// Order Tracking Service - MVP Version
// Real-time tracking to be implemented in Phase 9

import { supabase } from '@/lib/supabaseClient'

export interface OrderTracking {
  orderId: string
  currentStatus: string
  updates: any[]
  estimatedDelivery?: Date
  deliveryProof?: string
  proLocation?: { lat: number; lng: number }
}

export async function getTracking(orderId: string): Promise<OrderTracking | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !data) return null

    return {
      orderId,
      currentStatus: data.status || 'scheduled',
      updates: data.tracking_updates || [],
      estimatedDelivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
      deliveryProof: data.delivery_proof,
      proLocation: data.pro_location
    }
  } catch (error) {
    console.error('Error fetching tracking:', error)
    return null
  }
}

export function subscribeToTracking(
  orderId: string,
  onUpdate: (tracking: OrderTracking) => void,
  onError?: (error: Error) => void
) {
  // Polling implementation for MVP (Phase 9: replace with real-time)
  const interval = setInterval(async () => {
    const tracking = await getTracking(orderId)
    if (tracking) {
      onUpdate(tracking)
    }
  }, 5000)

  return () => clearInterval(interval)
}

export async function updateTrackingStatus(
  orderId: string,
  status: string,
  location?: { lat: number; lng: number }
): Promise<void> {
  try {
    await supabase
      .from('orders')
      .update({
        status,
        pro_location: location,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
  } catch (error) {
    console.error('Error updating tracking:', error)
  }
}
