/**
 * Dynamic Pricing Engine for Washlee
 * Calculates real-time pricing based on multiple factors:
 * - Base price ($3.00 per kg)
 * - Demand multiplier (rush hours)
 * - Weather impact
 * - Distance surcharge
 * - Service type premium
 */

interface PricingFactors {
  weightKg: number
  serviceType: 'standard' | 'express' | 'delicate' | 'comforter'
  distanceKm: number
  isRushHour: boolean
  weatherCondition: 'clear' | 'rain' | 'snow'
  locationZone: 'downtown' | 'suburban' | 'rural'
  isPeakDay: boolean
}

interface PricingBreakdown {
  basePrice: number
  demandMultiplier: number
  weatherSurcharge: number
  distanceSurcharge: number
  servicePremium: number
  rushHourBonus: number
  total: number
  breakdown: {
    base: number
    demand: number
    weather: number
    distance: number
    service: number
    rushHour: number
  }
}

// Configuration constants
const BASE_PRICE_PER_KG = 3.0
const MIN_ORDER = 5.0 // $5 minimum order

const SERVICE_PREMIUMS: Record<string, number> = {
  standard: 0,
  express: 0.5, // 50% premium
  delicate: 0.3, // 30% premium
  comforter: 0.4, // 40% premium
}

const DISTANCE_RATE = 0.5 // $0.50 per km

const WEATHER_SURCHARGES: Record<string, number> = {
  clear: 0,
  rain: 0.15, // 15% surcharge
  snow: 0.3, // 30% surcharge
}

const ZONE_MULTIPLIERS: Record<string, number> = {
  downtown: 1.1, // 10% premium
  suburban: 1.0,
  rural: 1.2, // 20% premium
}

/**
 * Determine if current time is rush hour (7-9am, 12-1pm, 5-7pm)
 */
export function isCurrentRushHour(): boolean {
  const now = new Date()
  const hour = now.getHours()
  return (hour >= 7 && hour < 9) || (hour >= 12 && hour < 13) || (hour >= 17 && hour < 19)
}

/**
 * Determine if current day is peak (Friday-Sunday)
 */
export function isPeakDay(): boolean {
  const now = new Date()
  const day = now.getDay()
  return day >= 5 // Friday (5), Saturday (6), Sunday (0 wrapped)
}

/**
 * Calculate demand multiplier based on time and day
 * Peak times get 1.2x-1.5x multiplier
 */
export function calculateDemandMultiplier(isRushHour: boolean, isPeakDay: boolean): number {
  let multiplier = 1.0

  if (isRushHour) {
    multiplier += 0.2 // +20%
  }

  if (isPeakDay) {
    multiplier += 0.3 // +30%
  }

  return Math.min(multiplier, 1.5) // Cap at 1.5x
}

/**
 * Calculate weather surcharge
 */
export function getWeatherSurcharge(weather: string): number {
  return WEATHER_SURCHARGES[weather] || 0
}

/**
 * Calculate zone multiplier
 */
export function getZoneMultiplier(zone: string): number {
  return ZONE_MULTIPLIERS[zone] || 1.0
}

/**
 * Calculate service premium
 */
export function getServicePremium(serviceType: string): number {
  return SERVICE_PREMIUMS[serviceType] || 0
}

/**
 * Main pricing calculation function
 */
