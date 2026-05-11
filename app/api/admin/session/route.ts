import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  isAdminPasswordConfigured,
  isAdminPasswordValid,
  verifyAdminSessionToken,
} from '@/lib/security/adminSession'

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const authenticated = await verifyAdminSessionToken(token)

  return NextResponse.json({ authenticated })
}

export async function POST(request: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Admin password is not configured' },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => null)
  const password = body && typeof body === 'object' ? (body as { password?: unknown }).password : undefined

  if (!(await isAdminPasswordValid(password))) {
    return NextResponse.json(
      { success: false, error: 'Invalid admin password' },
      { status: 401 }
    )
  }

  const token = await createAdminSessionToken()
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, token, cookieOptions())
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
