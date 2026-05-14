/**
 * Wash Club - Loyalty & Credit System
 * Manages membership tiers, credits, and rewards for customers
 */

export interface WashClubTier {
  id: string
  name: string
  minSpend: number // Minimum annual spend to qualify
  creditEarnRate: number // Credits earned per $1 spent (e.g., 0.1 = 10% back)
  bonusCredits: number // Bonus credits granted annually
  perksPercentage: number // Discount on orders (e.g., 5 for 5%)
  priority: number // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
  description: string
  benefits: string[]
  annualFee?: number
}

export interface WashClubMembership {
  userId: string
  tier: number // 1-4 for Bronze/Silver/Gold/Platinum
  totalSpend: number // Total lifetime spend
  creditsBalance: number // Available credits to redeem
  creditsEarned: number // Total credits earned
  creditsRedeemed: number // Total credits redeemed
  joinDate: Date
  lastUpdated: Date
  expiryDate?: Date
  status: 'active' | 'inactive' | 'suspended'
}

export interface CreditTransaction {
  id: string
  userId: string
  type: 'earn' | 'redeem' | 'expire' | 'admin_adjust'
  amount: number
  description: string
  orderId?: string
  timestamp: Date
  expiryDate?: Date
}

export interface WashClubOrder {
  orderId: string
  userId: string
  subtotal: number // Before credits/discounts
  creditsApplied: number // Credits applied as discount
  creditValue: number // $ value of each credit (e.g., $0.01)
  discountAmount: number // $ discount from credits
  tierDiscount: number // % discount from membership tier
  tierDiscountAmount: number // $ amount from tier discount
  finalTotal: number // subtotal - creditValue - tierDiscountAmount
  creditsEarned: number // Credits earned from this order
  timestamp: Date
}

// Wash Club Tiers Definition
export const WASH_CLUB_TIERS: Record<number, WashClubTier> = {
  1: {
    id: 'bronze',
    name: 'Bronze',
    minSpend: 0,
    creditEarnRate: 0.05, // 5% credits back
    bonusCredits: 25,
    perksPercentage: 0,
    priority: 1,
    description: 'Entry-level membership with basic rewards',
    benefits: [
      '5% credits back on every order',
      '25 bonus credits annually',
      'Early access to promotions',
      'Birthday bonus credits',
    ],
  },
  2: {
    id: 'silver',
    name: 'Silver',
    minSpend: 200,
    creditEarnRate: 0.08, // 8% credits back
    bonusCredits: 50,
    perksPercentage: 3,
    priority: 2,
    description: 'Rewards-focused members ($200+ annual spend)',
    benefits: [
      '8% credits back on every order',
      '3% discount on all orders',
      '50 bonus credits annually',
      'Priority customer support',
      'Early access to new services',
      'Birthday bonus (100 credits)',
    ],
  },
  3: {
    id: 'gold',
    name: 'Gold',
    minSpend: 500,
    creditEarnRate: 0.12, // 12% credits back
    bonusCredits: 100,
    perksPercentage: 5,
    priority: 3,
    description: 'Gold loyalty members ($500+ annual spend)',
    benefits: [
      '12% credits back on every order',
      '5% discount on all orders',
      '100 bonus credits annually',
      '24/7 priority support',
      'Free add-on services monthly',
      'Birthday bonus (200 credits)',
      'Exclusive member events',
    ],
  },
  4: {
    id: 'platinum',
    name: 'Platinum',
    minSpend: 1000,
    creditEarnRate: 0.15, // 15% credits back
    bonusCredits: 200,
    perksPercentage: 10,
    priority: 4,
    description: 'Elite members ($1000+ annual spend)',
    annualFee: 49.99,
    benefits: [
      '15% credits back on every order',
      '10% discount on all orders',
      '200 bonus credits annually',
      '24/7 VIP concierge support',
      'Complimentary premium add-ons',
      'Birthday bonus (500 credits)',
      'Exclusive member events & early access',
      'Free protection plan upgrade',
      'Referral rewards program',
    ],
  },
}

/**
 * Calculate which tier a customer should be in based on annual spend
 */
