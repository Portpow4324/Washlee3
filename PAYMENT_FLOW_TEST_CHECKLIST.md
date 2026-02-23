# Payment Flow Fix - Verification Checklist

## Critical Fix Summary
Changed Stripe redirect from `/payment-success` (OLD, client-side Firebase) to `/checkout/success` (NEW, API-based)

**File Changed:** `/app/api/checkout/route.ts` Line 87

---

## Pre-Test Checklist ✓

- [ ] Dev server running: `npm run dev`
- [ ] Firebase credentials in `.env.local` (verified)
- [ ] Stripe test keys configured (verified)
- [ ] Website loads without errors
- [ ] Logged in as test user (lukaverde045@gmail.com)

---

## Payment Test Steps

### Step 1: Create Test Booking
```
1. Navigate to http://localhost:3000/booking
2. Enter details:
   - Weight: 5 kg
   - Service: Wash & Fold
   - Delivery Speed: Standard
   - Address: Test address
   - Postcode: 3000
3. Click "Confirm & Pay"
```

**Expected:** Stripe checkout page loads

---

### Step 2: Complete Payment
```
1. Stripe payment form appears
2. Use test card: 4242 4242 4242 4242
3. Expiry: 12/34
4. CVC: 123
5. Name: Test User
6. Email: lukaverde045@gmail.com
7. Click "Pay"
```

**Expected:** Payment processes immediately (test card)

---

### Step 3: Verify Redirect
```
After payment completes:
- Page should redirect to: /checkout/success?session_id=...
- NOT /payment-success (old page)
```

**Expected:** URL shows `/checkout/success`

---

### Step 4: Verify Success Page Loads
```
Success page should show:
- "Processing Payment..." message initially
- Real order details appear after a few seconds
- Order ID (NOT a temporary ID like "temp-1770612911039-...")
```

**Expected:**
- ✅ Real order ID from Firestore
- ✅ Order details (weight, services, address)
- ✅ Price breakdown
- ✅ Delivery information

**If you see:** "Payment Received ✓" message, it means order details couldn't load initially (webhook delay)

---

### Step 5: Browser Console Verification
```
Open browser developer tools: F12
Go to Console tab
Look for these logs (in order):
```

**Expected logs (good sign):**
```
[Success] Auth state listener starting...
[Success] Auth state changed. User: lukaverde045@gmail.com
[Success] Waiting for auth to load...
[Success] Auth ready, fetching orders
[Success] Fetching orders for user: [UID]
[Success] Got ID token: abc123...
[Success] Got orders on first try: 1
```

**Bad logs (problem):**
```
Error fetching order: FirebaseError: Failed to get document because the client is offline
```

If you see the bad logs, the old `/payment-success` page is still being used.

---

### Step 6: Firestore Verification
```
1. Go to Firebase Console: https://console.firebase.google.com
2. Select "washlee-7d3c6" project
3. Go to Firestore Database
4. Open "orders" collection
5. Find order with createdAt ≈ now
6. Check document has:
```

**Expected fields:**
- ✅ `uid: "[your user id]"` (not `userId`)
- ✅ `email: "lukaverde045@gmail.com"`
- ✅ `total: 24` (or whatever you paid)
- ✅ `estimatedWeight: 5`
- ✅ `status: "pending"` (or "confirmed")
- ✅ `createdAt: [timestamp]`
- ✅ `deliveryAddress: [your test address]`

**Bad:**
- ❌ Field is `userId` instead of `uid`
- ❌ Order doesn't exist in Firestore
- ❌ Status shows error

---

### Step 7: Dashboard Verification
```
1. Go to Dashboard: http://localhost:3000/dashboard/customer
2. Look for "Active Orders" tab
3. Your test order should appear with:
```

**Expected:**
- ✅ Order listed as "Pending"
- ✅ Weight shows "5 kg"
- ✅ Price shows correct amount
- ✅ Delivery address visible
- ✅ Can click to view details

---

## Troubleshooting

### Problem: Still seeing "temporary order ID"
**Cause:** Stripe still redirecting to `/payment-success`  
**Fix:**
```bash
# Verify the change was applied
grep "checkout/success" /Users/lukaverde/Desktop/Website.BUsiness/app/api/checkout/route.ts
```
Should show: `success_url: ${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`

### Problem: "Error fetching order: client is offline"
**Cause:** Old `/payment-success` page is being used  
**Fix:**
1. Hard refresh browser (Cmd+Shift+R)
2. Clear Next.js cache: `rm -rf .next`
3. Restart dev server: Kill and run `npm run dev` again

### Problem: "Please sign in to view your order"
**Cause:** Auth session not initialized  
**Fix:**
1. Make sure you're logged in before payment
2. Check browser console for auth errors
3. Try logging out and back in

### Problem: Order in Firebase but not in Dashboard
**Cause:** Dashboard API not returning orders  
**Fix:**
```bash
# Check /api/orders/user/[uid] endpoint logs
# Look for errors in server terminal output
npm run dev
```

---

## Success Criteria

All of these must be true:

- [ ] Stripe redirects to `/checkout/success` (not `/payment-success`)
- [ ] Success page loads (shows "Processing Payment..." or real order details)
- [ ] Order ID is real (not "temp-...")
- [ ] Browser console shows proper auth logs
- [ ] Firestore has order with `uid` field
- [ ] Dashboard shows order in Active Orders
- [ ] No "client is offline" errors in console

---

## If Everything Works ✅

1. Payment flow is now fully functional
2. Orders are created correctly in Firestore
3. Success page displays real order information
4. Dashboard integration works
5. Ready for next features

---

## If Something Still Doesn't Work ❌

1. Check the error message carefully
2. Clear cache: `rm -rf .next`
3. Restart server: Kill and run `npm run dev`
4. Try different test card (4000 0000 0000 0002 for decline test)
5. Check server logs for errors

---

**Remember:** Stripe test cards don't charge anything - they're safe for testing!

---

**Last Updated:** January 19, 2025
