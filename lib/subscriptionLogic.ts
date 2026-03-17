import { Timestamp } from 'firebase/firestore'

export type SubscriptionPlan = 'payPerOrder' | 'starter' | 'pro' | 'premium'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired'
export type BillingCycle = 'monthly' | 'yearly'

export interface PlanFeatures {
  maxWeightPerLoad: number
  expressDelivery: boolean
  prioritySupport: boolean
  addOnDiscounts: boolean
  advancedAnalytics: boolean
  dedicatedAccount: boolean
}

export const planDetails: Record<SubscriptionPlan, { name: string; monthlyPrice: number; yearlyPrice: number; monthlyOrders: number; features: PlanFeatures }> = {
  payPerOrder: {
    name: 'Pay Per Order',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyOrders: 10,
    features: {
      maxWeightPerLoad: 25,
      expressDelivery: false,
      prioritySupport: false,
      addOnDiscounts: false,
      advancedAnalytics: false,
      dedicatedAccount: false,
    },
  },
  starter: {
    name: 'Starter',
    monthlyPrice: 4.99,
    yearlyPrice: 59.88, // $4.99 * 12, could apply discount
    monthlyOrders: 999999, // Unlimited
    features: {
      maxWeightPerLoad: 25,
      expressDelivery: true,
      prioritySupport: false,
      addOnDiscounts: true,
      advancedAnalytics: false,
      dedicatedAccount: false,
    },
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 9.99,
    yearlyPrice: 119.88, // $9.99 * 12, could apply discount
    monthlyOrders: 999999, // Unlimited
    features: {
      maxWeightPerLoad: 45,
      expressDelivery: true,
      prioritySupport: false,
      addOnDiscounts: true,
      advancedAnalytics: false,
      dedicatedAccount: false,
    },
  },
  premium: {
    name: 'Premium+',
    monthlyPrice: 24.99,
    yearlyPrice: 299.88, // $24.99 * 12, could apply discount
    monthlyOrders: 999999, // Unlimited
    features: {
      maxWeightPerLoad: 45,
      expressDelivery: true,
      prioritySupport: true,
      addOnDiscounts: true,
      advancedAnalytics: true,
      dedicatedAccount: true,
    },
  },
}

export interface Subscription {
  id: string
  customerId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  billingCycle: BillingCycle
  currentPeriodStart: Timestamp
  currentPeriodEnd: Timestamp
  cancelledAt?: Timestamp
  pausedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Invoice {
  id: string
  customerId: string
  subscriptionId: string
  amount: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'failed'
  dueDate: Timestamp
  paidDate?: Timestamp
  pdfUrl?: string
  createdAt: Timestamp
}

export interface BillingHistory {
  subscriptionId: string
  invoices: Invoice[]
  totalSpent: number
  nextBillingDate: Timestamp
  autoRenewal: boolean
}

// Validation
export function validateSubscription(sub: Partial<Subscription>) {
  if (!sub.customerId) return { isValid: false, error: 'Customer ID required' }
  if (!sub.plan || !Object.keys(planDetails).includes(sub.plan)) {
    return { isValid: false, error: 'Invalid plan' }
  }
  if (!sub.billingCycle || !['monthly', 'yearly'].includes(sub.billingCycle)) {
    return { isValid: false, error: 'Invalid billing cycle' }
  }
  return { isValid: true }
}

// Plan calculations
export function getPlanPrice(plan: SubscriptionPlan, billingCycle: BillingCycle = 'monthly'): number {
  const planInfo = planDetails[plan]
  if (billingCycle === 'yearly') {
    // Use yearlyPrice if available, otherwise calculate with 20% discount
    if (planInfo.yearlyPrice) {
      return planInfo.yearlyPrice
    }
    return Math.round(planInfo.monthlyPrice * 12 * 0.8 * 100) / 100
  }
  return planInfo.monthlyPrice
}

export function calculateTax(amount: number, taxRate: number = 0.1): number {
  return Math.round(amount * taxRate * 100) / 100
}

export function calculateInvoiceTotal(plan: SubscriptionPlan, billingCycle: BillingCycle = 'monthly'): {
  subtotal: number
  tax: number
  total: number
} {
  const subtotal = getPlanPrice(plan, billingCycle)
  const tax = calculateTax(subtotal)
  return {
    subtotal,
    tax,
    total: subtotal + tax,
  }
}

// Subscription period calculations
export function getNextBillingDate(currentPeriodEnd: Timestamp): Date {
  return new Date(currentPeriodEnd.toMillis())
}

export function getDaysUntilRenewal(currentPeriodEnd: Timestamp): number {
  const now = new Date()
  const endDate = new Date(currentPeriodEnd.toMillis())
  const diffTime = endDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function isSubscriptionActive(subscription: Subscription): boolean {
  return subscription.status === 'active' && new Date() < new Date(subscription.currentPeriodEnd.toMillis())
}

export function canDowngrade(fromPlan: SubscriptionPlan): boolean {
  // Can't downgrade from enterprise to free
  const order = ['free', 'starter', 'pro', 'enterprise']
  const fromIndex = order.indexOf(fromPlan)
  return fromIndex > 0
}

// Pro recommendations
export function recommendUpgrade(ordersThisMonth: number, currentPlan: SubscriptionPlan): SubscriptionPlan | null {
  const maxOrders = planDetails[currentPlan].monthlyOrders
  const usagePercent = (ordersThisMonth / maxOrders) * 100

  if (usagePercent > 80) {
    const order: SubscriptionPlan[] = ['payPerOrder', 'starter', 'pro', 'premium']
    const currentIndex = order.indexOf(currentPlan)
    if (currentIndex < order.length - 1) {
      return order[currentIndex + 1]
    }
  }

  return null
}

// Invoice generation
export function generateInvoiceNumber(): string {
  const date = new Date()
  const timestamp = date.getTime()
  return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${timestamp.toString().slice(-6)}`
}

// Promo code validation
export function validatePromoCode(code: string): { isValid: boolean; discount?: number; error?: string } {
  // Dummy validation - replace with real checks
  if (!code) return { isValid: false, error: 'Code required' }
  if (code === 'LAUNCH20') return { isValid: true, discount: 20 }
  if (code === 'LAUNCH10') return { isValid: true, discount: 10 }
  return { isValid: false, error: 'Invalid promo code' }
}

// Trial period
export function getTrialDaysRemaining(createdAt: Timestamp, trialDays: number = 14): number {
  const created = new Date(createdAt.toMillis())
  const trialEnd = new Date(created.getTime() + trialDays * 24 * 60 * 60 * 1000)
  const now = new Date()
  const diffTime = trialEnd.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function isInTrial(subscription: Subscription, trialDays: number = 14): boolean {
  const daysRemaining = getTrialDaysRemaining(subscription.createdAt, trialDays)
  return daysRemaining > 0
}

// Cancellation reasons
export const cancellationReasons = [
  'Too expensive',
  'Not using it',
  'Found better alternative',
  'Technical issues',
  'Poor customer support',
  'Other',
]
