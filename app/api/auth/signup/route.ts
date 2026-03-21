import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  console.log('[SIGNUP] ==========================================')
  console.log('[SIGNUP] POST /api/auth/signup called')
  
  const supabase = getServiceRoleClient()
  
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
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
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

    // Try to create user record in database
    // NOTE: This table might not exist, so we'll handle the error gracefully
    console.log('[SIGNUP] Inserting user record...')
    
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        phone: phone || null,
        user_type: userType,
        state: state || null,
        usage_type: personalUse || null,
      })
      .select()

    if (userError) {
      console.warn('[SIGNUP] User table insert failed (table may not exist):', userError.message)
      console.warn('[SIGNUP] Continuing anyway - user auth was created successfully')
      // Don't fail - auth user is created, just database record failed
    } else {
      console.log('[SIGNUP] ✓ User record created in database')
    }

    // Create customer or pro record based on user type
    if (userType === 'customer') {
      console.log('[SIGNUP] Creating customer record')
      const [firstName, ...lastNameParts] = name.split(' ')
      const lastName = lastNameParts.join(' ') || ''
      
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          state: state || null,
          personal_use: personalUse || null,
          subscription_active: false,
          subscription_plan: null,
          subscription_status: 'inactive',
          payment_status: 'no_payment_method',
          delivery_address: null,
          account_status: 'active',
        })

      if (customerError) {
        console.warn('[SIGNUP] Customer record creation failed:', customerError.message)
        console.warn('[SIGNUP] Continuing anyway - auth user was created successfully')
        // Don't fail - auth user is created
      } else {
        console.log('[SIGNUP] ✓ Customer record created')
      }
    } else if (userType === 'pro') {
      console.log('[SIGNUP] Creating pro/employee record')
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          id: userId,
          email,
          name,
          phone: phone || null,
          rating: 0,
          total_reviews: 0,
          completed_orders: 0,
          earnings: 0,
          availability_status: 'available',
          account_status: 'pending',
        })

      if (employeeError) {
        console.warn('[SIGNUP] Pro record creation failed (table may not exist):', employeeError.message)
        console.warn('[SIGNUP] Continuing anyway - auth user was created successfully')
        // Don't fail - auth user is created
      } else {
        console.log('[SIGNUP] ✓ Pro record created')
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
        console.warn('[SIGNUP] Failed to store verification code:', codeError.message)
        // Continue anyway - code is generated, just not stored
      } else {
        console.log('[SIGNUP] ✓ Verification code stored')
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const emailResponse = await fetch(`${baseUrl}/api/auth/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: name.split(' ')[0],
          verificationCode: verificationCode
        })
      })
      
      if (!emailResponse.ok) {
        const emailError = await emailResponse.json().catch(() => ({}))
        console.warn('[SIGNUP] Failed to send verification email:', emailError)
        // Don't fail signup if email fails - user can request resend
      } else {
        console.log('[SIGNUP] ✓ Verification email sent successfully')
        emailSent = true
      }
    } catch (emailError) {
      console.error('[SIGNUP] Error sending email:', emailError)
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
        console.warn('[SIGNUP] Failed to log email confirmation:', confirmError.message)
        // Don't fail signup - this is just tracking for admins
      } else {
        console.log('[SIGNUP] ✓ Email confirmation logged for admin panel')
      }
    } catch (logError) {
      console.error('[SIGNUP] Error logging email confirmation:', logError)
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
    console.error('[SIGNUP] Unexpected error:', error)
    console.error('[SIGNUP] Error stack:', error.stack)
    console.error('[SIGNUP] Error type:', typeof error)
    console.error('[SIGNUP] Error keys:', Object.keys(error || {}))
    
    const errorMessage = error?.message || error?.toString?.() || 'Signup failed'
    console.error('[SIGNUP] Returning error response:', { error: errorMessage })
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: 'SIGNUP_ERROR'
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
  const supabase = getServiceRoleClient()
  
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
