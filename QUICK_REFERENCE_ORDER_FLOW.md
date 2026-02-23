# Quick Reference: Order Flow Status ✅

## Current System Status

### What's Fixed ✅
- ✅ Stripe checkout stores booking data in metadata
- ✅ Webhook receives checkout.session.completed event
- ✅ Webhook extracts uid and booking data
- ✅ Firebase order created in orders/{orderId} with uid field
- ✅ Order synced to users/{uid}/orders array
- ✅ lastOrderId and lastOrderDate updated on user
- ✅ Dashboard uses secure API endpoint with auth token
- ✅ API endpoint verifies Bearer token
- ✅ API endpoint queries with correct uid field
- ✅ Success page should show real order ID

### What You Need to Test
1. **Payment Flow:** Go through /booking → /checkout/success
2. **Firestore Check:** Verify order synced to user.orders array
3. **Dashboard:** Check order appears in Active Orders tab

---

## The One-Minute Version

### Before Testing
```
1. Make sure user document exists in Firestore
2. Make sure user document has "orders" array (can be empty)
3. Make sure you're logged in
```

### During Payment
```
1. Go to http://localhost:3000/booking
2. Fill out form completely
3. Click "Confirm & Pay"
4. Test card: 4242 4242 4242 4242 (12/34, CVC: 123)
5. Click "Pay"
```

### After Payment
```
1. Success page should show real order ID (not temp-...)
2. Check server logs for "Order synced to customer account"
3. Check Firestore → orders collection → new order exists
4. Check Firestore → users/{uid} → orders array has entry
5. Go to /dashboard/customer
6. Refresh page (Cmd+Shift+R)
7. Should see order in "Active Orders" tab
8. Browser console should show "[Dashboard] Got orders: 1"
```

---

## If Orders Don't Appear

### Check 1: Does Firestore have the order?
```
Firebase Console → Firestore → orders collection
Should see: order-1707614...
With: uid, email, amount, status, createdAt
```
✅ YES → Check 2
❌ NO → Webhook problem, check server logs

### Check 2: Is order synced to user.orders?
```
Firebase Console → users → YOUR_UID → orders field
Should see: array with order entry
```
✅ YES → Check 3
❌ NO → Manually add order to user.orders array

### Check 3: Is API returning orders?
```
Browser F12 → Console → Dashboard page
Should show: "[Dashboard] Got orders: 1"
```
✅ YES → Dashboard should show order
❌ NO → Auth token issue, try logging out and back in

### Check 4: Firestore has right field?
```
Check order document:
✅ uid: "YOUR_UID" (not userId)
❌ userId: "..." (wrong! should be uid)
```

---

## Common Problems & Quick Fixes

| Problem | Check | Fix |
|---------|-------|-----|
| Order not in Firestore | Server logs | Does webhook show "checkout.session.completed"? |
| Order has temp ID | Success page | Should show real order ID after payment |
| Order in Firestore but not user.orders | user document | Add orders field to user document |
| Dashboard shows no orders | Browser console | Should show "[Dashboard] Got orders: X" |
| API returns "Unauthorized" | Auth token | Log out, log back in |
| Orders array empty | Firestore | Webhook didn't sync - check server logs |

---

## Files That Were Just Fixed

1. **`/app/dashboard/customer/page.tsx`** (MOST RECENT)
   - Changed: Dashboard now uses API instead of direct Firestore
   - Benefit: Secure, uses correct uid field
   
2. **`/backend/services/firebaseService.js`** (PREVIOUS)
   - Changed: Added order sync to user.orders array
   - Benefit: Orders now appear in customer account
   
3. **`/app/api/checkout/route.ts`** (PREVIOUS)
   - Changed: Passes booking data to Stripe metadata
   - Benefit: All booking details preserved through payment
   
4. **`/backend/routes/webhook.routes.js`** (PREVIOUS)
   - Changed: Handles laundry bookings with uid and booking data
   - Benefit: Webhook correctly creates orders

