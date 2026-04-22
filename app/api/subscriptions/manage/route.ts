import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')
    const { action } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Get the subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, stripe_customer_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (action === 'cancel') {
      if (subscription.stripe_subscription_id) {
        // Cancel in Stripe
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        })
      }

      // Update in database
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ status: 'cancellation_requested' })
        .eq('id', subscription.id)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json(
        { success: true, message: 'Subscription cancellation initiated' },
        { status: 200 }
      )
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[Manage Subscription] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to manage subscription' },
      { status: 500 }
    )
  }
}
