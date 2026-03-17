import { NextRequest, NextResponse } from 'next/server'
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
      console.error('[VERIFY-EMAIL] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

/**
 * POST /api/auth/verify-email
 * Completes email verification process
 * Marks user email as verified in Firestore
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, email, token } = body

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'UID and email required' },
        { status: 400 }
      )
    }

    // Update user record in Firestore
    const userRef = db.collection('users').doc(uid)
    await userRef.update({
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Send welcome email (placeholder)
    console.log(`[VERIFY-EMAIL] Email verified for user ${uid} (${email})`)

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error) {
    console.error('[VERIFY-EMAIL-ERROR]', error)
    return NextResponse.json(
      { error: 'Email verification failed' },
      { status: 500 }
    )
  }
}
