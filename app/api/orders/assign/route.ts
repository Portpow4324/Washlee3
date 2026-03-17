import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

/**
 * POST /api/orders/assign
 * Called by webhook after successful payment
 * Assigns an order to the first available pro
 * 
 * Flow:
 * 1. Get order details from Firestore
 * 2. Find available pros in the delivery area
 * 3. Assign to first available pro
 * 4. Update order status to "assigned"
 * 5. Create notification for pro
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, orderId } = body

    if (!uid || !orderId) {
      return NextResponse.json(
        { error: 'uid and orderId required' },
        { status: 400 }
      )
    }

    console.log('[ASSIGN-API] Assigning order:', { uid, orderId })

    // Get order details
    const orderRef = adminDb.collection('users').doc(uid).collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()

    if (!orderSnap.exists) {
      console.error('[ASSIGN-API] Order not found:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderSnap.data()
    console.log('[ASSIGN-API] Order found:', { 
      status: order?.status, 
      deliveryCity: order?.deliveryCity,
      deliveryState: order?.deliveryState,
      estimatedWeight: order?.estimatedWeight
    })

    // Get available pros with rating-based and geo-based matching
    const prosSnap = await adminDb
      .collection('professionals')
      .where('active', '==', true)
      .where('verified', '==', true)
      .get()

    if (prosSnap.empty) {
      console.warn('[ASSIGN-API] No available professionals found')
      // Mark as pending assignment instead of failing
      await orderRef.update({
        status: 'pending_assignment',
        statusReason: 'No available professionals',
        updatedAt: new Date(),
      })
      return NextResponse.json({
        success: true,
        message: 'Order marked pending assignment - no pros available',
        assigned: false,
      })
    }

    // Advanced matching: Score pros by geographic proximity + ratings
    const scoredPros = prosSnap.docs.map(proDoc => {
      const pro = proDoc.data()
      let score = 0

      // 1. Geographic proximity (40% weight)
      const sameCity = pro.serviceCity === order?.deliveryCity ? 10 : 0
      const sameState = pro.serviceState === order?.deliveryState ? 5 : 0
      const geoScore = sameCity + sameState

      // 2. Pro ratings (40% weight)
      const avgRating = pro.averageRating || 4.0
      const ratingScore = (avgRating / 5) * 10

      // 3. Current workload (20% weight)
      const activeOrders = pro.activeOrders || 0
      const maxCapacity = pro.maxCapacity || 10
      const workloadScore = Math.max(0, 10 - (activeOrders / maxCapacity) * 10)

      score = (geoScore * 0.4) + (ratingScore * 0.4) + (workloadScore * 0.2)

      return {
        id: proDoc.id,
        data: pro,
        score,
        geoScore,
        ratingScore,
        workloadScore,
      }
    })

    // Sort by score (highest first) and get top pro
    const topPro = scoredPros.sort((a, b) => b.score - a.score)[0]
    const proId = topPro.id
    const pro = topPro.data

    console.log('[ASSIGN-API] Assigning to pro:', { 
      proId, 
      name: pro.name,
      score: topPro.score.toFixed(2),
      rating: pro.averageRating || 'N/A'
    })

    // Create assignment record
    const assignmentRef = adminDb.collection('assignments').doc()
    const assignmentId = assignmentRef.id

    await assignmentRef.set({
      orderId,
      proId,
      uid,
      status: 'assigned',
      assignedAt: new Date(),
      createdAt: new Date(),
    })

    // Update order with assignment
    await orderRef.update({
      assignedProId: proId,
      assignedProName: pro.name,
      assignmentId,
      status: 'assigned',
      statusReason: 'Assigned to professional',
      updatedAt: new Date(),
    })

    console.log('[ASSIGN-API] ✓ Order assigned successfully')

    return NextResponse.json({
      success: true,
      message: 'Order assigned to professional',
      assigned: true,
      assignmentId,
      proId,
      proName: pro.name,
    })
  } catch (error: any) {
    console.error('[ASSIGN-API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Assignment failed' },
      { status: 500 }
    )
  }
}
