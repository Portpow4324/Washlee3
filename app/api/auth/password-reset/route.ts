import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordReset } from '@/lib/emailService'
import admin from 'firebase-admin'

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (privateKey) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.projectId,
      })
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        console.error('[PASSWORD-RESET-API] Firebase init error:', error.message)
      }
    }
  }
}

/**
 * POST /api/auth/password-reset
 * Send password reset email to user
 * 
 * Body:
 * - email: string (required)
 * - firstName: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, firstName = 'User' } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('[PASSWORD-RESET-API] Password reset requested for:', email)

    // Generate reset token (in production, store this in Firestore with expiration)
    const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    // Send password reset email
    const emailResult = await sendPasswordReset(
      email,
      firstName,
      resetLink
    )

    if (emailResult.success) {
      console.log('[PASSWORD-RESET-API] ✓ Password reset email sent to:', email)
      return NextResponse.json(
        { 
          success: true,
          message: 'Password reset email sent. Check your inbox.' 
        },
        { status: 200 }
      )
    } else {
      console.error('[PASSWORD-RESET-API] Email sending failed:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[PASSWORD-RESET-API] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Password Reset API',
    endpoint: '/api/auth/password-reset',
    method: 'POST',
    body: { email: 'string', firstName: 'string' }
  })
}
