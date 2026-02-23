# Firebase Structure Verification Checklist

## BEFORE Testing Payment

Make sure your Firebase Firestore has this structure:

```
collections/
├── users/
│   └── {YOUR_UID}/          ← Replace with your actual Firebase UID
│       ├── email: "your@email.com"
│       ├── name: "Your Name"
│       ├── phone: "+61..."
│       ├── orders: []        ← IMPORTANT: Start with empty array
│       ├── createdAt: Timestamp
│       └── (other fields)
│
└── orders/                  ← Create if doesn't exist
    └── (will be populated after payment)
```

**To verify:**
1. Go to Firebase Console → Firestore Database
2. Look at the left sidebar
3. You should see collections: `users`, `orders`, etc.
4. Click on `users` collection
5. Find your user document (ID = your Firebase UID)
6. Check that it has these fields:
   - ✅ email
   - ✅ name
   - ✅ phone
   - ✅ orders (Array type) - **Can be empty []**
   - ✅ createdAt

---

## AFTER Making Test Payment

Your Firestore should now have:

### 1. Order in `orders` collection

Path: `orders/{orderId}`

```
orderId: "order-1707614XXX-abc123def"
uid: "9g4GphSrUuVH8jxWnVleXTPiPax2"        ← Your UID
email: "your@email.com"
amount: 45.50
status: "confirmed"
createdAt: Timestamp(January 11, 2025, 2:30:45 PM)
updatedAt: Timestamp(January 11, 2025, 2:30:45 PM)
sessionId: "cs_test_..."
paymentId: "pi_test_..."
estimatedWeight: 5
deliverySpeed: "standard"
pickupTime: "soon"
scheduleDate: "2025-01-15"
scheduleTime: "14:00"
deliveryAddress: {
  line1: "Your Address Line 1",
  line2: "Your Address Line 2",
  city: "Your City",
  state: "VIC",
  postcode: "3000"
}
bookingData: { ...full booking details... }
timeline: [
  {
    status: "confirmed",
    timestamp: Timestamp,
    message: "Order confirmed with payment"
  }
]
```

### 2. Order synced to User document

Path: `users/{YOUR_UID}`

```
email: "your@email.com"
name: "Your Name"
phone: "+61..."
createdAt: Timestamp
orders: [
  {
    orderId: "order-1707614XXX-abc123def",
    email: "your@email.com",
    amount: 45.50,
    status: "confirmed",
    createdAt: Timestamp(January 11, 2025, 2:30:45 PM),
    estimatedWeight: 5,
    deliverySpeed: "standard",
    deliveryAddress: {
      line1: "Your Address Line 1",
      line2: "Your Address Line 2",
      city: "Your City",
      state: "VIC",
      postcode: "3000"
    }
  }
]
lastOrderId: "order-1707614XXX-abc123def"
lastOrderDate: Timestamp(January 11, 2025, 2:30:45 PM)
```

---

## How to Create Missing Collections/Documents

### If `users` collection doesn't exist:

1. Go to Firestore Database
2. Click "+ Start collection"
3. Collection ID: `users`
4. Click "Next"
5. Document ID: (leave auto-generated or use your Firebase UID)
6. Add a field:
   - Field: `email`, Type: `string`, Value: `your@email.com`
7. Click "Save"

### If your user document is missing `orders` field:

1. Go to Firestore → `users` collection
2. Find your document (by your Firebase UID)
3. Click the document to open it
4. Click "Edit document"
5. Click "Add field"
6. Field: `orders`
7. Type: `Array`
8. Value: Click "Add an element" and leave it empty for now
9. Click "Save"

### If `orders` collection doesn't exist:

1. Go to Firestore Database
2. Click "+ Start collection"
3. Collection ID: `orders`
4. Click "Next"
5. Document ID: (will be auto-generated from webhook)
6. Don't add any fields yet - webhook will create the structure
7. Click "Save"

---

## Testing the Complete Flow

### Step 1: Verify your user is ready
- [ ] User document exists in `users` collection
- [ ] User has these fields: email, name, phone, orders, createdAt
- [ ] `orders` array is empty (or has previous orders)

### Step 2: Make a test payment
1. Go to http://localhost:3000/booking
2. Fill out form completely
3. Click "Confirm & Pay"
4. Use test card: 4242 4242 4242 4242 (12/34, 123)
5. Click "Pay"
6. Should see success page with order ID

