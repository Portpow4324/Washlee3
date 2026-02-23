import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'

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
      // Initialize Firebase Admin if not already done
      if (!admin.apps.length) {
        admin.initializeApp()
      }

      decodedToken = await admin.auth().verifyIdToken(token)
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
    const db = admin.firestore()
    const ordersRef = db.collection('orders')
    const querySnap = await ordersRef
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get()

    const orders: any[] = []
    querySnap.forEach((doc) => {
      orders.push({
        orderId: doc.id,
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
