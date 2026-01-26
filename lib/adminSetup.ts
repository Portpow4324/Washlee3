import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * Admin Configuration
 * Set your admin email here - this user will have full privileges
 */
const ADMIN_EMAIL = 'lukaverde6@gmail.com';

/**
 * Set up an admin user with full Firebase Admin SDK access
 * This includes custom claims and Firestore admin flags
 */
export async function setupAdminUser(uid: string, email: string, name: string) {
  try {
    // Set custom claims on the user
    await adminAuth.setCustomUserClaims(uid, { admin: true });

    // Create/update admin document in Firestore
    await adminDb.collection('users').doc(uid).set(
      {
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
      },
      { merge: true }
    );

    console.log(`✅ Admin user setup complete: ${email} (super_admin)`);
    return { success: true, message: 'Admin setup complete', isAdmin: true };
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Make a specific user an admin
 */
export async function grantAdminByEmail(uid: string) {
  try {
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    await adminDb.collection('users').doc(uid).update({
      isAdmin: true,
      adminSince: new Date(),
    });
    console.log(`✅ Admin privileges granted to ${uid}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error granting admin:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    return userDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(uid: string, permission: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const permissions = userDoc.data()?.permissions || {};
    return permissions[permission] === true;
  } catch (error) {
    console.error('Error checking permission:', error);
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
    const snapshot = await adminDb.collection('users').where('isAdmin', '==', true).get();
    const admins = snapshot.docs.map((doc) => ({
      uid: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      adminSince: doc.data().adminSince?.toDate(),
    }));
    return admins;
  } catch (error) {
    console.error('Error listing admins:', error);
    return [];
  }
}

/**
 * Remove admin access from a user
 */
export async function removeAdminAccess(uid: string) {
  try {
    await adminAuth.setCustomUserClaims(uid, { admin: false });
    await adminDb.collection('users').doc(uid).update({
      isAdmin: false,
      adminRemovedAt: new Date(),
    });
    console.log(`✅ Admin access removed from ${uid}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing admin access:', error);
    return { success: false, error: String(error) };
  }
}
