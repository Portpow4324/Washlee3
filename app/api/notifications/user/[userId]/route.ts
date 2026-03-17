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
      console.error('[USER-NOTIFICATIONS] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

/**
 * GET /api/notifications/user/[userId]?limit={limit}&offset={offset}&unreadOnly={unreadOnly}
 * Returns paginated notifications for user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Query notifications
    let query = db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .orderBy('timestamp', 'desc')

    if (unreadOnly) {
      query = query.where('read', '==', false)
    }

    const snapshot = await query.get()
    const total = snapshot.size

    // Paginate
    const notifications = snapshot.docs
      .slice(offset, offset + limit)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toISOString()
      }))

    // Count unread
    const unreadSnapshot = await query.where('read', '==', false).get()
    const unreadCount = unreadSnapshot.size

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('[USER-NOTIFICATIONS-ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    )
  }
}
