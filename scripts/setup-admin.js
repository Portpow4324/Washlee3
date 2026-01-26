#!/usr/bin/env node

/**
 * Firebase Admin Setup Script
 * Run this once to make your first user an admin
 * 
 * Usage: node scripts/setup-admin.js
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

/**
 * Make a user an admin
 */
async function makeUserAdmin(uid, email, name) {
  try {
    console.log(`\n🔧 Setting up admin user...`);
    console.log(`   UID: ${uid}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}\n`);

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Custom claims set`);

    // Update Firestore
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
    console.log(`✅ Firestore user document updated`);

    console.log(`\n🎉 Admin setup complete!\n`);
    console.log(`   ${email} is now a super_admin\n`);

    return { success: true, message: 'Admin setup complete', isAdmin: true };
  } catch (error) {
    console.error(`❌ Error setting up admin:`, error);
    return { success: false, error: error.message };
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

// Run the setup
const uid = process.argv[2] || 'JernxHaYRxSk9RbLQSkSiGeCxfa2';
const email = process.argv[3] || 'lukaverde6@gmail.com';
const name = process.argv[4] || 'Luka Verde';

makeUserAdmin(uid, email, name);
