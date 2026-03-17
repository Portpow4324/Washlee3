import { NextRequest, NextResponse } from 'next/server'
import { getVerificationCodeForTesting } from '@/lib/serverVerification'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')

  if (!email || !phone) {
    return NextResponse.json({ error: 'Missing email or phone query parameters' }, { status: 400 })
  }

  const code = await getVerificationCodeForTesting(email, phone)
  return NextResponse.json({ code })
}