export function calculatePrice(factors: PricingFactors): PricingBreakdown {
  const {
    weightKg,
    serviceType,
    distanceKm,
    isRushHour,
    weatherCondition,
    locationZone,
    isPeakDay,
  } = factors

  // Step 1: Base price
  const basePrice = Math.max(weightKg * BASE_PRICE_PER_KG, MIN_ORDER)

  // Step 2: Demand multiplier
  const demandMultiplier = calculateDemandMultiplier(isRushHour, isPeakDay)
  const demandCharge = basePrice * (demandMultiplier - 1)

  // Step 3: Weather surcharge
  const weatherMultiplier = 1 + getWeatherSurcharge(weatherCondition)
  const weatherCharge = basePrice * (weatherMultiplier - 1)

  // Step 4: Distance surcharge
  const distanceCharge = distanceKm * DISTANCE_RATE

  // Step 5: Service premium
  const servicePremium = getServicePremium(serviceType)
  const serviceCharge = basePrice * servicePremium

  // Step 6: Zone multiplier
  const zoneMultiplier = getZoneMultiplier(locationZone)

  // Calculate subtotal before rush hour bonus
  let subtotal = basePrice + demandCharge + weatherCharge + distanceCharge + serviceCharge
  subtotal *= zoneMultiplier

  // Step 7: Rush hour bonus (give 10% discount during off-peak, neutral at peak)
  let rushHourAdjustment = 0
  if (!isRushHour && !isPeakDay) {
    rushHourAdjustment = -subtotal * 0.1 // 10% discount for off-peak
  } else if (isRushHour || isPeakDay) {
    rushHourAdjustment = subtotal * 0.05 // 5% surcharge for peak
  }

  const subtotalBeforeGST = Math.round((subtotal + rushHourAdjustment) * 100) / 100
  const total = subtotalBeforeGST

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    demandMultiplier,
    weatherSurcharge: Math.round(weatherCharge * 100) / 100,
    distanceSurcharge: Math.round(distanceCharge * 100) / 100,
    servicePremium: Math.round(serviceCharge * 100) / 100,
    rushHourBonus: Math.round(rushHourAdjustment * 100) / 100,
    total,
    breakdown: {
      base: Math.round(basePrice * 100) / 100,
      demand: Math.round(demandCharge * 100) / 100,
      weather: Math.round(weatherCharge * 100) / 100,
      distance: Math.round(distanceCharge * 100) / 100,
      service: Math.round(serviceCharge * 100) / 100,
      rushHour: Math.round(rushHourAdjustment * 100) / 100,
    },
  }
}

/**
 * Get pricing for common order sizes (used for preview)
 */
export function getPricingPreview(
  distanceKm: number = 5,
  serviceType: 'standard' | 'express' | 'delicate' | 'comforter' = 'standard',
  weatherCondition: 'clear' | 'rain' | 'snow' = 'clear',
  locationZone: 'downtown' | 'suburban' | 'rural' = 'suburban'
): Record<number, PricingBreakdown> {
  const weights = [3, 5, 10, 20]
  const preview: Record<number, PricingBreakdown> = {}

  weights.forEach((weight) => {
    preview[weight] = calculatePrice({
      weightKg: weight,
      serviceType,
      distanceKm,
      isRushHour: isCurrentRushHour(),
      weatherCondition,
      locationZone,
      isPeakDay: isPeakDay(),
    })
  })

  return preview
}

/**
 * Get surge pricing info for UI
 */
export function getSurgePricingInfo() {
  const rushHour = isCurrentRushHour()
  const peakDay = isPeakDay()

  return {
    isRushHour: rushHour,
    isPeakDay: peakDay,
    multiplier: calculateDemandMultiplier(rushHour, peakDay),
    message: rushHour
      ? 'Rush hour pricing active: 20% surge'
      : peakDay
        ? 'Weekend pricing active: 30% surge'
        : 'Standard pricing',
    discount: !rushHour && !peakDay ? '10% off-peak discount applied' : null,
  }
}

/**
 * Apply coupon discount to final price
 */
export function applyCoupon(
  basePrice: number,
  couponCode: string
): { discountAmount: number; finalPrice: number; couponName: string } {
  const coupons: Record<string, { percentage: number; name: string }> = {
    SAVE10: { percentage: 0.1, name: '10% Off' },
    SAVE20: { percentage: 0.2, name: '20% Off' },
    WELCOME5: { percentage: 0.05, name: 'Welcome $5 Off' },
    REFERRAL15: { percentage: 0.15, name: 'Referral Bonus' },
  }

  const coupon = coupons[couponCode.toUpperCase()]
  if (!coupon) {
    return { discountAmount: 0, finalPrice: basePrice, couponName: 'Invalid' }
  }

  const discountAmount = Math.round(basePrice * coupon.percentage * 100) / 100
  const finalPrice = Math.max(basePrice - discountAmount, MIN_ORDER)

  return {
    discountAmount,
    finalPrice,
    couponName: coupon.name,
  }
}
