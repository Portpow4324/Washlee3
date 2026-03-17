import { NextRequest, NextResponse } from 'next/server'
import { generateVerificationCode, storeVerificationCode, getVerificationCodeForTesting } from '@/lib/serverVerification'

// A test phone number that is always allowed and does not incur real SMS costs.
const TEST_PHONE_NUMBER = process.env.TEST_VERIFICATION_PHONE || '+61400000000'
const TEST_CODE = '123456'

export async function POST(request: NextRequest) {
  try {
    const { email, phone, firstName, type } = await request.json()

    if (!email || !phone || !firstName || !type) {
      return NextResponse.json({ error: 'Missing required fields: email, phone, firstName, type' }, { status: 400 })
    }

    // Generate a 6-digit code (or use a fixed test code for the test phone)
    const code = phone === TEST_PHONE_NUMBER ? TEST_CODE : generateVerificationCode()

    // Store it (server-side) so it can be verified later
    await storeVerificationCode(email, phone, code)

    // Send out via email or SMS depending on type
    if (type === 'email') {
      const emailResponse = await fetch(new URL('/api/email/send-verification-code', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, code, type: 'email' }),
      })
      if (!emailResponse.ok) {
        const data = await emailResponse.json().catch(() => ({}))
        return NextResponse.json({ error: data.error || 'Failed to send email' }, { status: 500 })
      }
    } else if (type === 'phone') {
      // In dev, we avoid calling real SMS providers. The library already logs.
      const smsResponse = await fetch(new URL('/api/sms/send', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, message: `Your Washlee verification code is ${code}` }),
      })
      if (!smsResponse.ok) {
        const data = await smsResponse.json().catch(() => ({}))
        return NextResponse.json({ error: data.error || 'Failed to send SMS' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, code: process.env.NODE_ENV === 'development' ? code : undefined })
  } catch (err: any) {
    console.error('[API][verification/send-code] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send verification code' }, { status: 500 })
  }
}
