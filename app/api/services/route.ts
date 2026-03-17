import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/services?language={language}&includeAddOns={includeAddOns}
 * Returns all available services with pricing and details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'
    const includeAddOns = searchParams.get('includeAddOns') !== 'false'

    const services = [
      {
        id: 'standard_wash',
        name: 'Standard Wash',
        description: 'Regular washing for everyday clothing',
        basePrice: 3.00,
        priceUnit: 'per_kg',
        icon: '👕',
        duration: '24-48 hours',
        addOns: includeAddOns ? [
          'stain_treatment',
          'hang_dry',
          'express_service'
        ] : []
      },
      {
        id: 'dry_clean',
        name: 'Dry Cleaning',
        description: 'Professional dry cleaning for delicate fabrics',
        basePrice: 5.00,
        priceUnit: 'per_kg',
        icon: '👔',
        duration: '48-72 hours',
        addOns: includeAddOns ? [
          'stain_treatment',
          'comforter_clean',
          'express_service'
        ] : []
      },
      {
        id: 'delicates',
        name: 'Delicates Care',
        description: 'Hand wash care for silk, wool, and delicate items',
        basePrice: 6.00,
        priceUnit: 'per_kg',
        icon: '✨',
        duration: '24-48 hours',
        addOns: includeAddOns ? [
          'stain_treatment',
          'hang_dry'
        ] : []
      },
      {
        id: 'comforter_clean',
        name: 'Comforter & Bedding',
        description: 'Specialized cleaning for comforters, duvets, and large bedding',
        basePrice: 25.00,
        priceUnit: 'per_item',
        icon: '🛏️',
        duration: '48-72 hours',
        addOns: includeAddOns ? [
          'express_service',
          'stain_treatment'
        ] : []
      },
      {
        id: 'leather_suede',
        name: 'Leather & Suede',
        description: 'Expert care for leather and suede garments',
        basePrice: 8.00,
        priceUnit: 'per_kg',
        icon: '🧥',
        duration: '72 hours',
        addOns: includeAddOns ? [
          'conditioning',
          'waterproofing'
        ] : []
      },
      {
        id: 'express_service',
        name: 'Express Service',
        description: 'Fast turnaround - ready in 12-18 hours',
        basePrice: 7.00,
        priceUnit: 'per_kg',
        icon: '⚡',
        duration: '12-18 hours',
        addOns: includeAddOns ? [
          'stain_treatment',
          'hang_dry'
        ] : []
      }
    ]

    const addOns = includeAddOns ? [
      {
        id: 'stain_treatment',
        name: 'Stain Treatment',
        price: 2.00,
        description: 'Professional stain removal treatment'
      },
      {
        id: 'hang_dry',
        name: 'Hang Dry',
        price: 1.50,
        description: 'Air dry instead of machine dry'
      },
      {
        id: 'express_service',
        name: 'Express Service',
        price: 7.00,
        description: '12-18 hour turnaround'
      },
      {
        id: 'comforter_clean',
        name: 'Comforter Cleaning',
        price: 25.00,
        description: 'Professional comforter cleaning'
      },
      {
        id: 'conditioning',
        name: 'Leather Conditioning',
        price: 5.00,
        description: 'Conditioning treatment for leather'
      },
      {
        id: 'waterproofing',
        name: 'Waterproofing Treatment',
        price: 8.00,
        description: 'Waterproof coating application'
      }
    ] : []

    return NextResponse.json({
      success: true,
      services,
      addOns,
      currency: 'USD'
    })
  } catch (error) {
    console.error('[SERVICES-ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get services' },
      { status: 500 }
    )
  }
}
