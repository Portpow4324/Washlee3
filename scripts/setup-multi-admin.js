#!/usr/bin/env node

/**
 * Setup Multiple Admin Service Accounts Script
 * This script sets up both Firebase Admin SDK service accounts with admin privileges
 * 
 * Usage:
 *   node scripts/setup-multi-admin.js <uid> <email> [name]
 * 
 * Example:
 *   node scripts/setup-multi-admin.js JernxHaYRxSk9RbLQSkSiGeCxfa2 lukaverde6@gmail.com "Luka Verde"
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const admin = require('firebase-admin');

// Initialize both service accounts
function initializeBothAccounts() {
  // Primary account (fbsvc)
  if (!admin.apps.length) {
    const primaryServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(primaryServiceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  }

  // Secondary account (lukaverde)
  const secondaryServiceAccount = {
    projectId: process.env.FIREBASE_SECONDARY_PROJECT_ID,
    clientEmail: process.env.FIREBASE_SECONDARY_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_SECONDARY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  let secondaryApp = null;
  try {
    secondaryApp = admin.initializeApp(
      {
        credential: admin.credential.cert(secondaryServiceAccount),
        databaseURL: `https://${process.env.FIREBASE_SECONDARY_PROJECT_ID}.firebaseio.com`,
      },
      'secondary'
    );
  } catch (error) {
    // App might already be initialized
    secondaryApp = admin.app('secondary');
  }

  return {
    primary: {
      auth: admin.auth(),
      db: admin.firestore(),
    },
    secondary: {
      auth: secondaryApp.auth(),
      db: secondaryApp.firestore(),
    },
  };
}

async function setupAdminViaAccount(
  uid,
  email,
  name,
  account,
  accountName
) {
  try {
    console.log(`\n📝 Setting up admin via ${accountName} service account...`);

    // Set custom claims
    await account.auth.setCustomUserClaims(uid, { admin: true });
    console.log(
      `   ✅ Custom claims set: {"admin": true}`
    );

    // Create/update Firestore document
    await account.db.collection('users').doc(uid).set(
      {
        isAdmin: true,
        email,
        name: name || email.split('@')[0],
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
    console.log(`   ✅ Admin document created/updated in Firestore`);

    console.log(`   ✅ Admin setup complete via ${accountName}`);
    return true;
  } catch (error) {
    console.error(
      `   ❌ Error setting up admin via ${accountName}:`,
      error.message
    );
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      '❌ Usage: node scripts/setup-multi-admin.js <uid> <email> [name]'
    );
    console.error('   Example: node scripts/setup-multi-admin.js abc123 user@example.com "John Doe"');
    process.exit(1);
  }

  const uid = args[0];
  const email = args[1];
  const name = args[2] || email.split('@')[0];

  console.log('🚀 Firebase Multi-Admin Setup Script');
  console.log('===================================\n');
  console.log(`UID:   ${uid}`);
  console.log(`Email: ${email}`);
  console.log(`Name:  ${name}\n`);

  try {
    // Initialize both accounts
    console.log('🔐 Initializing service accounts...');
    const accounts = initializeBothAccounts();
    console.log('   ✅ Both service accounts initialized\n');

    // Setup via both accounts
    const primarySuccess = await setupAdminViaAccount(
      uid,
      email,
      name,
      accounts.primary,
      'Primary (fbsvc)'
    );

    const secondarySuccess = await setupAdminViaAccount(
      uid,
      email,
      name,
      accounts.secondary,
      'Secondary (lukaverde)'
    );

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SETUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`Primary Account (fbsvc):  ${primarySuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Secondary Account (lukaverde): ${secondarySuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('='.repeat(50) + '\n');

    if (primarySuccess && secondarySuccess) {
      console.log('✨ Both service accounts successfully configured!\n');
      console.log('🎯 Next Steps:');
      console.log('   1. Visit https://console.firebase.google.com');
      console.log('   2. Enable Firestore API in both regions (if not already enabled)');
      console.log('   3. Navigate to http://localhost:3000/admin');
      console.log('   4. You should now have full admin access!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some service accounts failed to set up.');
      console.log('   Check the errors above and try again.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
