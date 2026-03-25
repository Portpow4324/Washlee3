/**
 * Order presets utility
 * Handles creating and managing reusable booking presets from order history
 */

import { supabase } from './supabaseClient'

export interface BookingPreset {
  id?: string
  customer_id: string
  name: string
  label: string  // Display name for the preset
  description?: string
  
  // Booking data
  selectedService: string
  detergent: string
  bagCount: number
  deliverySpeed: string
  protectionPlan: string
  
  // Special care options
  delicateCycle?: boolean
  hangDry?: boolean
  returnsOnHangers?: boolean
  delicatesCare?: boolean
  comforterService?: boolean
  stainTreatment?: boolean
  ironing?: boolean
  
  // Address preference
  preferredPickupLabel?: string
  preferredDeliveryLabel?: string
  
  created_at?: string
  updated_at?: string
  usageCount?: number
  lastUsed?: string
}

/**
 * Extract a preset from booking/order data
 */
export function createPresetFromBooking(
  customerId: string,
  bookingData: any,
  presetName: string
): BookingPreset {
  return {
    customer_id: customerId,
    name: presetName.toLowerCase().replace(/\s+/g, '_'),
    label: presetName,
    description: `Preset created from booking: ${new Date().toLocaleDateString('en-AU')}`,
    selectedService: bookingData.selectedService || 'standard',
    detergent: bookingData.detergent || 'classic-scented',
    bagCount: bookingData.bagCount || 4,
    deliverySpeed: bookingData.deliverySpeed || 'standard',
    protectionPlan: bookingData.protectionPlan || 'basic',
    delicateCycle: bookingData.delicateCycle || false,
    hangDry: bookingData.hangDry || false,
    returnsOnHangers: bookingData.returnsOnHangers || false,
    delicatesCare: bookingData.delicatesCare || false,
    comforterService: bookingData.comforterService || false,
    stainTreatment: bookingData.stainTreatment || false,
    ironing: bookingData.ironing || false,
  }
}

/**
 * Get all presets for a customer
 */
export async function getCustomerPresets(customerId: string): Promise<BookingPreset[]> {
  try {
    const { data, error } = await supabase
      .from('booking_presets')
      .select('*')
      .eq('customer_id', customerId)
      .order('usageCount', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Presets] Error fetching presets:', error)
      // Table might not exist yet
      return []
    }

    return data || []
  } catch (err) {
    console.error('[Presets] Error in getCustomerPresets:', err)
    return []
  }
}

/**
 * Create a new preset
 */
export async function createPreset(preset: BookingPreset): Promise<BookingPreset | null> {
  try {
    // Check if preset with same name already exists
    const { data: existing } = await supabase
      .from('booking_presets')
      .select('id')
      .eq('customer_id', preset.customer_id)
      .eq('name', preset.name)
      .maybeSingle()

    if (existing) {
      console.log('[Presets] Preset already exists, updating instead')
      return updatePreset(existing.id, preset)
    }

    const { data, error } = await supabase
      .from('booking_presets')
      .insert([preset])
      .select()
      .single()

    if (error) {
      console.error('[Presets] Error creating preset:', error)
      return null
    }

    console.log('[Presets] Preset created:', data)
    return data
  } catch (err) {
    console.error('[Presets] Error in createPreset:', err)
    return null
  }
}

/**
 * Update an existing preset
 */
export async function updatePreset(
  presetId: string,
  updates: Partial<BookingPreset>
): Promise<BookingPreset | null> {
  try {
    const { data, error } = await supabase
      .from('booking_presets')
      .update(updates)
      .eq('id', presetId)
      .select()
      .single()

    if (error) {
      console.error('[Presets] Error updating preset:', error)
      return null
    }

    console.log('[Presets] Preset updated:', data)
    return data
  } catch (err) {
    console.error('[Presets] Error in updatePreset:', err)
    return null
  }
}

/**
 * Delete a preset
 */
export async function deletePreset(presetId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('booking_presets')
      .delete()
      .eq('id', presetId)

    if (error) {
      console.error('[Presets] Error deleting preset:', error)
      return false
    }

    console.log('[Presets] Preset deleted')
    return true
  } catch (err) {
    console.error('[Presets] Error in deletePreset:', err)
    return false
  }
}

/**
 * Track preset usage - increment usage counter and update lastUsed
 */
export async function trackPresetUsage(presetId: string): Promise<boolean> {
  try {
    const { data: preset, error: fetchError } = await supabase
      .from('booking_presets')
      .select('usageCount')
      .eq('id', presetId)
      .maybeSingle()

    if (fetchError || !preset) {
      console.error('[Presets] Error fetching preset for tracking:', fetchError)
      return false
    }

    const newUsageCount = (preset.usageCount || 0) + 1

    const { error } = await supabase
      .from('booking_presets')
      .update({
        usageCount: newUsageCount,
        lastUsed: new Date().toISOString(),
      })
      .eq('id', presetId)

    if (error) {
      console.error('[Presets] Error updating usage:', error)
      return false
    }

    console.log('[Presets] Usage tracked:', newUsageCount)
    return true
  } catch (err) {
    console.error('[Presets] Error in trackPresetUsage:', err)
    return false
  }
}

/**
 * Create a default preset from first order (if exists)
 */
export async function createDefaultPresetFromFirstOrder(
  customerId: string,
  orderBookingData: any
): Promise<BookingPreset | null> {
  try {
    // Check if customer already has any presets
    const existing = await getCustomerPresets(customerId)
    if (existing.length > 0) {
      console.log('[Presets] Customer already has presets, skipping auto-creation')
      return null
    }

    const preset = createPresetFromBooking(
      customerId,
      orderBookingData,
      'Quick Reorder (From First Order)'
    )

    return await createPreset(preset)
  } catch (err) {
    console.error('[Presets] Error in createDefaultPresetFromFirstOrder:', err)
    return null
  }
}