### Step 3: Verify webhook worked
- [ ] Check server logs: should see "checkout.session.completed"
- [ ] Check server logs: should see "Order created in orders collection"
- [ ] Check server logs: should see "Order synced to customer account"
- [ ] Check Firestore: new order should exist in `orders` collection
- [ ] Check Firestore: user document should have order in `orders` array
- [ ] Check Firestore: user document should have `lastOrderId` and `lastOrderDate`

### Step 4: Verify dashboard fetches order
1. Go to http://localhost:3000/dashboard/customer
2. Press F12 → Console tab
3. Should see: "[Dashboard] Got orders: 1" (or however many orders you have)
4. Your order should appear in "Active Orders" section
5. Should show: order ID, status, weight, delivery type, address, price

### Step 5: Verify success page shows real order ID
1. After payment, success page should show:
   - ✅ Real order ID: "order-1707614XXX-abc123def" (NOT "temp-...")
   - ✅ Status: Confirmed
   - ✅ Booking details: weight, delivery type, address
   - ✅ Total price: correct amount

---

## Field Names to Check (CRITICAL)

❌ **WRONG:**
```
userId: "9g4GphSrUuVH8jxWnVleXTPiPax2"  ← DON'T USE THIS
```

✅ **CORRECT:**
```
uid: "9g4GphSrUuVH8jxWnVleXTPiPax2"     ← USE THIS
```

Make sure all orders have `uid` field, not `userId`.

---

## If Orders Still Don't Show

### Check 1: Query Field Mismatch
The dashboard is now using `/api/orders/user/{uid}` which queries with:
```javascript
where('uid', '==', uid)
```

If your order has `userId` instead of `uid`, it won't be found.

**Fix:** Edit order document and change `userId` to `uid`

### Check 2: User Document Doesn't Have Orders Array
If webhook tries to update `user.orders` but the field doesn't exist, it will fail.

**Fix:** Add `orders: []` field to user document manually

### Check 3: Auth Token Expired
API call needs valid Firebase auth token.

**Fix:** 
1. Clear browser cookies/cache
2. Log out and log back in
3. Try dashboard again

### Check 4: Firestore Security Rules
If rules deny access, queries will fail silently.

**Fix:** Check Firestore Rules (should allow reads on user's own document)

```firestore
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
}
```

---

## Server Logs to Expect

### Success (✅)
```
[Webhook] Received event: checkout.session.completed
[Webhook] Processing laundry booking completion: { uid: 'xxxxx', orderId: 'order-1707614...', email: '...' }
[Webhook] User verified: xxxxx
[Firebase] Order created in orders collection: order-1707614...
[Firebase] ✓ Order synced to customer account: xxxxx
[Webhook] ✓ Order created and synced to user account: order-1707614...
```

### Failure (❌)
```
[Webhook] Missing uid in session metadata
[Webhook] Missing orderId in session metadata
[Webhook] User xxxxx not found in Firebase
[Firebase] Error creating order: NOT_FOUND
[Firebase] Error syncing to customer account: NOT_FOUND
```

---

## Quick Checklist Before Testing

- [ ] User document exists with uid as document ID
- [ ] User document has `orders` array (can be empty)
- [ ] User document has `email` field
- [ ] orders collection exists (can be empty)
- [ ] Stripe webhook endpoint is configured correctly
- [ ] Firebase credentials in .env.local are correct
- [ ] Dev server running: `npm run dev`
- [ ] Not using Firebase Emulator (or it's properly configured)
- [ ] Browser is logged in (user.uid is available)
- [ ] Test card is ready: 4242 4242 4242 4242

---

## Commands to Check Status

```bash
# Check if orders collection exists and has orders
firebase firestore:list-collection-paths

# Check Firestore Rules
firebase firestore:rules:get

# Check if webhook endpoint is accessible
curl -X POST http://localhost:3000/api/webhooks/stripe -H "stripe-signature: test"

# Check server logs
grep "checkout.session.completed" ~/.pm2/logs/app.log 2>/dev/null

# Get your Firebase UID
# Go to Firebase Console → Authentication → Users → Copy UID
```

---

## Next: Run Test Payment

When everything is set up, run the complete flow:

1. ✅ User document exists with orders array
2. ✅ orders collection created
3. ✅ Dev server running
4. ✅ Go to /booking → fill form → pay
5. ✅ Check server logs for webhook success
6. ✅ Check Firestore for new order
7. ✅ Go to /dashboard/customer → refresh
8. ✅ Order should appear in Active Orders

**Good luck! 🚀**
