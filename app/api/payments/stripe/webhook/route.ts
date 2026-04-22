import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/email-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('[Stripe Webhook] Invalid signature:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('[Stripe Webhook] Event received:', event.type)

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata?.orderId
      const customerName = paymentIntent.metadata?.customerName

      if (!orderId) {
        console.warn('[Stripe Webhook] No orderId in metadata')
        return NextResponse.json({ received: true })
      }

      // Update refund status to completed
      const { error: updateError } = await supabaseAdmin
        .from('refund_requests')
        .update({
          status: 'completed',
          payment_method: 'stripe',
          transaction_id: paymentIntent.id,
          completed_at: new Date(),
        })
        .eq('order_id', orderId)

      if (updateError) {
        console.error('[Stripe Webhook] Failed to update refund:', updateError)
      } else {
        console.log('[Stripe Webhook] Refund marked as completed:', orderId)

        // Get user email to send confirmation
        const { data: refund } = await supabaseAdmin
          .from('refund_requests')
          .select('user_id, amount')
          .eq('order_id', orderId)
          .single()

        if (refund) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', refund.user_id)
            .single()

          if (user?.email) {
            try {
              await sendEmail({
                to: user.email,
                subject: 'Your Refund Has Been Processed',
                html: `
                  <h2>Refund Processed Successfully</h2>
                  <p>Hi ${customerName},</p>
                  <p>Your refund has been successfully processed.</p>
                  <p><strong>Amount:</strong> $${refund.amount.toFixed(2)}</p>
                  <p><strong>Payment Method:</strong> Stripe</p>
                  <p><strong>Status:</strong> Completed</p>
                  <p>The funds will appear in your original payment method within 3-5 business days.</p>
                  <p>If you have any questions, please contact our support team.</p>
                  <p>Best regards,<br>The Washlee Team</p>
                `,
              })
            } catch (emailError) {
              console.error('[Stripe Webhook] Failed to send confirmation email:', emailError)
            }
          }
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata?.orderId

      if (orderId) {
        // Update refund status to failed
        await supabaseAdmin
          .from('refund_requests')
          .update({
            status: 'failed',
            payment_method: 'stripe',
            transaction_id: paymentIntent.id,
          })
          .eq('order_id', orderId)

        console.log('[Stripe Webhook] Payment failed for order:', orderId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
