import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { sendProApplicationRejected } from '@/lib/emailService'

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
    const { inquiryId, adminId, adminName, rejectionReason } = await request.json()

    if (!inquiryId || !adminId || !rejectionReason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = admin.firestore()
    const inquiry = await db.collection('inquiries').doc(inquiryId).get()

    if (!inquiry.exists) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      )
    }

    const inquiryData = inquiry.data()

    // Update inquiry status
    await db.collection('inquiries').doc(inquiryId).update({
      status: 'rejected',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: adminId,
      adminName: adminName,
      rejectionReason: rejectionReason,
    })

    // Send rejection email
    const result = await sendProApplicationRejected(
      inquiryData?.email,
      inquiryData?.firstName,
      rejectionReason
    )
    const emailSent = result?.success || result?.messageId ? true : false

    console.log(`[API] Inquiry rejected and email sent: ${emailSent}`)

    return NextResponse.json({
      success: true,
      inquiryId,
      emailSent,
    })
  } catch (error: any) {
    console.error('[API] Error rejecting inquiry:', {
      message: error.message,
      code: error.code,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to reject inquiry' },
      { status: 500 }
    )
  }
}
