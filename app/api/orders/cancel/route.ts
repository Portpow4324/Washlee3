import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, App } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Parse Firebase service account key from environment
let adminApp: App | null = null

function getAdminApp() {
  if (adminApp) return adminApp
  
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount as any),
    projectId: process.env.FIREBASE_PROJECT_ID,
  })

  return adminApp
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const admin = getAdminApp()
    const auth = getAuth(admin)
    const db = getFirestore(admin)

    // Verify the token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification error:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decodedToken.uid
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order from Firestore
    const orderRef = db.collection('orders').doc(orderId)
    const orderSnapshot = await orderRef.get()

    if (!orderSnapshot.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderData = orderSnapshot.data()

    // Verify order belongs to the user
    if (orderData?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this order' },
        { status: 403 }
      )
    }

    // Check if order can be cancelled (only active orders)
    const cancellableStatuses = ['pending', 'confirmed', 'picked_up', 'in_washing', 'ready_for_delivery']
    if (!cancellableStatuses.includes(orderData?.status)) {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${orderData?.status}` },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    await orderRef.update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: 'customer',
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
