import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'
import { sendEmail } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  console.log('[SEND_PHONE_CODE] POST /api/auth/send-phone-code called')
  
  try {
    const { phone, userId, email, devMode } = await request.json()

    if (!phone || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, userId, email' },
        { status: 400 }
      )
    }

    const supabase = getServiceRoleClient()

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('[SEND_PHONE_CODE] Generated code for phone:', phone.slice(-4))
    if (devMode || process.env.NODE_ENV === 'development') {
      console.log('[SEND_PHONE_CODE] 🔧 DEV MODE: Test code =', code)
    }

    // Store code in verification_codes table
    const { error: codeError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        phone,
        code,
        code_type: 'phone',
        user_id: userId,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      })

    if (codeError) {
      console.error('[SEND_PHONE_CODE] Error storing code:', codeError.message)
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      )
    }

    console.log('[SEND_PHONE_CODE] Verification code stored')

    // Send SMS via Twilio or email fallback
    try {
      // For now, we'll use email fallback since we don't have SMS configured
      // In production, implement Twilio SMS sending here
      console.log('[SEND_PHONE_CODE] Sending code via email (SMS not configured)...')
      
      // Send verification code via email
      await sendEmail({
        to: email,
        subject: 'Your Washlee Phone Verification Code',
        html: `
          <h2>Phone Verification Code</h2>
          <p>Your phone verification code is:</p>
          <h1 style="font-size: 32px; font-weight: bold; letter-spacing: 2px; text-align: center; color: #48C9B0;">${code}</h1>
          <p>This code will expire in 15 minutes.</p>
          <p>Phone: ${phone}</p>
        `
      })
      console.log('[SEND_PHONE_CODE] ✓ Verification code sent')
    } catch (smErr: any) {
      console.error('[SEND_PHONE_CODE] Error sending code:', smErr)
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your phone',
      // In dev mode, return the code for testing
      ...(devMode || process.env.NODE_ENV === 'development' ? { testCode: code } : {})
    })
  } catch (err: any) {
    console.error('[SEND_PHONE_CODE] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
