import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'

// Initialize Firebase Admin if not already done
try {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error('Missing Firebase Admin SDK credentials in environment variables')
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      } as any),
    })
  }
} catch (initError: any) {
  console.error('[API] Firebase Admin initialization failed:', initError.message)
}

export async function GET(request: NextRequest) {
  try {
    const db = admin.firestore()
    
    // Get all inquiries, ordered by submission date
    const inquiriesSnapshot = await db
      .collection('inquiries')
      .orderBy('submittedAt', 'desc')
      .get()

    const inquiries = inquiriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log('[API] Inquiries listed:', inquiries.length)

    return NextResponse.json({
      inquiries,
      total: inquiries.length,
    })
  } catch (error: any) {
    console.error('[API] Error listing inquiries:', {
      message: error.message,
      code: error.code,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to list inquiries' },
      { status: 500 }
    )
  }
}
