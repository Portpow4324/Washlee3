/**
 * Supabase Admin Data Sync Service
 * Handles syncing data between Supabase and admin panel
 * Supports: real-time listeners, bulk import, field mapping
 */

import { supabase } from './supabaseClient'

// ============================================
// TYPES
// ============================================

export interface SyncCollection {
  name: string
  supabaseTable: string
  fields: Record<string, string> // Map of admin field -> supabase field
}

export interface SyncResult {
  collection: string
  imported: number
  updated: number
  deleted: number
  errors: string[]
}

// ============================================
// COLLECTION MAPPINGS
// ============================================

export const ADMIN_COLLECTIONS = {
  USERS: {
    name: 'Users',
    supabaseTable: 'users',
    fields: {
      id: 'id',
      email: 'email',
      fullName: 'name',
      phone: 'phone',
      userType: 'user_type',
      isAdmin: 'is_admin',
      isEmployee: 'is_employee',
      profilePictureUrl: 'profile_picture_url',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  CUSTOMERS: {
    name: 'Customers',
    supabaseTable: 'customers',
    fields: {
      id: 'id',
      subscriptionActive: 'subscription_active',
      subscriptionPlan: 'subscription_plan',
      subscriptionStatus: 'subscription_status',
      paymentStatus: 'payment_status',
      deliveryAddress: 'delivery_address',
      preferences: 'preferences',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  EMPLOYEES: {
    name: 'Employees',
    supabaseTable: 'employees',
    fields: {
      id: 'id',
      rating: 'rating',
      totalReviews: 'total_reviews',
      completedOrders: 'completed_orders',
      earnings: 'earnings',
      availabilityStatus: 'availability_status',
      serviceAreas: 'service_areas',
      bankAccount: 'bank_account',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  ORDERS: {
    name: 'Orders',
    supabaseTable: 'orders',
    fields: {
      id: 'id',
      userId: 'user_id',
      status: 'status',
      items: 'items',
      totalPrice: 'total_price',
      deliveryAddress: 'delivery_address',
      pickupAddress: 'pickup_address',
      scheduledPickupDate: 'scheduled_pickup_date',
      scheduledDeliveryDate: 'scheduled_delivery_date',
      actualPickupDate: 'actual_pickup_date',
      actualDeliveryDate: 'actual_delivery_date',
      proId: 'pro_id',
      trackingCode: 'tracking_code',
      notes: 'notes',
      washClubCreditsApplied: 'wash_club_credits_applied',
      tierDiscount: 'tier_discount',
      creditsEarned: 'credits_earned',
      tierAtOrderTime: 'tier_at_order_time',
      reviewed: 'reviewed',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  WASH_CLUBS: {
    name: 'Wash Club Members',
    supabaseTable: 'wash_clubs',
    fields: {
      id: 'id',
      userId: 'user_id',
      cardNumber: 'card_number',
      tier: 'tier',
      creditsBalance: 'credits_balance',
      earnedCredits: 'earned_credits',
      redeemedCredits: 'redeemed_credits',
      totalSpend: 'total_spend',
      status: 'status',
      emailVerified: 'email_verified',
      termsAccepted: 'terms_accepted',
      termsAcceptedAt: 'terms_accepted_at',
      joinDate: 'join_date',
      lastUpdated: 'last_updated',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  WASH_CLUB_TRANSACTIONS: {
    name: 'Wash Club Transactions',
    supabaseTable: 'wash_club_transactions',
    fields: {
      id: 'id',
      userId: 'user_id',
      washClubId: 'wash_club_id',
      type: 'type',
      amount: 'amount',
      description: 'description',
      orderId: 'order_id',
      tierLevel: 'tier_level',
      balanceBefore: 'balance_before',
      balanceAfter: 'balance_after',
      createdAt: 'created_at'
    }
  },
  REVIEWS: {
    name: 'Reviews',
    supabaseTable: 'reviews',
    fields: {
      id: 'id',
      orderId: 'order_id',
      customerId: 'customer_id',
      proId: 'pro_id',
      rating: 'rating',
      title: 'title',
      comment: 'comment',
      categories: 'categories',
      status: 'status',
      moderationNotes: 'moderation_notes',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  INQUIRIES: {
    name: 'Support Tickets',
    supabaseTable: 'inquiries',
    fields: {
      id: 'id',
      type: 'type',
      userId: 'user_id',
      email: 'email',
      name: 'name',
      phone: 'phone',
      companyName: 'company_name',
      inquiryType: 'inquiry_type',
      message: 'message',
      status: 'status',
      adminNotes: 'admin_notes',
      submittedAt: 'submitted_at',
      updatedAt: 'updated_at'
    }
  },
  TRANSACTIONS: {
    name: 'Transactions',
    supabaseTable: 'transactions',
    fields: {
      id: 'id',
      userId: 'user_id',
      orderId: 'order_id',
      type: 'type',
      amount: 'amount',
      currency: 'currency',
      status: 'status',
      paymentMethod: 'payment_method',
      stripeTransactionId: 'stripe_transaction_id',
      description: 'description',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  VERIFICATION_CODES: {
    name: 'Verification Codes',
    supabaseTable: 'verification_codes',
    fields: {
      id: 'id',
      userId: 'user_id',
      type: 'type',
      code: 'code',
      verified: 'verified',
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

/**
 * Fetch all data from a Supabase table
 */
export async function fetchCollectionData(table: string, limit?: number) {
  try {
    let query = supabase.from(table).select('*')
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error(`[AdminSync] Error fetching ${table}:`, error)
      return { data: [], count: 0, error: error.message }
    }
    
    console.log(`[AdminSync] Fetched ${data?.length || 0} records from ${table}`)
    return { data: data || [], count: count || 0, error: null }
  } catch (err: any) {
    console.error(`[AdminSync] Exception fetching ${table}:`, err)
    return { data: [], count: 0, error: err.message }
  }
}

/**
 * Fetch data with filtering
 */
export async function fetchFilteredCollection(
  table: string,
  filters: { column: string; value: any; operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' }[],
  limit?: number
) {
  try {
    let query = supabase.from(table).select('*')
    
    for (const filter of filters) {
      const op = filter.operator || 'eq'
      if (op === 'eq') query = query.eq(filter.column, filter.value)
      else if (op === 'neq') query = query.neq(filter.column, filter.value)
      else if (op === 'gt') query = query.gt(filter.column, filter.value)
      else if (op === 'gte') query = query.gte(filter.column, filter.value)
      else if (op === 'lt') query = query.lt(filter.column, filter.value)
      else if (op === 'lte') query = query.lte(filter.column, filter.value)
      else if (op === 'like') query = query.like(filter.column, filter.value)
      else if (op === 'in') query = query.in(filter.column, filter.value)
    }
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error(`[AdminSync] Error fetching filtered ${table}:`, error)
      return { data: [], error: error.message }
    }
    
    return { data: data || [], error: null }
  } catch (err: any) {
    console.error(`[AdminSync] Exception fetching filtered ${table}:`, err)
    return { data: [], error: err.message }
  }
}

/**
 * Get count of records in table
 */
export async function getCollectionCount(table: string) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error(`[AdminSync] Error counting ${table}:`, error)
      return 0
    }
    
    return count || 0
  } catch (err: any) {
    console.error(`[AdminSync] Exception counting ${table}:`, err)
    return 0
  }
}

/**
 * Get sum of a numeric column
 */
export async function getCollectionSum(table: string, column: string) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
    
    if (error) {
      console.error(`[AdminSync] Error summing ${table}.${column}:`, error)
      return 0
    }
    
    return (data || []).reduce((sum: number, row: any) => sum + (row[column] || 0), 0)
  } catch (err: any) {
    console.error(`[AdminSync] Exception summing ${table}.${column}:`, err)
    return 0
  }
}

/**
 * Get average of a numeric column
 */
export async function getCollectionAverage(table: string, column: string) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
    
    if (error) {
      console.error(`[AdminSync] Error averaging ${table}.${column}:`, error)
      return 0
    }
    
    const records = data || []
    if (records.length === 0) return 0
    
    const sum = records.reduce((acc: number, row: any) => acc + (row[column] || 0), 0)
    return sum / records.length
  } catch (err: any) {
    console.error(`[AdminSync] Exception averaging ${table}.${column}:`, err)
    return 0
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to real-time changes in a table
 */
export function subscribeToCollection(
  table: string,
  callback: (payload: any) => void,
  filter?: { column: string; value: any }
) {
  let subscription = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
      },
      (payload: any) => {
        console.log(`[AdminSync] Change detected in ${table}:`, payload)
        callback(payload)
      }
    )
    .subscribe()
  
  return subscription
}

/**
 * Unsubscribe from real-time changes
 */
export async function unsubscribeFromCollection(subscription: any) {
  if (subscription) {
    await supabase.removeChannel(subscription)
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Bulk insert or update records
 */
export async function bulkUpsertCollection(
  table: string,
  records: any[],
  conflictColumn: string = 'id'
) {
  try {
    if (records.length === 0) return { inserted: 0, updated: 0, errors: [] }
    
    const { error, data } = await supabase
      .from(table)
      .upsert(records, { onConflict: conflictColumn })
      .select()
    
    if (error) {
      console.error(`[AdminSync] Error upserting to ${table}:`, error)
      return { inserted: 0, updated: 0, errors: [error.message] }
    }
    
    return { inserted: data?.length || 0, updated: 0, errors: [] }
  } catch (err: any) {
    console.error(`[AdminSync] Exception upserting to ${table}:`, err)
    return { inserted: 0, updated: 0, errors: [err.message] }
  }
}

/**
 * Delete records by filter
 */
export async function deleteFilteredRecords(
  table: string,
  filters: { column: string; value: any }[]
) {
  try {
    let query = supabase.from(table).delete()
    
    for (const filter of filters) {
      query = query.eq(filter.column, filter.value)
    }
    
    const { error, count } = await query
    
    if (error) {
      console.error(`[AdminSync] Error deleting from ${table}:`, error)
      return { deleted: 0, error: error.message }
    }
    
    return { deleted: count || 0, error: null }
  } catch (err: any) {
    console.error(`[AdminSync] Exception deleting from ${table}:`, err)
    return { deleted: 0, error: err.message }
  }
}

// ============================================
// AGGREGATION & METRICS
// ============================================

/**
 * Get dashboard metrics
 */
export async function getDashboardMetrics() {
  try {
    const metrics = {
      totalUsers: await getCollectionCount('users'),
      totalOrders: await getCollectionCount('orders'),
      totalRevenue: await getCollectionSum('orders', 'total_price'),
      activeOrders: 0,
      completedOrders: 0,
      averageOrderValue: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      refundRate: 0,
      averageRating: 0
    }
    
    // Calculate active orders
    const { data: orders } = await supabase
      .from('orders')
      .select('status, total_price, created_at')
    
    if (orders) {
      metrics.activeOrders = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status)).length
      metrics.completedOrders = orders.filter((o: any) => o.status === 'delivered').length
      metrics.averageOrderValue = metrics.totalOrders > 0 ? metrics.totalRevenue / metrics.totalOrders : 0
    }
    
    // Calculate active users (users with orders in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('user_id, created_at')
      .gte('created_at', thirtyDaysAgo)
    
    metrics.activeUsers = new Set(recentOrders?.map((o: any) => o.user_id)).size || 0
    
    // Calculate new users this month
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    metrics.newUsersThisMonth = await getCollectionCount('users')
    // This would need proper filtering in real implementation
    
    // Calculate average rating
    metrics.averageRating = await getCollectionAverage('reviews', 'rating')
    
    console.log('[AdminSync] Dashboard metrics calculated:', metrics)
    return metrics
  } catch (err: any) {
    console.error('[AdminSync] Error calculating metrics:', err)
    return {
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      activeOrders: 0,
      completedOrders: 0,
      averageOrderValue: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      refundRate: 0,
      averageRating: 0
    }
  }
}

export default {
  ADMIN_COLLECTIONS,
  fetchCollectionData,
  fetchFilteredCollection,
  getCollectionCount,
  getCollectionSum,
  getCollectionAverage,
  subscribeToCollection,
  unsubscribeFromCollection,
  bulkUpsertCollection,
  deleteFilteredRecords,
  getDashboardMetrics
}
