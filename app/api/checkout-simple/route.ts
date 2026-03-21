import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  console.log('[CHECKOUT-SIMPLE] ===== NEW CHECKOUT REQUEST =====')
  try {
    const body = await request.json()
    console.log('[CHECKOUT-SIMPLE] Request received:', { orderId: body.orderId, amount: body.amount, email: body.email })

    // Validate input
    if (!body.amount || typeof body.amount !== 'number' || body.amount < 1) {
      console.log('[CHECKOUT-SIMPLE] Invalid amount:', body.amount)
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }
    if (!body.email) {
      console.log('[CHECKOUT-SIMPLE] Missing email')
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      )
    }

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[CHECKOUT-SIMPLE] STRIPE_SECRET_KEY not set')
      return NextResponse.json(
        { success: false, error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    console.log('[CHECKOUT-SIMPLE] Initializing Stripe...')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const baseUrl = 'http://localhost:3001'

    // Create simple Stripe checkout session
    console.log('[CHECKOUT-SIMPLE] Creating Stripe session for $' + body.amount)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Laundry Service',
              description: 'Washlee Laundry Order',
            },
            unit_amount: Math.round(body.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking`,
      customer_email: body.email,
      metadata: {
        orderId: body.orderId || 'unknown',
      },
    })

    console.log('[CHECKOUT-SIMPLE] ✅ Session created:', session.id)
    console.log('[CHECKOUT-SIMPLE] Session URL:', session.url)

    return NextResponse.json({
      data: {
        sessionId: session.id,
        url: session.url,
      },
      success: true,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[CHECKOUT-SIMPLE] ❌ ERROR:', error.message)
    console.error('[CHECKOUT-SIMPLE] Full error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
