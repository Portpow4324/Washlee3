import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Update payment in Firestore
        const paymentsRef = collection(db, 'payments')
        const q = query(
          paymentsRef,
          where('stripePaymentIntentId', '==', paymentIntent.id)
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const paymentDoc = querySnapshot.docs[0]
          await updateDoc(paymentDoc.ref, {
            status: 'succeeded',
            updatedAt: Timestamp.now()
          })

          // Update order status
          const orderId = paymentIntent.metadata?.orderId
          if (orderId) {
            const orderRef = doc(db, 'orders', orderId)
            await updateDoc(orderRef, {
              paymentStatus: 'completed',
              paymentConfirmedAt: Timestamp.now(),
              status: 'confirmed'
            })
          }
        }

        console.log('Payment succeeded:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Update payment in Firestore
        const paymentsRef = collection(db, 'payments')
        const q = query(
          paymentsRef,
          where('stripePaymentIntentId', '==', paymentIntent.id)
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const paymentDoc = querySnapshot.docs[0]
          await updateDoc(paymentDoc.ref, {
            status: 'failed',
            updatedAt: Timestamp.now()
          })

          // Update order status
          const orderId = paymentIntent.metadata?.orderId
          if (orderId) {
            const orderRef = doc(db, 'orders', orderId)
            await updateDoc(orderRef, {
              paymentStatus: 'failed'
            })
          }
        }

        console.log('Payment failed:', paymentIntent.id)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        // Update payment in Firestore
        const paymentsRef = collection(db, 'payments')
        const q = query(
          paymentsRef,
          where('stripePaymentIntentId', '==', charge.payment_intent)
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const paymentDoc = querySnapshot.docs[0]
          await updateDoc(paymentDoc.ref, {
            status: 'refunded',
            refundAmount: charge.amount_refunded,
            updatedAt: Timestamp.now()
          })
        }

        console.log('Payment refunded:', charge.id)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.metadata?.firebaseUid

        if (customerId) {
          const userRef = doc(db, 'users', customerId)
          await updateDoc(userRef, {
            subscriptionStatus: subscription.status,
            subscriptionEndDate: Timestamp.fromDate(
              new Date((subscription as any).current_period_end * 1000)
            )
          })
        }

        console.log('Subscription updated:', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.metadata?.firebaseUid

        if (customerId) {
          const userRef = doc(db, 'users', customerId)
          await updateDoc(userRef, {
            subscriptionStatus: 'cancelled',
            stripeSubscriptionId: null
          })
        }

        console.log('Subscription cancelled:', subscription.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
