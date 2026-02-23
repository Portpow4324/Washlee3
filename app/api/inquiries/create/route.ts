import admin from 'firebase-admin'
import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const inquiryData = await request.json()
    console.log('[API] Inquiry data received:', {
      userId: inquiryData.userId,
      email: inquiryData.email,
      phone: inquiryData.phone,
      firstName: inquiryData.firstName,
      lastName: inquiryData.lastName,
      allKeys: Object.keys(inquiryData),
    })

    const db = admin.firestore()

    // Validate required fields
    if (!inquiryData.userId || !inquiryData.email || !inquiryData.phone) {
      console.log('[API] Validation failed - missing fields:', {
        userId: !!inquiryData.userId,
        email: !!inquiryData.email,
        phone: !!inquiryData.phone,
      })
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, and phone are required' },
        { status: 400 }
      )
    }

    // Check if inquiry already exists for this user
    const snapshot = await db
      .collection('inquiries')
      .where('userId', '==', inquiryData.userId)
      .get()

    // Allow one pending/active inquiry per user
    const hasActiveInquiry = snapshot.docs.some(doc => {
      const status = doc.data().status
      return status === 'pending' || status === 'under-review'
    })

    if (hasActiveInquiry) {
      console.log('[API] User already has active inquiry')
      return NextResponse.json(
        { error: 'You already have an active inquiry. Please wait for a response.' },
        { status: 400 }
      )
    }

    // Create the inquiry document
    const docRef = await db.collection('inquiries').add({
      ...inquiryData,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
    })

    console.log('[API] Inquiry created successfully:', docRef.id)

    return NextResponse.json(
      {
        success: true,
        inquiryId: docRef.id,
        message: 'Inquiry submitted successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API] Inquiry creation error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to create inquiry' },
      { status: 500 }
    )
  }
}
