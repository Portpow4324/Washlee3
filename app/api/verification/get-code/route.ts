import { NextRequest, NextResponse } from 'next/server'
import { getVerificationCodeForTesting } from '@/lib/serverVerification'

export async function GET(request: NextRequest) {
  // Allow in development or when explicitly enabled
  const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ALLOW_GET_CODE === 'true'
  if (!isDev) {
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
