import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, customerId, amount, orderId, description, paymentMethodId } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'create_payment_intent': {
        // Get or create Stripe customer ID
        const userRef = doc(db, 'users', customerId)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }

        let stripeCustomerId = userSnap.data().stripeCustomerId

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: userSnap.data().email,
            name: userSnap.data().name || 'Customer',
            metadata: {
              firebaseUid: customerId
            }
          })

          stripeCustomerId = customer.id

          // Save to Firestore
          await updateDoc(userRef, {
            stripeCustomerId
          })
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
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

        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        })
      }

      case 'confirm_payment': {
        // Payment confirmation is handled by webhook
        return NextResponse.json({
          success: true,
          message: 'Payment processing'
        })
      }

      case 'get_payment_methods': {
        // Get saved payment methods
        const userRef = doc(db, 'users', customerId)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }

        const stripeCustomerId = userSnap.data().stripeCustomerId
        if (!stripeCustomerId) {
          return NextResponse.json({ methods: [] })
        }

        const paymentMethods = await stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: 'card'
        })

        return NextResponse.json({
          methods: paymentMethods.data.map((pm: any) => ({
            id: pm.id,
            type: pm.type,
            card: {
              brand: pm.card?.brand,
              last4: pm.card?.last4,
              expMonth: pm.card?.exp_month,
              expYear: pm.card?.exp_year
            }
          }))
        })
      }

      case 'save_payment_method': {
        // Attach payment method to customer
        const userRef = doc(db, 'users', customerId)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }

        let stripeCustomerId = userSnap.data().stripeCustomerId

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: userSnap.data().email,
            name: userSnap.data().name || 'Customer',
            metadata: {
              firebaseUid: customerId
            }
          })

          stripeCustomerId = customer.id

          await updateDoc(userRef, {
            stripeCustomerId
          })
        }

        // Attach payment method
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId
        })

        // Save to Firestore
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

        await addDoc(collection(db, 'users', customerId, 'payment_methods'), {
          stripePaymentMethodId: paymentMethodId,
          type: paymentMethod.type,
          card: paymentMethod.card,
          createdAt: Timestamp.now()
        })

        return NextResponse.json({
          success: true,
          paymentMethodId
        })
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
