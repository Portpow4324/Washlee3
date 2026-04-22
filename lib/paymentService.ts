import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover'
})

export interface PaymentIntent {
  id: string
  status: 'succeeded' | 'pending' | 'failed'
  amount: number
  currency: string
  orderId: string
  customerId: string
  createdAt: string
  updatedAt: string
}

export interface PaymentMethod {
  id: string
  type: 'card'
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  customerId: string
  isDefault: boolean
}

// Create Stripe customer with retry logic for rate limits
export async function createStripeCustomer(
  customerId: string,
  email: string,
  name: string,
  retries = 3
): Promise<string> {
  try {
    console.log('[PaymentService] Creating Stripe customer for:', customerId)
    
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        supabaseUid: customerId
      }
    })

    console.log('[PaymentService] Stripe customer created successfully:', customer.id)

    // Save Stripe customer ID to Supabase
    const { error } = await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', customerId)

    if (error) {
      console.error('[PaymentService] Error saving Stripe customer ID to Supabase:', error)
      throw error
    }

    console.log('[PaymentService] Stripe customer ID saved to Supabase')
    return customer.id
  } catch (error: any) {
    // Handle rate limiting (429 error) with exponential backoff
    if (error?.status === 429 && retries > 0) {
      const delay = Math.pow(2, 4 - retries) * 1000 // Exponential backoff: 1s, 2s, 4s
      console.warn(`[PaymentService] Rate limited. Retrying in ${delay}ms (${retries} retries left)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return createStripeCustomer(customerId, email, name, retries - 1)
    }
    
    console.error('[PaymentService] Error creating Stripe customer:', error?.message || error)
    throw error
  }
}

// Create payment intent
export async function createPaymentIntent(
  customerId: string,
  amount: number, // in cents
  orderId: string,
  description?: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  try {
    console.log('[Payment] Creating payment intent for:', { customerId, amount, orderId })
    
    // Get Stripe customer ID from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', customerId)
      .single()
    
    if (userError || !userData) {
      console.error('[Payment] User not found in Supabase:', customerId)
      throw new Error('User not found in Supabase')
    }

    const stripeCustomerId = userData.stripe_customer_id
    console.log('[Payment] Retrieved stripeCustomerId:', stripeCustomerId)
    
    if (!stripeCustomerId) {
      console.error('[Payment] Stripe customer not set up. User data:', userData)
      throw new Error('Stripe customer not set up - run createStripeCustomer() first')
    }

    // Create payment intent
    console.log('[Payment] Calling Stripe API to create payment intent')
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'aud',
      customer: stripeCustomerId,
      description: description || `Order ${orderId}`,
      metadata: {
        orderId,
        supabaseUid: customerId
      }
    })

    console.log('[Payment] Payment intent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret ? 'present' : 'missing'
    })

    // Save to Supabase
    const { error: insertError } = await supabase
      .from('transactions')
      .insert([{
        stripe_payment_intent_id: paymentIntent.id,
        order_id: orderId,
        user_id: customerId,
        amount,
        currency: 'aud',
        status: paymentIntent.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])

    if (insertError) {
      console.error('[Payment] Error saving payment intent to Supabase:', insertError)
    }

    return {
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('[Payment] Error creating payment intent:', errorMsg, error)
    throw error
  }
}

// Get or create payment method
export async function savePaymentMethod(
  customerId: string,
  stripePaymentMethodId: string,
  isDefault: boolean = false
): Promise<PaymentMethod | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', customerId)
      .single()
    
    if (userError || !userData) {
      throw new Error('User not found')
    }

    const stripeCustomerId = userData.stripe_customer_id
    if (!stripeCustomerId) {
      throw new Error('Stripe customer not set up')
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId)
    
    await stripe.paymentMethods.attach(stripePaymentMethodId, {
      customer: stripeCustomerId
    })

    // Set as default if requested
    if (isDefault) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: stripePaymentMethodId
        }
      })
    }

    // For now, payment methods are managed through Stripe
    // In future, could store reference in Supabase if needed

    return {
      id: stripePaymentMethodId,
      type: 'card',
      card: {
        brand: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '****',
        expMonth: paymentMethod.card?.exp_month || 0,
        expYear: paymentMethod.card?.exp_year || 0
      },
      customerId,
      isDefault
    }
  } catch (error) {
    console.error('Error saving payment method:', error)
    return null
  }
}

// Get saved payment methods
export async function getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', customerId)
      .single()
    
    if (userError || !userData) {
      return []
    }

    const stripeCustomerId = userData.stripe_customer_id
    if (!stripeCustomerId) {
      return []
    }

    // Get from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card'
    })

    return paymentMethods.data.map((pm: any) => ({
      id: pm.id,
      type: 'card',
      card: {
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '****',
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0
      },
      customerId,
      isDefault: false
    }))
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return []
  }
}

// Confirm payment
export async function confirmPayment(
  customerId: string,
  paymentIntentId: string
): Promise<boolean> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      console.log('Payment confirmed:', paymentIntentId)
      return true
    }

    return false
  } catch (error) {
    console.error('Error confirming payment:', error)
    return false
  }
}

// Create subscription
export async function createSubscription(
  customerId: string,
  priceId: string
): Promise<string | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', customerId)
      .single()
    
    if (userError || !userData) {
      throw new Error('User not found')
    }

    const stripeCustomerId = userData.stripe_customer_id
    if (!stripeCustomerId) {
      throw new Error('Stripe customer not set up')
    }

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    })

    // Save to Supabase
    const { error: updateError } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: customerId,
        stripe_subscription_id: subscription.id,
        plan_type: priceId,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])

    if (updateError) {
      console.error('[Payment] Error saving subscription to Supabase:', updateError)
    }

    return subscription.id
  } catch (error) {
    console.error('Error creating subscription:', error)
    return null
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await stripe.subscriptions.cancel(subscriptionId)
    return true
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return false
  }
}

// Process refund
export async function processRefund(
  paymentIntentId: string,
  amount?: number
): Promise<boolean> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount // in cents, undefined = full refund
    })

    console.log('Refund created:', refund.id)
    return true
  } catch (error) {
    console.error('Error processing refund:', error)
    return false
  }
}

// Get payment history
export async function getPaymentHistory(
  customerId: string,
  limit: number = 20
): Promise<PaymentIntent[]> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', customerId)
      .single()
    
    if (userError || !userData) {
      return []
    }

    const stripeCustomerId = userData.stripe_customer_id
    if (!stripeCustomerId) {
      return []
    }

    // Get charges from Stripe
    const charges = await stripe.charges.list({
      customer: stripeCustomerId,
      limit
    })

    return charges.data.map((charge: any) => ({
      id: charge.id,
      status: charge.status === 'succeeded' ? 'succeeded' : 'failed',
      amount: charge.amount,
      currency: charge.currency,
      orderId: charge.metadata?.orderId || '',
      customerId,
      createdAt: new Date(charge.created * 1000).toISOString(),
      updatedAt: new Date(charge.created * 1000).toISOString()
    }))
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return []
  }
}
