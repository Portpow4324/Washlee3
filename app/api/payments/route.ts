import { NextRequest, NextResponse } from 'next/server'
import {
  savePaymentMethod,
  getPaymentMethods,
  processRefund,
} from '@/lib/paymentService'
import { PaymentIntentSchema, SavePaymentMethodSchema, validateData } from '@/lib/validationSchemas'
import { validationError, successResponse, createdResponse, serverError } from '@/lib/apiUtils'
import { withRateLimit, rateLimits } from '@/lib/middleware/rateLimit'

// NOTE: This API uses Stripe directly and does NOT depend on Firebase Admin SDK
// Firebase Firestore saves are optional/best-effort only
// This ensures payment processing works even if Firebase has issues

const Stripe = require('stripe')

export async function POST(request: NextRequest) {
  // Rate limiting (10 per minute)
  const { allowed, response } = withRateLimit(
    request,
    rateLimits.payment.max,
    rateLimits.payment.window
  )
  if (!allowed) return response!

  try {
    const body = await request.json()
    const { action, customerId, amount, orderId, paymentMethodId, description } = body

    // Validate required customer ID
    if (!customerId || typeof customerId !== 'string') {
      return validationError('Invalid customer ID', {
        customerId: ['Customer ID is required and must be a string']
      })
    }

    // Initialize Stripe with secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-12-15.clover'
    })

    switch (action) {
      case 'create_payment_intent': {
        // Validate input
        const validation = validateData(PaymentIntentSchema, { customerId, amount, orderId, description })
        if (!validation.success) {
          return validationError('Invalid payment intent data', validation.error.flatten().fieldErrors)
        }

        const { amount: validAmount, orderId: validOrderId } = validation.data

        console.log('[PAYMENTS-API] Creating payment intent for customerId:', customerId)
        
        try {
          // Step 1: Create Stripe customer (required for payment intent)
          console.log('[PAYMENTS-API] Step 1: Creating Stripe customer...')
          
          const customer = await stripe.customers.create({
            email: `user-${customerId}@washlee.local`,
            name: 'Customer',
            metadata: {
              firebaseUid: customerId
            }
          })
          
          const stripeCustomerId = customer.id
          console.log('[PAYMENTS-API] ✓ Stripe customer created:', stripeCustomerId)

          // Step 2: Create payment intent with Stripe customer
          console.log('[PAYMENTS-API] Step 2: Creating payment intent...')
          
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(validAmount * 100), // Convert AUD to cents
            currency: 'aud',
            customer: stripeCustomerId,
            description: description || `Order ${validOrderId}`,
            metadata: {
              orderId: validOrderId,
              firebaseUid: customerId,
              timestamp: new Date().toISOString()
            }
          })

          console.log('[PAYMENTS-API] ✓ Payment intent created:', {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount
          })

          // Step 3: Return payment details to client
          return createdResponse({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            stripeCustomerId: stripeCustomerId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
          })

        } catch (stripeErr: any) {
          console.error('[PAYMENTS-API] Stripe error:', stripeErr.message)
          return serverError(stripeErr, 'Failed to create payment intent')
        }
      }

      case 'save_payment_method': {
        // Validate input
        const validation = validateData(SavePaymentMethodSchema, { customerId, paymentMethodId, isDefault: body.isDefault })
        if (!validation.success) {
          return validationError('Invalid payment method data', validation.error.flatten().fieldErrors)
        }

        try {
          const result = await savePaymentMethod(
            customerId,
            validation.data.paymentMethodId,
            validation.data.isDefault || false
          )

          return successResponse(result)
        } catch (error: any) {
          console.error('[PAYMENTS-API] Error saving payment method:', error.message)
          return serverError(error, 'Failed to save payment method')
        }
      }

      case 'get_payment_methods': {
        try {
          const methods = await getPaymentMethods(customerId)
          return successResponse({ methods })
        } catch (error: any) {
          console.error('[PAYMENTS-API] Error getting payment methods:', error.message)
          return serverError(error, 'Failed to retrieve payment methods')
        }
      }

      case 'refund_payment': {
        const { paymentIntentId, refundAmount } = body

        if (!paymentIntentId || typeof paymentIntentId !== 'string') {
          return validationError('Invalid refund data', {
            paymentIntentId: ['Payment intent ID is required and must be a string']
          })
        }

        try {
          const success = await processRefund(
            paymentIntentId,
            refundAmount ? Math.round(refundAmount * 100) : undefined
          )

          return successResponse({ success })
        } catch (error: any) {
          console.error('[PAYMENTS-API] Error processing refund:', error.message)
          return serverError(error, 'Failed to process refund')
        }
      }

      default:
        return validationError('Invalid action', {
          action: ['Unknown action. Valid actions: create_payment_intent, save_payment_method, get_payment_methods, refund_payment']
        })
    }
  } catch (error: any) {
    console.error('[PAYMENTS-API] Request error:', error.message)
    return serverError(error, 'Payment processing failed')
  }
}
