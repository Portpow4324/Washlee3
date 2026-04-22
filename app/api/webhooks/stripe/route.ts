import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Verify and process Stripe webhooks
export async function POST(request: NextRequest) {
  console.log('[WEBHOOK] Stripe webhook received')

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    if (!webhookSecret) {
      console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify the webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('[WEBHOOK] Signature verified. Event type:', event.type)
    } catch (err: any) {
      console.error('[WEBHOOK] Signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Handle different event types
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('[WEBHOOK] Payment completed for session:', session.id)
      console.log('[WEBHOOK] Session metadata:', session.metadata)
      console.log('[WEBHOOK] Amount total:', session.amount_total, 'Currency:', session.currency)

      // Extract order info from metadata
      const orderId = session.metadata?.orderId
      const customerId = session.metadata?.userId || 'anonymous'
      const amountPaid = (session.amount_total || 0) / 100 // Convert cents to dollars

      if (orderId) {
        console.log('[WEBHOOK] Updating order status to paid:', orderId, 'Amount:', amountPaid)
        
        // Update order in database with actual payment amount
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            price: amountPaid, // Update with actual amount from Stripe
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('[WEBHOOK] Failed to update order:', updateError.message)
        } else {
          console.log('[WEBHOOK] ✅ Order updated successfully')
        }

        // Log payment confirmation
        const { error: logError } = await supabase
          .from('payment_confirmations')
          .insert({
            order_id: orderId,
            customer_id: customerId,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            payment_status: 'confirmed',
            amount: (session.amount_total || 0) / 100,
            currency: session.currency,
            confirmed_at: new Date().toISOString(),
          })

        if (logError) {
          console.warn('[WEBHOOK] Failed to log payment (non-critical):', logError.message)
        } else {
          console.log('[WEBHOOK] ✅ Payment logged successfully')
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('[WEBHOOK] Payment failed for intent:', paymentIntent.id)

      // Extract metadata
      const metadata = paymentIntent.metadata as any
      const orderId = metadata?.orderId

      if (orderId) {
        console.log('[WEBHOOK] Updating order status to payment_failed:', orderId)
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'payment_failed',
            payment_status: 'failed',
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('[WEBHOOK] Failed to update order:', updateError.message)
        } else {
          console.log('[WEBHOOK] ✅ Order marked as payment failed')
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('[WEBHOOK] ❌ Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Webhook endpoint is ready' }, { status: 200 })
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
