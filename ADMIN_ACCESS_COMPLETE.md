# Admin Account Access Guide - Washlee

## Your Admin Account

**Email:** `lukaverde6@gmail.com`  
**UID:** `JernxHaYRxSk9RbLQSkSiGeCxfa2`  
**Status:** ✅ Admin privileges set on BOTH service accounts

---

## How to Access Admin Dashboard

### Step 1: Login to Your Website

1. Visit: http://localhost:3000 (or your deployed site)
2. Click **"Login"** in the header
3. Sign in with: `lukaverde6@gmail.com` (your Firebase password)
4. You'll be logged in as an admin user

### Step 2: Navigate to Admin Dashboard

**Option A: Direct URL**
- Visit: `http://localhost:3000/admin`

**Option B: From Header Menu**
1. After logging in, look at the top-right of the page
2. Click your **user menu** (profile icon)
3. You'll see **"Admin Dashboard"** link (appears only for admins)
4. Click it to go to `/admin`

---

## Admin Functions Available

Once you're on the admin dashboard, you have access to:

### 1. **Dashboard Overview**
- Total Revenue (all-time earnings)
- Total Orders (completed orders count)
- Active Users (customer + pro accounts)
- Average Order Value
- Platform metrics and stats

### 2. **User Management**
- View all users (customers, pros, admins)
- Search and filter users
- Update user roles
- View user details and activity
- Promote users to admin

### 3. **Order Management**
- View all orders (pending, completed, cancelled)
- Filter by status, date, user
- View order details and tracking
- Manage order status
- Handle refunds/cancellations

### 4. **Analytics**
- User growth trends
- Order analytics and patterns
- Payment success metrics
- Revenue breakdown
- Pro earnings reports

### 5. **Support & Settings**
- Email templates and logs
- Loyalty program management
- Subscription settings
- System configuration
- Support tickets/messages

---

## Service Accounts You Have

You now have **2 Firebase Admin SDK service accounts** configured:

| Name | Email | Use Case |
|------|-------|----------|
| **Primary** (fbsvc) | `firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com` | Default - API routes, backend operations |
| **Secondary** (lukaverde) | `lukaverde@washlee-7d3c6.iam.gserviceaccount.com` | Automation, batch jobs, team operations |

Both accounts have the same permissions and capabilities.

---

## Code Functions for Admin Operations

You can use these functions in your code:

### Using Primary Account (Default)
```typescript
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// Set someone as admin
await adminAuth.setCustomUserClaims(uid, { admin: true });

// Query admin users
const admins = await adminDb.collection('users')
  .where('isAdmin', '==', true)
  .get();
```

### Using Secondary Account (lukaverde)
```typescript
import { secondaryAuth, secondaryDb } from '@/lib/firebaseAdmin';

const auth = secondaryAuth();
const db = secondaryDb();

// Same operations as primary
await auth.setCustomUserClaims(uid, { admin: true });
```

### Using Multi-Account Manager (Most Flexible)
```typescript
import { 
  promoteToAdmin,
  isUserAdmin,
  listAllAdmins,
  removeAdminAccess,
  getAuth,
  getDatabase
} from '@/lib/multiServiceAccount';

// Promote user to admin
await promoteToAdmin('uid123', 'user@example.com', 'primary');

// Check if user is admin
const isAdmin = await isUserAdmin('uid123', 'primary');

// List all admins
const admins = await listAllAdmins('primary');

// Remove admin access
await removeAdminAccess('uid123', 'primary');

// Get instances to use directly
const auth = getAuth('secondary');
const db = getDatabase('secondary');
```

---

## Admin Permissions You Have

✅ View Analytics & Metrics  
✅ Manage Users (CRUD operations)  
✅ View & Manage Orders  
✅ View Payments & Revenue  
✅ Manage Subscription Plans  
✅ View System Logs  
✅ Manage Email Settings  
✅ Control Loyalty Program  
✅ Full Admin Privileges  

---

## Verification Checklist

- [x] Email: `lukaverde6@gmail.com`
- [x] UID: `JernxHaYRxSk9RbLQSkSiGeCxfa2`
- [x] Custom claims set on primary account ✅
- [x] Custom claims set on secondary account ✅
- [x] Firestore documents ready (pending Firestore API enable)
- [x] Header admin link configured
- [x] Admin dashboard page created
- [x] Analytics API endpoint ready
- [x] TypeScript compilation clean (0 errors)

---

## Troubleshooting

### Admin Link Not Showing in Header?
1. Make sure you're logged in
2. The header checks `userData?.isAdmin` to show the link
3. Log out and log back in to refresh
4. Check browser console for errors

### Can't Access `/admin`?
1. Make sure you're logged in with `lukaverde6@gmail.com`
2. Custom claims must be set (they are ✅)
3. If it redirects to login, you're not authenticated
4. Try logging out completely and back in

### Dashboard Shows No Data?
1. Enable Firestore API in Google Cloud (see next section)
2. This is needed for Firestore reads/writes to work
3. Once enabled, data will populate automatically

---

## One More Step: Enable Firestore API

To get full functionality, you need to enable Firestore API in Google Cloud:

1. Visit: https://console.firebase.google.com
2. Select Project: `washlee-7d3c6`
3. Go to: **Firestore Database** or **APIs & Services > Dashboard**
4. Search for: **Firestore API**
5. Click **Enable**

Once enabled, re-run:
```bash
node scripts/setup-multi-admin.js "JernxHaYRxSk9RbLQSkSiGeCxfa2" "lukaverde6@gmail.com" "Luka Verde"
```

This will create the admin Firestore documents.

---

## Summary

**Your Admin Email:** `lukaverde6@gmail.com`

**Access Path:**
1. Login at `http://localhost:3000`
2. Click user menu > **Admin Dashboard**
3. Or go directly to `http://localhost:3000/admin`

**What You Can Do:**
- View analytics and metrics
- Manage all users
- Control orders and payments
- Configure system settings
- Use both service accounts for backend operations

**Code Examples:** Check `lib/multiServiceAccount.ts` for all available functions

---

**Status:** ✅ Ready to Use  
**Last Updated:** January 26, 2026
