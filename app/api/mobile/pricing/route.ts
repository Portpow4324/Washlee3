import { NextRequest } from 'next/server'
import { calculateBookingQuote, getMobilePricingConfig } from '@/lib/mobilePricing'
import { mobileJson, mobileOptions } from '@/lib/mobileBackend'

export async function OPTIONS() {
  return mobileOptions()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pricingConfig = await getMobilePricingConfig()
  const shouldQuote =
    searchParams.has('estimatedWeight') ||
    searchParams.has('weight') ||
    searchParams.has('customWeight') ||
    searchParams.has('bagCount')

  const quote = shouldQuote
    ? calculateBookingQuote({
        estimatedWeight: searchParams.get('estimatedWeight'),
        weight: searchParams.get('weight'),
        customWeight: searchParams.get('customWeight'),
        bagCount: searchParams.get('bagCount'),
        deliverySpeed: searchParams.get('deliverySpeed'),
        protectionPlan: searchParams.get('protectionPlan'),
        hangDry: searchParams.get('hangDry') === 'true',
        returnsOnHangers: searchParams.get('returnsOnHangers') === 'true',
      }, pricingConfig)
    : null

  return mobileJson({
    success: true,
    data: {
      ...pricingConfig,
      quote,
    },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const pricingConfig = await getMobilePricingConfig()
  const quote = calculateBookingQuote(body || {}, pricingConfig)

  return mobileJson({
    success: true,
    data: {
      ...pricingConfig,
      quote,
    },
  })
}
