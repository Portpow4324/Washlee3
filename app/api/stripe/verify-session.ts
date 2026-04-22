import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover' as any,
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment was not completed' },
        { status: 400 }
      )
    }

    // Extract subscription info
    const subscriptionId = session.subscription as string
    let subscription: any = null
    let planName = 'Standard'
    let amount = 0
    let interval = 'monthly'

    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = subscription.items.data[0].price.id
      
      // Map price IDs to plan names (you may need to adjust based on your Stripe setup)
      const priceData = await stripe.prices.retrieve(priceId)
      planName = priceData.nickname || 'Premium'
      amount = (priceData.unit_amount || 0) / 100
      interval = priceData.recurring?.interval || 'month'
    }

    return NextResponse.json({
      success: true,
      sessionId,
      subscriptionId,
      planName,
      amount,
      interval,
      customerEmail: session.customer_email,
      currentPeriodEnd: subscription?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    })
  } catch (error) {
    console.error('Stripe verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment session' },
      { status: 500 }
    )
  }
}
