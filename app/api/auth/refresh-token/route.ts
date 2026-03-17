import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import admin from 'firebase-admin'

// Initialize Firebase Admin
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
    privateKey: privateKey?.replace(/\\n/g, '\n'),
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.projectId,
    })
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('[REFRESH-TOKEN] Firebase init error:', error.message)
    }
  }
}

/**
 * POST /api/auth/refresh-token
 * Refreshes access token using refresh token
 * Part of Remember Me feature
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken, uid } = body

    if (!refreshToken || !uid) {
      return NextResponse.json(
        { error: 'Refresh token and UID required' },
        { status: 400 }
      )
    }

    // In production, verify refresh token hasn't expired
    // For now, issue new token
    const auth = getAuth(admin.app())
    const customToken = await auth.createCustomToken(uid)

    return NextResponse.json({
      accessToken: customToken,
      refreshToken: refreshToken, // In production, rotate this too
      expiresIn: 3600,
      success: true
    })
  } catch (error) {
    console.error('[REFRESH-TOKEN-ERROR]', error)
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 401 }
    )
  }
}
