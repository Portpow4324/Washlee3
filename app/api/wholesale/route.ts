import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { sendWholesaleInquiryAdminNotification, sendWholesaleInquiryConfirmation } from '@/lib/emailService'

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (!privateKey) {
    console.error('[WHOLESALE-API] FIREBASE_PRIVATE_KEY is missing!')
  }
  
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
      console.error('[WHOLESALE-API] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

/**
 * POST /api/wholesale - Submit wholesale pre-booking inquiry
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[WHOLESALE-API] POST request received')
    
    const body = await request.json()
    const { uid, name, email, phone, company, orderType, estimatedWeight, frequency, preferredDates, notes, agreedToTerms } = body

    // Validation
    if (!name || !email || !phone || !company || !estimatedWeight) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (parseFloat(estimatedWeight) < 45) {
      return NextResponse.json(
        { error: 'Minimum order size is 45kg' },
        { status: 400 }
      )
    }

    const inquiryData = {
      uid: uid || '',
      name,
      email,
      phone,
      company,
      orderType,
      estimatedWeight: parseFloat(estimatedWeight),
      frequency,
      preferredDates,
      notes,
      agreedToTerms,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Store in Firestore
    try {
      const docRef = await db.collection('wholesale_inquiries').add(inquiryData)
      console.log('[WHOLESALE-API] ✓ Inquiry created:', docRef.id)

      // Send email notifications
      const adminEmail = 'lukaverde045@gmail.com'
      const adminLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com.au'}/admin/wholesale/${docRef.id}`

      // Send to admin
      await sendWholesaleInquiryAdminNotification(
        adminEmail,
        company,
        name,
        email,
        phone,
        estimatedWeight,
        orderType,
        frequency,
        docRef.id,
        notes || '',
        adminLink
      )

      // Send confirmation to customer
      await sendWholesaleInquiryConfirmation(
        email,
        name,
        company,
        estimatedWeight,
        orderType,
        frequency,
        docRef.id
      )

      console.log('[WHOLESALE-API] ✓ Emails sent successfully')
      
      return NextResponse.json({
        success: true,
        inquiryId: docRef.id,
        message: 'Wholesale inquiry submitted successfully. Check your email for confirmation.'
      }, { status: 201 })
    } catch (dbError: any) {
      const errorMsg = dbError.message || 'Unknown database error'
      console.error('[WHOLESALE-API] Database Error:', errorMsg)

      return NextResponse.json(
        { error: `Failed to submit inquiry: ${errorMsg}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error'
    console.error('[WHOLESALE-API] Error:', errorMsg)

    return NextResponse.json(
      { error: `Failed to process request: ${errorMsg}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Wholesale API is running',
    endpoint: '/api/wholesale',
    method: 'POST'
  })
}
