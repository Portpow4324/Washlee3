/**
 * Supabase Admin Client
 * =====================
 * Server-side only - Use service role key for privileged operations
 * Never expose to client/browser
 * 
 * Usage:
 *   import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
 *   const { data, error } = await getSupabaseAdmin().from('customers').select('*')
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time credential requirements
let supabaseAdminClient: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        '❌ Missing Supabase credentials for admin client:',
        !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
        !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : ''
      )
      throw new Error('Missing Supabase credentials')
    }

    // Create admin client with service role (full database access)
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseAdminClient
}

// Create a Proxy that lazily initializes on first access
export const supabaseAdmin = new Proxy({} as any, {
  get: (_target, prop) => {
    const client = getSupabaseAdmin()
    return (client as any)[prop]
  },
})

export { getSupabaseAdmin }

/**
 * Verify user is admin by checking custom claim or admin column
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // Check if user has admin role in customers table
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn(`[AdminClient] User not found or not customer: ${userId}`)
      return false
    }

    return data?.role === 'admin'
  } catch (err) {
    console.error('[AdminClient] Error checking admin status:', err)
    return false
  }
}

/**
 * Grant admin role to a user
 */
export async function grantAdminRole(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('customers')
      .update({ role: 'admin' })
      .eq('id', userId)

    if (error) throw error
    console.log(`[AdminClient] ✓ Granted admin role to ${userId}`)
    return true
  } catch (err) {
    console.error('[AdminClient] Failed to grant admin role:', err)
    return false
  }
}

/**
 * Remove admin role from a user
 */
export async function removeAdminRole(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('customers')
      .update({ role: 'user' })
      .eq('id', userId)

    if (error) throw error
    console.log(`[AdminClient] ✓ Removed admin role from ${userId}`)
    return true
  } catch (err) {
    console.error('[AdminClient] Failed to remove admin role:', err)
    return false
  }
}

/**
 * Get all customers
 */
export async function getAllCustomers() {
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to fetch customers:', err)
    return { data: null, error: err }
  }
}

/**
 * Get all employees
 */
export async function getAllEmployees() {
  try {
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to fetch employees:', err)
    return { data: null, error: err }
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error(`[AdminClient] Failed to fetch customer ${userId}:`, err)
    return { data: null, error: err }
  }
}

/**
 * Update customer data
 */
export async function updateCustomer(userId: string, updates: Record<string, any>) {
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    console.log(`[AdminClient] ✓ Updated customer ${userId}`)
    return { data, error: null }
  } catch (err) {
    console.error(`[AdminClient] Failed to update customer ${userId}:`, err)
    return { data: null, error: err }
  }
}

/**
 * Delete customer (including auth)
 */
export async function deleteCustomer(userId: string): Promise<boolean> {
  try {
    // Delete from customers table
    const { error: customerError } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', userId)

    if (customerError) throw customerError

    // Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) throw authError

    console.log(`[AdminClient] ✓ Deleted customer ${userId}`)
    return true
  } catch (err) {
    console.error(`[AdminClient] Failed to delete customer ${userId}:`, err)
    return false
  }
}

/**
 * Create wholesale inquiry in database
 */
