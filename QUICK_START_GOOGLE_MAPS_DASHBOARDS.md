# 🚀 Quick Start Guide - Google Maps + Dashboards

## What's Ready to Use

### ✅ Google Maps Live Tracking
- **URL**: `/tracking?id=ORDER_ID`
- **Features**: Real-time map, pro location, customer location, route visualization
- **Already Setup**: Google Maps API key in `.env.local`

### ✅ Customer Dashboard  
- **URL**: `/dashboard`
- **Login as**: Customer account
- **Shows**: Recent orders, stats, quick actions

### ✅ Pro/Employee Dashboard
- **URL**: `/pro/dashboard`
- **Login as**: Pro account
- **Shows**: Active jobs, earnings, weekly stats

---

## How to Test Everything

### Step 1: Create Accounts
```
1. Go to /auth/signup
2. Create CUSTOMER account
3. Confirm email (check inbox or click resend)
4. Create SECOND account selecting "Pro"
5. Confirm pro email
```

### Step 2: Test Customer Dashboard
```
1. Login with customer account
2. Visit /dashboard
3. See "Active Orders", "Completed", "Total Spent"
4. See "Recent Orders" section
5. Click "New Order" button
```

### Step 3: Create & Track Order
```
1. From dashboard, click "New Order"
2. Go through 7-step booking flow
3. Use test card: 4242 4242 4242 4242
4. Complete payment
5. See order appear in dashboard with status badge
```

### Step 4: Assign Order to Pro (Manual)
```
In Supabase:
1. Go to orders table
2. Find your new order
3. Set pro_id = (your pro user id)
4. Set status = 'confirmed'
5. Click Update
```

### Step 5: Test Pro Dashboard
```
1. Logout (or open new browser/incognito)
2. Login with PRO account
3. Visit /pro/dashboard
4. See your order in "Active Jobs" section
5. Click the order to view details
```

### Step 6: Test Live Tracking
```
1. From customer dashboard, find your order
2. Click order → goes to order detail
3. Look for tracking button or URL: /tracking?id=ORDER_ID
4. See real-time map with:
   - Pro location (teal marker)
   - Your address (orange marker)
   - Route line between them
5. Click "Call Pro" button
```

---

## File Changes Made

### New Files Created:
- ✅ `/components/LiveTracking.tsx` - Map component
- ✅ `/app/tracking/page.tsx` - Live tracking page  
- ✅ `GOOGLE_MAPS_DASHBOARDS_IMPLEMENTATION.md` - Full docs

### Files Modified:
- ✅ `/app/dashboard/page.tsx` - Customer dashboard (rebuilt)
- ✅ `/app/pro/dashboard/page.tsx` - Pro dashboard (rebuilt)

### No Changes Needed:
- `/app/dashboard/layout.tsx` - Already works
- `.env.local` - Google Maps API key already there
- `supabaseClient.ts` - Already configured

---

## Real-Time Features Active

These pages update automatically when data changes:

- **Customer Dashboard**: Updates when:
  - Order status changes
  - New order created
  - Pro assigned

- **Pro Dashboard**: Updates when:
  - New job assigned
  - Job status changes
  - Job completed

- **Live Tracking**: Updates when:
  - Order status changes
  - Pro location updates

---

## Environment Check ✅

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDhKr9c9U9eftZeFzuKMVrd_JHxRYg21-E ✅

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY ✅

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✅
STRIPE_SECRET_KEY ✅
STRIPE_WEBHOOK_SECRET ✅

# Email (for confirmations)
Resend configured ✅
```

---

## Common Issues & Fixes

### Maps Not Showing
- Check if Google Maps script loaded (DevTools → Network tab)
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in .env.local
- Restart dev server

### Dashboard Shows Empty
- Make sure you created an order
- Make sure you're logged in as the right user
- Check Supabase: should have order in `orders` table

### Pro Dashboard Shows "Access Denied"
- Make sure you're logged in as PRO account
- Check user_type in database = 'pro'
- Try logging out and back in

### Orders Not Appearing in Pro Dashboard
- Make sure order has `pro_id` set to your pro user id
- Make sure order status is one of: confirmed, in-transit, in_washing, pending-pickup
- Check Supabase filter in console

### Real-Time Not Updating
- Check browser console for errors
- Verify Supabase connection
- Try refreshing page (should see data)
- Check Supabase real-time enabled

---

## Next Steps

1. **Test fresh signup flow end-to-end** ← You are here
2. Test all dashboard features work
3. Test real-time updates
4. Test tracking map with real order
5. Deploy to production when ready

---

## Get Help

Check these docs for more info:
- `GOOGLE_MAPS_DASHBOARDS_IMPLEMENTATION.md` - Full technical details
- `EMAIL_CONFIRMATION_GUIDE.md` - Email verification flow
- `FRESH_START_STATUS.md` - System status overview

---

**Last Updated**: March 21, 2026  
**Status**: Ready to test! 🎉
