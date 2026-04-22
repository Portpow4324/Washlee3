import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/email-service'

interface CaptureRequest {
  orderID: string
  orderId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CaptureRequest = await request.json()
    const { orderID, orderId } = body

    if (!orderID || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET

    if (!clientId || !clientSecret) {
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

    // Capture the order
    const captureResponse = await fetch(
      `https://api.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      }
    )

    if (!captureResponse.ok) {
      throw new Error('Failed to capture PayPal order')
    }

    const captureData = await captureResponse.json()
    const transactionId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id

    // Update refund status to completed
    const { error: updateError } = await supabaseAdmin
      .from('refund_requests')
      .update({
        status: 'completed',
        payment_method: 'paypal',
        transaction_id: transactionId || orderID,
        completed_at: new Date(),
      })
      .eq('order_id', orderId)

    if (updateError) {
      console.error('[PayPal] Failed to update refund:', updateError)
    } else {
      console.log('[PayPal] Refund marked as completed:', orderId)

      // Get user email to send confirmation
      const { data: refund } = await supabaseAdmin
        .from('refund_requests')
        .select('user_id, amount')
        .eq('order_id', orderId)
        .single()

      if (refund) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email, name')
          .eq('id', refund.user_id)
          .single()

        if (user?.email) {
          try {
            await sendEmail({
              to: user.email,
              subject: 'Your Refund Has Been Processed',
              html: `
                <h2>Refund Processed Successfully</h2>
                <p>Hi ${user.name},</p>
                <p>Your refund has been successfully processed.</p>
                <p><strong>Amount:</strong> $${refund.amount.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> PayPal</p>
                <p><strong>Status:</strong> Completed</p>
                <p>The funds will appear in your PayPal account or original payment method within 3-5 business days.</p>
                <p>If you have any questions, please contact our support team.</p>
                <p>Best regards,<br>The Washlee Team</p>
              `,
            })
          } catch (emailError) {
            console.error('[PayPal] Failed to send confirmation email:', emailError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      transactionId,
    })
  } catch (error) {
    console.error('[PayPal] Capture error:', error)
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
