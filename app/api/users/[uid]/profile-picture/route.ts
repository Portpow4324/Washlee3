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
      console.error('[PROFILE-PIC] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()
const bucket = (() => {
  try {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6'}.appspot.com`
    return admin.storage().bucket(bucketName)
  } catch (error: any) {
    console.error('[PROFILE-PIC] Storage bucket not available:', error.message)
    return null
  }
})()

/**
 * POST /api/users/[uid]/profile-picture
 * Uploads and stores profile picture in Firebase Storage
 * Validates file size and type
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    if (!bucket) {
      return NextResponse.json(
        { error: 'Storage service not available' },
        { status: 503 }
      )
    }

    const { uid } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Upload to Firebase Storage
    const fileName = `profile-pictures/${uid}-${Date.now()}`
    const fileBuffer = await file.arrayBuffer()
    
    const file_ref = bucket.file(fileName)
    await file_ref.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: file.type
      }
    })

    // Get signed URL
    const [url] = await file_ref.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    // Update user record
    await db.collection('users').doc(uid).update({
      profilePictureUrl: url,
      profilePictureStoragePath: fileName,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      url,
      message: 'Profile picture uploaded successfully'
    })
  } catch (error) {
    console.error('[PROFILE-PIC-ERROR]', error)
    return NextResponse.json(
      { error: 'Profile picture upload failed' },
      { status: 500 }
    )
  }
}
