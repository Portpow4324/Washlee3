import { createClient } from '@supabase/supabase-js'

export type BookingQuoteInput = {
  estimatedWeight?: number | string | null
  weight?: number | string | null
  customWeight?: number | string | null
  bagCount?: number | string | null
  deliverySpeed?: string | null
  protectionPlan?: string | null
  hangDry?: boolean | null
  returnsOnHangers?: boolean | null
}

export const mobilePricingConfig = {
  currency: 'AUD',
  standardRatePerKg: 7.50,
  expressRatePerKg: 12.50,
  minimumOrder: 75.00,
  hangDryPrice: 16.50,
  returnOnHangersPrice: 1.50,
  protectionPlans: {
    none: 0,
    basic: 0,
    standard: 3.50,
    premium: 8.50,
    'premium-plus': 8.50,
  },
}

type MobilePricingConfig = typeof mobilePricingConfig

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function normalizeProtectionPlan(plan: unknown) {
  const normalized = String(plan || 'none').trim().toLowerCase()
  if (normalized === 'no_protection' || normalized === 'free') return 'none'
  if (normalized === 'premium_plus' || normalized === 'premium plus') return 'premium-plus'
  if (normalized === 'basic') return 'none'
  if (normalized === 'standard' || normalized === 'premium' || normalized === 'premium-plus') {
    return normalized
  }
  return 'none'
}

export function normalizeMobilePricingConfig(raw: unknown): MobilePricingConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return mobilePricingConfig
  const config = raw as Partial<MobilePricingConfig>
  const protectionPlans =
    config.protectionPlans &&
    typeof config.protectionPlans === 'object' &&
    !Array.isArray(config.protectionPlans)
      ? config.protectionPlans
      : {}

  return {
    currency: typeof config.currency === 'string' ? config.currency : mobilePricingConfig.currency,
    standardRatePerKg: asNumber(config.standardRatePerKg, mobilePricingConfig.standardRatePerKg),
    expressRatePerKg: asNumber(config.expressRatePerKg, mobilePricingConfig.expressRatePerKg),
    minimumOrder: asNumber(config.minimumOrder, mobilePricingConfig.minimumOrder),
    hangDryPrice: asNumber(config.hangDryPrice, mobilePricingConfig.hangDryPrice),
    returnOnHangersPrice: asNumber(
      config.returnOnHangersPrice,
      mobilePricingConfig.returnOnHangersPrice
    ),
    protectionPlans: {
      ...mobilePricingConfig.protectionPlans,
      ...protectionPlans,
    },
  }
}

export async function getMobilePricingConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) return mobilePricingConfig

  try {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await admin
      .from('pricing_config')
      .select('config')
      .eq('key', 'mobile_booking_v1')
      .eq('active', true)
      .maybeSingle()

    if (error || !data?.config) return mobilePricingConfig
    return normalizeMobilePricingConfig(data.config)
  } catch (error) {
    console.warn('[MobilePricing] Falling back to code pricing config:', error)
    return mobilePricingConfig
  }
}

export function calculateBookingQuote(
  input: BookingQuoteInput,
  config: MobilePricingConfig = mobilePricingConfig
) {
  const bagCount = asNumber(input.bagCount)
  const estimatedWeight =
    asNumber(input.estimatedWeight) ||
    asNumber(input.weight) ||
    asNumber(input.customWeight) ||
    (bagCount > 0 ? bagCount * 5 : 0)

  const deliverySpeed = String(input.deliverySpeed || 'standard').toLowerCase()
  const ratePerKg =
    deliverySpeed === 'express'
      ? config.expressRatePerKg
      : config.standardRatePerKg

  const laundrySubtotal = estimatedWeight * ratePerKg
  const baseSubtotal = Math.max(laundrySubtotal, config.minimumOrder)
  const hangDryPrice = input.hangDry ? config.hangDryPrice : 0
  const returnOnHangersPrice = input.returnsOnHangers
    ? config.returnOnHangersPrice
    : 0
  const protectionPlan = normalizeProtectionPlan(input.protectionPlan)
  const protectionPrice =
    config.protectionPlans[
      protectionPlan as keyof typeof config.protectionPlans
    ] || 0
  const addonsTotal = hangDryPrice + returnOnHangersPrice
  const total = baseSubtotal + addonsTotal + protectionPrice

  return {
    currency: config.currency,
    deliverySpeed,
    estimatedWeight,
    ratePerKg,
    laundrySubtotal: roundMoney(laundrySubtotal),
    minimumOrderApplied: laundrySubtotal < config.minimumOrder,
    baseSubtotal: roundMoney(baseSubtotal),
    hangDryPrice: roundMoney(hangDryPrice),
    returnOnHangersPrice: roundMoney(returnOnHangersPrice),
    addonsTotal: roundMoney(addonsTotal),
    protectionPlan,
    protectionPrice: roundMoney(protectionPrice),
    total: roundMoney(total),
  }
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}
