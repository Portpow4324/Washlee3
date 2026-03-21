import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
})


export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, orderId, amount, customerId } = body

    if (action === 'create_payment_intent') {
      if (!orderId || !amount) {
        return NextResponse.json(
          { error: 'Missing orderId or amount' },
          { status: 400 }
        )
      }

      try {
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount, // Amount in cents
          currency: 'aud', // Australian Dollars
          metadata: {
            orderId,
            customerId: user.id,
          },
        })

        // Store payment intent record in Supabase
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            order_id: orderId,
            customer_id: user.id,
            amount: amount / 100, // Convert back to dollars
            currency: 'AUD',
            payment_method: 'stripe',
            status: 'pending',
            stripe_payment_intent_id: paymentIntent.id,
            created_at: new Date().toISOString(),
          })

        if (insertError) console.error('Error storing transaction:', insertError)

        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        })
      } catch (stripeError: any) {
        console.error('Stripe error:', stripeError)
        return NextResponse.json(
          { error: stripeError.message || 'Payment intent creation failed' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}

export async function PUT(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}
