import { NextRequest, NextResponse } from 'next/server'

// Stripe-only test API - no Firebase Admin SDK dependency
// This tests that Stripe payment processing is working

const Stripe = require('stripe')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId } = body

    console.log('[TEST-API] Diagnostics test started')

    // Test 1: Endpoint reachable?
    console.log('[TEST-API] ✓ Endpoint reached')

    // Test 2: Stripe keys configured?
    const hasPublicKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
    
    if (!hasSecretKey) {
      return NextResponse.json({
        success: false,
        error: 'STRIPE_SECRET_KEY not configured in .env.local',
        diagnostics: {
          stripeKeysConfigured: { hasPublicKey, hasSecretKey }
        }
      }, { status: 500 })
    }

    console.log('[TEST-API] ✓ Stripe keys configured')

    // Test 3: Can we connect to Stripe?
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2026-02-25.clover'
      })

      console.log('[TEST-API] Testing Stripe connection...')

      // Create a test customer
      const testCustomer = await stripe.customers.create({
        email: `test-${Date.now()}@washlee.local`,
        name: 'Test Customer',
        metadata: { 
          test: 'true',
          timestamp: new Date().toISOString()
        }
      })

      console.log('[TEST-API] ✓ Stripe test customer created:', testCustomer.id)

      // Test 4: Create a test payment intent
      const testPaymentIntent = await stripe.paymentIntents.create({
        amount: 5000, // $50.00 AUD for testing
        currency: 'aud',
        customer: testCustomer.id,
        description: 'Test payment intent for diagnostics',
        metadata: {
          test: 'true',
          timestamp: new Date().toISOString()
        }
      })

      console.log('[TEST-API] ✓ Stripe test payment intent created:', testPaymentIntent.id)

      // Clean up test data
      try {
        await stripe.customers.del(testCustomer.id)
        console.log('[TEST-API] ✓ Cleaned up test data')
      } catch (cleanupErr) {
        console.warn('[TEST-API] Could not clean up test data, continuing anyway')
      }

      console.log('[TEST-API] ✅ All diagnostics passed!')

      return NextResponse.json({
        success: true,
        message: 'System ready for payments',
        diagnostics: {
          stripeKeysConfigured: { hasPublicKey, hasSecretKey },
          stripeConnected: true,
          testCustomerCreated: testCustomer.id,
          testPaymentIntentCreated: testPaymentIntent.id,
          status: '✅ Payment system is operational'
        }
      }, { status: 200 })

    } catch (stripeErr: any) {
      const errorMsg = stripeErr.message || 'Unknown Stripe error'
      console.error('[TEST-API] Stripe API error:', errorMsg)
      
      return NextResponse.json({
        success: false,
        error: `Stripe API error: ${errorMsg}`,
        diagnostics: {
          stripeKeysConfigured: { hasPublicKey, hasSecretKey },
          stripeConnected: false,
          status: '❌ Cannot connect to Stripe'
        }
      }, { status: 500 })
    }

  } catch (error: any) {
    const errorMsg = error.message || JSON.stringify(error)
    console.error('[TEST-API] Unhandled error:', errorMsg)
    
    return NextResponse.json({
      success: false,
      error: `Test error: ${errorMsg}`,
      status: '❌ Test failed'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test API is running. POST with { customerId } to run diagnostics.',
    endpoint: '/api/test'
  })
}
