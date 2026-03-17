import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { sendPaymentFailed } from '@/lib/emailService'

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.projectId,
    })
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('[WEBHOOK] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

const Stripe = require('stripe')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover'
})

// Stripe webhook signing secret from .env.local
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events (payment_intent.succeeded, etc)
 * Updates order status in Firestore when payment is confirmed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    console.log('[WEBHOOK] Received Stripe event')
    console.log('[WEBHOOK] Signature present:', !!signature)

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('[WEBHOOK] ✓ Signature verified')
    } catch (err: any) {
      console.warn('[WEBHOOK] Signature verification failed:', err.message)
      // In development/testing, allow unverified webhooks
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 400 }
        )
      }
      // Parse event anyway for testing
      try {
        event = JSON.parse(body)
        console.log('[WEBHOOK] ⚠ Proceeding with unverified event (dev mode)')
      } catch {
        return NextResponse.json(
          { error: 'Invalid event data' },
          { status: 400 }
        )
      }
    }

    console.log('[WEBHOOK] Event type:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'charge.succeeded': {
        console.log('[WEBHOOK] Processing charge.succeeded')
        const charge = event.data.object
        
        // Get the payment intent to find the order ID
        if (charge.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent)
          const orderId = paymentIntent.metadata?.orderId
          
          if (orderId) {
            await updateOrderStatus(orderId, 'confirmed', {
              paymentId: charge.id,
              paymentIntentId: paymentIntent.id,
              amountPaid: charge.amount / 100,
              paidAt: new Date().toISOString(),
            })
          }
        }
        break
      }

      case 'charge.failed': {
        console.log('[WEBHOOK] Processing charge.failed')
        const charge = event.data.object
        
        // Send payment failed email
        try {
          const metadata = charge.metadata || {}
          const customerEmail = metadata.customerEmail || charge.billing_details?.email
          const customerName = metadata.customerName || 'Valued Customer'
          const orderId = metadata.orderId || 'UNKNOWN'
          const errorMessage = charge.failure_message || 'Card declined or payment failed'
          const amount = (charge.amount / 100).toFixed(2)
          const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/payments`

          if (customerEmail) {
            const emailResult = await sendPaymentFailed(
              customerEmail,
              customerName,
              orderId,
              errorMessage,
              amount,
              paymentLink
            )

            if (emailResult.success) {
              console.log('[WEBHOOK] ✓ Payment failed email sent to:', customerEmail)
            } else {
              console.error('[WEBHOOK] Payment failed email send failed:', emailResult.error)
            }
          }
        } catch (emailError: any) {
          console.error('[WEBHOOK] Error sending payment failed email:', emailError.message)
          // Continue - webhook shouldn't fail due to email issues
        }

        // Update order status
        if (charge.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent)
          const orderId = paymentIntent.metadata?.orderId
          
          if (orderId) {
            await updateOrderStatus(orderId, 'payment_failed', {
              paymentId: charge.id,
              failureReason: charge.failure_message,
              failedAt: new Date().toISOString(),
            })
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        console.log('[WEBHOOK] Processing payment_intent.succeeded')
        const paymentIntent = event.data.object
        const orderId = paymentIntent.metadata?.orderId
        
        if (orderId) {
          await updateOrderStatus(orderId, 'confirmed', {
            paymentIntentId: paymentIntent.id,
            amountPaid: paymentIntent.amount / 100,
            paidAt: new Date().toISOString(),
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        console.log('[WEBHOOK] Processing payment_intent.payment_failed')
        const paymentIntent = event.data.object
        const orderId = paymentIntent.metadata?.orderId
        
        if (orderId) {
          await updateOrderStatus(orderId, 'payment_failed', {
            paymentIntentId: paymentIntent.id,
            failureReason: paymentIntent.last_payment_error?.message,
            failedAt: new Date().toISOString(),
          })
        }
        break
      }

      case 'checkout.session.completed': {
        console.log('[WEBHOOK] Processing checkout.session.completed')
        const session = event.data.object
        const orderId = session.metadata?.orderId
        const uid = session.metadata?.uid
        
        if (orderId && session.payment_status === 'paid') {
          await updateOrderStatus(orderId, 'payment_completed', {
            sessionId: session.id,
            amountPaid: session.amount_total / 100,
            paidAt: new Date().toISOString(),
          })
          
          // Assign to pro after payment
          if (uid) {
            console.log('[WEBHOOK] Triggering pro assignment for order:', orderId)
            try {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              const assignResponse = await fetch(`${baseUrl}/api/orders/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, orderId }),
              })
              const assignResult = await assignResponse.json()
              console.log('[WEBHOOK] Assignment result:', assignResult)
            } catch (assignError: any) {
              console.error('[WEBHOOK] Assignment failed:', assignError.message)
              // Don't fail the webhook, assignment can be retried
            }
          }
        }
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        console.log('[WEBHOOK] Processing checkout.session.async_payment_succeeded')
        const session = event.data.object
        const orderId = session.metadata?.orderId
        
        if (orderId) {
          await updateOrderStatus(orderId, 'confirmed', {
            sessionId: session.id,
            amountPaid: session.amount_total / 100,
            paidAt: new Date().toISOString(),
          })
        }
        break
      }

      case 'checkout.session.async_payment_failed': {
        console.log('[WEBHOOK] Processing checkout.session.async_payment_failed')
        const session = event.data.object
        const orderId = session.metadata?.orderId
        
        if (orderId) {
          await updateOrderStatus(orderId, 'payment_failed', {
            sessionId: session.id,
            failureReason: 'Async payment failed',
            failedAt: new Date().toISOString(),
          })
        }
        break
      }

      default:
        console.log('[WEBHOOK] Unhandled event type:', event.type)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json(
      { received: true, eventType: event.type },
      { status: 200 }
    )

  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error'
    console.error('[WEBHOOK] Error processing webhook:', errorMsg)
    
    // Return 200 anyway to avoid retry loops
    return NextResponse.json(
      { error: errorMsg, received: false },
      { status: 200 }
    )
  }
}

/**
 * Update order status in Firestore
 */
async function updateOrderStatus(
  orderId: string,
  status: string,
  extraData: Record<string, any> = {}
) {
  try {
    console.log(`[WEBHOOK] Updating order ${orderId} to status: ${status}`)

    const orderRef = db.collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()

    if (!orderSnap.exists) {
      console.warn(`[WEBHOOK] Order ${orderId} not found in Firestore`)
      // Try to create it if it doesn't exist
      return
    }

    // Update the order
    await orderRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...extraData,
    })

    console.log(`[WEBHOOK] ✓ Order ${orderId} updated to ${status}`)
    
    // Log the update for debugging
    console.log('[WEBHOOK] Order update data:', {
      orderId,
      status,
      extraData,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error(`[WEBHOOK] Failed to update order ${orderId}:`, error.message)
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is running',
    endpoint: '/api/webhooks/stripe',
    method: 'POST',
    events: [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'charge.succeeded',
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded',
      'checkout.session.async_payment_failed',
    ]
  })
}
