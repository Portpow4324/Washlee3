/**
 * Legacy subscription plans data.
 *
 * Washlee no longer sells paid subscription plans. Keep this module as a stable
 * import target for old code, but expose an empty list so nothing can render
 * stale monthly / quarterly / annual membership offers.
 */

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

export const subscriptionPlans: SubscriptionPlan[] = []

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
