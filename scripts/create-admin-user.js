#!/usr/bin/env node

/**
 * Create New Admin User Account
 * Creates a regular Firebase user account and sets admin privileges
 * 
 * Usage:
 *   node scripts/create-admin-user.js <email> <password> [name]
 * 
 * Example:
 *   node scripts/create-admin-user.js admin@washlee.com password123 "Admin User"
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const admin = require('firebase-admin');

// Initialize Firebase Admin
function initializeAdmin() {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  }

  return {
    auth: admin.auth(),
    db: admin.firestore(),
  };
}

async function createAdminUser(email, password, displayName) {
  const { auth, db } = initializeAdmin();

  console.log('🚀 Creating New Admin User');
  console.log('='.repeat(50));
  console.log(`Email: ${email}`);
  console.log(`Password: ${'*'.repeat(password.length)}`);
  console.log(`Name: ${displayName}`);
  console.log('='.repeat(50) + '\n');

  try {
    // 1. Create user account
    console.log('📝 Step 1: Creating user account...');
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    const uid = userRecord.uid;
    console.log(`   ✅ User created with UID: ${uid}\n`);

    // 2. Set custom claims
    console.log('🔐 Step 2: Setting admin custom claims...');
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log('   ✅ Custom claims set: {"admin": true}\n');

    // 3. Create Firestore document
    console.log('📋 Step 3: Creating Firestore admin document...');
    try {
      await db.collection('users').doc(uid).set({
        uid,
        email,
        name: displayName,
        isAdmin: true,
        adminRole: 'super_admin',
        userType: 'admin',
        createdAt: new Date().toISOString(),
        adminSince: new Date().toISOString(),
        permissions: {
          canViewAnalytics: true,
          canManageUsers: true,
          canManageOrders: true,
          canViewPayments: true,
          canManagePlans: true,
          canViewLogs: true,
        },
      });
      console.log('   ✅ Firestore document created\n');
    } catch (firestoreError) {
      console.log(
        '   ⚠️  Firestore not available (API disabled), but custom claims are set\n'
      );
    }

    // Summary
    console.log('='.repeat(50));
    console.log('✨ ADMIN USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📧 Login Credentials:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n🎯 Next Steps:`);
    console.log(`   1. Go to: http://localhost:3000/auth/login`);
    console.log(`   2. Login with: ${email}`);
    console.log(`   3. Password: ${password}`);
    console.log(`   4. After login, check user menu for "Admin Dashboard" link`);
    console.log(`   5. Click to access admin dashboard at /admin\n`);

    console.log('💡 Tips:');
    console.log('   • Change your password after first login');
    console.log('   • You have full admin privileges');
    console.log('   • Service account (lukaverde@washlee...) is for backend only\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/email-already-exists') {
      console.error('   This email is already registered in Firebase');
    }
    process.exit(1);
  }
}

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Usage: node scripts/create-admin-user.js <email> <password> [name]');
  console.error('   Example: node scripts/create-admin-user.js admin@washlee.com password123 "Admin User"');
  process.exit(1);
}

const email = args[0];
const password = args[1];
const name = args[2] || email.split('@')[0];

// Validate email
if (!email.includes('@')) {
  console.error('❌ Invalid email address');
  process.exit(1);
}

// Validate password
if (password.length < 6) {
  console.error('❌ Password must be at least 6 characters');
  process.exit(1);
}

createAdminUser(email, password, name);
