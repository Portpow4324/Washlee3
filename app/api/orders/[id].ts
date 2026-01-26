import { NextRequest, NextResponse } from 'next/server'
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  deleteDoc,
  collection,
  addDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Order, canBeCancelled } from '@/lib/orderUtils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = { id: orderSnap.id, ...orderSnap.data() } as Order
    return NextResponse.json(order, { status: 200 })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await request.json()
    const { action, ...updates } = body

    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderSnap.data() as Order

    switch (action) {
      case 'update_status': {
        const { status } = body
        if (!status) {
          return NextResponse.json(
            { error: 'Status required' },
            { status: 400 }
          )
        }

        await updateDoc(orderRef, {
          status,
          updatedAt: Timestamp.now()
        })

        // Log status change
        const updatesRef = collection(db, 'orders', orderId, 'updates')
        await addDoc(updatesRef, {
          timestamp: Timestamp.now(),
          status,
          message: `Order status changed to ${status}`,
          action: 'status_update'
        })

        return NextResponse.json(
          { success: true, status },
          { status: 200 }
        )
      }

      case 'assign_pro': {
        const { proId, proName, proPhone, proRating } = body
        if (!proId) {
          return NextResponse.json(
            { error: 'Pro ID required' },
            { status: 400 }
          )
        }

        await updateDoc(orderRef, {
          proId,
          assignedPro: {
            id: proId,
            name: proName,
            phone: proPhone,
            rating: proRating
          },
          status: 'accepted',
          updatedAt: Timestamp.now()
        })

        return NextResponse.json(
          { success: true },
          { status: 200 }
        )
      }

      case 'add_feedback': {
        const { rating, review, photos } = body
        if (!rating) {
          return NextResponse.json(
            { error: 'Rating required' },
            { status: 400 }
          )
        }

        await updateDoc(orderRef, {
          feedback: {
            rating,
            review: review || '',
            photos: photos || []
          },
          updatedAt: Timestamp.now()
        })

        return NextResponse.json(
          { success: true },
          { status: 200 }
        )
      }

      case 'cancel': {
        if (!canBeCancelled(order.status)) {
          return NextResponse.json(
            { error: `Cannot cancel order with status: ${order.status}` },
            { status: 400 }
          )
        }

        const { reason } = body
        await updateDoc(orderRef, {
          status: 'cancelled',
          cancellationReason: reason || 'Customer requested',
          cancelledAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })

        return NextResponse.json(
          { success: true },
          { status: 200 }
        )
      }

      case 'mark_completed': {
        if (order.status !== 'delivering') {
          return NextResponse.json(
            { error: 'Order must be in delivering status' },
            { status: 400 }
          )
        }

        await updateDoc(orderRef, {
          status: 'completed',
          actualDelivery: Timestamp.now(),
          updatedAt: Timestamp.now()
        })

        return NextResponse.json(
          { success: true },
          { status: 200 }
        )
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderSnap.data() as Order

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only delete pending orders' },
        { status: 400 }
      )
    }

    await deleteDoc(orderRef)

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}
