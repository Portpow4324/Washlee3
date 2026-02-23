const stripe = require('stripe')

/**
 * Initialize Stripe
 */
const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripeClient = stripe(stripeKey)

/**
 * Create checkout session for subscription
 */
async function createCheckoutSession(uid, plan, priceId) {
  try {
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        firebaseUID: uid,
        plan: plan,
      },
    })

    console.log(`[Stripe] Created checkout session ${session.id} for user ${uid}`)
    return session
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error)
    throw error
  }
}

/**
 * Retrieve checkout session details
 */
async function getCheckoutSession(sessionId) {
  try {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId)
    return session
  } catch (error) {
    console.error('[Stripe] Error retrieving checkout session:', error)
    throw error
  }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(body, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
  }

  try {
    const event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret)
    return event
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error.message)
    throw new Error('Invalid webhook signature')
  }
}

module.exports = {
  stripeClient,
  createCheckoutSession,
  getCheckoutSession,
  verifyWebhookSignature,
}
