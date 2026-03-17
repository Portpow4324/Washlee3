import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/serverVerification'

export async function POST(request: NextRequest) {
  try {
    const { email, phone, code } = await request.json()

    if (!email || !phone || !code) {
      return NextResponse.json({ error: 'Missing required fields: email, phone, code' }, { status: 400 })
    }

    const verified = await verifyCode(email, phone, code)

    return NextResponse.json({ success: verified })
  } catch (err: any) {
    console.error('[API][verification/verify-code] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to verify code' }, { status: 500 })
  }
}
