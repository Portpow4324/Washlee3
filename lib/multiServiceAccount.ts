import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Admin Service Account Manager
 * Unified service for admin operations using Supabase
 */

// Create service role client for admin operations
export const adminClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Set admin privileges for a user
 */
export async function setAdminClaims(
  uid: string
) {
  try {
    // Update user's is_admin field in users table
    const { error } = await adminClient
      .from('users')
      .update({ is_admin: true })
      .eq('id', uid)

    if (error) {
      throw error
    }

    console.log(`✅ Admin status set for ${uid}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to set admin claims:`, error)
    throw error
  }
}

/**
 * Create or update admin user document
 */
export async function createAdminUser(
  uid: string,
  email: string,
  name: string
) {
  try {
    const { error } = await adminClient
      .from('users')
      .update({
        is_admin: true,
        admin_role: 'super_admin',
        user_type: 'admin',
        admin_since: new Date().toISOString(),
        subscription: {
          plan: 'none',
          status: 'inactive'
        },
        permissions: {
          can_view_analytics: true,
          can_manage_users: true,
          can_manage_orders: true,
          can_view_payments: true,
          can_manage_plans: true,
          can_view_logs: true
        }
      })
      .eq('id', uid)

    if (error) {
      throw error
    }

    console.log(`✅ Admin user document created for ${email}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to create admin user:`, error)
    throw error
  }
}

/**
 * Promote an existing user to admin
 */
export async function promoteToAdmin(
  uid: string,
  email: string
) {
  try {
    // Set custom claims
    await setAdminClaims(uid)

    // Create admin document
    await createAdminUser(uid, email, email.split('@')[0])

    console.log(`✅ User ${email} promoted to admin`)
    return true
  } catch (error) {
    console.error(`❌ Failed to promote user:`, error)
    throw error
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(
  uid: string
): Promise<boolean> {
  try {
    const { data, error } = await adminClient
      .from('users')
      .select('is_admin')
      .eq('id', uid)
      .single()

    if (error) {
      throw error
    }

    return data?.is_admin === true
  } catch (error) {
    console.error(`❌ Failed to check admin status:`, error)
    return false
  }
}

/**
 * List all admins in the system
 */
export async function listAllAdmins() {
  try {
    const { data, error } = await adminClient
      .from('users')
      .select('id, email, name, is_admin, admin_role, admin_since')
      .eq('is_admin', true)

    if (error) {
      throw error
    }

    const admins = data || []
    console.log(`📋 Found ${admins.length} admins`)
    return admins
  } catch (error) {
    console.error(`❌ Failed to list admins:`, error)
    throw error
  }
}

/**
 * Remove admin privileges
 */
export async function removeAdminAccess(
  uid: string
) {
  try {
    const { error } = await adminClient
      .from('users')
      .update({
        is_admin: false,
        admin_role: null,
        user_type: 'customer'
      })
      .eq('id', uid)

    if (error) {
      throw error
    }

    console.log(`✅ Admin access removed for ${uid}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to remove admin access:`, error)
    throw error
  }
}

/**
 * Test connection to Supabase admin client
 */
export async function testServiceAccountConnections() {
  console.log('🧪 Testing Supabase admin connection...\n')

  try {
    // Test admin client by fetching users
    const { data, error } = await adminClient
      .from('users')
      .select('id')
      .limit(1)

    if (error) {
      throw error
    }

    console.log('✅ Supabase admin connection working\n')
    return true
  } catch (error) {
    console.error('❌ Supabase admin connection failed:', error, '\n')
    return false
  }
}
