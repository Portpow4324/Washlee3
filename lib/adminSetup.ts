import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * Admin Configuration
 * Set your admin email here - this user will have full privileges
 */
const ADMIN_EMAIL = 'lukaverde6@gmail.com';

/**
 * Admin error logger - logs to Firestore for audit trail
 */
async function logAdminAction(action: string, details: any, status: 'success' | 'failed', errorMsg?: string) {
  try {
    await adminDb.collection('admin_audit_logs').add({
      timestamp: new Date(),
      action,
      details,
      status,
      errorMessage: errorMsg,
      source: 'adminSetup.ts',
    });
  } catch (e) {
    console.error('Failed to log admin action:', e);
  }
}

/**
 * Set up an admin user with full Firebase Admin SDK access
 * This includes custom claims and Firestore admin flags
 * Supports batch operations and transaction rollback
 */
export async function setupAdminUser(uid: string, email: string, name: string) {
  const startTime = Date.now();
  try {
    console.log(`[ADMIN] Setting up admin user: ${email}`);

    // Validate input
    if (!uid || !email || !name) {
      throw new Error('Missing required fields: uid, email, name');
    }

    // Step 1: Set custom claims on the user
    try {
      await adminAuth.setCustomUserClaims(uid, { admin: true });
      console.log(`[ADMIN] ✓ Custom claims set for ${uid}`);
    } catch (authError: any) {
      console.error(`[ADMIN] ✗ Failed to set custom claims:`, authError.message);
      await logAdminAction('setupAdminUser - setCustomClaims', { uid, email }, 'failed', authError.message);
      throw new Error(`Auth error: ${authError.message}`);
    }

    // Step 2: Create/update admin document in Firestore
    try {
      const adminData = {
        isAdmin: true,
        email,
        name,
        adminRole: 'super_admin',
        userType: 'admin',
        adminSince: new Date(),
        subscription: {
          plan: 'washly',
          status: 'active',
          startDate: new Date().toISOString(),
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        permissions: {
          canManageUsers: true,
          canApproveProUsers: true,
          canManagePayments: true,
          canViewAnalytics: true,
          canCreatePromo: true,
          canHandleDisputes: true,
          canAccessAdminPanel: true,
        },
      };

      await adminDb.collection('users').doc(uid).set(adminData, { merge: true });
      console.log(`[ADMIN] ✓ Firestore document created for ${uid}`);
    } catch (firestoreError: any) {
      console.error(`[ADMIN] ✗ Failed to update Firestore:`, firestoreError.message);
      // Try to rollback auth claims
      try {
        await adminAuth.setCustomUserClaims(uid, { admin: false });
        console.log(`[ADMIN] ⟲ Rolled back auth claims for ${uid}`);
      } catch (e) {
        console.error(`[ADMIN] Failed to rollback:`, e);
      }
      await logAdminAction('setupAdminUser - Firestore', { uid, email }, 'failed', firestoreError.message);
      throw new Error(`Firestore error: ${firestoreError.message}`);
    }

    const duration = Date.now() - startTime;
    const successMsg = `Admin user setup complete: ${email} (super_admin)`;
    console.log(`[ADMIN] ✅ ${successMsg} [${duration}ms]`);
    await logAdminAction('setupAdminUser', { uid, email, duration }, 'success');
    
    return { success: true, message: successMsg, isAdmin: true };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`[ADMIN] ❌ Error setting up admin user: ${errorMsg}`);
    await logAdminAction('setupAdminUser', { uid, email }, 'failed', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Make a specific user an admin
 */
export async function grantAdminByEmail(uid: string) {
  const startTime = Date.now();
  try {
    console.log(`[ADMIN] Granting admin privileges to ${uid}`);

    if (!uid) {
      throw new Error('Missing UID');
    }

    try {
      await adminAuth.setCustomUserClaims(uid, { admin: true });
      console.log(`[ADMIN] ✓ Custom claims granted`);
    } catch (authError: any) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    try {
      await adminDb.collection('users').doc(uid).update({
        isAdmin: true,
        adminSince: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[ADMIN] ✓ Firestore updated`);
    } catch (firestoreError: any) {
      // Rollback auth claims
      await adminAuth.setCustomUserClaims(uid, { admin: false });
      throw new Error(`Firestore error: ${firestoreError.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[ADMIN] ✅ Admin privileges granted to ${uid} [${duration}ms]`);
    await logAdminAction('grantAdminByEmail', { uid, duration }, 'success');
    return { success: true };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`[ADMIN] ❌ Error granting admin:`, errorMsg);
    await logAdminAction('grantAdminByEmail', { uid }, 'failed', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    if (!uid) return false;
    
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const isAdmin = userDoc.data()?.isAdmin === true;
    
    console.log(`[ADMIN] Admin check for ${uid}: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error(`[ADMIN] Error checking admin status for ${uid}:`, error);
    return false;
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(uid: string, permission: string): Promise<boolean> {
  try {
    if (!uid || !permission) return false;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const permissions = userDoc.data()?.permissions || {};
    const hasPermissionFlag = permissions[permission] === true;
    
    if (!hasPermissionFlag) {
      console.warn(`[ADMIN] Permission denied for ${uid}: ${permission}`);
    }
    
    return hasPermissionFlag;
  } catch (error) {
    console.error(`[ADMIN] Error checking permission for ${uid}:`, error);
    return false;
  }
}

/**
 * Get admin configuration
 */
export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}

/**
 * Check if email should be admin
 */
export function isAdminEmailConfigured(email: string): boolean {
  return email === ADMIN_EMAIL;
}

/**
 * List all admins in the system
 */
export async function listAllAdmins() {
  try {
    console.log('[ADMIN] Fetching all admin users...');
    const snapshot = await adminDb.collection('users').where('isAdmin', '==', true).get();
    
    if (snapshot.empty) {
      console.log('[ADMIN] No admins found');
      return [];
    }

    const admins = snapshot.docs.map((doc) => ({
      uid: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      adminSince: doc.data().adminSince?.toDate(),
      adminRole: doc.data().adminRole || 'admin',
    }));

    console.log(`[ADMIN] ✓ Found ${admins.length} admin(s)`);
    await logAdminAction('listAllAdmins', { count: admins.length }, 'success');
    return admins;
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`[ADMIN] ❌ Error listing admins: ${errorMsg}`);
    await logAdminAction('listAllAdmins', {}, 'failed', errorMsg);
    return [];
  }
}

/**
 * Remove admin access from a user (batch safe)
 */
export async function removeAdminAccess(uid: string) {
  const startTime = Date.now();
  try {
    console.log(`[ADMIN] Removing admin access from ${uid}`);

    if (!uid) {
      throw new Error('Missing UID');
    }

    try {
      await adminAuth.setCustomUserClaims(uid, { admin: false });
      console.log(`[ADMIN] ✓ Auth claims revoked`);
    } catch (authError: any) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    try {
      await adminDb.collection('users').doc(uid).update({
        isAdmin: false,
        adminRemovedAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[ADMIN] ✓ Firestore updated`);
    } catch (firestoreError: any) {
      // Rollback auth changes
      await adminAuth.setCustomUserClaims(uid, { admin: true });
      throw new Error(`Firestore error: ${firestoreError.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[ADMIN] ✅ Admin access removed from ${uid} [${duration}ms]`);
    await logAdminAction('removeAdminAccess', { uid, duration }, 'success');
    return { success: true };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`[ADMIN] ❌ Error removing admin access: ${errorMsg}`);
    await logAdminAction('removeAdminAccess', { uid }, 'failed', errorMsg);
    return { success: false, error: errorMsg };
  }
}