export async function createWholesaleInquiry(inquiryData: {
  company: string
  contact_name: string
  email: string
  phone: string
  estimated_weight: number
  order_type: string
  frequency: string
  notes: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('wholesale_inquiries')
      .insert({
        ...inquiryData,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    console.log(`[AdminClient] ✓ Created wholesale inquiry: ${inquiryData.company}`)
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to create wholesale inquiry:', err)
    return { data: null, error: err }
  }
}

/**
 * Get all wholesale inquiries
 */
export async function getAllWholesaleInquiries() {
  try {
    const { data, error } = await supabaseAdmin
      .from('wholesale_inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to fetch wholesale inquiries:', err)
    return { data: null, error: err }
  }
}

/**
 * Update wholesale inquiry status
 */
export async function updateWholesaleInquiryStatus(inquiryId: string, status: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('wholesale_inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', inquiryId)
      .select()
      .single()

    if (error) throw error
    console.log(`[AdminClient] ✓ Updated inquiry ${inquiryId} status to ${status}`)
    return { data, error: null }
  } catch (err) {
    console.error(`[AdminClient] Failed to update inquiry ${inquiryId}:`, err)
    return { data: null, error: err }
  }
}

/**
 * Ensure user profile exists in users table
 * Creates a basic profile if user doesn't exist
 */
export async function ensureUserProfile(userId: string, customerData?: { name?: string; email?: string; phone?: string }) {
  try {
    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone')
      .eq('id', userId)
      .maybeSingle()

    if (existingUser) {
      console.log('[AdminClient] User profile already exists:', userId)
      // If profile exists but has no name/email/phone, update it with provided data
      if (customerData && (!existingUser.name || existingUser.name === 'Customer')) {
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            ...(customerData.name && { name: customerData.name }),
            ...(customerData.email && { email: customerData.email }),
            ...(customerData.phone && { phone: customerData.phone }),
          })
          .eq('id', userId)
        
        if (updateError) {
          console.warn('[AdminClient] Error updating user profile:', updateError)
        } else {
          console.log('[AdminClient] ✓ Updated user profile with customer data:', userId)
        }
      }
      return existingUser
    }

    // User doesn't exist, create a basic profile with customer data if provided
    console.log('[AdminClient] Creating user profile for:', userId)
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        name: customerData?.name || 'Customer',
        email: customerData?.email || '',
        phone: customerData?.phone || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.warn('[AdminClient] Error creating user profile:', error)
      return null
    }

    console.log('[AdminClient] ✓ Created user profile:', userId)
    return newUser
  } catch (err) {
    console.error('[AdminClient] Exception in ensureUserProfile:', err)
    return null
  }
}

/**
 * Create order in database
 */
export async function createOrder(orderData: {
  user_id: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  weight?: number | string
  service_type: string
  total_price: number
  status?: string
  pickup_date?: string
  delivery_date?: string
  notes?: string
  pickupAddress?: string
  deliveryAddress?: string
  delivery_speed?: string
  protection_plan?: string
  bagCount?: number
  oversizedItems?: number
  pickupSpot?: string
  pickupInstructions?: string
  detergent?: string
  delicateCycle?: boolean
  returnsOnHangers?: boolean
  additionalRequests?: string
  deliveryInstructions?: string
  hangDry?: boolean
  addOns?: {
    hangDry?: boolean
    delicatesCare?: boolean
    comforterService?: boolean
    stainTreatment?: boolean
  }
}) {
  try {
    const {
      user_id,
      service_type,
      total_price,
      weight,
      bagCount,
      pickupAddress,
      deliveryAddress,
      delivery_speed,
      protection_plan,
      notes,
      pickupSpot,
      pickupInstructions,
      detergent,
      delicateCycle,
      returnsOnHangers,
      additionalRequests,
      deliveryInstructions,
      hangDry,
      addOns,
      customerName,
      customerEmail,
      customerPhone,
    } = orderData

    // Ensure user profile exists with customer data (create if missing, update if incomplete)
    await ensureUserProfile(user_id, {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    })

    // Calculate weight from bagCount if not provided
    const calculatedWeight = weight ? parseFloat(weight.toString()) : (bagCount || 0) * 10

    // Prepare the order data for the orders table
    const orderRecord: any = {
      user_id,
      total_price: parseFloat(total_price.toString()),
      status: 'confirmed',
      // created_at and updated_at will be set by database defaults
    }

    // Add optional fields if they exist (only columns that exist in schema)
    if (pickupAddress) orderRecord.pickup_address = pickupAddress
    if (deliveryAddress) orderRecord.delivery_address = deliveryAddress
    if (notes) orderRecord.notes = notes
    
    // Add booking preference fields
    if (pickupSpot) orderRecord.pickup_spot = pickupSpot
    if (pickupInstructions) orderRecord.pickup_instructions = pickupInstructions
    if (detergent) orderRecord.detergent = detergent
    if (delicateCycle !== undefined) orderRecord.delicate_cycle = delicateCycle
    if (returnsOnHangers !== undefined) orderRecord.returns_on_hangers = returnsOnHangers
    if (additionalRequests) orderRecord.additional_requests = additionalRequests
    if (deliveryInstructions) orderRecord.delivery_instructions = deliveryInstructions
    if (hangDry !== undefined) orderRecord.hang_dry = hangDry
    
    // Store booking details in items JSON column
    const bookingDetails = {
      weight: calculatedWeight,
      bagCount: bagCount || Math.ceil(calculatedWeight / 10),
      service_type,
      delivery_speed,
      protection_plan,
      addOns
    }
    
    orderRecord.items = JSON.stringify(bookingDetails)

    console.log('[AdminClient] Creating order:', {
      user_id,
      total_price,
      weight: calculatedWeight,
      bagCount,
      service_type,
      delivery_speed,
      protection_plan,
    })

    // Create the order
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(orderRecord)
      .select()
      .single()

    if (error) throw error
    
    console.log(`[AdminClient] ✓ Created order ${data.id} for user ${user_id}`)
    console.log(`[AdminClient] Order details - Weight: ${calculatedWeight}kg, Price: $${total_price}`)
    
    // Create a pro_job record so pros can see this as an available job
    if (data && data.id) {
      const { error: jobError } = await supabaseAdmin
        .from('pro_jobs')
        .insert({
          order_id: data.id,
          status: 'available',
          posted_at: new Date().toISOString()
        })
      
      if (jobError) {
        console.error('[AdminClient] Failed to create pro_job for order:', jobError)
        // Don't throw - the order was created successfully, job creation is secondary
      } else {
        console.log(`[AdminClient] ✓ Created available job for order ${data.id}`)
      }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to create order:', err)
    return { data: null, error: err }
  }
}

/**
 * Get all orders
 */
export async function getAllOrders(filters?: { status?: string; customerId?: string }) {
  try {
    let query = supabaseAdmin.from('orders').select('*')

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to fetch orders:', err)
    return { data: null, error: err }
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    console.log(`[AdminClient] ✓ Updated order ${orderId} status to ${status}`)
    return { data, error: null }
  } catch (err) {
    console.error(`[AdminClient] Failed to update order ${orderId}:`, err)
    return { data: null, error: err }
  }
}

/**
 * Update order with multiple fields
 */
export async function updateOrder(orderId: string, updates: any) {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    console.log(`[AdminClient] ✓ Updated order ${orderId}`)
    return { data, error: null }
  } catch (err) {
    console.error(`[AdminClient] Failed to update order ${orderId}:`, err)
    return { data: null, error: err }
  }
}

