import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

// Plan to Stripe Price ID mapping
const PLAN_TO_PRICE_ID: { [key: string]: string } = {
  'none': '', // No subscription - pay per order
  'starter': process.env.STRIPE_PRICE_ID_STARTER || '',
  'professional': process.env.STRIPE_PRICE_ID_PROFESSIONAL || '',
  'washly': process.env.STRIPE_PRICE_ID_WASHLY || '',
}

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json()

    if (!plan) {
      console.error('[Checkout] Missing plan parameter')
      return NextResponse.json({ error: 'Missing plan parameter' }, { status: 400 })
    }

    // Get user from auth header or session
    const authHeader = request.headers.get('authorization')
    console.log('[Checkout] Auth header present:', !!authHeader)
    console.log('[Checkout] Creating checkout session for plan:', plan)

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Checkout] Missing STRIPE_SECRET_KEY')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    // Get the price ID for the plan
    const priceId = PLAN_TO_PRICE_ID[plan]
    if (priceId === undefined) {
      console.error('[Checkout] Invalid plan:', plan)
      console.error('[Checkout] Available plans:', Object.keys(PLAN_TO_PRICE_ID))
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    if (!priceId) {
      console.error('[Checkout] Missing price ID for plan:', plan)
      return NextResponse.json({ 
        error: `Stripe price ID not configured for plan: ${plan}. Please contact support.` 
      }, { status: 500 })
    }

    console.log('[Checkout] Using price ID:', priceId, 'for plan:', plan)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscriptions?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscriptions?canceled=true`,
      // Add customer email if available from context
      customer_email: undefined, // Will be populated by frontend
    })

    console.log('[Checkout] ✓ Stripe session created:', session.id)

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    }, { status: 200 })
  } catch (error: any) {
    console.error('[Checkout] Error creating checkout session:', error)
    console.error('[Checkout] Error message:', error?.message)
    console.error('[Checkout] Error code:', error?.code)
    
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
