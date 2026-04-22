/**
 * Delivery Service Logic
 * Manages delivery speed availability, capacity, and delivery windows
 */

import { supabase } from './supabaseClient'

export interface DeliveryMetrics {
  activeMembers: number
  activeOrders: number
  averageOrderWeight: number // in kg
  totalCapacity: number // total kg/hour the team can handle
  availableCapacity: number // remaining capacity
  capacityUsage: number // percentage
  standardDeliveryHours: number // hours for standard delivery
  expressDeliveryHours: number // hours for express delivery
  lastUpdated: string
}

export interface DeliveryWindow {
  type: 'standard' | 'express'
  estimatedHours: number
  estimatedDeliveryDate: string
  estimatedDeliveryTime: string
  available: boolean
  reason?: string // e.g., "High demand - Express recommended"
}

/**
 * Get current delivery metrics from backend
 */
export async function getDeliveryMetrics(): Promise<DeliveryMetrics | null> {
  try {
    const response = await fetch('/api/delivery/metrics', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      console.warn('[Delivery] Failed to fetch metrics:', response.status)
      return null
    }

    const data = await response.json()
    return data.metrics || null
  } catch (err) {
    console.error('[Delivery] Error fetching metrics:', err)
    return null
  }
}

/**
 * Calculate delivery windows based on current metrics and weight
 */
export function calculateDeliveryWindows(
  metrics: DeliveryMetrics,
  weightKg: number
): { standard: DeliveryWindow; express: DeliveryWindow } {
  const now = new Date()

  // Standard delivery: 24-48 hours based on capacity
  let standardHours = 24
  if (metrics.capacityUsage > 80) {
    standardHours = 36 // Extended if high capacity
  } else if (metrics.capacityUsage > 60) {
    standardHours = 30
  }

  // Express delivery: 4-12 hours (only if capacity available)
  const expressAvailable = metrics.availableCapacity > weightKg * 2 // Need 2x buffer for express
  let expressHours = 6
  if (metrics.capacityUsage > 70) {
    expressHours = 12 // Slower express if busy
  } else if (metrics.capacityUsage < 30) {
    expressHours = 4 // Fast if capacity available
  }

  const getDeliveryDateTime = (hoursToAdd: number) => {
    const deliveryDate = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000)
    const dateStr = deliveryDate.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    const timeStr = deliveryDate.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    return { dateStr, timeStr }
  }

  const standardDateTime = getDeliveryDateTime(standardHours)
  const expressDateTime = getDeliveryDateTime(expressHours)

  return {
    standard: {
      type: 'standard',
      estimatedHours: standardHours,
      estimatedDeliveryDate: standardDateTime.dateStr,
      estimatedDeliveryTime: standardDateTime.timeStr,
      available: true,
      reason:
        metrics.capacityUsage > 80
          ? 'High demand - expect longer wait times'
          : metrics.capacityUsage > 60
            ? 'Moderate demand'
            : 'Low demand - fastest standard delivery',
    },
    express: {
      type: 'express',
      estimatedHours: expressHours,
      estimatedDeliveryDate: expressDateTime.dateStr,
      estimatedDeliveryTime: expressDateTime.timeStr,
      available: expressAvailable,
      reason: expressAvailable
        ? 'Priority queue - limited slots'
        : 'Express not available - capacity full. Try Standard delivery.',
    },
  }
}

/**
 * Suggest delivery speed based on capacity and weight
 */
export function suggestDeliverySpeed(
  metrics: DeliveryMetrics,
  weightKg: number
): 'standard' | 'express' {
  // Recommend standard if:
  // - Capacity usage > 80% (express slots needed for urgent)
  // - Weight > 20kg (bulky items go standard)
  // - Limited express capacity

  if (
    metrics.capacityUsage > 80 ||
    weightKg > 20 ||
    metrics.availableCapacity < weightKg * 3
  ) {
    return 'standard'
  }

  return 'express'
}

/**
 * Track order for capacity planning
 */
export async function trackOrderCapacity(
  orderId: string,
  weightKg: number,
  deliverySpeed: 'standard' | 'express'
): Promise<boolean> {
  try {
    const response = await fetch('/api/delivery/track-capacity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        weightKg,
        deliverySpeed,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      console.warn('[Delivery] Failed to track capacity:', response.status)
      return false
    }

    return true
  } catch (err) {
    console.error('[Delivery] Error tracking capacity:', err)
    return false
  }
}

/**
 * Get delivery status for an order
 */
export async function getDeliveryStatus(orderId: string): Promise<any> {
  try {
    const response = await fetch(`/api/delivery/status/${orderId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.status || null
  } catch (err) {
    console.error('[Delivery] Error fetching status:', err)
    return null
  }
}

/**
 * Format weight/hour metric for display
 */
export function formatWeightMetric(
  weightKg: number,
  durationHours: number
): string {
  const ratePerHour = (weightKg / durationHours).toFixed(1)
  return `${ratePerHour} kg/hour`
}

/**
 * Generate customer-friendly delivery message
 */
export function generateDeliveryMessage(window: DeliveryWindow): string {
  return `
    <div class="text-sm text-gray-700">
      <p class="font-semibold">${window.type === 'express' ? '⚡ Express Delivery' : '🚚 Standard Delivery'}</p>
      <p class="mt-1">Estimated: <strong>${window.estimatedDeliveryDate} by ${window.estimatedDeliveryTime}</strong></p>
      <p class="text-xs mt-1">${window.reason}</p>
      <p class="text-xs text-gray-500 mt-2">Processing time: ${window.estimatedHours} hours</p>
    </div>
  `
}
