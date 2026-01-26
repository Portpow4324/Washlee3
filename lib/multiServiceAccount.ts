import { adminAuth, adminDb, secondaryAuth, secondaryDb } from '@/lib/firebaseAdmin';

/**
 * Multi-Service Account Manager
 * Provides utilities to work with both primary (fbsvc) and secondary (lukaverde) service accounts
 */

export type ServiceAccountType = 'primary' | 'secondary';

/**
 * Get auth instance for the specified service account
 */
export function getAuth(accountType: ServiceAccountType = 'primary') {
  return accountType === 'secondary' ? secondaryAuth() : adminAuth;
}

/**
 * Get Firestore instance for the specified service account
 */
export function getDatabase(accountType: ServiceAccountType = 'primary') {
  return accountType === 'secondary' ? secondaryDb() : adminDb;
}

/**
 * Set admin privileges via the specified service account
 */
export async function setAdminClaims(
  uid: string,
  accountType: ServiceAccountType = 'primary'
) {
  try {
    const auth = getAuth(accountType);
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log(
      `✅ Admin claims set for ${uid} via ${accountType} service account`
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to set admin claims via ${accountType} account:`,
      error
    );
    throw error;
  }
}

/**
 * Create or update admin user document
 */
export async function createAdminUser(
  uid: string,
  email: string,
  name: string,
  accountType: ServiceAccountType = 'primary'
) {
  try {
    const db = getDatabase(accountType);
    await db.collection('users').doc(uid).set(
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
        },
        permissions: {
          canViewAnalytics: true,
          canManageUsers: true,
          canManageOrders: true,
          canViewPayments: true,
          canManagePlans: true,
          canViewLogs: true,
        },
      },
      { merge: true }
    );
    console.log(
      `✅ Admin user document created for ${email} via ${accountType} account`
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to create admin user via ${accountType} account:`,
      error
    );
    throw error;
  }
}

/**
 * Promote an existing user to admin
 */
export async function promoteToAdmin(
  uid: string,
  email: string,
  accountType: ServiceAccountType = 'primary'
) {
  try {
    // Set custom claims
    await setAdminClaims(uid, accountType);

    // Create admin document
    await createAdminUser(uid, email, email.split('@')[0], accountType);

    console.log(
      `✅ User ${email} promoted to admin via ${accountType} account`
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to promote user via ${accountType} account:`,
      error
    );
    throw error;
  }
}

/**
 * Check if user is admin (using Firestore document)
 */
export async function isUserAdmin(
  uid: string,
  accountType: ServiceAccountType = 'primary'
): Promise<boolean> {
  try {
    const db = getDatabase(accountType);
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.exists && userDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error(`❌ Failed to check admin status via ${accountType}:`, error);
    return false;
  }
}

/**
 * List all admins in the system
 */
export async function listAllAdmins(accountType: ServiceAccountType = 'primary') {
  try {
    const db = getDatabase(accountType);
    const snapshot = await db
      .collection('users')
      .where('isAdmin', '==', true)
      .get();

    const admins = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    console.log(`📋 Found ${admins.length} admins via ${accountType} account`);
    return admins;
  } catch (error) {
    console.error(
      `❌ Failed to list admins via ${accountType} account:`,
      error
    );
    throw error;
  }
}

/**
 * Remove admin privileges
 */
export async function removeAdminAccess(
  uid: string,
  accountType: ServiceAccountType = 'primary'
) {
  try {
    const auth = getAuth(accountType);
    const db = getDatabase(accountType);

    // Remove custom claims
    await auth.setCustomUserClaims(uid, { admin: false });

    // Update Firestore document
    await db.collection('users').doc(uid).update({
      isAdmin: false,
      adminRole: 'none',
      userType: 'customer',
    });

    console.log(
      `✅ Admin access removed for ${uid} via ${accountType} account`
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to remove admin access via ${accountType}:`,
      error
    );
    throw error;
  }
}

/**
 * Test connection to both service accounts
 */
export async function testServiceAccountConnections() {
  console.log('🧪 Testing service account connections...\n');

  try {
    // Test primary
    console.log('Testing Primary Account (fbsvc):');
    await adminAuth.listUsers(1);
    console.log('✅ Primary account authentication working\n');
  } catch (error) {
    console.error('❌ Primary account failed:', error, '\n');
  }

  try {
    // Test secondary
    console.log('Testing Secondary Account (lukaverde):');
    await secondaryAuth().listUsers(1);
    console.log('✅ Secondary account authentication working\n');
  } catch (error) {
    console.error('❌ Secondary account failed:', error, '\n');
  }

  console.log('✨ Service account test complete');
}
