# Admin Access Setup - Quick Guide

## Problem Fixed

When you tried to access the admin panel, you were getting an "Access Denied" error even though you're logged in. This is because your account doesn't have admin privileges set up yet.

## Solution

We've created a simple setup page that lets you grant yourself admin access in just 2 clicks:

### Step-by-Step Instructions

#### 1. Log In First
- Make sure you're logged into your account
- If not logged in, log in now at `/auth/login`

#### 2. Go to Admin Setup
- Visit: `http://localhost:3000/admin-setup` (or `/admin-setup` on production)
- Or if you see the access denied page on `/admin`, it will have a link to admin-setup

#### 3. Click "Make Me Admin"
- Click the **"Make Me Admin"** button
- This will:
  - Set your account as admin in Firebase
  - Grant you the necessary permissions
  - Store admin settings in your user profile

#### 4. Log Out and Back In
- Log out completely
- Log back in with your email
- This refreshes your session with the new admin permissions

#### 5. Access Admin Panel
- Go to `/admin`
- You should now see the admin dashboard ✅

---

## What Changed

### New Files Created
- **`/app/admin-setup/page.tsx`** - Simple setup page to grant admin access
- **`lib/adminSessionContext.tsx`** - Admin session isolation (keeps admin separate from customer)

### Modified Files
- **`/app/admin/page.tsx`** - Now shows helpful message if you don't have admin access
- **`/app/layout.tsx`** - Added AdminSessionProvider
- All admin pages - Added new tab navigation so you don't lose the admin panel

---

## How It Works Behind the Scenes

1. **Firebase Custom Claims**: When you click "Make Me Admin", it calls `/api/admin/setup` which:
   - Sets your user ID with `admin: true` custom claim in Firebase
   - Creates a user document marking you as admin
   - These are verified every time you access an admin page

2. **Session Isolation**: The `AdminSessionContext` keeps your admin session separate from your customer session, preventing permission conflicts

3. **New Tab Navigation**: All admin links open in new tabs, so you can keep the main admin dashboard open

---

## Troubleshooting

### "Error: Unauthorized - no token"
- Make sure you're logged in first
- Try logging out and logging back in
- Check that your browser allows cookies/session storage

### "Error: Failed to set admin privileges"
- Make sure you have internet connection
- Check if Firebase is running (should be since you're logged in)
- Try the setup page again

### Still seeing "Access Denied" after setup
- **Important**: You must log out and log back in
- Just refreshing the page won't work - you need to restart your session
- Close the browser tab and open a new one if needed

### Console shows "User is not admin"
- You haven't completed step 4 (log out and back in)
- The system needs to refresh your session token with the new admin claim

---

## Next Steps

After you have admin access, you can:
- **View User Management**: See all customers and pros in the system
- **Manage Orders**: Track and manage all orders
- **View Analytics**: See revenue, orders, and user growth metrics
- **Employee Inquiries**: Approve or reject pro applications
- **Security Dashboard**: Monitor system health and errors
- **Marketing**: Create and send campaigns to users

---

## Admin URLs

Once you have access, here are the main admin pages:

- `/admin` - Main admin dashboard
- `/admin/users` - User management (customers & pros)
- `/admin/orders` - Order management
- `/admin/analytics` - Analytics and reports
- `/admin/inquiries` - Employee applications
- `/admin/security` - Security & debugging
- `/admin/marketing/campaigns` - Email campaigns

All of these will open in new tabs so you don't lose the main dashboard!

---

## Still Having Issues?

Check the browser console (F12 → Console tab) for detailed error messages. The system logs helpful debug info that shows:
- Your current user email
- Whether you're marked as admin
- Any permission issues
- Session status

These logs help troubleshoot what's happening.
