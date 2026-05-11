import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { calculateBookingQuote, getMobilePricingConfig } from '@/lib/mobilePricing'

export async function POST(request: NextRequest) {
  console.log('[CHECKOUT] ===== NEW CHECKOUT REQUEST =====')
  try {
    const body = await request.json()
    console.log('[CHECKOUT] 1. Request body received:', { orderId: body.orderId, amount: body.amount })
    
    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.log('[CHECKOUT] 2. ERROR: No auth header')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Verify the user token
    console.log('[CHECKOUT] 2. Verifying auth token...')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (!user || authError) {
      console.error('[CHECKOUT] 2. ERROR: Auth failed:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CHECKOUT] 3. Auth verified for user:', user.id)

    // Validate input
    if (!body.amount || typeof body.amount !== 'number' || body.amount < 24) {
      console.log('[CHECKOUT] 4. ERROR: Invalid amount:', body.amount)
      return NextResponse.json(
        { success: false, error: 'Amount must be at least $24' },
        { status: 400 }
      )
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      console.log('[CHECKOUT] 4. ERROR: Invalid email:', body.email)
      return NextResponse.json(
        { success: false, error: 'Invalid email' },
        { status: 400 }
      )
    }
    if (!body.name || body.name.trim().length < 2) {
      console.log('[CHECKOUT] 4. ERROR: Invalid name:', body.name)
      return NextResponse.json(
        { success: false, error: 'Name required' },
        { status: 400 }
      )
    }
    if (!body.orderId) {
      console.log('[CHECKOUT] 4. ERROR: No order ID')
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      )
    }

    console.log('[CHECKOUT] 4. All validations passed')

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[CHECKOUT] 5. ERROR: STRIPE_SECRET_KEY not set')
      return NextResponse.json(
        { success: false, error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    console.log('[CHECKOUT] 5. Stripe initialized')
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
    
    console.log('[CHECKOUT] 6. Base URL determined:')
    console.log('[CHECKOUT]   - x-forwarded-proto:', forwardedProto)
    console.log('[CHECKOUT]   - x-forwarded-host:', forwardedHost)
    console.log('[CHECKOUT]   - request host:', requestHost)
    console.log('[CHECKOUT]   - final URL:', baseUrl)
    
    // Skip database update for now - focus on getting Stripe working

    // Build line items from booking details
    const lineItems: any[] = []
    const bookingDetails = body.bookingDetails || {}
    const pricingConfig = await getMobilePricingConfig()
    const quote = calculateBookingQuote({
      estimatedWeight: bookingDetails.estimatedWeight,
      weight: bookingDetails.weight,
      customWeight: bookingDetails.customWeight,
      bagCount: bookingDetails.bagCount,
      deliverySpeed: bookingDetails.deliverySpeed,
      protectionPlan: bookingDetails.protectionPlan || body.protectionPlan,
      hangDry: bookingDetails.hangDry,
      returnsOnHangers: bookingDetails.returnsOnHangers,
    }, pricingConfig)

    // Base laundry service
    if (quote.baseSubtotal > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Laundry Service',
            description: `${quote.estimatedWeight.toFixed(1)}kg @ $${quote.ratePerKg.toFixed(2)}/kg${quote.deliverySpeed === 'express' ? ' (Express)' : ''}${quote.minimumOrderApplied ? ' · minimum order applied' : ''}`,
          },
          unit_amount: Math.round(quote.baseSubtotal * 100),
        },
        quantity: 1,
      })
    }

    // Add-ons
    if (bookingDetails.hangDry) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Hang Dry Service',
            description: 'Hang-dry delicate items',
          },
          unit_amount: Math.round(quote.hangDryPrice * 100),
        },
        quantity: 1,
      })
    }

    if (quote.returnOnHangersPrice > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Return on Hangers',
            description: 'Return selected garments on hangers',
          },
          unit_amount: Math.round(quote.returnOnHangersPrice * 100),
        },
        quantity: 1,
      })
    }

    if (bookingDetails.delicatesCare) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Delicates Care + Ironing',
            description: 'Special care and ironing for delicate items',
          },
          unit_amount: 2200,
        },
        quantity: 1,
      })
    }

    if (bookingDetails.comforterService) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Comforter Service',
            description: 'Professional cleaning for comforters and quilts',
          },
          unit_amount: 2500,
        },
        quantity: 1,
      })
    }

    if (bookingDetails.stainTreatment) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Stain Treatment',
            description: 'Professional stain removal per item',
          },
          unit_amount: 50,
        },
        quantity: bookingDetails.stainTreatmentCount || 1,
      })
    }

    if (bookingDetails.oversizedItems && bookingDetails.oversizedItems > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Oversized Items',
            description: 'Large items (beds, blankets, etc)',
          },
          unit_amount: 800,
        },
        quantity: bookingDetails.oversizedItems,
      })
    }

    // Protection Plan
    if (quote.protectionPrice > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: quote.protectionPlan === 'standard'
              ? 'Protection Plan - Standard'
              : 'Protection Plan - Premium',
            description: quote.protectionPlan === 'standard'
              ? 'Standard damage protection'
              : 'Premium damage protection',
          },
          unit_amount: Math.round(quote.protectionPrice * 100),
        },
        quantity: 1,
      })
    }

    // If no line items, add a single line for the total
    if (lineItems.length === 0) {
      const totalCents = Math.round(quote.total * 100)
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

    // Create Stripe checkout session
    console.log('[CHECKOUT] 7. Creating Stripe session:', {
      amount: body.amount,
      email: body.email,
      orderId: body.orderId,
      lineItemsCount: lineItems.length,
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking?paymentStatus=cancelled`,
      customer_email: body.email,
      metadata: {
        userId: user.id,
        orderId: body.orderId,
        customerName: body.name.substring(0, 100),
        customerEmail: body.email.substring(0, 100),
        protectionPlan: quote.protectionPlan,
        quotedTotal: quote.total.toFixed(2),
      },
    })

    console.log('[CHECKOUT] 8. ✅ Session created successfully:', session.id)

    return NextResponse.json({
      data: {
        sessionId: session.id,
        url: session.url,
      },
      success: true
    }, { status: 201 })
  } catch (error: any) {
    console.error('[CHECKOUT] ❌ ERROR:', error.message)
    console.error('[CHECKOUT] Full error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}
