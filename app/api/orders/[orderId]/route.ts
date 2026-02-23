import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'

/**
 * GET /api/orders/[orderId]
 * Fetch order details from Firestore (requires authentication)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId
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

    // Fetch order from Firestore using Admin SDK
    const db = admin.firestore()
    const orderDoc = await db.collection('orders').doc(orderId).get()

    if (!orderDoc.exists) {
      console.log(`[API] Order not found: ${orderId}`)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderData = orderDoc.data()
    
    // Verify user owns this order
    if (orderData?.uid !== decodedToken.uid) {
      console.log('[API] User does not own this order')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const order = {
      orderId: orderDoc.id,
      ...orderData,
    }

    console.log(`[API] Order fetched: ${orderId}`)

    return NextResponse.json(order)
  } catch (error) {
    console.error('[API] Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}
