/**
 * Shared subscription plans data
 * Used by both pricing page and dashboard subscriptions
 */

import { Zap, Crown } from 'lucide-react'

export interface SubscriptionPlan {
  id: string
  name: string
  price: string
  period: string
  description: string
  features: string[]
  icon?: any
  popular?: boolean
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Pass',
    price: '$29',
    period: '/month',
    description: 'Perfect for regular laundry',
    features: [
      'Unlimited pickups & deliveries',
      '15% discount on all services',
      'Priority customer support',
      'Free protection plan',
      'Monthly loyalty points bonus',
    ],
    icon: Zap,
  },
  {
    id: 'quarterly',
    name: 'Quarterly Bundle',
    price: '$79',
    period: '/quarter',
    description: 'Best value for monthly users',
    features: [
      'Unlimited pickups & deliveries',
      '20% discount on all services',
      'Priority support + Express support',
      'Free premium protection plan',
      'Double loyalty points',
      'Exclusive member perks',
    ],
    icon: Crown,
    popular: true,
  },
  {
    id: 'annual',
    name: 'Annual Plan',
    price: '$199',
    period: '/year',
    description: 'Maximum savings',
    features: [
      'Unlimited pickups & deliveries',
      '25% discount on all services',
      'VIP customer support',
      'Free premium+ protection plan',
      'Triple loyalty points',
      'Exclusive member events',
      'Free service month (April)',
    ],
    icon: Crown,
  },
]

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return subscriptionPlans.find(plan => plan.id === planId)
}

/**
 * Get most popular plan
 */
export function getPopularPlan(): SubscriptionPlan | undefined {
  return subscriptionPlans.find(plan => plan.popular)
}

/**
 * Format plan price display
 */
export function formatPlanPrice(plan: SubscriptionPlan): string {
  return `${plan.price}${plan.period}`
}
