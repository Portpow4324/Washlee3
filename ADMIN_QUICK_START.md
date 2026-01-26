# 🚀 Admin Access Quick Start Guide

## Your Admin Setup Summary

| Field | Value |
|-------|-------|
| **Your Email** | lukaverde6@gmail.com |
| **Your Name** | Luka Verde |
| **Your UID** | JernxHaYRxSk9RbLQSkSiGeCxfa2 |
| **Admin Role** | super_admin |
| **Custom Claims** | { "admin": true } ✅ |

---

## ⚡ 3 Steps to Access Admin Dashboard

### Step 1️⃣: Grant Admin Privileges (One-time setup)

Run this command **once** to set yourself up as admin:

```bash
cd /Users/lukaverde/Desktop/Website.BUsiness
node scripts/setup-admin.js 'JernxHaYRxSk9RbLQSkSiGeCxfa2' 'lukaverde6@gmail.com' 'Luka Verde'
```

**Expected output:**
```
🔧 Setting up admin user...
   UID: JernxHaYRxSk9RbLQSkSiGeCxfa2
   Email: lukaverde6@gmail.com
   Name: Luka Verde

✅ Custom claims set
✅ Firestore user document updated

🎉 Admin setup complete!

   lukaverde6@gmail.com is now a super_admin
```

If you get a Firestore API error:
1. Go to: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=washlee-7d3c6
2. Click **ENABLE**
3. Wait 2-3 minutes
4. Run the script again

### Step 2️⃣: Start Your Dev Server

```bash
npm run dev
```

This starts your site at **http://localhost:3000**

### Step 3️⃣: Access Admin Dashboard

**Option A: Direct URL** (Easiest)
```
http://localhost:3000/admin
```

**Option B: From Header**
1. Log in with **lukaverde6@gmail.com**
2. Click your profile icon (top right)
3. Click **"Admin Dashboard"** (red button)
4. Done! ✅

---

## 📊 What You'll See in Admin Dashboard

### Key Metrics
```
┌─────────────────────────────────────┐
│  Total Revenue    │  $0.00          │
│  Total Orders     │  0              │
│  Active Users     │  0              │
│  Avg Order Value  │  $0.00          │
│  New Signups      │  0 this month   │
│  Pending Apps     │  0              │
│  Refund Rate      │  0%             │
└─────────────────────────────────────┘
```

### Quick Access Sections
- 👥 **User Management** - View/manage customers and pros
- 📦 **Order Management** - Handle orders and disputes
- 📊 **Analytics** - Detailed reports and insights
- 🛠️ **Support & Settings** - Tickets and configuration

---

## 🔐 Your Admin Permissions

Once set up, you have **full admin privileges**:

✅ View all users (customers and pros)  
✅ View all orders and payments  
✅ Approve/reject pro applications  
✅ Handle disputes and refunds  
✅ View detailed analytics  
✅ Create promotional codes  
✅ Manage support tickets  
✅ Access admin APIs  
✅ Query any Firestore collection  
✅ Manage other admin users  

---

## 🧪 Test It Works

### Test 1: Verify Firestore Data
```
Firebase Console → Firestore → Collection: users
Look for document with ID: JernxHaYRxSk9RbLQSkSiGeCxfa2

Should contain:
{
  "isAdmin": true,
  "adminRole": "super_admin",
  "email": "lukaverde6@gmail.com",
  "name": "Luka Verde",
  ...
}
```

### Test 2: Check Firebase Custom Claims
```
Firebase Console → Authentication → Select your user
Look for "Custom claims" section

Should show: { "admin": true }
```

### Test 3: Access Admin Page
1. Start dev server: `npm run dev`
2. Go to: http://localhost:3000/admin
3. Should see metrics dashboard (even if empty)
4. Should NOT see "Access Denied" message

---

## 🆘 Troubleshooting

### Problem: "Access Denied" on /admin
**Solution:** 
```bash
# Re-run setup script
node scripts/setup-admin.js 'JernxHaYRxSk9RbLQSkSiGeCxfa2' 'lukaverde6@gmail.com' 'Luka Verde'

# Then refresh the page
```

### Problem: Firestore API Error
**Solution:**
1. Go to: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=washlee-7d3c6
2. Click **ENABLE** button
3. Wait 3-5 minutes
4. Run setup script again

### Problem: "You must be logged in"
**Solution:**
1. Go to http://localhost:3000/auth/login
2. Sign in with **lukaverde6@gmail.com**
3. Go back to http://localhost:3000/admin

### Problem: Not seeing "Admin Dashboard" in profile menu
**Solution:**
1. Make sure you ran the setup script
2. Refresh the page (Ctrl+R or Cmd+R)
3. Log out and log back in

---

## 📝 Files You Have Now

All admin functionality is set up with these files:

```
lib/
  ├── firebaseAdmin.ts          # Admin SDK initialization
  └── adminSetup.ts             # Admin management functions

middleware/
  └── admin.ts                  # Admin verification utilities

app/
  └── admin/
      └── page.tsx              # Admin dashboard page

api/
  └── admin/
      ├── analytics.ts          # Analytics endpoints
      └── (more admin APIs)

components/
  └── Header.tsx                # Updated with admin link

scripts/
  └── setup-admin.js            # Setup script
```

---

## 🎯 Next: What to Do With Admin Access

### Immediate
1. ✅ Access http://localhost:3000/admin
2. ✅ Explore the admin dashboard
3. ✅ Test fetching analytics data

### Short-term
- Create admin pages for:
  - User management (view/approve pros)
  - Order management (handle disputes)
  - Analytics dashboard (charting)
  - Support tickets

### Long-term
- Set up other admin users (if needed)
- Configure email alerts for admins
- Set up audit logging for admin actions
- Create admin-only API routes

---

## 📞 Need Help?

If something isn't working:

1. **Check the setup guide:** `FIREBASE_ADMIN_SDK_SETUP.md`
2. **Check troubleshooting:** `HOW_TO_ACCESS_ADMIN.md`
3. **Check Firebase Console logs** for errors
4. **Check browser console** (F12 → Console tab)

---

## ✅ Checklist

- [ ] Run setup script: `node scripts/setup-admin.js ...`
- [ ] Start dev server: `npm run dev`
- [ ] Go to http://localhost:3000/admin
- [ ] See admin dashboard load
- [ ] See your metrics displayed
- [ ] Verify Firestore has your admin document
- [ ] Verify Firebase Auth has custom claims

Once all checked, you're ready to start building admin features! 🚀

---

**Status:** ✅ Admin SDK is fully set up  
**Ready to use:** Yes  
**Date:** January 26, 2026
