import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

/**
 * GET /api/orders/user/[uid]
 * Fetch all orders for a user (requires authentication)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params
    console.log('[API] GET /api/orders/user/' + uid)

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get auth header
    const authHeader = request.headers.get('authorization')
    console.log('[API] Auth header present:', !!authHeader)

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[API] No valid auth header')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    console.log('[API] Token:', token.substring(0, 20) + '...')

    // Verify the token using Firebase Admin SDK
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
      console.log('[API] Token verified for user:', decodedToken.uid)
    } catch (tokenError) {
      console.error('[API] Token verification failed:', tokenError)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify the requested uid matches the token
    if (decodedToken.uid !== uid) {
      console.log('[API] User ID mismatch:', decodedToken.uid, 'vs', uid)
      return NextResponse.json(
        { error: 'Unauthorized - uid mismatch' },
        { status: 403 }
      )
    }

    // Fetch orders from Firestore using Admin SDK
    // Orders are stored in user subcollection: users/{uid}/orders/{orderId}
    const ordersSnapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .get()

    const orders: any[] = []
    ordersSnapshot.forEach((doc) => {
      orders.push({
        orderId: doc.id,
        id: doc.id,
        ...doc.data(),
      })
    })

    console.log(`[API] Fetched ${orders.length} orders for user ${uid}`)

    return NextResponse.json({
      count: orders.length,
      orders,
    })
  } catch (error) {
    console.error('[API] Error fetching user orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
