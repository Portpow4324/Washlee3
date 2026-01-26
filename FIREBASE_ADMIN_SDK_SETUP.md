# Firebase Admin SDK Setup Guide

## ✅ Setup Complete!

You now have Firebase Admin SDK fully configured. Here's what was set up:

### Files Created/Modified:

1. **`lib/firebaseAdmin.ts`** - Admin SDK initialization
   - Initializes Firebase Admin with service account credentials
   - Exports: `adminAuth`, `adminDb`, `adminRealtimeDb`
   - Used for server-side operations only

2. **`middleware/admin.ts`** - Admin verification utilities
   - `verifyAdmin(idToken)` - Check if user is admin
   - `adminMiddleware(req)` - Middleware for protecting admin routes
   - `makeUserAdmin(uid)` - Grant admin access

3. **`lib/adminSetup.ts`** - Admin management utilities
   - `setupAdminUser(uid, email, name)` - Set up first admin
   - `grantAdminByEmail(uid)` - Make user admin
   - `isUserAdmin(uid)` - Check admin status
   - `listAllAdmins()` - List all admins
   - `removeAdminAccess(uid)` - Remove admin access

4. **`.env.local`** - Updated with admin SDK credentials
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

---

## 🚀 How to Use

### Step 1: Make Your First User an Admin

When you sign up as a user (lukaverde6@gmail.com), get your UID from Firebase Console → Authentication.

Then run this in a Node.js script or directly in Firebase Cloud Functions:

```typescript
import { setupAdminUser } from '@/lib/adminSetup';

const result = await setupAdminUser('your-uid-here', 'lukaverde6@gmail.com', 'Luka Verde');
console.log(result);
```

### Step 2: Verify Admin Status

```typescript
import { isUserAdmin } from '@/lib/adminSetup';

const isAdmin = await isUserAdmin('user-uid');
console.log(`Is admin: ${isAdmin}`);
```

### Step 3: List All Admins

```typescript
import { listAllAdmins } from '@/lib/adminSetup';

const admins = await listAllAdmins();
console.log(admins);
```

---

## 🔒 Protecting Admin Routes

### Option 1: Server-Side Protection (Recommended)

```typescript
// app/api/admin/users.ts
import { verifyAdmin } from '@/middleware/admin';

export async function POST(req: Request) {
  // Get auth token from request
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.substring(7);
  const { isAdmin } = await verifyAdmin(idToken);

  if (!isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with admin operation
  // ...
}
```

### Option 2: Client-Side Check

```typescript
// app/admin/page.tsx
'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminDb } from '@/lib/firebaseAdmin'; // ❌ NOT for client!

export default function AdminDashboard() {
  const { user, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!userData?.isAdmin) {
      router.push('/');
      return;
    }
  }, [user, userData, router]);

  if (!userData?.isAdmin) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Dashboard</div>;
}
```

---

## 📚 Common Operations

### Query All Users (Server-Side Only)

```typescript
import { adminDb } from '@/lib/firebaseAdmin';

const snapshot = await adminDb.collection('users').get();
const users = snapshot.docs.map(doc => ({
  uid: doc.id,
  ...doc.data()
}));
```

### Update User Without Client Auth

```typescript
import { adminDb } from '@/lib/firebaseAdmin';

await adminDb.collection('users').doc(uid).update({
  isVerified: true,
  verifiedAt: new Date(),
  verifiedBy: adminUid
});
```

### Delete User Account

```typescript
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// Delete from Auth
await adminAuth.deleteUser(uid);

// Delete from Firestore
await adminDb.collection('users').doc(uid).delete();
```

### Create Custom Claims

```typescript
import { adminAuth } from '@/lib/firebaseAdmin';

await adminAuth.setCustomUserClaims(uid, {
  admin: true,
  role: 'super_admin'
});
```

---

## ⚠️ Important Security Notes

1. **Never expose the Admin SDK on the client**
   - `lib/firebaseAdmin.ts` is server-only
   - Always use it in API routes or server actions
   - The environment variables are server-only in `.env.local`

2. **Rotate service account keys periodically**
   - Go to Firebase Console → Settings → Service Accounts
   - Download new key every 3-6 months
   - Update `.env.local` with new key

3. **Restrict API endpoints to admins**
   - Always verify admin status before sensitive operations
   - Use `verifyAdmin()` in all admin API routes
   - Log all admin actions for audit trail

4. **Use Security Rules**
   - Even with Admin SDK, implement Firestore security rules
   - Example:
   ```
   match /users/{userId} {
     allow read, write: if request.auth.uid == userId;
     allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
   }
   ```

---

## 🔧 Troubleshooting

### Error: "Firebase app not initialized"

Make sure you're importing from `lib/firebaseAdmin` in server-only context:

```typescript
// ✅ Correct - in API route or server action
import { adminDb } from '@/lib/firebaseAdmin';

// ❌ Wrong - in client component
'use client';
import { adminDb } from '@/lib/firebaseAdmin'; // This will fail!
```

### Error: "FIREBASE_PRIVATE_KEY is not defined"

Check that `.env.local` has these three variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Error: "Permission denied" when querying Firestore

Make sure your Firestore Security Rules allow the admin user:

```firestore
allow write: if request.auth.token.admin == true;
```

---

## 📋 Next Steps

1. ✅ **Admin SDK installed and configured**
2. 🚀 **Make your first user an admin** (follow Step 1 above)
3. 📊 **Protect admin routes** with `verifyAdmin()` middleware
4. 🔐 **Test admin operations** on a test user
5. 📈 **Build admin dashboard** pages with protected data access

---

## 📞 Quick Reference Commands

```bash
# Test if Admin SDK works
node -e "require('firebase-admin/lib/admin').initializeApp()"

# Check environment variables
cat .env.local | grep FIREBASE

# View service account info
cat washlee-7d3c6-firebase-adminsdk-fbsvc-4230189212.json
```

---

**Setup Date:** January 26, 2026  
**Status:** ✅ Complete - Ready to use
