import { NextResponse } from 'next/server'

/**
 * Paid subscription checkout is retired.
 *
 * Washlee is pay-per-order and Wash Club is free loyalty only. Keep this route
 * as a stable contract for any old clients, but do not create Stripe
 * subscription sessions from it.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Paid subscriptions are no longer available. Washlee is pay-per-order and Wash Club is free.',
      pricingModel: 'pay_per_order',
    },
    { status: 410 }
  )
}
