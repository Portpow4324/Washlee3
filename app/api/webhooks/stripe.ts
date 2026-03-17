/**
 * /api/webhooks/stripe - Handles Stripe webhook events
 * Creates orders in Firestore after successful payment
 */
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import admin from 'firebase-admin'
import '@/lib/firebaseAdmin' // Initialize Firebase Admin

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

/**
 * Verify Stripe webhook signature
 */
function verifySignature(req: NextRequest, body: Buffer): string | null {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    console.error('[STRIPE-WEBHOOK] Missing stripe-signature header')
    return null
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return JSON.stringify(event)
  } catch (error: any) {
    console.error('[STRIPE-WEBHOOK] Signature verification failed:', error.message)
    return null
  }
}

/**
 * Handle charge.succeeded event
 * Updates order in Firestore with payment confirmation
 */
async function handleChargeSucceeded(charge: any) {
  console.log('[STRIPE-WEBHOOK] Processing charge.succeeded for:', charge.id)

  try {
    const { metadata, amount_captured, currency, customer_email, id: chargeId } = charge

    // Extract metadata
    const uid = metadata?.uid
    const orderId = metadata?.orderId
    const customerName = metadata?.customerName || 'Customer'
    const customerEmail = metadata?.customerEmail || customer_email || ''

    if (!uid) {
      console.error('[STRIPE-WEBHOOK] Missing uid in metadata for charge:', chargeId)
      return { success: false, error: 'Missing user ID' }
    }

    if (!orderId) {
      console.error('[STRIPE-WEBHOOK] Missing orderId in metadata for charge:', chargeId)
      return { success: false, error: 'Missing order ID' }
    }

    // Fetch the existing order from Firestore
    const db = admin.firestore()
    const orderRef = db.collection('users').doc(uid).collection('orders').doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      console.error('[STRIPE-WEBHOOK] Order not found:', { uid, orderId })
      return { success: false, error: 'Order not found' }
    }

    const existingOrderData = orderDoc.data() as any

    console.log('[STRIPE-WEBHOOK] Found order:', {
      orderId,
      uid,
      currentStatus: existingOrderData?.status,
      chargeId
    })

    // Update order with payment confirmation
    const updateData = {
      chargeId,
      status: 'confirmed',
      orderTotal: amount_captured / 100,
      currency: currency?.toUpperCase() || 'AUD',
      updatedAt: new Date(),
      paymentConfirmedAt: new Date(),
      
      tracking: {
        status: 'pending_pickup',
        lastUpdate: new Date(),
        pickupLocation: existingOrderData?.pickupAddress,
        deliveryLocation: existingOrderData?.deliveryAddressLine1,
      }
    }

    // Update the order document
    await orderRef.update(updateData)

    console.log('[STRIPE-WEBHOOK] ✓ Order updated:', {
      orderId,
      uid,
      chargeId,
      amount: updateData.orderTotal,
      status: updateData.status,
    })

    return {
      success: true,
      orderId,
      uid,
    }
  } catch (error: any) {
    console.error('[STRIPE-WEBHOOK] Error creating order:', error.message)
    console.error('[STRIPE-WEBHOOK] Error details:', error)
    return { success: false, error: error.message }
  }
}

/**
 * POST /api/webhooks/stripe
 * Receive and process Stripe webhook events
 */
export async function POST(request: NextRequest) {
  // Get raw body for signature verification
  const rawBody = await request.arrayBuffer()
  const buffer = Buffer.from(rawBody)

  // Verify Stripe signature
  const eventString = verifySignature(request, buffer)
  if (!eventString) {
    console.error('[STRIPE-WEBHOOK] Signature verification failed')
    return NextResponse.json(
      { received: true, error: 'Invalid signature' },
      { status: 401 }
    )
  }

  const event = JSON.parse(eventString)

  console.log('[STRIPE-WEBHOOK] Received event:', event.type)

  try {
    switch (event.type) {
      case 'charge.succeeded':
        console.log('[STRIPE-WEBHOOK] Processing charge.succeeded')
        await handleChargeSucceeded(event.data.object)
        break

      case 'charge.failed':
        console.log('[STRIPE-WEBHOOK] Charge failed:', event.data.object.id)
        // Could update order status to 'payment_failed'
        break

      case 'charge.refunded':
        console.log('[STRIPE-WEBHOOK] Charge refunded:', event.data.object.id)
        // Could update order status to 'refunded'
        break

      default:
        console.log('[STRIPE-WEBHOOK] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('[STRIPE-WEBHOOK] Webhook processing error:', error)
    // Always return 200 to Stripe to avoid retries, even on error
    return NextResponse.json(
      { received: true, error: 'Processing error' },
      { status: 200 }
    )
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}
