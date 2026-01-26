import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover' as any,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, orderTotal, customerEmail, customerName } = body

    if (!orderId || !orderTotal || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Washlee Laundry Service',
              description: `Order ID: ${orderId}`,
            },
            unit_amount: Math.round(orderTotal * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout/cancel?order_id=${orderId}`,
      customer_email: customerEmail,
      metadata: {
        orderId,
        customerName,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}
