import { NextRequest, NextResponse } from 'next/server'
import { validationError, createdResponse, serverError } from '@/lib/apiUtils'
import { withRateLimit, rateLimits } from '@/lib/middleware/rateLimit'
import { verifyToken } from '@/lib/firebaseAuthServer'
import Stripe from 'stripe'
import admin from 'firebase-admin'
import '@/lib/firebaseAdmin'

/**
 * /api/checkout - Creates a Stripe checkout session
 * 
 * Flow:
 * 1. Client sends: amount, email, name, orderId, bookingDetails
 * 2. We store booking details in Firestore (under the order)
 * 3. We create Stripe session with minimal metadata (just orderId, uid)
 * 4. Webhook receives payment confirmation and fetches order from Firestore
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult) {
      console.error('[CHECKOUT-API] Authentication failed')
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED', timestamp: new Date().toISOString() },
        { status: 401 }
      )
    }
    console.log('[CHECKOUT-API] Auth verified for user:', authResult.uid)

    // Rate limiting
    const { allowed, response: rateLimitResponse } = withRateLimit(
      request,
      rateLimits.checkout.max,
      rateLimits.checkout.window
    )
    if (!allowed) return rateLimitResponse!

    const body = await request.json()
    console.log('[CHECKOUT-API] Payload received:', { 
      amount: body.amount, 
      email: body.email,
      orderId: body.orderId,
      hasBookingDetails: !!body.bookingDetails
    })

    // Simple validation
    if (!body.amount || typeof body.amount !== 'number' || body.amount < 24) {
      console.error('[CHECKOUT-API] Validation failed: Invalid amount')
      return validationError('Amount must be at least $24')
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      console.error('[CHECKOUT-API] Validation failed: Invalid email')
      return validationError('Invalid email')
    }
    if (!body.name || body.name.trim().length < 2) {
      console.error('[CHECKOUT-API] Validation failed: Invalid name')
      return validationError('Name required')
    }
    if (!body.orderId) {
      console.error('[CHECKOUT-API] Validation failed: Missing orderId')
      console.error('[CHECKOUT-API] Request body keys:', Object.keys(body))
      console.error('[CHECKOUT-API] Request body:', {
        amount: body.amount,
        email: body.email,
        name: body.name,
        hasOrderId: !!body.orderId,
        hasBookingDetails: !!body.bookingDetails
      })
      return validationError('Order ID required - please try booking again')
    }

    const uid = authResult.uid
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[CHECKOUT-API] STRIPE_SECRET_KEY not set')
      return serverError(new Error('Stripe not configured'), 'Stripe configuration missing')
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Store booking details in Firestore FIRST (before creating Stripe session)
    // This way we don't hit Stripe metadata character limits
    try {
      const db = admin.firestore()
      const orderRef = db.collection('users').doc(uid).collection('orders').doc(body.orderId)
      
      // Update the order with full booking details
      await orderRef.update({
        ...body.bookingDetails,
        updatedAt: new Date(),
        lastUpdatedReason: 'Checkout initiated'
      })
      
      console.log('[CHECKOUT-API] ✓ Order updated with booking details:', body.orderId)
    } catch (dbError: any) {
      console.error('[CHECKOUT-API] Failed to update order in Firestore:', dbError.message)
      return serverError(dbError, 'Failed to save booking details')
    }

    // Build line items from booking details to show breakdown to customer
    const lineItems: any[] = []
    const bookingDetails = body.bookingDetails || {}
    
    // Base laundry service
    const estimatedWeight = bookingDetails.estimatedWeight || (bookingDetails.bagCount * 2.5) || 0
    const baseRate = bookingDetails.deliverySpeed === 'express' ? 10.0 : 5.0
    const baseCost = estimatedWeight * baseRate
    
    if (baseCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Laundry Service',
            description: `${estimatedWeight.toFixed(1)}kg @ $${baseRate}/kg${bookingDetails.deliverySpeed === 'express' ? ' (Express)' : ''}`,
          },
          unit_amount: Math.round(baseCost * 100),
        },
        quantity: 1,
      })
    }
    
    // Add-on: Hang Dry
    if (bookingDetails.hangDry) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Hang Dry Service',
            description: 'Hang-dry delicate items',
          },
          unit_amount: 1650, // $16.50
        },
        quantity: 1,
      })
    }
    
    // Add-on: Delicates Care
    if (bookingDetails.delicatesCare) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Delicates Care + Ironing',
            description: 'Special care and ironing for delicate items',
          },
          unit_amount: 2200, // $22.00
        },
        quantity: 1,
      })
    }
    
    // Add-on: Comforter Service
    if (bookingDetails.comforterService) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Comforter Service',
            description: 'Professional cleaning for comforters and quilts',
          },
          unit_amount: 2500, // $25.00
        },
        quantity: 1,
      })
    }
    
    // Add-on: Stain Treatment
    if (bookingDetails.stainTreatment) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Stain Treatment',
            description: 'Professional stain removal per item',
          },
          unit_amount: 50, // $0.50
        },
        quantity: bookingDetails.stainTreatmentCount || 1,
      })
    }
    
    // Add-on: Oversized Items
    if (bookingDetails.oversizedItems && bookingDetails.oversizedItems > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Oversized Items',
            description: 'Large items (beds, blankets, etc)',
          },
          unit_amount: 800, // $8.00 per item
        },
        quantity: bookingDetails.oversizedItems,
      })
    }
    
    // Protection Plan
    if (bookingDetails.protectionPlan === 'premium') {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Protection Plan - Premium',
            description: 'Premium damage protection',
          },
          unit_amount: 250, // $2.50
        },
        quantity: 1,
      })
    } else if (bookingDetails.protectionPlan === 'premium-plus') {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Protection Plan - Premium Plus',
            description: 'Premium Plus damage protection',
          },
          unit_amount: 575, // $5.75
        },
        quantity: 1,
      })
    }
    
    // If no line items (shouldn't happen), add a single line for the total
    if (lineItems.length === 0) {
      const totalCents = Math.round(body.amount * 100)
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Laundry Service',
            description: 'Pickup, wash, and delivery service',
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      })
    }

    // Create Stripe checkout session with MINIMAL metadata
    // The webhook will fetch full booking details from Firestore using orderId
    console.log('[CHECKOUT-API] Creating Stripe session with minimal metadata:', {
      amount: body.amount,
      email: body.email,
      orderId: body.orderId,
      uid
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking?paymentStatus=cancelled`,
      customer_email: body.email,
      metadata: {
        uid,
        orderId: body.orderId,
        customerName: body.name.substring(0, 100), // Limit to 100 chars
        customerEmail: body.email.substring(0, 100), // Limit to 100 chars
      },
    })

    console.log('[CHECKOUT-API] ✓ Session created:', session.id)
    console.log('[CHECKOUT-API] Redirect URL:', session.url)

    return createdResponse({
      sessionId: session.id,
      url: session.url,
      success: true
    })
  } catch (error: any) {
    console.error('[CHECKOUT-API] Error:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      type: error.type,
    })
    return serverError(error, 'Failed to create Stripe checkout session')
  }
}
