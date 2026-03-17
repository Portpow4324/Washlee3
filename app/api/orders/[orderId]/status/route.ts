import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { 
  sendOrderShipped, 
  sendDeliveryNotification, 
  sendRatingRequest 
} from '@/lib/emailService'

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (privateKey) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.projectId,
      })
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        console.error('[ORDER-STATUS-API] Firebase init error:', error.message)
      }
    }
  }
}

const db = admin.firestore()

/**
 * POST /api/orders/[orderId]/status
 * Update order status and trigger appropriate emails
 * 
 * Body:
 * - status: 'picked_up' | 'delivering' | 'delivered' | 'cancelled'
 * - proName: string (optional, for picked_up status)
 * - estimatedDelivery: string (optional, for picked_up status)
 * - deliveryTime: string (optional, for delivering status)
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, status, proName, estimatedDelivery, deliveryTime } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, status' },
        { status: 400 }
      )
    }

    console.log('[ORDER-STATUS-API] Updating order:', orderId, 'to status:', status)

    // Get order from Firestore
    const orderDoc = await db.collection('orders').doc(orderId).get()

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderData = orderDoc.data() as any
    const customerEmail = orderData.email || orderData.customerEmail
    const customerName = orderData.customerName || 'Valued Customer'

    // Update order status in Firestore
    await db.collection('orders').doc(orderId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      [`${status}At`]: new Date().toISOString(),
    })

    console.log('[ORDER-STATUS-API] ✓ Order status updated:', orderId)

    // Send appropriate email based on status
    const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tracking/${orderId}`

    switch (status) {
      case 'picked_up': {
        // Send "Order Shipped" email
        if (customerEmail) {
          try {
            await sendOrderShipped(
              customerEmail,
              customerName,
              orderId,
              proName || 'Your Washlee Pro',
              estimatedDelivery || 'Soon',
              trackingLink
            )
            console.log('[ORDER-STATUS-API] ✓ Order shipped email sent to:', customerEmail)
          } catch (emailError: any) {
            console.error('[ORDER-STATUS-API] Order shipped email failed:', emailError.message)
          }
        }
        break
      }

      case 'delivering': {
        // Send "On the Way" email
        if (customerEmail) {
          try {
            await sendDeliveryNotification(
              customerEmail,
              customerName,
              orderId,
              proName || 'Your Washlee Pro',
              deliveryTime || 'Soon',
              trackingLink
            )
            console.log('[ORDER-STATUS-API] ✓ Delivery notification email sent to:', customerEmail)
          } catch (emailError: any) {
            console.error('[ORDER-STATUS-API] Delivery notification email failed:', emailError.message)
          }
        }
        break
      }

      case 'delivered': {
        // Send "Rate Your Experience" email (2 hours after delivery)
        // In production, you'd use a scheduled function, but for now we send immediately
        if (customerEmail) {
          try {
            // Get pro name from order if available
            const proNameForRating = orderData.assignedProName || proName || 'Your Washlee Pro'
            const ratingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/orders/${orderId}/review`

            await sendRatingRequest(
              customerEmail,
              customerName,
              proNameForRating,
              orderId,
              ratingLink
            )
            console.log('[ORDER-STATUS-API] ✓ Rating request email sent to:', customerEmail)
          } catch (emailError: any) {
            console.error('[ORDER-STATUS-API] Rating request email failed:', emailError.message)
          }
        }

        // Schedule rating email to be sent 2 hours after delivery if using background jobs
        // For now, it's sent immediately
        break
      }

      default:
        console.log('[ORDER-STATUS-API] No email action for status:', status)
    }

    return NextResponse.json(
      { 
        success: true,
        orderId,
        status,
        message: `Order status updated to ${status}`
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[ORDER-STATUS-API] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Order Status Update API',
    endpoint: '/api/orders/[orderId]/status',
    method: 'POST | PATCH',
    body: {
      orderId: 'string',
      status: 'picked_up | delivering | delivered | cancelled',
      proName: 'string (optional)',
      estimatedDelivery: 'string (optional)',
      deliveryTime: 'string (optional)'
    }
  })
}

/**
 * PATCH /api/orders/[orderId]/status
 * Pro dashboard update for order status
 * Used by professionals to update order progress
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const { customerId, status } = await request.json()

    if (!customerId || !status) {
      return NextResponse.json(
        { error: 'Missing customerId or status' },
        { status: 400 }
      )
    }

    console.log('[ORDER-STATUS-API-PATCH] Updating order:', orderId, 'status:', status)

    // Update order in Firestore
    const orderRef = db
      .collection('users')
      .doc(customerId)
      .collection('orders')
      .doc(orderId)

    const updateData: any = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Add completion timestamp if marking as completed
    if (status === 'completed') {
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp()
    }

    await orderRef.update(updateData)

    console.log('[ORDER-STATUS-API-PATCH] Order updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Order status updated',
    })
  } catch (error: any) {
    console.error('[ORDER-STATUS-API-PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    )
  }
}