/**
 * Create or update admin notification
 */
export async function sendAdminNotification(notification: {
  recipient_id: string
  title: string
  message: string
  type: 'order' | 'inquiry' | 'payment' | 'user' | 'system'
  related_id?: string
  data?: Record<string, any>
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_notifications')
      .insert({
        ...notification,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    console.log(`[AdminClient] ✓ Sent admin notification to ${notification.recipient_id}`)
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to send admin notification:', err)
    return { data: null, error: err }
  }
}

/**
 * Get admin notifications
 */
export async function getAdminNotifications(adminId: string, unreadOnly = false) {
  try {
    let query = supabaseAdmin
      .from('admin_notifications')
      .select('*')
      .eq('recipient_id', adminId)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to fetch admin notifications:', err)
    return { data: null, error: err }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('admin_notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to mark notification as read:', err)
    return { error: err }
  }
}

// ============================================
// BUSINESS ACCOUNTS FUNCTIONS
// ============================================

/**
 * Create business account
 */
export async function createBusinessAccount(customerId: string, accountData: {
  company_name: string
  abn: string
  business_type: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .insert({
        customer_id: customerId,
        ...accountData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    console.log(`[AdminClient] ✓ Created business account for ${customerId}`)
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to create business account:', err)
    return { data: null, error: err }
  }
}

/**
 * Get business account by customer ID
 */
export async function getBusinessAccount(customerId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to get business account:', err)
    return { data: null, error: err }
  }
}

/**
 * Update business account
 */
export async function updateBusinessAccount(accountId: string, updates: Record<string, any>) {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to update business account:', err)
    return { data: null, error: err }
  }
}

// ============================================
// NOTIFICATIONS FUNCTIONS
// ============================================

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: string, unreadOnly = false) {
  try {
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to get notifications:', err)
    return { data: null, error: err }
  }
}

/**
 * Create notification
 */
export async function createNotification(userId: string, notificationData: {
  title: string
  body: string
  type: string
  data?: Record<string, any>
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        ...notificationData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to create notification:', err)
    return { data: null, error: err }
  }
}

/**
 * Mark user notification as read
 */
export async function markUserNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to mark notification as read:', err)
    return { error: err }
  }
}

