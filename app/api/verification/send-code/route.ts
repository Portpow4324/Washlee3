import { NextRequest, NextResponse } from 'next/server'
import { generateVerificationCode, storeVerificationCode, getVerificationCodeForTesting } from '@/lib/serverVerification'

// A test phone number that is always allowed and does not incur real SMS costs.
const TEST_PHONE_NUMBER = process.env.TEST_VERIFICATION_PHONE || '+61400000000'
const TEST_CODE = '123456'

export async function POST(request: NextRequest) {
  try {
    const { email, phone, firstName, type } = await request.json()

    console.log('[API][verification/send-code] Request:', { email, phone, firstName, type })

    if (!email || !phone || !firstName || !type) {
      return NextResponse.json({ error: 'Missing required fields: email, phone, firstName, type' }, { status: 400 })
    }

    // Generate a 6-digit code (or use a fixed test code for the test phone)
    const code = phone === TEST_PHONE_NUMBER ? TEST_CODE : generateVerificationCode()

    console.log('[API][verification/send-code] Generated code:', code)

    // Store it (server-side) so it can be verified later
    try {
      await storeVerificationCode(email, phone, code)
      console.log('[API][verification/send-code] Code stored successfully')
    } catch (storeErr: any) {
      console.error('[API][verification/send-code] Failed to store code:', storeErr.message)
      return NextResponse.json({ error: 'Failed to store verification code' }, { status: 500 })
    }

    // Send out via email or SMS depending on type
    if (type === 'email') {
      try {
        console.log('[API][verification/send-code] Sending email verification...')
        const emailResponse = await fetch(new URL('/api/email/send-verification-code', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, firstName, code, type: 'email' }),
        })
        
        console.log('[API][verification/send-code] Email response status:', emailResponse.status)
        
        if (!emailResponse.ok) {
          const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[API][verification/send-code] Email send failed:', errorData)
          // Don't fail the whole request - code was stored, email just failed
          return NextResponse.json({ 
            success: true, 
            code: process.env.NODE_ENV === 'development' ? code : undefined,
            warning: 'Code stored but email send failed'
          })
        }
        
        console.log('[API][verification/send-code] Email sent successfully')
      } catch (emailErr: any) {
        console.error('[API][verification/send-code] Email fetch exception:', emailErr.message)
        // Code was stored, so allow the request to succeed
        return NextResponse.json({ 
          success: true, 
          code: process.env.NODE_ENV === 'development' ? code : undefined,
          warning: 'Code stored but email send failed'
        })
      }
    } else if (type === 'phone') {
      try {
        console.log('[API][verification/send-code] Sending SMS verification...')
        // In dev, we avoid calling real SMS providers. The library already logs.
        const smsResponse = await fetch(new URL('/api/sms/send', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone, message: `Your Washlee verification code is ${code}` }),
        })
        
        console.log('[API][verification/send-code] SMS response status:', smsResponse.status)
        
        if (!smsResponse.ok) {
          const errorData = await smsResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[API][verification/send-code] SMS send failed:', errorData)
          // Don't fail - code was stored, SMS just failed
          return NextResponse.json({ 
            success: true, 
            code: process.env.NODE_ENV === 'development' ? code : undefined,
            warning: 'Code stored but SMS send failed'
          })
        }
        
        console.log('[API][verification/send-code] SMS sent successfully')
      } catch (smsErr: any) {
        console.error('[API][verification/send-code] SMS fetch exception:', smsErr.message)
        // Code was stored, so allow the request to succeed
        return NextResponse.json({ 
          success: true, 
          code: process.env.NODE_ENV === 'development' ? code : undefined,
          warning: 'Code stored but SMS send failed'
        })
      }
    } else {
      return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, code: process.env.NODE_ENV === 'development' ? code : undefined })
  } catch (err: any) {
    console.error('[API][verification/send-code] Unexpected error:', err.message, err.stack)
    return NextResponse.json({ error: err.message || 'Failed to send verification code' }, { status: 500 })
  }
}
