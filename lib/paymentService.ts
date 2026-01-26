import Stripe from 'stripe'
import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc, Timestamp, addDoc, collection } from 'firebase/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover'
})

export interface PaymentIntent {
  id: string
  status: 'succeeded' | 'pending' | 'failed'
  amount: number
  currency: string
  orderId: string
  customerId: string
  createdAt: Timestamp
  updatedAt: Timestamp
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

// Create Stripe customer
export async function createStripeCustomer(
  customerId: string,
  email: string,
  name: string
): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        firebaseUid: customerId
      }
    })

    // Save Stripe customer ID to Firestore
    const userRef = doc(db, 'users', customerId)
    await updateDoc(userRef, {
      stripeCustomerId: customer.id
    })

    return customer.id
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
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
    // Get Stripe customer ID
    const userRef = doc(db, 'users', customerId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      throw new Error('User not found')
    }

    const stripeCustomerId = userSnap.data().stripeCustomerId
    if (!stripeCustomerId) {
      throw new Error('Stripe customer not set up')
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'aud',
      customer: stripeCustomerId,
      description: description || `Order ${orderId}`,
      metadata: {
        orderId,
        firebaseUid: customerId
      }
    })

    // Save to Firestore
    await addDoc(collection(db, 'payments'), {
      stripePaymentIntentId: paymentIntent.id,
      orderId,
      customerId,
      amount,
      currency: 'aud',
      status: paymentIntent.status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    return {
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
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
    const userRef = doc(db, 'users', customerId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      throw new Error('User not found')
    }

    const stripeCustomerId = userSnap.data().stripeCustomerId
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

    // Save to Firestore
    const paymentMethodsRef = collection(db, 'users', customerId, 'payment_methods')
    await addDoc(paymentMethodsRef, {
      stripePaymentMethodId,
      type: paymentMethod.type,
      card: paymentMethod.card,
      isDefault,
      createdAt: Timestamp.now()
    })

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
    const userRef = doc(db, 'users', customerId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return []
    }

    const stripeCustomerId = userSnap.data().stripeCustomerId
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
      // Find and update order
      const paymentsRef = collection(db, 'payments')
      // Query by payment intent ID and update
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
    const userRef = doc(db, 'users', customerId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      throw new Error('User not found')
    }

    const stripeCustomerId = userSnap.data().stripeCustomerId
    if (!stripeCustomerId) {
      throw new Error('Stripe customer not set up')
    }

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    })

    // Save to Firestore
    await updateDoc(userRef, {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPriceId: priceId,
      subscriptionStartDate: Timestamp.fromDate(new Date((subscription as any).current_period_start * 1000)),
      subscriptionEndDate: Timestamp.fromDate(new Date((subscription as any).current_period_end * 1000))
    })

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
    const userRef = doc(db, 'users', customerId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return []
    }

    const stripeCustomerId = userSnap.data().stripeCustomerId
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
      createdAt: Timestamp.fromDate(new Date(charge.created * 1000)),
      updatedAt: Timestamp.fromDate(new Date(charge.created * 1000))
    }))
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return []
  }
}
