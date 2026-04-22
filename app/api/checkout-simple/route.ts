import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  console.log('[CHECKOUT-SIMPLE] ===== NEW CHECKOUT REQUEST =====')
  try {
    const body = await request.json()
    console.log('[CHECKOUT-SIMPLE] Request received:', { orderId: body.orderId, amount: body.amount, email: body.email })
    
    // Log full booking details if provided
    if (body.bookingDetails) {
      console.log('[CHECKOUT-SIMPLE] Booking Details Received:', {
        bagCount: body.bookingDetails.bagCount,
        estimatedWeight: body.bookingDetails.estimatedWeight,
        deliverySpeed: body.bookingDetails.deliverySpeed,
        protectionPlan: body.bookingDetails.protectionPlan,
        customWeight: body.bookingDetails.customWeight,
      })
    }

    // Validate input
    if (!body.amount || typeof body.amount !== 'number' || body.amount < 1) {
      console.log('[CHECKOUT-SIMPLE] Invalid amount:', body.amount)
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }
    if (!body.email) {
      console.log('[CHECKOUT-SIMPLE] Missing email')
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      )
    }

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[CHECKOUT-SIMPLE] STRIPE_SECRET_KEY not set')
      return NextResponse.json(
        { success: false, error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    console.log('[CHECKOUT-SIMPLE] Initializing Stripe...')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    
    // Get the actual host from the request to handle localhost:3000, localhost:3001, or production URL
    const forwardedProto = request.headers.get('x-forwarded-proto') || request.headers.get('scheme')
    const forwardedHost = request.headers.get('x-forwarded-host')
    const requestHost = request.headers.get('host')
    
    // For localhost development, use the actual request host (which will be localhost:3000 or localhost:3001)
    // For production, prefer x-forwarded-* headers from reverse proxy
    let baseUrl: string
    
    if (forwardedProto && forwardedHost) {
      // Production: behind reverse proxy
      const cleanHost = forwardedHost.split(',')[0].trim()
      baseUrl = `${forwardedProto}://${cleanHost}`
    } else if (requestHost) {
      // Development: direct request
      baseUrl = `http://${requestHost}`
    } else {
      // Fallback
      baseUrl = 'http://localhost:3000'
    }
    
    console.log('[CHECKOUT-SIMPLE] Base URL determined:')
    console.log('[CHECKOUT-SIMPLE]   - x-forwarded-proto:', forwardedProto)
    console.log('[CHECKOUT-SIMPLE]   - x-forwarded-host:', forwardedHost)
    console.log('[CHECKOUT-SIMPLE]   - request host:', requestHost)
    console.log('[CHECKOUT-SIMPLE]   - final URL:', baseUrl)

    // Build line items with detailed breakdown
    console.log('[CHECKOUT-SIMPLE] Creating Stripe session for $' + body.amount)
    console.log('[CHECKOUT-SIMPLE] Protection Plan:', body.protectionPlan)
    
    const lineItems: any[] = []
    const bookingDetails = body.bookingDetails || {}

    // Base laundry service
    const estimatedWeight = bookingDetails.estimatedWeight || (bookingDetails.bagCount * 2.5) || 0
    const baseRate = bookingDetails.deliverySpeed === 'express' ? 12.50 : 7.50
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

    // Hang Dry Service
    if (bookingDetails.hangDry) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Hang Dry Service',
            description: 'Hang-dry delicate items',
          },
          unit_amount: 1650,
        },
        quantity: 1,
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
          unit_amount: 350,
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
          unit_amount: 850,
        },
        quantity: 1,
      })
    }

    // If no line items generated, create a single line item for the total
    if (lineItems.length === 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Washlee Laundry Order',
            description: 'Laundry Service',
          },
          unit_amount: Math.round(body.amount * 100),
        },
        quantity: 1,
      })
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking`,
      customer_email: body.email,
      metadata: {
        orderId: body.orderId || 'unknown',
        protectionPlan: body.protectionPlan || 'basic',
      },
    })

    console.log('[CHECKOUT-SIMPLE] ✅ Session created:', session.id)
    console.log('[CHECKOUT-SIMPLE] Session URL:', session.url)

    return NextResponse.json({
      data: {
        sessionId: session.id,
        url: session.url,
      },
      success: true,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[CHECKOUT-SIMPLE] ❌ ERROR:', error.message)
    console.error('[CHECKOUT-SIMPLE] Full error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
