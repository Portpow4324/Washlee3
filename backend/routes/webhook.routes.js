const express = require('express')
const router = express.Router()
const { verifyWebhookSignature } = require('../services/stripeService')
const { getUser, activateSubscription, deactivateSubscription, createOrder } = require('../services/firebaseService')

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 *
 * This endpoint bypasses authentication and uses Stripe signature verification instead
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature']

    if (!signature) {
      console.warn('[Webhook] Missing Stripe signature')
      return res.status(400).json({
        error: 'Missing Stripe signature',
      })
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(req.body, signature)

    console.log(`[Webhook] Received event: ${event.type}`)

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutSessionCompleted(event.data.object)
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      await handlePaymentFailed(event.data.object)
    }

    // Acknowledge receipt
    res.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error.message)
    res.status(400).json({
      error: 'Webhook processing failed',
      message: error.message,
    })
  }
})

/**
 * Handle checkout.session.completed event
 * This fires when a customer completes Stripe Checkout for laundry booking
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    // For laundry bookings, uid comes from metadata, not firebaseUID
    const uid = session.metadata?.uid
    const orderId = session.metadata?.orderId
    const email = session.customer_email

    console.log('[Webhook] Processing laundry booking completion:', { uid, orderId, email })

    if (!uid) {
      console.error('[Webhook] Missing uid in session metadata - cannot create order without user ID')
      return
    }

    if (!orderId) {
      console.error('[Webhook] Missing orderId in session metadata')
      return
    }

    // Verify user exists in Firebase
    const user = await getUser(uid)
    if (!user) {
      console.error(`[Webhook] User ${uid} not found in Firebase`)
      return
    }

    console.log(`[Webhook] User verified: ${uid}`)

    // Build booking data from metadata
    const bookingData = {
      estimatedWeight: parseFloat(session.metadata?.estimatedWeight || '5'),
      deliverySpeed: session.metadata?.deliverySpeed || 'standard',
      pickupTime: session.metadata?.pickupTime || 'soon',
      scheduleDate: session.metadata?.scheduleDate || '',
      scheduleTime: session.metadata?.scheduleTime || '',
      detergent: session.metadata?.detergent || 'eco-friendly',
      waterTemp: session.metadata?.waterTemp || 'warm',
      foldingPreference: session.metadata?.foldingPreference || 'folded',
      specialCare: session.metadata?.specialCare || '',
      deliveryAddress: {
        line1: session.metadata?.deliveryAddressLine1 || '',
        line2: session.metadata?.deliveryAddressLine2 || '',
        city: session.metadata?.deliveryCity || '',
        state: session.metadata?.deliveryState || '',
        postcode: session.metadata?.deliveryPostcode || '',
      },
      deliveryNotes: session.metadata?.deliveryNotes || '',
      addOns: {},
    }

    // Parse add-ons from JSON
    if (session.metadata?.addOnsJson) {
      try {
        bookingData.addOns = JSON.parse(session.metadata.addOnsJson)
      } catch (e) {
        console.warn('[Webhook] Could not parse add-ons JSON:', e.message)
        bookingData.addOns = {}
      }
    }

    // Create order record with full booking details
    const order = await createOrder(uid, {
      orderId,
      email,
      bookingData,
      amount: session.amount_total / 100, // Convert cents to dollars
      sessionId: session.id,
      paymentId: session.payment_intent,
      status: 'confirmed',
    })

    console.log(`[Webhook] ✓ Order created and synced to user account: ${order.orderId}`)
    console.log(`[Webhook] ✓ Order data synced for user ${uid}`)
  } catch (error) {
    console.error('[Webhook] Error handling checkout.session.completed:', error.message)
    console.error('[Webhook] Error details:', error)
    throw error
  }
}

/**
 * Handle payment_intent.payment_failed event
 * This fires when a payment fails
 */
async function handlePaymentFailed(paymentIntent) {
  try {
    const firebaseUID = paymentIntent.metadata?.firebaseUID

    if (!firebaseUID) {
      console.error('[Webhook] Missing firebaseUID in payment intent metadata')
      return
    }

    console.log(`[Webhook] Processing payment failure for user ${firebaseUID}`)

    // Verify user exists
    const user = await getUser(firebaseUID)
    if (!user) {
      console.error(`[Webhook] User ${firebaseUID} not found`)
      return
    }

    // Deactivate subscription in Firestore
    await deactivateSubscription(firebaseUID)

    console.log(`[Webhook] Subscription deactivated for user ${firebaseUID}`)
  } catch (error) {
    console.error('[Webhook] Error handling payment_intent.payment_failed:', error.message)
    throw error
  }
}

module.exports = router