export function calculateTier(totalSpend: number): number {
  if (totalSpend >= WASH_CLUB_TIERS[4].minSpend) return 4
  if (totalSpend >= WASH_CLUB_TIERS[3].minSpend) return 3
  if (totalSpend >= WASH_CLUB_TIERS[2].minSpend) return 2
  return 1
}

/**
 * Calculate credits earned from an order
 */
export function calculateCreditsEarned(subtotal: number, tierLevel: number): number {
  const tier = WASH_CLUB_TIERS[tierLevel]
  return Math.floor(subtotal * tier.creditEarnRate * 100) / 100 // Round to 2 decimals
}

/**
 * Calculate order total after credits and tier discounts
 */
export function calculateOrderTotal(
  subtotal: number,
  tierLevel: number,
  creditsToRedeem: number = 0,
  creditValue: number = 0.01
): {
  creditsApplied: number
  discountFromCredits: number
  tierDiscount: number
  discountFromTier: number
  finalTotal: number
  creditsEarned: number
} {
  const tier = WASH_CLUB_TIERS[tierLevel]
  
  // Calculate credit discount
  const maxCreditValue = creditsToRedeem * creditValue
  const creditsApplied = creditsToRedeem
  const discountFromCredits = Math.min(maxCreditValue, subtotal * 0.5) // Max 50% off via credits
  
  // Calculate tier discount (on remaining balance)
  const balanceAfterCredits = subtotal - discountFromCredits
  const discountFromTier = Math.floor(balanceAfterCredits * (tier.perksPercentage / 100) * 100) / 100
  
  // Calculate final total
  const finalTotal = Math.max(0, subtotal - discountFromCredits - discountFromTier)
  
  // Calculate credits earned on final total
  const creditsEarned = calculateCreditsEarned(finalTotal, tierLevel)
  
  return {
    creditsApplied,
    discountFromCredits,
    tierDiscount: tier.perksPercentage,
    discountFromTier,
    finalTotal,
    creditsEarned,
  }
}

/**
 * Get membership status and tier info
 */
export function getMembershipInfo(membership: WashClubMembership | null) {
  if (!membership) {
    return {
      tier: 1,
      tierName: 'Bronze',
      status: 'Not a member',
      creditsBalance: 0,
      tierBenefits: WASH_CLUB_TIERS[1].benefits,
    }
  }

  const tier = WASH_CLUB_TIERS[membership.tier]
  return {
    tier: membership.tier,
    tierName: tier.name,
    status: membership.status,
    creditsBalance: membership.creditsBalance,
    tierBenefits: tier.benefits,
    totalSpend: membership.totalSpend,
    creditEarnRate: tier.creditEarnRate,
  }
}

/**
 * Check if customer should be upgraded to higher tier
 */
export function checkTierUpgrade(
  currentTier: number,
  annualSpend: number
): { newTier: number; upgraded: boolean; message: string } {
  const newTier = calculateTier(annualSpend)
  
  if (newTier > currentTier) {
    const tierName = WASH_CLUB_TIERS[newTier].name
    return {
      newTier,
      upgraded: true,
      message: `Congratulations! You've been upgraded to ${tierName} tier!`,
    }
  }
  
  return {
    newTier: currentTier,
    upgraded: false,
    message: '',
  }
}

/**
 * Format credits for display
 */
export function formatCredits(credits: number): string {
  return `${credits.toFixed(2)} credits`
}

/**
 * Format credit value as currency
 */
export function formatCreditValue(credits: number, creditValue: number = 0.01): string {
  return `$${(credits * creditValue).toFixed(2)}`
}

/**
 * Calculate points to next tier
 */
export function getPointsToNextTier(currentTier: number, currentSpend: number): {
  currentTier: number
  nextTier: number | null
  spendNeeded: number
  message: string
} {
  if (currentTier >= 4) {
    return {
      currentTier: 4,
      nextTier: null,
      spendNeeded: 0,
      message: 'You are at the highest tier!',
    }
  }

  const nextTier = currentTier + 1
  const nextTierMinSpend = WASH_CLUB_TIERS[nextTier].minSpend
  const spendNeeded = Math.max(0, nextTierMinSpend - currentSpend)

  return {
    currentTier,
    nextTier,
    spendNeeded,
    message: `Spend $${spendNeeded.toFixed(2)} more to reach ${WASH_CLUB_TIERS[nextTier].name} tier!`,
  }
}