---

## Key Field Names (DON'T MIX UP)

```
✅ CORRECT:
- Field name: uid
- Type: string
- Value: "9g4GphSrUuVH8jxWnVleXTPiPax2"

❌ WRONG:
- Field name: userId (old, don't use)
- Type: string  
- Value: same as uid above
```

**The entire flow uses `uid`, NOT `userId`**

---

## Expected Console Messages

### Server Console (npm run dev)
```
[Webhook] Received event: checkout.session.completed
[Webhook] Processing laundry booking completion: { uid: 'xxxxx', orderId: 'order-1707614...', email: '...' }
[Webhook] User verified: xxxxx
[Firebase] Order created in orders collection: order-1707614...
[Firebase] ✓ Order synced to customer account: xxxxx
[Webhook] ✓ Order created and synced to user account: order-1707614...
```

### Browser Console (F12 at /dashboard/customer)
```
[Dashboard] Fetching orders with auth token
[Dashboard] Orders API response status: 200
[Dashboard] Got orders: 1
```

If you DON'T see these messages, something is wrong!

---

## What Should Work Now

✅ **Complete Payment** → Order created in Firestore
✅ **Webhook Fires** → order/orders/{orderId} is created
✅ **Sync Works** → users/{uid}/orders array updated
✅ **API Works** → `/api/orders/user/{uid}` returns orders
✅ **Dashboard Works** → Shows order in Active Orders tab
✅ **Success Page** → Shows real order ID (not temp-...)

---

## Test Commands

```bash
# Check if webhook is processing events (in server terminal)
# You should see [Webhook] lines after making payment

# Check Firestore structure (via Firebase Console)
# orders collection should have new documents
# users/{uid}/orders should have array entries

# Test API manually (in browser console at /dashboard/customer)
const user = await firebase.auth().currentUser
const token = await user.getIdToken()
fetch(`/api/orders/user/${user.uid}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log(d))
```

---

## Next Steps

1. **Verify setup:**
   - [ ] User document exists in Firestore
   - [ ] User document has orders array
   - [ ] Dev server is running
   - [ ] You're logged in

2. **Test payment:**
   - [ ] Go to /booking
   - [ ] Fill form, click "Confirm & Pay"
   - [ ] Use test card: 4242 4242 4242 4242
   - [ ] Complete payment

3. **Verify results:**
   - [ ] Server logs show webhook success
   - [ ] Firestore has new order in orders collection
   - [ ] User document has order in orders array
   - [ ] Dashboard shows order in Active Orders

4. **If any step fails:**
   - [ ] Check corresponding troubleshooting guide
   - [ ] Check server/browser logs for errors
   - [ ] Fix and retry

---

## Success Indicators

When everything is working:

1. ✅ Go to /booking
2. ✅ Click "Confirm & Pay"
3. ✅ Complete Stripe payment
4. ✅ Success page shows real order ID
5. ✅ Check server logs show sync success
6. ✅ Go to /dashboard/customer
7. ✅ Refresh page
8. ✅ Order appears in Active Orders tab
9. ✅ Click order to see full details
10. ✅ All info is there: weight, delivery, address, price

**If all 10 steps work → Payment system is complete! 🎉**

---

## Where to Get Help

**If payments aren't being processed:**
- Check Stripe dashboard for payment attempts
- Check webhook deliveries in Stripe settings
- Verify webhook endpoint URL is correct

**If orders aren't being created:**
- Check server logs for webhook success
- Check Firestore → orders collection exists
- Check user document has orders field

**If dashboard isn't showing orders:**
- Check browser console for "[Dashboard]" messages
- Check Firebase auth is working
- Log out and back in to refresh token

**If you're totally stuck:**
- Manually create an order in Firestore
- Check if dashboard shows it
- This tells you if problem is payment or dashboard

---

**Remember: Every step must work for the full flow to succeed!**

Good luck! 🚀
