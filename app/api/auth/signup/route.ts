import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  console.log('[SIGNUP] ==========================================')
  console.log('[SIGNUP] POST /api/auth/signup called')
  
  let supabase
  
  try {
    supabase = getServiceRoleClient()
  } catch (initError: any) {
    console.error('[SIGNUP] ❌ CRITICAL: Failed to initialize Supabase client')
    console.error('[SIGNUP] Init error message:', initError?.message)
    console.error('[SIGNUP] Init error:', initError)
    return NextResponse.json(
      { 
        error: 'Server configuration error: ' + (initError?.message || 'Cannot initialize Supabase'),
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

    const { email, password, name, phone, userType, state, personalUse } = body

    // Validate input
    if (!email || !password || !name || !userType) {
      console.error('[SIGNUP] Validation failed - missing fields')
      console.error('[SIGNUP] email:', !!email, 'password:', !!password, 'name:', !!name, 'userType:', !!userType)
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, userType' },
        { status: 400 }
      )
    }

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

    // Sign up with Supabase Auth using Admin API to bypass rate limits
    // Regular signUp() is rate-limited; admin API allows direct creation
    console.log('[SIGNUP] Creating user via admin API to bypass rate limits...')
    console.log('[SIGNUP] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'MISSING')
    console.log('[SIGNUP] Service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'MISSING')
    
    // Parse first and last names
    const [firstName, ...lastNameParts] = name.split(' ')
    const lastName = lastNameParts.join(' ') || ''
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        first_name: firstName,
        last_name: lastName,
        phone,
        user_type: userType,
      },
      email_confirm: false  // User must confirm email before logging in
    })

    console.log('[SIGNUP] Auth response received')
    console.log('[SIGNUP] Auth error:', authError ? authError.message : 'none')
    console.log('[SIGNUP] Auth user ID:', authData?.user?.id ? 'created' : 'not created')

    if (authError) {
      console.error('[SIGNUP] Auth error:', authError.message)
      console.error('[SIGNUP] Full auth error:', authError)
      
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
      
      // Check for rate limit error
      if (authError.message && authError.message.includes('email rate limit')) {
        console.warn('[SIGNUP] Rate limit hit - too many signups in short time')
        return NextResponse.json(
          { 
            error: 'Too many signup attempts. Please wait 60 seconds and try again.',
            code: 'RATE_LIMIT',
            retryAfter: 60
          },
          { status: 429 }
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

    // Create user record in database (REQUIRED - every auth user must have a users record)
    console.log('[SIGNUP] Inserting user record...')
    
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        user_type: userType,
        phone: phone || null,
        phone_verified: false,
      })
      .select()

    if (userError) {
      console.error('[SIGNUP] ❌ CRITICAL: User table insert failed:', userError.message)
      console.error('[SIGNUP] Error code:', userError.code)
      console.error('[SIGNUP] Error details:', userError.details)
      console.error('[SIGNUP] This is a REQUIRED record - signup cannot continue')
      
      return NextResponse.json(
        { 
          error: 'Failed to create user account in database. Please try again.',
          code: 'USER_CREATION_FAILED',
          details: userError.message
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
          personal_use: personalUse || null,
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
      console.log('[SIGNUP] Employee data:', { email, name, firstName, lastName })
      
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert({
          id: userId,
          email,
          name,
          phone: phone || null,
        })
        .select()

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
    }

    console.log(`[SIGNUP] ✓ New ${userType} registered:`, email)
    
    // Send verification email via SendGrid (bypassing Supabase rate limit)
    console.log('[SIGNUP] Sending verification email via SendGrid...')
    let verificationCode = ''
    let emailSent = false
    
    try {
      verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      console.log('[SIGNUP] Generated verification code:', verificationCode)
      
      // Store verification code in database
      console.log('[SIGNUP] Storing verification code in database...')
      const { error: codeError } = await supabase
        .from('verification_codes')
        .insert({
          email,
          code: verificationCode,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          used: false
        })
      
      if (codeError) {
        console.warn('[SIGNUP] Warning: Failed to store verification code:', codeError.message)
        console.warn('[SIGNUP] Code error details:', codeError.details)
        // Continue anyway - code is generated, just not stored in this table
      } else {
        console.log('[SIGNUP] ✓ Verification code stored')
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
        emailSent = true
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
          user_type: userType,
          verification_code: verificationCode,
          email_provider: 'resend',
          is_confirmed: false,  // NOT confirmed yet - user must click email link
          confirmation_method: 'pending',
          confirmed_at: null,
          email_sent_at: emailSent ? new Date().toISOString() : null
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
  } catch (error: any) {
    console.error('[SIGNUP] ==========================================')
    console.error('[SIGNUP] ❌ UNEXPECTED ERROR IN SIGNUP')
    console.error('[SIGNUP] ==========================================')
    console.error('[SIGNUP] Error name:', error?.name)
    console.error('[SIGNUP] Error message:', error?.message)
    console.error('[SIGNUP] Error status:', error?.status)
    console.error('[SIGNUP] Error code:', error?.code)
    console.error('[SIGNUP] Full error object:', JSON.stringify(error, null, 2))
    console.error('[SIGNUP] Error stack:', error?.stack)
    console.error('[SIGNUP] Error type:', typeof error)
    console.error('[SIGNUP] Error keys:', Object.keys(error || {}))
    console.error('[SIGNUP] ==========================================')
    
    const errorMessage = error?.message || error?.toString?.() || 'Signup failed'
    console.error('[SIGNUP] Returning error response:', { error: errorMessage })
    
    return NextResponse.json(
      { 
        error: errorMessage || 'An unexpected error occurred during signup',
        code: 'SIGNUP_ERROR',
        details: process.env.NODE_ENV === 'development' ? error?.toString?.() : undefined
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
  } catch (initError: any) {
    console.error('[SIGNUP-GET] Failed to initialize Supabase:', initError?.message)
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
  } catch (error: any) {
    console.error('[SIGNUP-GET] Error:', error.message)
    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    )
  }
}
