# Firebase Order Sync Troubleshooting Guide

## Problem: Orders Not Showing in Dashboard

If your orders aren't appearing in the dashboard even after payment, here's how to diagnose and fix it:

---

## Step 1: Check Firebase Console Structure

### What You Should See

**In Firestore → `orders` collection:**
```
orders/
├── order-1707614XXX-abc123def
│   ├── orderId: "order-1707614XXX-abc123def"
│   ├── uid: "9g4GphSrUuVH8jxWnVleXTPiPax2"        ← CHECK THIS!
│   ├── email: "lukaverde045@gmail.com"
│   ├── amount: 45.50
│   ├── status: "confirmed"
│   ├── estimatedWeight: 5
│   ├── deliverySpeed: "standard"
│   ├── createdAt: Timestamp
│   └── bookingData: {...}
```

**In Firestore → `users/{uid}/`:**
```
users/9g4GphSrUuVH8jxWnVleXTPiPax2/
├── email: "lukaverde045@gmail.com"
├── name: "Your Name"
├── phone: "+61..."
├── orders: [                          ← CHECK THIS!
│   {
│     orderId: "order-1707614XXX-abc123def",
│     email: "lukaverde045@gmail.com",
│     amount: 45.50,
│     status: "confirmed",
│     estimatedWeight: 5,
│     deliverySpeed: "standard",
│     deliveryAddress: {...},
│     createdAt: Timestamp
│   }
│ ]
├── lastOrderId: "order-1707614XXX-abc123def"    ← CHECK THIS!
├── lastOrderDate: Timestamp                     ← CHECK THIS!
```

---

## Step 2: Server Logs - What to Look For

When payment is completed, check your server terminal (where `npm run dev` is running):

### Good Signs ✅
```
[Webhook] Processing laundry booking completion: { uid: '9g4GphSrUuVH8jxWnVleXTPiPax2', orderId: '...', email: '...' }
[Firebase] Order created in orders collection: order-1707614XXX-abc123def
[Firebase] ✓ Order synced to customer account: 9g4GphSrUuVH8jxWnVleXTPiPax2
```

### Bad Signs ❌
```
[Webhook] Missing uid in session metadata
[Firebase] Error creating order: NOT_FOUND
[Firebase] Error syncing to customer account: NOT_FOUND
```

---

## Step 3: Common Issues & Fixes

### Issue 1: Order has `uid` but User Document Doesn't Have `orders` Array

**Problem:** Order was created with correct `uid`, but it wasn't synced to user.orders

**Cause:** User document needs to exist first before the webhook tries to update it

**Fix:** Add the order manually to the user document

1. Go to Firebase Console
2. Click on `users` collection
3. Find your user document (by uid: `9g4GphSrUuVH8jxWnVleXTPiPax2`)
4. Click **Edit document**
5. Add a new field:
   - **Field name:** `orders`
   - **Type:** Array
   - **Value:** Add the following object:
   ```json
   {
     "orderId": "order-1707614XXX-abc123def",
     "email": "lukaverde045@gmail.com",
     "amount": 45.50,
     "status": "confirmed",
     "estimatedWeight": 5,
     "deliverySpeed": "standard",
     "createdAt": Timestamp,
     "deliveryAddress": {...}
   }
   ```

### Issue 2: Order Created With `userId` Instead of `uid`

**Problem:** Old orders might have been created with wrong field name

**Cause:** Code wasn't updated consistently

**Fix:** Use a Firestore batch operation to fix old orders

Go to Firebase Console → Firestore → Create a collection rule or manually:

For each order:
1. View the document
2. Add new field `uid` with the value from the order's user ID
3. Delete the `userId` field (if it exists)

**Or use this quick script in Firestore console:**

```javascript
// Run in Cloud Functions or your backend to fix all orders
const db = admin.firestore();
const orders = await db.collection('orders').get();

orders.forEach(async (doc) => {
  if (!doc.data().uid && doc.data().userId) {
    // Has userId but not uid - fix it
    await doc.ref.update({
      uid: doc.data().userId,
    });
  }
});
```

### Issue 3: User Document Doesn't Exist

**Problem:** Webhook tries to update user.orders but user doc doesn't exist

**Cause:** User wasn't created before order was made

**Fix:** Create the user document first

1. Go to Firebase Console → Users collection
2. Create a new document with ID = user's uid: `9g4GphSrUuVH8jxWnVleXTPiPax2`
3. Add these fields:
   ```
   email: "lukaverde045@gmail.com"
   name: "Your Name"
   createdAt: Timestamp.now()
   orders: []
   ```

---

## Step 4: Browser Console - What to Look For

When viewing dashboard, check browser console (F12):

### Good Signs ✅
```
[Dashboard] Fetching orders with auth token
[Dashboard] Orders API response status: 200
[Dashboard] Got orders: 1
```

### Bad Signs ❌
```
[Dashboard] Error fetching orders: Failed to load orders
[Dashboard] Error fetching orders: Unauthorized
[Dashboard] Error fetching orders: No orders found
```

---

## Step 5: Test the Complete Flow

1. **Verify API endpoint works:**
   ```
   Go to: http://localhost:3000/api/orders/user/9g4GphSrUuVH8jxWnVleXTPiPax2
   (You'll see "Unauthorized" in browser - that's expected, it needs auth header)
   ```

2. **Check dashboard logs:**
   - Open browser DevTools (F12)
   - Go to `/dashboard/customer`
   - Look at Console tab
   - Should see `[Dashboard] Got orders: X`

3. **If orders show:**
   - They'll display with all details (weight, delivery, address, price)
   - Click to expand and see full booking details

---

## Step 6: Manual Fix Commands

If the automatic sync didn't work, here's how to fix it manually:

### Option A: Firebase Console (Easy)

1. Find your user in `users` collection
2. Click the document
3. Click "Edit document" button
4. Add field: `orders` (Array type)
5. Click "Add an element" and paste order data
6. Save

### Option B: Firebase CLI (Advanced)

```bash
# Install firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy a function to fix orders
# Create a file: functions/fixOrders.js with the code above
firebase deploy --only functions:fixOrders
```

---

## Step 7: Verify the Fix

After applying any fixes:

1. **Clear browser cache:**
   - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

2. **Go to dashboard:**
   - Navigate to `/dashboard/customer`
   - Check "Active Orders" tab

3. **Should see:**
   - Order ID
   - Status: Confirmed
   - Weight and delivery details
   - Full delivery address
   - Total price

4. **If still not showing:**
   - Check browser console for errors
   - Check server logs for webhook issues
   - Verify Firestore has the data

---

## Quick Checklist

- [ ] Order document exists in `orders` collection
- [ ] Order has `uid` field (not `userId`)
- [ ] User document exists in `users` collection
- [ ] User document has `orders` array field
- [ ] `orders` array contains the order
- [ ] User has `lastOrderId` and `lastOrderDate` fields
- [ ] Server logs show successful webhook processing
- [ ] Browser console shows successful API response
- [ ] Dashboard shows orders when accessing `/dashboard/customer`

---

## Still Having Issues?

1. **Check server logs:** What does the webhook say?
2. **Check Firestore structure:** Does the data exist and match expected structure?
3. **Check browser console:** What API errors appear?
4. **Clear everything:** Delete test orders and try a fresh payment
5. **Check auth:** Is the user logged in with correct Firebase auth?

The most common issue is: **User document doesn't have `orders` array field**

Make sure it exists before orders will show in the dashboard!
