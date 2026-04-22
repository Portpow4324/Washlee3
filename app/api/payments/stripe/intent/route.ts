import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

interface PaymentIntentRequest {
  amount: number
  orderId: string
  customerEmail: string
  customerName: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentIntentRequest = await request.json()
    const { amount, orderId, customerEmail, customerName } = body

    if (!amount || !orderId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description: `Refund for order ${orderId.slice(0, 8)}`,
      receipt_email: customerEmail,
      metadata: {
        orderId,
        customerName,
        type: 'refund',
      },
    })

    console.log('[Stripe] Payment intent created:', paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('[Stripe] Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
