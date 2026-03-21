// User Management - Supabase Implementation
// Handles customer and employee profiles

import { supabase } from './supabaseClient'

export interface EmployeeProfile {
  uid: string
  name: string
  email: string
  phone?: string
  employeeId?: string
  accountStatus: 'pending' | 'active' | 'inactive'
}

export interface CustomerProfile {
  uid: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  state?: string
  personalUse?: 'personal' | 'business'
  preferenceMarketingTexts?: boolean
  preferenceAccountTexts?: boolean
  selectedPlan?: string
  accountStatus: 'active' | 'inactive'
  createdAt?: string
}

export interface UserMetadata {
  uid: string
  email: string
  displayName?: string
  roles: ('customer' | 'pro' | 'admin')[]
}

export async function createEmployeeProfile(uid: string, data: Partial<EmployeeProfile>): Promise<void> {
  console.log('[UserMgmt] Creating employee profile:', uid, data)
  try {
    const { error } = await supabase
      .from('employees')
      .insert({
        id: uid,
        ...data,
      })
    if (error) throw error
    console.log('[UserMgmt] ✓ Employee profile created')
  } catch (err) {
    console.error('[UserMgmt] Failed to create employee profile:', err)
    throw err
  }
}

export async function updateEmployeeProfile(uid: string, data: Partial<EmployeeProfile>): Promise<void> {
  console.log('[UserMgmt] Updating employee profile:', uid, data)
  try {
    const { error } = await supabase
      .from('employees')
      .update(data)
      .eq('id', uid)
    if (error) throw error
    console.log('[UserMgmt] ✓ Employee profile updated')
  } catch (err) {
    console.error('[UserMgmt] Failed to update employee profile:', err)
    throw err
  }
}

export async function getEmployeeProfile(uid: string): Promise<EmployeeProfile | null> {
  console.log('[UserMgmt] Getting employee profile:', uid)
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', uid)
      .single()
    if (error) {
      console.error('[UserMgmt] Error fetching employee:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('[UserMgmt] Failed to get employee profile:', err)
    return null
  }
}

export async function generateUniqueEmployeeId(): Promise<string> {
  console.log('[UserMgmt] Generating unique employee ID')
  return `EMP${Date.now()}`
}

export async function createCustomerProfile(uid: string, data: Partial<CustomerProfile>): Promise<void> {
  console.log('[UserMgmt] Creating customer profile via API:', uid)
  try {
    const response = await fetch('/api/auth/create-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || '',
        state: data.state,
        personalUse: data.personalUse,
        preferenceMarketingTexts: data.preferenceMarketingTexts,
        preferenceAccountTexts: data.preferenceAccountTexts,
        selectedPlan: data.selectedPlan,
      })
    })

    const result = await response.json()

    if (!response.ok) {
      const errorMsg = result.error || `Failed with status ${response.status}`
      console.error('[UserMgmt] API error:', errorMsg)
      throw new Error(errorMsg)
    }

    console.log('[UserMgmt] ✓ Customer profile created via API')
  } catch (err: any) {
    const errorMsg = err?.message || err?.toString?.() || 'Unknown error'
    console.error('[UserMgmt] Failed to create customer profile:', errorMsg)
    throw err
  }
}

export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  console.log('[UserMgmt] Getting customer profile:', uid)
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', uid)
      .single()
    if (error) {
      console.error('[UserMgmt] Error fetching customer:', error)
      return null
    }
    return {
      uid: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      state: data.state,
      personalUse: data.personal_use,
      preferenceMarketingTexts: data.preference_marketing_texts,
      preferenceAccountTexts: data.preference_account_texts,
      selectedPlan: data.selected_plan,
      accountStatus: data.account_status,
      createdAt: data.created_at,
    }
  } catch (err) {
    console.error('[UserMgmt] Failed to get customer profile:', err)
    return null
  }
}

export async function updateCustomerProfile(uid: string, data: Partial<CustomerProfile>): Promise<void> {
  console.log('[UserMgmt] Updating customer profile:', uid, data)
  try {
    const updateData: Record<string, any> = {}
    if (data.firstName) updateData.first_name = data.firstName
    if (data.lastName) updateData.last_name = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.state) updateData.state = data.state
    if (data.personalUse) updateData.personal_use = data.personalUse
    if (data.preferenceMarketingTexts !== undefined) updateData.preference_marketing_texts = data.preferenceMarketingTexts
    if (data.preferenceAccountTexts !== undefined) updateData.preference_account_texts = data.preferenceAccountTexts
    if (data.selectedPlan) updateData.selected_plan = data.selectedPlan

    const { error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', uid)
    if (error) throw error
    console.log('[UserMgmt] ✓ Customer profile updated')
  } catch (err) {
    console.error('[UserMgmt] Failed to update customer profile:', err)
    throw err
  }
}

export async function deleteEmployeeProfile(uid: string): Promise<void> {
  console.log('[UserMgmt] Deleting employee profile:', uid)
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', uid)
    if (error) throw error
    console.log('[UserMgmt] ✓ Employee profile deleted')
  } catch (err) {
    console.error('[UserMgmt] Failed to delete employee profile:', err)
    throw err
  }
}

export async function deleteCustomerProfile(uid: string): Promise<void> {
  console.log('[UserMgmt] Deleting customer profile:', uid)
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', uid)
    if (error) throw error
    console.log('[UserMgmt] ✓ Customer profile deleted')
  } catch (err) {
    console.error('[UserMgmt] Failed to delete customer profile:', err)
    throw err
  }
}

export async function hasLinkedProfiles(uid: string): Promise<boolean> {
  console.log('[UserMgmt] Checking linked profiles:', uid)
  // TODO: Check if user has multiple profiles
  return false
}

export async function generateShortUserId(): Promise<string> {
  return `USR${Date.now()}`
}

export function compressFirebaseUid(uid: string): string {
  return uid.slice(0, 8)
}

export async function getDisplayId(uid: string): Promise<string> {
  return compressFirebaseUid(uid)
}
