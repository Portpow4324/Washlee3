import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'
import { getClientIP, checkSignupRateLimit, logSignupAttempt, getRateLimitErrorResponse } from '@/lib/rateLimitUtil'

type ErrorLike = Record<string, unknown>
type SupabaseInsertResult = {
  data?: unknown
  error?: {
    message?: string
    details?: string
    code?: string
  } | null
}
type SupabaseInsertClient = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => {
      select: () => PromiseLike<SupabaseInsertResult>
    }
  }
}

function asRecord(error: unknown): ErrorLike {
  return error && typeof error === 'object' ? error as ErrorLike : {}
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : String(error || fallback)
}

async function insertWithColumnFallback(supabase: SupabaseInsertClient, table: string, payload: Record<string, unknown>) {
  let currentPayload = { ...payload }

  for (let attempt = 0; attempt < 10; attempt++) {
    const result = await supabase
      .from(table)
      .insert(currentPayload)
      .select()

    if (!result.error) return result

    const message = result.error.message || ''
    const missingColumn =
      message.match(/'([^']+)' column/)?.[1] ||
      message.match(/column "([^"]+)"/)?.[1]

    if (!missingColumn || !(missingColumn in currentPayload)) {
      return result
    }

    console.warn(`[SIGNUP] ${table} column missing, retrying without ${missingColumn}`)
    const nextPayload = { ...currentPayload }
    delete nextPayload[missingColumn]
    currentPayload = nextPayload
  }

  return supabase
    .from(table)
    .insert(currentPayload)
    .select()
}

