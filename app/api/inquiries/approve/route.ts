import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { generateOfferLetterHTML } from '@/lib/offer-letter'
import { sendOfferLetter } from '@/lib/email-service'

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
    const { inquiryId, adminId, adminName } = await request.json()

    if (!inquiryId || !adminId) {
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
      status: 'approved',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: adminId,
      adminName: adminName,
    })

    // Generate employee ID
    const employeeId = `EMP-${Date.now()}`

    // Update user record with employee status
    const userId = inquiryData?.userId
    if (userId) {
      await db.collection('users').doc(userId).update({
        isEmployee: true,
        employeeId: employeeId,
        approvalDate: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: adminId,
      })
    }

    // Generate and send offer letter email
    const offerLetterData = {
      employeeId,
      firstName: inquiryData?.firstName || 'Pro Partner',
      lastName: inquiryData?.lastName || '',
      email: inquiryData?.email || '',
      phone: inquiryData?.phone || '',
      state: inquiryData?.state || '',
      approvalDate: new Date().toISOString(),
    }

    const offerLetterHtml = generateOfferLetterHTML(offerLetterData)
    
    // Send email - don't fail the approval if email fails
    const emailSent = await sendOfferLetter(
      inquiryData?.email,
      inquiryData?.firstName,
      inquiryData?.lastName,
      offerLetterHtml,
      employeeId
    )

    console.log(`[API] Inquiry approved and offer letter sent: ${emailSent}`)

    return NextResponse.json({
      success: true,
      inquiryId,
      employeeId,
      emailSent,
    })
  } catch (error: any) {
    console.error('[API] Error approving inquiry:', {
      message: error.message,
      code: error.code,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to approve inquiry' },
      { status: 500 }
    )
  }
}
