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
      console.error('[PREFERENCES] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

/**
 * GET /api/users/[uid]/preferences
 * Returns user preferences
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params
    const doc = await db.collection('users').doc(uid).get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const preferences = doc.data()?.preferences || {}

    return NextResponse.json({
      success: true,
      preferences
    })
  } catch (error) {
    console.error('[PREFERENCES-GET-ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[uid]/preferences
 * Updates user preferences
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params
    const body = await request.json()

    const {
      emailNotifications = true,
      smsNotifications = false,
      pushNotifications = true,
      language = 'en',
      timezone = 'UTC',
      marketingEmails = false
    } = body

    // Update preferences
    await db.collection('users').doc(uid).update({
      preferences: {
        emailNotifications,
        smsNotifications,
        pushNotifications,
        language,
        timezone,
        marketingEmails
      },
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    })
  } catch (error) {
    console.error('[PREFERENCES-PUT-ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
