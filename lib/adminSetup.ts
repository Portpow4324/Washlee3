import { supabase } from '@/lib/supabaseClient'

/**
 * Admin Configuration
 * Set your admin email here - this user will have full privileges
 */
const ADMIN_EMAIL = 'lukaverde6@gmail.com'

/**
 * Admin error logger - logs to Supabase for audit trail
 */
async function logAdminAction(action: string, details: any, status: 'success' | 'failed', errorMsg?: string) {
  try {
    await supabase
      .from('admin_logs')
      .insert([{
        action,
        details: JSON.stringify(details),
        status,
        error_message: errorMsg,
        source: 'adminSetup.ts',
        created_at: new Date().toISOString(),
      }])
  } catch (e) {
    console.error('Failed to log admin action:', e)
  }
}

/**
 * Set up an admin user with full Supabase access
 * This includes is_admin flag and admin logs
 */
export async function setupAdminUser(uid: string, email: string, name: string) {
  const startTime = Date.now()
  try {
    console.log(`[ADMIN] Setting up admin user: ${email}`)

    // Validate input
    if (!uid || !email || !name) {
      throw new Error('Missing required fields: uid, email, name')
    }

    // Update user to be admin
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_admin: true,
          user_type: 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid)

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      console.log(`[ADMIN] ✓ User updated to admin in Supabase`)
    } catch (dbError: any) {
      console.error(`[ADMIN] ✗ Failed to update user:`, dbError.message)
      await logAdminAction('setupAdminUser', { uid, email }, 'failed', dbError.message)
      throw new Error(`Database error: ${dbError.message}`)
    }

    const duration = Date.now() - startTime
    const successMsg = `Admin user setup complete: ${email}`
    console.log(`[ADMIN] ✅ ${successMsg} [${duration}ms]`)
    await logAdminAction('setupAdminUser', { uid, email, duration }, 'success')
    
    return { success: true, message: successMsg, isAdmin: true }
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    console.error(`[ADMIN] ❌ Error setting up admin user: ${errorMsg}`)
    await logAdminAction('setupAdminUser', { uid, email }, 'failed', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Make a specific user an admin
 */
export async function grantAdminByEmail(uid: string) {
  const startTime = Date.now()
  try {
    console.log(`[ADMIN] Granting admin privileges to ${uid}`)

    if (!uid) {
      throw new Error('Missing UID')
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_admin: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid)

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      console.log(`[ADMIN] ✓ Supabase updated`)
    } catch (dbError: any) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    const duration = Date.now() - startTime
    console.log(`[ADMIN] ✅ Admin privileges granted to ${uid} [${duration}ms]`)
    await logAdminAction('grantAdminByEmail', { uid, duration }, 'success')
    return { success: true }
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    console.error(`[ADMIN] ❌ Error granting admin:`, errorMsg)
    await logAdminAction('grantAdminByEmail', { uid }, 'failed', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    if (!uid) return false
    
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', uid)
      .single()

    if (error || !data) {
      console.log(`[ADMIN] Admin check failed for ${uid}`)
      return false
    }

    const isAdmin = data.is_admin === true
    console.log(`[ADMIN] Admin check for ${uid}: ${isAdmin}`)
    return isAdmin
  } catch (error) {
    console.error(`[ADMIN] Error checking admin status for ${uid}:`, error)
    return false
  }
}

/**
 * Get admin configuration
 */
export function getAdminEmail(): string {
  return ADMIN_EMAIL
}

/**
 * Check if email should be admin
 */
export function isAdminEmailConfigured(email: string): boolean {
  return email === ADMIN_EMAIL
}

/**
 * List all admins in the system
 */
export async function listAllAdmins() {
  try {
    console.log('[ADMIN] Fetching all admin users...')
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_admin', true)

    if (error) {
      throw new Error(error.message)
    }

    if (!data || data.length === 0) {
      console.log('[ADMIN] No admins found')
      return []
    }

    const admins = data.map((doc: any) => ({
      id: doc.id,
      email: doc.email,
      name: doc.name,
      created_at: doc.created_at,
      user_type: doc.user_type,
    }))

    console.log(`[ADMIN] ✓ Found ${admins.length} admin(s)`)
    await logAdminAction('listAllAdmins', { count: admins.length }, 'success')
    return admins
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    console.error(`[ADMIN] ❌ Error listing admins: ${errorMsg}`)
    await logAdminAction('listAllAdmins', {}, 'failed', errorMsg)
    return []
  }
}

/**
 * Remove admin access from a user
 */
export async function removeAdminAccess(uid: string) {
  const startTime = Date.now()
  try {
    console.log(`[ADMIN] Removing admin access from ${uid}`)

    if (!uid) {
      throw new Error('Missing UID')
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_admin: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid)

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      console.log(`[ADMIN] ✓ Supabase updated`)
    } catch (dbError: any) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    const duration = Date.now() - startTime
    console.log(`[ADMIN] ✅ Admin access removed from ${uid} [${duration}ms]`)
    await logAdminAction('removeAdminAccess', { uid, duration }, 'success')
    return { success: true }
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    console.error(`[ADMIN] ❌ Error removing admin access: ${errorMsg}`)
    await logAdminAction('removeAdminAccess', { uid }, 'failed', errorMsg)
    return { success: false, error: errorMsg }
  }
}
