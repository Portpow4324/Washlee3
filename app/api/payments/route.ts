import { NextRequest, NextResponse } from 'next/server'
import {
  createPaymentIntent,
  savePaymentMethod,
  getPaymentMethods,
  processRefund
} from '@/lib/paymentService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, customerId, amount, orderId, paymentMethodId, description } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'create_payment_intent': {
        if (!amount || !orderId) {
          return NextResponse.json(
            { error: 'Amount and Order ID required' },
            { status: 400 }
          )
        }

        const result = await createPaymentIntent(
          customerId,
          Math.round(amount * 100), // Convert to cents
          orderId,
          description
        )

        return NextResponse.json(result, { status: 200 })
      }

      case 'save_payment_method': {
        if (!paymentMethodId) {
          return NextResponse.json(
            { error: 'Payment method ID required' },
            { status: 400 }
          )
        }

        const result = await savePaymentMethod(
          customerId,
          paymentMethodId,
          body.isDefault || false
        )

        return NextResponse.json(result, { status: 200 })
      }

      case 'get_payment_methods': {
        const methods = await getPaymentMethods(customerId)
        return NextResponse.json({ methods }, { status: 200 })
      }

      case 'refund_payment': {
        const { paymentIntentId, refundAmount } = body

        if (!paymentIntentId) {
          return NextResponse.json(
            { error: 'Payment intent ID required' },
            { status: 400 }
          )
        }

        const success = await processRefund(
          paymentIntentId,
          refundAmount ? Math.round(refundAmount * 100) : undefined
        )

        return NextResponse.json({ success }, { status: 200 })
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
