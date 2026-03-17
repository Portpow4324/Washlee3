import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, App } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'

const Stripe = require('stripe')

// Parse Firebase service account key from environment
let adminApp: App | null = null

function getAdminApp() {
  if (adminApp) return adminApp
  
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount as any),
    projectId: process.env.FIREBASE_PROJECT_ID,
  })

  return adminApp
}

// Map plans to Stripe price IDs
const PLAN_STRIPE_MAPPING: Record<string, { priceId: string; name: string; amount: number }> = {
  'starter': {
    priceId: 'price_starter_monthly', // You'll need to create these in Stripe
    name: 'Starter Plan',
    amount: 1499, // $14.99 AUD in cents
  },
  'professional': {
    priceId: 'price_professional_monthly',
    name: 'Professional Plan',
    amount: 2999, // $29.99 AUD in cents
  },
  'washly': {
    priceId: 'price_washly_monthly',
    name: 'Washly Premium Plan',
    amount: 7499, // $74.99 AUD in cents
  },
  'none': {
    priceId: '', // No subscription
    name: 'Pay Per Order',
    amount: 0,
  },
}

/**
 * POST /api/subscriptions/create-checkout-session
 * Creates a Stripe checkout session for subscription plans
 * Requires authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from Authorization header or session
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    let userId = ''
    let userEmail = ''

    // If token provided, verify it
    if (token) {
      try {
        const app = getAdminApp()
        const auth = getAuth(app)
        const decodedToken = await auth.verifyIdToken(token)
        userId = decodedToken.uid
        userEmail = decodedToken.email || ''
      } catch (error) {
        console.error('[SUBSCRIPTION-CHECKOUT] Token verification failed:', error)
        return NextResponse.json(
          { error: 'Unauthorized: Invalid token' },
          { status: 401 }
        )
      }
    } else {
      // For unauthenticated users, require email in body
      const body = await request.json()
      userEmail = body.email
      
      if (!userEmail) {
        return NextResponse.json(
          { error: 'Email or authentication required' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { plan } = body

    if (!plan || !PLAN_STRIPE_MAPPING[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const planData = PLAN_STRIPE_MAPPING[plan]
    
    // For "none" (pay per order), don't create a session
    if (plan === 'none') {
      return NextResponse.json(
        { error: 'No subscription selected' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planData.name,
              description: `Unlimited laundry orders with exclusive benefits`,
            },
            unit_amount: planData.amount,
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscriptions?cancelled=true`,
      customer_email: userEmail,
      metadata: {
        plan,
        userId: userId || '',
        planName: planData.name,
      },
      subscription_data: {
        metadata: {
          plan,
          userId: userId || '',
        },
      },
    })

    console.log('[SUBSCRIPTION-CHECKOUT] Created session:', {
      sessionId: session.id,
      plan,
      userEmail,
      userId,
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url
    })
  } catch (error: any) {
    console.error('[SUBSCRIPTION-CHECKOUT] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
