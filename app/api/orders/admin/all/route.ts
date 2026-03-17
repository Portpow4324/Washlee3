import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { verifyToken } from '@/lib/firebaseAuthServer'

/**
 * GET /api/orders/admin/all
 * Get all orders in the system (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check if user is admin
    console.log('[ADMIN-ORDERS] Fetching all orders')

    const orders: any[] = []

    // Get all users
    const usersSnap = await adminDb.collection('users').get()

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id

      // Get all orders for this user
      const ordersSnap = await adminDb
        .collection('users')
        .doc(uid)
        .collection('orders')
        .orderBy('createdAt', 'desc')
        .get()

      for (const orderDoc of ordersSnap.docs) {
        const order = orderDoc.data()
        orders.push({
          orderId: orderDoc.id,
          uid,
          ...order,
        })
      }
    }

    console.log('[ADMIN-ORDERS] Total orders:', orders.length)

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    })
  } catch (error: any) {
    console.error('[ADMIN-ORDERS] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
