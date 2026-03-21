import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    console.log('[CHECKOUT] 6. SKIPPING database update - going straight to Stripe')
    
    // Skip database update for now - focus on getting Stripe working

    // Build line items from booking details
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

    // Add-ons
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

    // If no line items, add a single line for the total
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
