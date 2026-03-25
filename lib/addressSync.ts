/**
 * Address sync utility
 * Handles auto-syncing addresses from booking to customer_addresses table
 */

import { supabase } from './supabaseClient'
import { AddressParts } from './googlePlaces'

export interface CustomerAddress {
  id?: string
  customer_id: string
  label: string
  address: string
  city: string
  state: string
  postcode: string
  country?: string
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Extract address from AddressParts and create CustomerAddress object
 */
export function createAddressFromParts(
  customerId: string,
  addressParts: AddressParts | null,
  label: string,
  isDefault: boolean = false
): CustomerAddress | null {
  if (!addressParts) return null

  return {
    customer_id: customerId,
    label,
    address: addressParts.streetAddress || '',
    city: addressParts.suburb || '',
    state: addressParts.state || '',
    postcode: addressParts.postcode || '',
    country: addressParts.country || 'Australia',
    is_default: isDefault,
  }
}

/**
 * Sync pickup and delivery addresses from booking to customer_addresses table
 * Creates entries if they don't exist, updates if they do
 */
export async function syncBookingAddresses(
  customerId: string,
  pickupAddressDetails: AddressParts | null,
  deliveryAddressDetails: AddressParts | null
) {
  try {
    // Extract address information
    const pickupAddress = createAddressFromParts(
      customerId,
      pickupAddressDetails,
      'Pickup Address',
      false
    )

    const deliveryAddress = createAddressFromParts(
      customerId,
      deliveryAddressDetails,
      'Delivery Address',
      false
    )

    const addressesToAdd: CustomerAddress[] = []
    if (pickupAddress) addressesToAdd.push(pickupAddress)
    if (deliveryAddress) addressesToAdd.push(deliveryAddress)

    if (addressesToAdd.length === 0) {
      console.log('[AddressSync] No addresses to sync')
      return { success: true, synced: 0 }
    }

    // Fetch existing addresses to check for duplicates
    const { data: existingAddresses, error: fetchError } = await supabase
      .from('customer_addresses')
      .select('id, address, city, postcode')
      .eq('customer_id', customerId)

    if (fetchError) {
      console.error('[AddressSync] Error fetching existing addresses:', fetchError)
      // Continue anyway - table might not exist yet
    }

    const existingAddressSet = new Set(
      (existingAddresses || []).map(
        (addr: any) => `${addr.address}-${addr.city}-${addr.postcode}`
      )
    )

    // Filter out duplicates
    const newAddresses = addressesToAdd.filter(
      (addr) => !existingAddressSet.has(`${addr.address}-${addr.city}-${addr.postcode}`)
    )

    if (newAddresses.length === 0) {
      console.log('[AddressSync] All addresses already exist')
      return { success: true, synced: 0 }
    }

    // Insert new addresses
    const { data, error } = await supabase
      .from('customer_addresses')
      .insert(newAddresses)
      .select()

    if (error) {
      console.error('[AddressSync] Error inserting addresses:', error)
      // Don't throw - this shouldn't block order creation
      return { success: false, error: error.message, synced: 0 }
    }

    console.log('[AddressSync] Successfully synced addresses:', data?.length || 0)
    return { success: true, synced: data?.length || 0 }
  } catch (err) {
    console.error('[AddressSync] Unexpected error:', err)
    return { success: false, error: String(err), synced: 0 }
  }
}

/**
 * Get all addresses for a customer
 */
export async function getCustomerAddresses(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[AddressSync] Error fetching customer addresses:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[AddressSync] Error in getCustomerAddresses:', err)
    return []
  }
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(
  customerId: string,
  addressId: string
) {
  try {
    // First, unset all addresses as default
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customerId)

    // Then set the selected one as default
    const { error } = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('customer_id', customerId)

    if (error) {
      console.error('[AddressSync] Error setting default address:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[AddressSync] Error in setDefaultAddress:', err)
    return false
  }
}
