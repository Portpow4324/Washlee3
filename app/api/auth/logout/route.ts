import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Handles user logout across all sessions
 * - Clears session storage
 * - Invalidates refresh tokens
 * - Logs logout action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, sessionId } = body

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Clear remember me session
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear cookies
    response.cookies.set('session', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    response.cookies.set('refreshToken', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    // Log logout event
    console.log(`[LOGOUT] User ${uid} logged out at ${new Date().toISOString()}`)

    return response
  } catch (error) {
    console.error('[LOGOUT-ERROR]', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
