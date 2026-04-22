import { NextRequest, NextResponse } from 'next/server'

interface PayPalOrderRequest {
  amount: number
  orderId: string
  customerEmail: string
  customerName: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PayPalOrderRequest = await request.json()
    const { amount, orderId, customerEmail, customerName } = body

    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('[PayPal] Missing credentials')
      return NextResponse.json(
        { error: 'PayPal not configured' },
        { status: 500 }
      )
    }

    // Get access token
    const authResponse = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    })

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with PayPal')
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Create PayPal order
    const orderResponse = await fetch('https://api.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
            description: `Refund for order ${orderId.slice(0, 8)}`,
          },
        ],
        payer: {
          email_address: customerEmail,
          name: {
            given_name: customerName?.split(' ')[0] || 'Customer',
            surname: customerName?.split(' ').slice(1).join(' ') || 'Customer',
          },
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/refund-payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/refund-payment/cancel`,
        application_context: {
          brand_name: 'Washlee',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/refund-payment/success?orderId=${orderId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/refund-payment?token=${encodeURIComponent(Buffer.from(JSON.stringify({ orderid: orderId, amount })).toString('base64'))}`,
        },
      }),
    })

    if (!orderResponse.ok) {
      throw new Error('Failed to create PayPal order')
    }

    const orderData = await orderResponse.json()
    const approvalLink = orderData.links?.find((link: any) => link.rel === 'approve')?.href

    console.log('[PayPal] Order created:', orderData.id)

    return NextResponse.json({
      id: orderData.id,
      approvalLink,
    })
  } catch (error) {
    console.error('[PayPal] Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
