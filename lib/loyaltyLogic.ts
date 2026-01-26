import { Timestamp } from 'firebase/firestore'

export type LoyaltyTier = 'silver' | 'gold' | 'platinum'

export interface LoyaltyMember {
  customerId: string
  email: string
  points: number
  tier: LoyaltyTier
  totalSpent: number
  totalOrders: number
  pointsHistory: PointsTransaction[]
  referrals: ReferralRecord[]
  lastPointsUpdated: Timestamp
  tierUpdatedAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface PointsTransaction {
  id: string
  type: 'earn' | 'redeem' | 'bonus' | 'referral' | 'expire'
  points: number
  description: string
  orderId?: string
  referralId?: string
  expiresAt?: Timestamp
  createdAt: Timestamp
}

export interface ReferralRecord {
  referralId: string
  referredEmail: string
  status: 'pending' | 'registered' | 'first-order' | 'converted'
  pointsEarned: number
  createdAt: Timestamp
  convertedAt?: Timestamp
}

export interface RewardOption {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'credit' | 'discount' | 'free-order' | 'donation'
  value: number
  valueCurrency?: string
  available: boolean
  limit?: number
  redeemed: number
  expiresAt?: Timestamp
}

// Tier requirements
export const TIER_REQUIREMENTS = {
  silver: { minPoints: 0, minSpent: 0, discountPercent: 0 },
  gold: { minPoints: 500, minSpent: 500, discountPercent: 5 },
  platinum: { minPoints: 1500, minSpent: 1500, discountPercent: 10 }
}

// Points earning rates
export const POINTS_RATES = {
  orderCompletion: 1, // 1 point per $1 spent
  reviewSubmission: 50, // 50 points for review
  referralConversion: 200, // 200 points when referral converts
  birthdayBonus: 100, // 100 points on birthday
  tierUpgrade: 150 // 150 points on tier upgrade
}

// Points expiration
export const POINTS_EXPIRATION_DAYS = 365 // Points expire after 1 year

/**
 * Calculate tier based on total points
 */
export function calculateTier(points: number): LoyaltyTier {
  if (points >= TIER_REQUIREMENTS.platinum.minPoints) return 'platinum'
  if (points >= TIER_REQUIREMENTS.gold.minPoints) return 'gold'
  return 'silver'
}

/**
 * Calculate points to earn from order
 */
export function calculateOrderPoints(orderTotal: number): number {
  return Math.floor(orderTotal * POINTS_RATES.orderCompletion)
}

/**
 * Get tier information
 */
export function getTierInfo(tier: LoyaltyTier) {
  const info = {
    silver: {
      name: 'Silver',
      icon: '🥈',
      color: '#C0C0C0',
      discount: 0,
      benefits: [
        'Earn 1 point per $1 spent',
        'Birthday bonus: 100 points',
        'Access to loyalty rewards'
      ]
    },
    gold: {
      name: 'Gold',
      icon: '🥇',
      color: '#FFD700',
      discount: 5,
      benefits: [
        'Earn 1.5 points per $1 spent (1 point base)',
        '5% discount on orders',
        'Birthday bonus: 150 points',
        'Priority support',
        'Exclusive promotions'
      ]
    },
    platinum: {
      name: 'Platinum',
      icon: '💎',
      color: '#E5E4E2',
      discount: 10,
      benefits: [
        'Earn 2 points per $1 spent (1 point base)',
        '10% discount on orders',
        'Birthday bonus: 250 points',
        'White glove support',
        'Early access to new features',
        'Free delivery on orders over $50'
      ]
    }
  }
  return info[tier]
}

/**
 * Get discount percentage for tier
 */
export function getTierDiscount(tier: LoyaltyTier): number {
  return TIER_REQUIREMENTS[tier].discountPercent
}

/**
 * Calculate points to next tier
 */
export function pointsToNextTier(currentPoints: number, currentTier: LoyaltyTier): number {
  if (currentTier === 'platinum') return 0
  
  const nextTier = currentTier === 'silver' ? 'gold' : 'platinum'
  const nextRequirement = TIER_REQUIREMENTS[nextTier].minPoints
  
  return Math.max(0, nextRequirement - currentPoints)
}

/**
 * Check if member can redeem points
 */
export function canRedeemPoints(currentPoints: number, costPoints: number): boolean {
  return currentPoints >= costPoints
}

/**
 * Get available rewards
 */
export function getAvailableRewards(): RewardOption[] {
  return [
    {
      id: 'credit-5',
      name: '$5 Credit',
      description: 'Get $5 credit towards your next order',
      pointsCost: 500,
      type: 'credit',
      value: 5,
      valueCurrency: 'AUD',
      available: true,
      redeemed: 0
    },
    {
      id: 'credit-10',
      name: '$10 Credit',
      description: 'Get $10 credit towards your next order',
      pointsCost: 1000,
      type: 'credit',
      value: 10,
      valueCurrency: 'AUD',
      available: true,
      redeemed: 0
    },
    {
      id: 'credit-20',
      name: '$20 Credit',
      description: 'Get $20 credit towards your next order',
      pointsCost: 2000,
      type: 'credit',
      value: 20,
      valueCurrency: 'AUD',
      available: true,
      redeemed: 0
    },
    {
      id: 'free-order',
      name: 'Free Order (up to $30)',
      description: 'One free order up to $30 value',
      pointsCost: 3000,
      type: 'free-order',
      value: 30,
      valueCurrency: 'AUD',
      available: true,
      limit: 1,
      redeemed: 0
    },
    {
      id: 'donation',
      name: 'Donate 100 Points to Charity',
      description: 'Donate points to environmental charity',
      pointsCost: 100,
      type: 'donation',
      value: 100,
      available: true,
      redeemed: 0
    }
  ]
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return `${points.toLocaleString()} points`
}

/**
 * Get tier upgrade message
 */
export function getTierUpgradeMessage(previousTier: LoyaltyTier, newTier: LoyaltyTier): string {
  const messages = {
    'silver-gold': 'Congratulations! You\'ve reached Gold tier! Enjoy 5% discount on all orders.',
    'silver-platinum': 'Amazing! You\'ve reached Platinum tier! Enjoy 10% discount and exclusive benefits.',
    'gold-platinum': 'Incredible! You\'ve reached Platinum tier! Your loyalty is rewarded with 10% discount and white-glove support.'
  }
  const key = `${previousTier}-${newTier}` as keyof typeof messages
  return messages[key] || 'Your tier has been updated!'
}

/**
 * Calculate spending needed for next tier
 */
export function spendingToNextTier(currentSpent: number, currentTier: LoyaltyTier): number {
  if (currentTier === 'platinum') return 0
  
  const nextTier = currentTier === 'silver' ? 'gold' : 'platinum'
  const nextRequirement = TIER_REQUIREMENTS[nextTier].minSpent
  
  return Math.max(0, nextRequirement - currentSpent)
}

/**
 * Get points expiration date
 */
export function getPointsExpirationDate(pointsCreatedAt: Timestamp): Date {
  const expirationDate = new Date(pointsCreatedAt.toDate())
  expirationDate.setDate(expirationDate.getDate() + POINTS_EXPIRATION_DAYS)
  return expirationDate
}

/**
 * Calculate points progress to redemption
 */
export function pointsRedemptionProgress(currentPoints: number, targetPoints: number): number {
  if (targetPoints === 0) return 100
  return Math.min(100, Math.round((currentPoints / targetPoints) * 100))
}

/**
 * Get milestone messages
 */
export function getMilestoneMessage(totalPoints: number): string | null {
  if (totalPoints === 1000) return '🎉 Reached 1000 points! You\'re making great progress.'
  if (totalPoints === 2500) return '⭐ Amazing! 2500 points collected. Platinum tier is close!'
  if (totalPoints === 5000) return '🏆 Incredible loyalty! You\'ve earned 5000 points!'
  if (totalPoints % 1000 === 0 && totalPoints > 5000) return `🎯 Milestone reached: ${totalPoints.toLocaleString()} points!`
  return null
}

/**
 * Generate referral code
 */
export function generateReferralCode(customerId: string): string {
  const hash = customerId.substring(0, 8).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `WASH-${hash}${random}`
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  return /^WASH-[A-Z0-9]{12}$/.test(code)
}
