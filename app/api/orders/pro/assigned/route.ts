import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { verifyToken } from '@/lib/firebaseAuthServer'

/**
 * GET /api/orders/pro/assigned
 * Get all orders assigned to the authenticated pro
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

    const proId = authResult.uid
    console.log('[PRO-ORDERS-API] Getting assigned orders for pro:', proId)

    // Get all assignments for this pro
    const assignmentsSnap = await adminDb
      .collection('assignments')
      .where('proId', '==', proId)
      .where('status', 'in', ['assigned', 'picked_up', 'washing', 'ready'])
      .orderBy('assignedAt', 'desc')
      .get()

    console.log('[PRO-ORDERS-API] Found assignments:', assignmentsSnap.size)

    const orders: any[] = []

    // Fetch full order details for each assignment
    for (const assignmentDoc of assignmentsSnap.docs) {
      const assignment = assignmentDoc.data()
      const { uid, orderId } = assignment

      try {
        const orderSnap = await adminDb
          .collection('users')
          .doc(uid)
          .collection('orders')
          .doc(orderId)
          .get()

        if (orderSnap.exists) {
          const order = orderSnap.data()
          orders.push({
            orderId,
            uid,
            ...order,
          })
        }
      } catch (err) {
        console.error('[PRO-ORDERS-API] Error fetching order:', orderId, err)
      }
    }

    console.log('[PRO-ORDERS-API] Returning orders:', orders.length)

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    })
  } catch (error: any) {
    console.error('[PRO-ORDERS-API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
