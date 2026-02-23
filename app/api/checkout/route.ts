import { NextRequest, NextResponse } from 'next/server'

const Stripe = require('stripe')

/**
 * /api/checkout - Creates a Stripe checkout session for the booking
 * Called from booking/page.tsx when user clicks "Confirm & Pay"
 * Redirects to Stripe hosted checkout page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, orderTotal, customerEmail, customerName, bookingData, uid } = body

    if (!orderId || !orderTotal || !customerEmail) {
      console.error('[CHECKOUT-API] Missing fields:', { orderId, orderTotal, customerEmail })
      return NextResponse.json(
        { error: 'Missing required fields: orderId, orderTotal, customerEmail' },
        { status: 400 }
      )
    }

    // Log received data
    console.log('[CHECKOUT-API] Received:', { orderId, orderTotal, customerEmail, uid, hasBookingData: !!bookingData })

    // Validate minimum purchase amount ($24)
    if (orderTotal < 24) {
      console.warn('[CHECKOUT-API] Order total below minimum:', { orderId, orderTotal })
      return NextResponse.json(
        { error: `Minimum purchase amount is $24.00. Current total: $${orderTotal.toFixed(2)}` },
        { status: 400 }
      )
    }

    console.log('[CHECKOUT-API] Creating Stripe session for order:', orderId)

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    console.log('[CHECKOUT-API] Base URL:', baseUrl)

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-12-15.clover'
    })

    // Calculate line item breakdown
    // Default split: 70% laundry service, 30% delivery fee
    const laundryAmount = Math.round(orderTotal * 0.70 * 100) // 70% to cents
    const deliveryAmount = Math.round(orderTotal * 0.30 * 100) // 30% to cents
    
    // Ensure total matches (handle rounding)
    const totalCents = Math.round(orderTotal * 100)
    const adjustedDeliveryAmount = totalCents - laundryAmount

    // Build line items array
    const lineItems = [
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Laundry Service',
            description: `${bookingData?.estimatedWeight || '5'} kg wash & fold service`,
            images: [], // Can add your logo URL here
          },
          unit_amount: laundryAmount,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Delivery Fee',
            description: 'Pickup and delivery within service area',
          },
          unit_amount: adjustedDeliveryAmount,
        },
        quantity: 1,
      },
    ]

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking?paymentStatus=cancelled&orderId=${orderId}`,
      customer_email: customerEmail,
      metadata: {
        orderId,
        customerName,
        customerEmail,
        uid: uid || '', // Firebase user ID - critical for webhook
        laundryAmount: String(laundryAmount / 100),
        deliveryAmount: String(adjustedDeliveryAmount / 100),
        // Store booking data as JSON strings (metadata only accepts strings)
        estimatedWeight: bookingData?.estimatedWeight || '5',
        deliverySpeed: bookingData?.deliverySpeed || 'standard',
        pickupTime: bookingData?.pickupTime || 'soon',
        scheduleDate: bookingData?.scheduleDate || '',
        scheduleTime: bookingData?.scheduleTime || '',
        detergent: bookingData?.detergent || 'eco-friendly',
        waterTemp: bookingData?.waterTemp || 'warm',
        foldingPreference: bookingData?.foldingPreference || 'folded',
        specialCare: bookingData?.specialCare || '',
        deliveryAddressLine1: bookingData?.deliveryAddressLine1 || '',
        deliveryAddressLine2: bookingData?.deliveryAddressLine2 || '',
        deliveryCity: bookingData?.deliveryCity || '',
        deliveryState: bookingData?.deliveryState || '',
        deliveryPostcode: bookingData?.deliveryPostcode || '',
        deliveryNotes: bookingData?.deliveryNotes || '',
        // Add-ons as JSON string
        addOnsJson: JSON.stringify(bookingData?.addOns || {}),
      },
    })

    console.log('[CHECKOUT-API] ✓ Session created:', session.id)
    console.log('[CHECKOUT-API] Redirect URL:', session.url)

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      success: true
    }, { status: 200 })

  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error'
    console.error('[CHECKOUT-API] Stripe error:', errorMsg, error)
    
    return NextResponse.json(
      { error: `Checkout failed: ${errorMsg}` },
      { status: 500 }
    )
  }
}
