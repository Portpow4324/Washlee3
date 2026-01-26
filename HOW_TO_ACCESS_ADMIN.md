# 🔐 How to Access the Admin Dashboard

## Step 1: Make Sure You're Logged In

1. Go to **http://localhost:3000** (or your deployed site)
2. Click **"Log In"** in the header
3. Sign in with your email: **lukaverde6@gmail.com**
4. Password: whatever you set during signup

## Step 2: Give Yourself Admin Privileges

You already have the UID `JernxHaYRxSk9RbLQSkSiGeCxfa2` set up with admin claims. 

Now run the setup script to add you to the admin list in Firestore:

```bash
cd /Users/lukaverde/Desktop/Website.BUsiness
node scripts/setup-admin.js 'JernxHaYRxSk9RbLQSkSiGeCxfa2' 'lukaverde6@gmail.com' 'Luka Verde'
```

**What this does:**
- ✅ Sets custom claims in Firebase Auth
- ✅ Creates admin record in Firestore with all permissions
- ✅ Enables access to admin dashboard

## Step 3: Access the Admin Page

After running the script, you have **three ways** to access the admin dashboard:

### Option A: Direct URL (Easiest)
Simply go to:
```
http://localhost:3000/admin
```

The page will:
1. Check if you're logged in
2. Check if `userData?.isAdmin === true`
3. Show admin dashboard if you have access
4. Redirect to home page if you don't

### Option B: From Header Dropdown
1. Log in with your admin account
2. Click your **profile icon** in the top-right
3. Look for "Admin Dashboard" link in the dropdown
4. Click it to access `/admin`

### Option C: API Routes with Admin SDK
Your backend can now use admin-only API routes:

```typescript
// Example: app/api/admin/users.ts
import { verifyAdmin } from '@/middleware/admin';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.substring(7);
  
  if (!idToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { isAdmin, uid } = await verifyAdmin(idToken);
  
  if (!isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Now you can safely do admin operations
  // ...
}
```

---

## 🎯 Admin Dashboard Features

Once you access `/admin`, you should see:

### 📊 Key Metrics
- Total Revenue (monthly)
- Total Orders (all-time)
- Active Users (this month)
- Average Order Value
- New Signups (this month)
- Pending Pro Applications
- Refund Rate %

### 🛠️ Quick Access Sections
- **User Management** - View/manage customers and pros
- **Order Management** - Handle disputes and reassign orders
- **Analytics Dashboard** - Detailed reports
- **Support & Settings** - Tickets and configuration

---

## 🔍 Troubleshooting

### "Access Denied" or redirect to home page
**Problem:** Your user isn't marked as admin in Firestore

**Solution:** Run the setup script again:
```bash
node scripts/setup-admin.js 'JernxHaYRxSk9RbLQSkSiGeCxfa2' 'lukaverde6@gmail.com' 'Luka Verde'
```

### Firestore API not enabled error
**Problem:** The Cloud Firestore API needs to be activated

**Solution:** 
1. Go to: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=washlee-7d3c6
2. Click the **ENABLE** button
3. Wait 2-3 minutes
4. Run the script again

### "You are not logged in" on admin page
**Problem:** Session expired or cookie issue

**Solution:**
1. Log out (click profile → Log Out)
2. Go to `/auth/login`
3. Sign in again with **lukaverde6@gmail.com**
4. Go to `/admin`

### "userData is undefined"
**Problem:** User data isn't loading from Firestore

**Solution:**
1. Check Firebase Console → Firestore → `users` collection
2. Verify your document exists with structure:
   ```json
   {
     "uid": "JernxHaYRxSk9RbLQSkSiGeCxfa2",
     "email": "lukaverde6@gmail.com",
     "name": "Luka Verde",
     "isAdmin": true,
     "adminRole": "super_admin",
     ...
   }
   ```
3. If missing, run setup script again

---

## 📱 Testing Admin Features

### Test 1: Verify Admin Dashboard Loads
```bash
# 1. Start dev server
npm run dev

# 2. Open browser to http://localhost:3000/admin
# 3. You should see admin metrics and cards
```

### Test 2: Check Firestore Data
```bash
# Firebase Console → Firestore → Collection: users → Document: JernxHaYRxSk9RbLQSkSiGeCxfa2
# Should show:
# {
#   "isAdmin": true,
#   "adminRole": "super_admin",
#   "email": "lukaverde6@gmail.com",
#   ...
# }
```

### Test 3: Verify Custom Claims
```bash
# Firebase Console → Authentication → Select your user
# Look for "Custom claims" section
# Should show: { "admin": true }
```

---

## 🚀 Next Steps

1. ✅ Run setup script to grant admin privileges
2. ✅ Log in with lukaverde6@gmail.com
3. ✅ Visit http://localhost:3000/admin
4. 📊 Explore admin dashboard features
5. 🔧 Start building admin features you need

---

## 💡 Admin Privileges Your Account Has

Once set up, you can:

✅ View all users (customers and pros)  
✅ View all orders and transactions  
✅ Approve/reject pro applications  
✅ Handle disputes and refunds  
✅ View analytics and reports  
✅ Create promotional codes  
✅ Manage support tickets  
✅ Access all admin APIs  
✅ Query any Firestore collection  
✅ Manage other admins  

---

**Setup Complete!** 🎉

Your admin account is ready. Just run the setup script if you haven't already, then visit `/admin` to see your dashboard.
