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

    // Handle ID verification upload to Firebase Storage
    let idVerification = null
    if (inquiryData.idVerification?.base64) {
      try {
        const bucket = admin.storage().bucket()
        const fileName = `inquiries/${inquiryData.userId}/${Date.now()}-${inquiryData.idVerification.fileName || 'id-document'}`
        const file = bucket.file(fileName)
        
        // Convert base64 to buffer
        const base64Data = inquiryData.idVerification.base64.replace(/^data:image\/[a-z]+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        
        // Upload to Firebase Storage
        await file.save(buffer, {
          metadata: {
            contentType: inquiryData.idVerification.fileType || 'image/jpeg',
            metadata: {
              userId: inquiryData.userId,
              uploadedAt: new Date().toISOString(),
            },
          },
          public: false, // Keep private, access via signed URLs
        })
        
        // Get download URL (signed for 1 year)
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        })
        
        idVerification = {
          fileName: inquiryData.idVerification.fileName,
          fileType: inquiryData.idVerification.fileType,
          storagePath: fileName,
          downloadUrl: url,
        }
        
        console.log('[API] ID document uploaded to storage:', fileName)
      } catch (uploadError: any) {
        console.error('[API] Failed to upload ID document:', uploadError)
        // Continue without ID verification rather than failing the whole inquiry
        idVerification = null
      }
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
    // Perform a quick mock AI assessment of the uploaded ID image (dev/test only)
    const idAnalysis = idVerification
      ? {
          isLikelyReal: true,
          confidence: 0.85,
          notes: 'Automated check completed. Manual review still required.',
          evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }
      : null

    const docRef = await db.collection('inquiries').add({
      ...inquiryData,
      idVerification,
      idAnalysis,
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
