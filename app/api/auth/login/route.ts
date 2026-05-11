import { NextRequest, NextResponse } from 'next/server'
import { getAnonClient } from '@/lib/supabaseClientFactory'
import { cleanString, isBodyTooLarge, isEmail } from '@/lib/security/validation'

const MAX_LOGIN_BODY_BYTES = 4_096

export async function POST(request: NextRequest) {
  const supabase = getAnonClient()
  
  try {
    if (isBodyTooLarge(request.headers.get('content-length'), MAX_LOGIN_BODY_BYTES)) {
      return NextResponse.json(
        { error: 'Request body is too large', code: 'REQUEST_TOO_LARGE' },
        { status: 413 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_BODY' },
        { status: 400 }
      )
    }

    const email = cleanString((body as { email?: unknown }).email, 254).toLowerCase()
    const password = (body as { password?: unknown }).password

    if (!email || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      )
    }

    if (!isEmail(email) || password.length > 200) {
      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      console.warn('[LOGIN-API] Login failed')
      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type, created_at')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.warn('[LOGIN-API] Failed to fetch user data:', userError.message)
      // Don't fail - auth was successful, just missing database record
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
  } catch (error) {
    console.error('[LOGIN-API] Unexpected error:', error)
    
    return NextResponse.json(
      { 
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      },
      { status: 500 }
    )
  }
}
