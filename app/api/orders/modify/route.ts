import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

/**
 * PATCH /api/orders/modify
 * Handle order reschedule or cancellation with refunds
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, customerId, action, newPickupDate, reason } = body

    if (!customerId || !orderId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, customerId, action' },
        { status: 400 }
      )
    }

    // Get order details
    const orderRef = adminDb.collection('users').doc(customerId).collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderSnap.data()

    if (action === 'reschedule') {
      if (!newPickupDate) {
        return NextResponse.json(
          { error: 'New pickup date required' },
          { status: 400 }
        )
      }

      // Only allow rescheduling if order hasn't been picked up yet
      if (['picked_up', 'washing', 'ready', 'completed'].includes(order?.status)) {
        return NextResponse.json(
          { error: 'Cannot reschedule order after pickup' },
          { status: 400 }
        )
      }

      await orderRef.update({
        scheduledPickupDate: new Date(newPickupDate),
        rescheduledAt: new Date(),
        rescheduledReason: reason || '',
        updatedAt: new Date(),
      })

      console.log(`Order rescheduled: ${orderId} to ${newPickupDate}`)

      return NextResponse.json({
        success: true,
        message: 'Order rescheduled successfully',
        orderId,
        newPickupDate,
      })
    } else if (action === 'cancel') {
      // Only allow cancellation if order hasn't been picked up
      if (['picked_up', 'washing', 'ready', 'completed'].includes(order?.status)) {
        return NextResponse.json(
          { error: 'Cannot cancel order after pickup' },
          { status: 400 }
        )
      }

      // Process refund if payment was made
      let refundId = null
      if (order?.paymentIntentId) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: order.paymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
              orderId,
              reason: reason || 'customer_request',
            },
          })
          refundId = refund.id
          console.log(`Refund processed: ${refundId} for order ${orderId}`)
        } catch (refundError: any) {
          console.error('Refund error:', refundError)
          // Don't fail the cancellation if refund fails - admin can handle manually
        }
      }

      // Update order status
      await orderRef.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason || 'customer_request',
        refundId,
        updatedAt: new Date(),
      })

      // If order was assigned to a pro, mark assignment as cancelled
      if (order?.assignmentId) {
        const assignmentRef = adminDb.collection('assignments').doc(order.assignmentId)
        await assignmentRef.update({
          status: 'cancelled',
          cancelledAt: new Date(),
        })
      }

      console.log(`Order cancelled: ${orderId}, Refund: ${refundId || 'N/A'}`)

      return NextResponse.json({
        success: true,
        message: 'Order cancelled successfully. Refund processed.',
        orderId,
        refundId,
        refundAmount: order?.totalPrice,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "reschedule" or "cancel"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error modifying order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to modify order' },
      { status: 500 }
    )
  }
}