export async function POST(request: NextRequest) {
  console.log('[SIGNUP] ==========================================')
  console.log('[SIGNUP] POST /api/auth/signup called')
  
  const clientIP = getClientIP(request)
  console.log('[SIGNUP] Client IP:', clientIP)
  
  let supabase
  
  try {
    supabase = getServiceRoleClient()
  } catch (initError: unknown) {
    const initMessage = getErrorMessage(initError, 'Cannot initialize Supabase')
    console.error('[SIGNUP] ❌ CRITICAL: Failed to initialize Supabase client')
    console.error('[SIGNUP] Init error message:', initMessage)
    console.error('[SIGNUP] Init error:', initError)
    return NextResponse.json(
      { 
        error: 'Server configuration error: ' + initMessage,
        code: 'INIT_ERROR'
      },
      { status: 500 }
    )
  }
  
  try {
    const body = await request.json()
    console.log('[SIGNUP] Request body received:', { 
      email: body.email,
      name: body.name,
      userType: body.userType,
      hasPassword: !!body.password
    })

    const { email, password, name, phone, userType, state, personalUse, address, city, postcode, country, latitude, longitude, serviceRadiusKm } = body

    // Validate input
    if (!email || !password || !name || !userType) {
      console.error('[SIGNUP] Validation failed - missing fields')
      console.error('[SIGNUP] email:', !!email, 'password:', !!password, 'name:', !!name, 'userType:', !!userType)
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, userType' },
        { status: 400 }
      )
    }

    // ============================================
    // RATE LIMITING CHECK
    // ============================================
    const rateLimit = await checkSignupRateLimit(clientIP, email)
    if (!rateLimit.allowed) {
      console.warn('[SIGNUP] ⚠️ Rate limit exceeded:', rateLimit.reason)
      await logSignupAttempt(clientIP, email, false)
      return NextResponse.json(
        getRateLimitErrorResponse(rateLimit.reason!),
        { status: 429 }
      )
    }
    console.log('[SIGNUP] ✓ Rate limit check passed')

    if (!['customer', 'pro'].includes(userType)) {
      console.error('[SIGNUP] Invalid userType:', userType)
      return NextResponse.json(
        { error: 'userType must be "customer" or "pro"' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      console.error('[SIGNUP] Password too short:', password.length)
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Sign up with Supabase Auth using Admin API
    // Admin API still requires email/password validation but skips client-side rate limits
    console.log('[SIGNUP] Creating user via auth service...')
    console.log('[SIGNUP] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'MISSING')
    console.log('[SIGNUP] Service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'MISSING')
    
    // Parse first and last names
    const [firstName, ...lastNameParts] = name.split(' ')
    const lastName = lastNameParts.join(' ') || ''
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        // Core profile info
        name,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        
        // Account type info
        user_type: userType,
        
        // Location info (for customers)
        state: state || null,
        personal_use: personalUse || false,
        
        // Timestamps
        created_at: new Date().toISOString(),
        phone_verified: false,
      },
      email_confirm: false  // User must confirm email before logging in
    })

    console.log('[SIGNUP] Auth response received')
    console.log('[SIGNUP] Auth error:', authError ? authError.message : 'none')
    console.log('[SIGNUP] Auth user ID:', authData?.user?.id ? 'created' : 'not created')

    if (authError) {
      console.error('[SIGNUP] Auth error:', authError.message)
      console.error('[SIGNUP] Full auth error:', authError)
      
      // Log failed attempt for rate limiting
      await logSignupAttempt(clientIP, email, false)
      
      // Check for duplicate email error
      if (authError.message && (authError.message.includes('already registered') || authError.message.includes('User already exists'))) {
        console.warn('[SIGNUP] Email already registered:', email)
        return NextResponse.json(
          { 
            error: 'A user with this email address has already been registered. Please log in or use a different email.',
            code: 'DUPLICATE_EMAIL',
            email
          },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: authError.message || 'Authentication failed' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error('[SIGNUP] No user returned from auth')
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    const userId = authData.user.id
    console.log('[SIGNUP] Auth user created:', userId)

    // Update auth user metadata to ensure it persists (backup for AuthContext to read from)
    console.log('[SIGNUP] Updating user metadata...')
    const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        name,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        user_type: userType,
        state: state || null,
        personal_use: personalUse || false,
        created_at: new Date().toISOString(),
        phone_verified: false,
      },
    })

    if (metadataError) {
      console.warn('[SIGNUP] ⚠️ Warning: Failed to update user metadata:', metadataError.message)
      // Don't fail signup here - this is just a backup
    } else {
      console.log('[SIGNUP] ✓ User metadata updated')
    }

    // Create user record in database (REQUIRED - every auth user must have a users record)
    console.log('[SIGNUP] Inserting user record...')
    
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
        phone: phone || null,
        phone_verified: false,
      })
      .select()

    if (userError) {
      console.error('[SIGNUP] ❌ CRITICAL: User table insert failed:', userError.message)
      console.error('[SIGNUP] Error code:', userError.code)
      console.error('[SIGNUP] Error details:', userError.details)
      console.error('[SIGNUP] Full error object:', JSON.stringify(userError, null, 2))
      console.error('[SIGNUP] This is a REQUIRED record - signup cannot continue')
      
      return NextResponse.json(
        { 
          error: 'Failed to create user account in database. Please try again.',
          code: 'USER_CREATION_FAILED',
          details: userError.message,
          hint: userError.hint || userError.details
        },
        { status: 500 }
      )
    }
    
    console.log('[SIGNUP] ✓ User record created in database')

    // Create customer or pro record based on user type
    if (userType === 'customer') {
      console.log('[SIGNUP] Creating customer record for user_id:', userId)
      console.log('[SIGNUP] Customer data:', { email, firstName, lastName })
      
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          state: state || null,
          personal_use: personalUse || false,
        })
        .select()

      if (customerError) {
        console.error('[SIGNUP] ❌ Customer record creation failed:', customerError.message)
        console.error('[SIGNUP] Error code:', customerError.code)
        console.error('[SIGNUP] Error details:', customerError.details)
        
        return NextResponse.json(
          { 
            error: 'Failed to create customer profile. Please try again.',
            code: 'CUSTOMER_CREATION_FAILED',
            details: customerError.message
          },
          { status: 500 }
        )
      } else {
        console.log('[SIGNUP] ✓ Customer record created:', customerData)
      }
    } else if (userType === 'pro') {
      console.log('[SIGNUP] Creating pro/employee record for user_id:', userId)
      console.log('[SIGNUP] Employee data:', { email, firstName, lastName, address, city, state, postcode })
      
      const serviceAreas = address || postcode || latitude || longitude
        ? [{
            address: address || '',
            suburb: city || '',
            state: state || '',
            postcode: postcode || '',
            country: country || 'Australia',
            lat: typeof latitude === 'number' ? latitude : null,
            lng: typeof longitude === 'number' ? longitude : null,
            radiusKm: serviceRadiusKm || 15,
          }]
        : []

      const { data: employeeData, error: employeeError } = await insertWithColumnFallback(
        supabase,
        'employees',
        {
          id: userId,
          email,
          name,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          state: state || null,
          address: address || null,
          city: city || null,
          postcode: postcode || null,
          country: country || 'Australia',
          latitude: typeof latitude === 'number' ? latitude : null,
          longitude: typeof longitude === 'number' ? longitude : null,
          service_areas: serviceAreas,
          availability_status: 'available',
          account_status: 'active',
          status: 'active',
          role: 'employee',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      )

      if (employeeError) {
        console.error('[SIGNUP] ❌ Pro record creation failed:', employeeError.message)
        console.error('[SIGNUP] Error code:', employeeError.code)
        console.error('[SIGNUP] Error details:', employeeError.details)
        
        return NextResponse.json(
          { 
            error: 'Failed to create pro profile. Please try again.',
            code: 'PRO_CREATION_FAILED',
            details: employeeError.message
          },
          { status: 500 }
        )
      } else {
        console.log('[SIGNUP] ✓ Pro record created:', employeeData)
      }

      await supabase
        .from('employee_availability')
        .upsert(
          {
            employee_id: userId,
            service_radius_km: serviceRadiusKm || 15,
            availability_schedule: {
              monday: { available: true, start: '09:00', end: '17:00' },
              tuesday: { available: true, start: '09:00', end: '17:00' },
              wednesday: { available: true, start: '09:00', end: '17:00' },
              thursday: { available: true, start: '09:00', end: '17:00' },
              friday: { available: true, start: '09:00', end: '17:00' },
              saturday: { available: true, start: '10:00', end: '14:00' },
              sunday: { available: false, start: '00:00', end: '00:00' },
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'employee_id' }
        )

      // Create customer record for pros so they can also make purchases
      console.log('[SIGNUP] Creating customer record for pro user_id:', userId)
      console.log('[SIGNUP] Customer data:', { email, firstName, lastName })
      
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          state: state || null,
          personal_use: true,
        })
        .select()

      if (customerError) {
        console.error('[SIGNUP] ⚠️ Warning: Customer record creation for pro failed:', customerError.message)
        console.error('[SIGNUP] Error code:', customerError.code)
        console.error('[SIGNUP] Error details:', customerError.details)
        // Note: We don't fail signup here - pro account is already created
      } else {
        console.log('[SIGNUP] ✓ Customer record created for pro:', customerData)
      }
    }

    console.log(`[SIGNUP] ✓ New ${userType} registered:`, email)
    
    // Send welcome email for marketing/engagement (async, don't block signup)
    if (userType === 'customer') {
      try {
        console.log('[SIGNUP] Sending welcome email for engagement...')
        const { sendWelcomeEmail } = await import('@/lib/emailMarketing')
        sendWelcomeEmail({
          to: email,
          customerName: firstName || 'there',
          email: email,
        }).catch(err => {
          console.error('[SIGNUP] Warning: Failed to send welcome email:', err)
          // Don't fail signup if welcome email fails
        })
      } catch (err) {
        console.error('[SIGNUP] Error loading email marketing:', err)
      }
    }
    
    // Send verification email via Resend-backed email service (bypassing Supabase rate limit)
    console.log('[SIGNUP] Sending verification email via Resend...')
    let verificationCode = ''
    
    try {
      verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      console.log('[SIGNUP] Generated verification code:', verificationCode)
      console.log('[SIGNUP] Code type:', typeof verificationCode)
      console.log('[SIGNUP] Code length:', verificationCode.length)
      
      // Store verification code in database
      console.log('[SIGNUP] Storing verification code in database...')
      console.log('[SIGNUP] Code insert payload:', {
        user_id: userId,
        type: 'email',
        code: verificationCode,
        verified: false,
        used: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      const { error: codeError, data: insertedData } = await supabase
        .from('verification_codes')
        .insert({
          user_id: userId,
          type: 'email',
          code: verificationCode,
          verified: false,
          used: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
      
      console.log('[SIGNUP] Code insert response:', { codeError, insertedData, insertedDataLength: insertedData?.length })
      
      if (codeError) {
        console.error('[SIGNUP] ❌ ERROR storing verification code:', codeError.message)
        console.error('[SIGNUP] Error code:', codeError.code)
        console.error('[SIGNUP] Error details:', codeError.details)
        console.error('[SIGNUP] Full error:', JSON.stringify(codeError))
      } else {
        console.log('[SIGNUP] ✓ Verification code stored successfully')
        console.log('[SIGNUP] Inserted code record:', JSON.stringify(insertedData))
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      console.log('[SIGNUP] Calling /api/auth/send-confirmation at:', baseUrl)
      const emailResponse = await fetch(`${baseUrl}/api/auth/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: name.split(' ')[0],
          verificationCode: verificationCode
        })
      })
      
      console.log('[SIGNUP] Email response status:', emailResponse.status)
      
      if (!emailResponse.ok) {
        let emailError = {}
        try {
          emailError = await emailResponse.json()
        } catch {
          const text = await emailResponse.text()
          console.warn('[SIGNUP] Email error response body:', text)
        }
        console.warn('[SIGNUP] Warning: Failed to send verification email:', emailError)
        // Don't fail signup if email fails - user can request resend
      } else {
        console.log('[SIGNUP] ✓ Verification email sent successfully')
      }
    } catch (emailError) {
      console.error('[SIGNUP] Error in email section:', emailError instanceof Error ? emailError.message : String(emailError))
      // Don't fail signup if email fails
    }
    
    // Log email confirmation status to admin database
    console.log('[SIGNUP] Logging email confirmation status...')
    try {
      const { error: confirmError } = await supabase
        .from('email_confirmations')
        .insert({
          user_id: userId,
          email,
          code: verificationCode,
          is_confirmed: false
        })
      
      if (confirmError) {
        console.warn('[SIGNUP] Warning: Failed to log email confirmation:', confirmError.message)
        console.warn('[SIGNUP] Confirmation error details:', confirmError.details)
        // Don't fail signup - this is just tracking for admins
      } else {
        console.log('[SIGNUP] ✓ Email confirmation logged for admin panel')
      }
    } catch (logError) {
      console.warn('[SIGNUP] Warning: Error logging email confirmation:', logError instanceof Error ? logError.message : String(logError))
      // Don't fail signup
    }

    // Log successful signup attempt
    await logSignupAttempt(clientIP, email, true)

    return NextResponse.json(
      {
        success: true,
        message: `${userType === 'customer' ? 'Customer' : 'Pro'} account created successfully`,
        user: {
          id: userId,
          email,
          name,
          userType,
        },
        requiresEmailVerification: true,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorRecord = asRecord(error)
    const errorMessage = getErrorMessage(error, 'Signup failed')
    console.error('[SIGNUP] ==========================================')
    console.error('[SIGNUP] ❌ UNEXPECTED ERROR IN SIGNUP')
    console.error('[SIGNUP] ==========================================')
    console.error('[SIGNUP] Error name:', errorRecord.name)
    console.error('[SIGNUP] Error message:', errorMessage)
    console.error('[SIGNUP] Error status:', errorRecord.status)
    console.error('[SIGNUP] Error code:', errorRecord.code)
    console.error('[SIGNUP] Full error object:', JSON.stringify(error, null, 2))
    console.error('[SIGNUP] Error stack:', errorRecord.stack)
    console.error('[SIGNUP] Error type:', typeof error)
    console.error('[SIGNUP] Error keys:', Object.keys(errorRecord))
    console.error('[SIGNUP] ==========================================')
    
    console.error('[SIGNUP] Returning error response:', { error: errorMessage })
    
    return NextResponse.json(
      { 
        error: errorMessage || 'An unexpected error occurred during signup',
        code: 'SIGNUP_ERROR',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/signup
 * Check if email exists
 */
export async function GET(request: NextRequest) {
  let supabase
  
  try {
    supabase = getServiceRoleClient()
  } catch (initError: unknown) {
    console.error('[SIGNUP-GET] Failed to initialize Supabase:', getErrorMessage(initError, 'Cannot initialize Supabase'))
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      exists: users && users.length > 0,
      email,
    })
  } catch (error: unknown) {
    console.error('[SIGNUP-GET] Error:', getErrorMessage(error, 'Failed to check email availability'))
    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    )
  }
}
