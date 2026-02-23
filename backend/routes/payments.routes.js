const express = require('express')
const router = express.Router()
const { createCheckoutSession } = require('../services/stripeService')
const { getUser, updateUser } = require('../services/firebaseService')
const { verifyFirebaseAuth } = require('../middleware/auth.middleware')

/**
 * POST /payments/create-checkout-session
 * Create a Stripe checkout session for subscription payment
 */
router.post('/create-checkout-session', verifyFirebaseAuth, async (req, res) => {
  try {
    const { plan, priceId } = req.body
    const uid = req.user.uid

    // Validate request
    if (!plan || !priceId) {
      return res.status(400).json({
        error: 'Missing required fields: plan, priceId',
      })
    }

    console.log(`[Payments] Creating checkout session for user ${uid}, plan ${plan}`)

    // Verify user exists
    const user = await getUser(uid)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      })
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession(uid, plan, priceId)

    // Update user subscription status to pending
    await updateUser(uid, {
      'subscription.paymentStatus': 'pending',
      'subscription.plan': plan,
    })

    console.log(`[Payments] Checkout session created: ${session.id}`)

    res.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('[Payments] Error creating checkout session:', error.message)
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    })
  }
})

module.exports = router
