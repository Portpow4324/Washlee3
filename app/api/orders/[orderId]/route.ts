import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

/**
 * GET /api/orders/[orderId]
 * Fetch order details from Firestore (requires authentication)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    console.log('[API] GET /api/orders/' + orderId)

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
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

    // Fetch order from Firestore using Admin SDK
    // Orders are stored at: users/{uid}/orders/{orderId}
    const orderDoc = await adminDb.collection('users').doc(decodedToken.uid).collection('orders').doc(orderId).get()

    if (!orderDoc.exists) {
      console.log(`[API] Order not found: ${orderId} for user: ${decodedToken.uid}`)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderData = orderDoc.data()

    const order = {
      id: orderDoc.id,
      orderId: orderData?.orderId || orderDoc.id,
      ...orderData,
    }

    console.log(`[API] Order fetched: ${orderId} for user: ${decodedToken.uid}`)

    return NextResponse.json(order)
  } catch (error) {
    console.error('[API] Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}
