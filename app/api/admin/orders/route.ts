import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { verifyToken } from '@/lib/firebaseAuthServer'

/**
 * GET /api/admin/orders
 * Get all orders across the system (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Check if user is admin
    console.log('[ADMIN-ORDERS-API] Fetching all orders')

    const allOrders: any[] = []

    // Get all users and their orders
    const usersSnap = await adminDb.collection('users').get()

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id
      const ordersSnap = await adminDb
        .collection('users')
        .doc(uid)
        .collection('orders')
        .get()

      for (const orderDoc of ordersSnap.docs) {
        const order = orderDoc.data()
        allOrders.push({
          orderId: orderDoc.id,
          uid,
          ...order,
        })
      }
    }

    console.log('[ADMIN-ORDERS-API] Found orders:', allOrders.length)

    return NextResponse.json({
      success: true,
      count: allOrders.length,
      orders: allOrders.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0
        const timeB = b.createdAt?.seconds || 0
        return timeB - timeA
      }),
    })
  } catch (error: any) {
    console.error('[ADMIN-ORDERS-API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
