import { NextRequest, NextResponse } from 'next/server'
import { getAnonClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  console.log('[LOGIN-API] POST /api/auth/login called')
  
  const supabase = getAnonClient()
  
  try {
    const body = await request.json()
    console.log('[LOGIN-API] Request body received:', { 
      email: body.email,
      hasPassword: !!body.password
    })

    const { email, password } = body

    // Validate input
    if (!email || !password) {
      console.error('[LOGIN-API] Validation failed - missing fields')
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      )
    }

    // Sign in with Supabase Auth
    console.log('[LOGIN-API] Signing in with Supabase...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('[LOGIN-API] Auth response received')
    console.log('[LOGIN-API] Auth error:', error ? error.message : 'none')
    console.log('[LOGIN-API] Auth user ID:', data?.user?.id ? 'found' : 'not found')

    if (error) {
      console.error('[LOGIN-API] Auth error:', error.message)
      
      // Check for invalid credentials
      if (error.message && (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed'))) {
        console.warn('[LOGIN-API] Invalid credentials or email not confirmed:', email)
        return NextResponse.json(
          { 
            error: error.message || 'Invalid email or password',
            code: 'INVALID_CREDENTIALS'
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: error.message || 'Authentication failed' },
        { status: 400 }
      )
    }

    if (!data.user) {
      console.error('[LOGIN-API] No user returned from auth')
      return NextResponse.json(
        { error: 'Failed to authenticate' },
        { status: 500 }
      )
    }

    console.log('[LOGIN-API] ✓ User logged in:', data.user.id)
    
    // Fetch user data from database
    console.log('[LOGIN-API] Fetching user data from database...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type, created_at')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.warn('[LOGIN-API] Failed to fetch user data:', userError.message)
      // Don't fail - auth was successful, just missing database record
    } else {
      console.log('[LOGIN-API] ✓ User data fetched:', userData)
    }

    // Fetch customer profile if customer
    if (userData?.user_type === 'customer') {
      console.log('[LOGIN-API] Fetching customer profile...')
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name')
        .eq('id', data.user.id)
        .single()

      if (customerError) {
        console.warn('[LOGIN-API] Failed to fetch customer data:', customerError.message)
      } else {
        console.log('[LOGIN-API] ✓ Customer data fetched')
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          userType: userData?.user_type || 'customer',
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[LOGIN-API] Unexpected error:', error)
    console.error('[LOGIN-API] Error message:', error?.message)
    
    return NextResponse.json(
      { 
        error: error?.message || 'Login failed',
        code: 'LOGIN_ERROR'
      },
      { status: 500 }
    )
  }
}
