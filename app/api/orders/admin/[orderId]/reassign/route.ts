import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { verifyToken } from '@/lib/firebaseAuthServer'

/**
 * POST /api/orders/admin/[orderId]/reassign
 * Reassign order to next available pro
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId required' },
        { status: 400 }
      )
    }

    console.log('[ADMIN-REASSIGN] Reassigning order:', orderId)

    // Get order
    const orderRef = adminDb
      .collection('users')
      .doc(customerId)
      .collection('orders')
      .doc(orderId)

    const orderSnap = await orderRef.get()
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Find next available pro
    const prosSnap = await adminDb
      .collection('professionals')
      .where('active', '==', true)
      .where('verified', '==', true)
      .limit(1)
      .get()

    if (prosSnap.empty) {
      return NextResponse.json({
        success: false,
        message: 'No available professionals',
      })
    }

    const proDoc = prosSnap.docs[0]
    const proId = proDoc.id
    const pro = proDoc.data()

    console.log('[ADMIN-REASSIGN] Assigning to pro:', proId)

    // Create assignment
    await adminDb.collection('assignments').add({
      proId,
      uid: customerId,
      orderId,
      status: 'assigned',
      assignedAt: new Date(),
    })

    // Update order
    await orderRef.update({
      status: 'assigned',
      assignedProId: proId,
      assignedProName: pro.name,
      updatedAt: new Date(),
    })

    console.log('[ADMIN-REASSIGN] Order reassigned successfully')

    return NextResponse.json({
      success: true,
      message: 'Order reassigned',
      proId,
      proName: pro.name,
    })
  } catch (error: any) {
    console.error('[ADMIN-REASSIGN] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reassign order' },
      { status: 500 }
    )
  }
}