/**
 * Archive notification
 */
export async function archiveNotification(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ archived: true })
      .eq('id', notificationId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to archive notification:', err)
    return { error: err }
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to delete notification:', err)
    return { error: err }
  }
}

// ============================================
// EMPLOYEE PAYOUTS FUNCTIONS
// ============================================

/**
 * Get employee payout info
 */
export async function getEmployeePayout(employeeId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_payouts')
      .select('*')
      .eq('employee_id', employeeId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to get payout info:', err)
    return { data: null, error: err }
  }
}

/**
 * Create or initialize payout record
 */
export async function initializeEmployeePayout(employeeId: string) {
  try {
    const existing = await getEmployeePayout(employeeId)
    if (existing.data) return { data: existing.data, error: null }

    const { data, error } = await supabaseAdmin
      .from('employee_payouts')
      .insert({
        employee_id: employeeId,
        amount: 0,
        pending_amount: 0,
        total_earned: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to initialize payout:', err)
    return { data: null, error: err }
  }
}

/**
 * Update payout bank account
 */
export async function updatePayoutBankAccount(payoutId: string, bankInfo: {
  bank_account_number: string
  bsb: string
  account_holder_name: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_payouts')
      .update({ ...bankInfo, updated_at: new Date().toISOString() })
      .eq('id', payoutId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to update bank account:', err)
    return { data: null, error: err }
  }
}

/**
 * Request payout
 */
export async function requestPayout(payoutId: string, amount: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_payouts')
      .update({
        status: 'requested',
        amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payoutId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to request payout:', err)
    return { data: null, error: err }
  }
}

// ============================================
// EMPLOYEE AVAILABILITY FUNCTIONS
// ============================================

/**
 * Get employee availability
 */
export async function getEmployeeAvailability(employeeId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employeeId)
      .order('day_of_week', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to get availability:', err)
    return { data: null, error: err }
  }
}

/**
 * Create or update availability slot
 */
export async function setAvailability(employeeId: string, availabilityData: {
  day_of_week: string
  start_time: string
  end_time: string
  is_available: boolean
}) {
  try {
    // Check if slot exists
    const { data: existing } = await supabaseAdmin
      .from('employee_availability')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('day_of_week', availabilityData.day_of_week)
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('employee_availability')
        .update({ ...availabilityData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('employee_availability')
        .insert({
          employee_id: employeeId,
          ...availabilityData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }
  } catch (err) {
    console.error('[AdminClient] Failed to set availability:', err)
    return { data: null, error: err }
  }
}

/**
 * Delete availability slot
 */
export async function deleteAvailability(availabilityId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('employee_availability')
      .delete()
      .eq('id', availabilityId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to delete availability:', err)
    return { error: err }
  }
}

// ============================================
// EMPLOYEE DOCUMENTS FUNCTIONS
// ============================================

/**
 * Get employee documents
 */
export async function getEmployeeDocuments(employeeId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId)

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to get documents:', err)
    return { data: null, error: err }
  }
}

/**
 * Upload employee document
 */
export async function uploadEmployeeDocument(employeeId: string, documentData: {
  document_type: string
  document_url: string
  document_name: string
  expires_at?: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        ...documentData,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to upload document:', err)
    return { data: null, error: err }
  }
}

/**
 * Verify document
 */
export async function verifyDocument(documentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_documents')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to verify document:', err)
    return { data: null, error: err }
  }
}

/**
 * Reject document
 */
export async function rejectDocument(documentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('employee_documents')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to reject document:', err)
    return { data: null, error: err }
  }
}

/**
 * Delete document
 */
export async function deleteDocument(documentId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('employee_documents')
      .delete()
      .eq('id', documentId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.error('[AdminClient] Failed to delete document:', err)
    return { error: err }
  }
}

export default supabaseAdmin
