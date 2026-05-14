import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/services?language={language}&includeAddOns={includeAddOns}
 * Returns the current Washlee service catalogue.
 *
 * Canonical pricing — kept in sync with lib/mobilePricing.ts:
 *   - Standard wash & fold: $7.50/kg
 *   - Express same-day:     $12.50/kg
 *   - Delicates / special care: same per-kg rate as standard
 *   - Minimum order: $75 (AUD, GST inclusive)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAddOns = searchParams.get('includeAddOns') !== 'false'

    const services = [
      {
        id: 'standard_wash',
        name: 'Standard wash & fold',
        description: 'Sorted, washed, and folded. Delivered next business day.',
        basePrice: 7.5,
        priceUnit: 'per_kg',
        icon: '👕',
        duration: 'Next business day',
        addOns: includeAddOns ? ['hang_dry'] : [],
      },
      {
        id: 'express_wash',
        name: 'Express same-day',
        description: 'Order before noon, back the same evening by 7pm.',
        basePrice: 12.5,
        priceUnit: 'per_kg',
        icon: '⚡',
        duration: 'Same day',
        addOns: includeAddOns ? ['hang_dry'] : [],
      },
      {
        id: 'delicates_care',
        name: 'Delicates / special care',
        description:
          'Gentle handling for items that need extra care — same per-kg rate as standard. Add care notes at booking.',
        basePrice: 7.5,
        priceUnit: 'per_kg',
        icon: '✨',
        duration: 'Next business day',
        addOns: includeAddOns ? ['hang_dry'] : [],
      },
    ]

    const addOns = includeAddOns
      ? [
          {
            id: 'hang_dry',
            name: 'Hang dry',
            price: 16.5,
            description: 'Air-dried on racks instead of tumble dry.',
          },
        ]
      : []

    return NextResponse.json({
      success: true,
      services,
      addOns,
      currency: 'AUD',
      minimumOrder: 75,
    })
  } catch (error) {
    console.error('[SERVICES-ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get services' },
      { status: 500 }
    )
  }
}
