# Complete Order Flow Troubleshooting Guide

## The Complete Flow (What Should Happen)

```
1. USER GOES TO BOOKING PAGE
   ├─ /app/booking/page.tsx loads
   ├─ User is logged in (has Firebase uid)
   ├─ Form is filled out (weight, delivery type, address, etc)
   └─ "Confirm & Pay" button is clicked

2. CHECKOUT API IS CALLED
   ├─ POST /api/checkout
   ├─ Sends uid, email, booking details
   ├─ Creates Stripe Checkout Session
   ├─ Stores all booking data in Stripe session metadata
   ├─ Returns session.url (Stripe payment page)
   └─ User is redirected to Stripe

3. USER PAYS ON STRIPE
   ├─ Enters card details
   ├─ Stripe processes payment
   ├─ Payment succeeds
   └─ Stripe sends webhook event

4. WEBHOOK IS RECEIVED
   ├─ POST /api/webhooks/stripe (backend route)
   ├─ Stripe signature is verified
   ├─ Event type is "checkout.session.completed"
   ├─ Extracts uid, orderId from session metadata
   ├─ Extracts all booking data from session metadata
   └─ Calls createOrder() function

5. ORDER IS CREATED IN FIREBASE
   ├─ Creates document in orders/{orderId}
   │  └─ Contains: uid, email, amount, status, booking details
   ├─ Updates users/{uid} document
   │  └─ Adds to orders[] array
   │  └─ Sets lastOrderId and lastOrderDate
   └─ Logs success to server console

6. USER IS REDIRECTED TO SUCCESS PAGE
   ├─ /checkout/success page loads
   ├─ Displays order confirmation
   ├─ Shows real order ID (not temp-...)
   ├─ Shows booking details
   └─ Shows "Go to Dashboard" button

7. USER GOES TO DASHBOARD
   ├─ /dashboard/customer page loads
   ├─ useEffect calls fetchOrders()
   ├─ Gets auth token: user.getIdToken()
   ├─ Calls: fetch('/api/orders/user/{uid}', { headers: { 'Authorization': 'Bearer {token}' } })
   ├─ API verifies token with Firebase Admin SDK
   ├─ API queries: db.collection('orders').where('uid', '==', uid)
   ├─ API returns orders array
   ├─ Dashboard sets state with orders
   ├─ Dashboard renders Active Orders tab
   └─ User sees their order!
```

---

## Troubleshooting Decision Tree

Start at the top and work your way down:

### ❓ Does the order exist in Firestore?

**NO** → Go to: "Order Not Created in Firebase"
- Webhook didn't receive event
- Webhook couldn't create order
- Firebase credentials not working

**YES** → Go to: "Order Exists in Firestore"
- Order created but dashboard not showing
- API not fetching correctly
- Auth token issue

---

## ORDER NOT CREATED IN FIRESTORE

**Symptoms:**
- No documents in `orders` collection
- User document doesn't have `orders` array entry
- Server logs don't show "Order created in orders collection"

**Step 1: Check Server Logs**
Look at terminal where `npm run dev` is running:

```
✓ Should see:
  [Webhook] Received event: checkout.session.completed
  [Webhook] Processing laundry booking completion: { uid: '...', orderId: '...', email: '...' }

✗ If you DON'T see these:
  → Webhook endpoint not receiving events
  → Go to Step 2
```

**Step 2: Verify Webhook Endpoint Configuration**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Find endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Check it's enabled and listening to `checkout.session.completed`
4. Click the endpoint to see recent deliveries
5. Look for recent payment attempts
6. Check the response code:
   - ✅ 200: Webhook was received and processed
   - ❌ 5xx: Server error processing webhook
   - ❌ No events: Webhook never sent

**Step 3: Verify Checkout API Stores Metadata**

Check `/app/api/checkout/route.ts`:

```typescript
// Should have this:
const bookingData = {
  estimatedWeight: parseFloat(req.body.estimatedWeight),
  deliverySpeed: req.body.deliverySpeed,
  // ... other fields
}

// And pass to Stripe:
session = await stripe.checkout.sessions.create({
  metadata: {
    uid: req.body.uid,                    ← CRITICAL
    orderId: bookingData.orderId,
    estimatedWeight: String(bookingData.estimatedWeight),
    deliverySpeed: bookingData.deliverySpeed,
    // ... all other booking data as strings
  }
})
```

**Step 4: Check Firebase Credentials**

`.env.local` should have:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_ADMIN_SDK_PRIVATE_KEY=...
FIREBASE_ADMIN_SDK_CLIENT_EMAIL=...
FIREBASE_ADMIN_SDK_PROJECT_ID=...
```

**Step 5: Check Webhook Handler**

Verify `/backend/routes/webhook.routes.js` has:
```javascript
// Should extract uid from metadata:
const uid = session.metadata?.uid

// Should check if uid exists:
if (!uid) {
  console.error('[Webhook] Missing uid in session metadata')
  return
}

// Should call createOrder:
const order = await createOrder(uid, { ... })
```

**Step 6: Test Manually**

If webhook still not working, manually create an order to test Firebase:

1. Go to Firebase Console → Firestore
2. Create a new document in `orders` collection
3. Add fields:
   ```
   orderId: "test-order-123"
   uid: "YOUR_UID"
   email: "your@email.com"
   amount: 45.50
   status: "test"
   createdAt: Timestamp.now()
   ```
4. Go to dashboard → should it appear?
   - ✅ YES: Firebase is working, webhook is the problem
   - ❌ NO: API or dashboard is the problem

---

## ORDER EXISTS IN FIRESTORE

**Symptoms:**
- Order document exists in `orders/{orderId}`
- But dashboard shows no orders
- Or: Order shows temp ID instead of real ID

**Step 1: Check Success Page**

After payment, success page shows:
- ✅ GOOD: Real order ID like "order-1707614..."
- ❌ BAD: Temp ID like "temp-xxxxxxxx"

If temp ID:
→ Success page is using client-side Firebase instead of API
→ Fix: `/checkout/success` should get orderId from query params or API, not create temp

**Step 2: Check User Document Structure**

Go to Firebase Console → Firestore → users collection:

```
users/{YOUR_UID}
├─ email: string
├─ name: string
├─ orders: ARRAY               ← CRITICAL: must exist!
├─ lastOrderId: string
└─ lastOrderDate: Timestamp
```

**If `orders` array doesn't exist:**
1. Click user document
2. Click "Edit document"
3. Add field: `orders`
4. Type: Array
5. Leave empty for now
6. Save

**If no `orders` entries:**
1. Webhook didn't sync
2. Check server logs for sync errors
3. Manually add: 
   ```json
   {
     "orderId": "order-1707614...",
     "email": "your@email.com",
     "amount": 45.50,
     "status": "confirmed",
     "createdAt": Timestamp,
     "estimatedWeight": 5,
     "deliverySpeed": "standard"
   }
   ```

**Step 3: Check Order Has `uid` Field**

Go to order document: `orders/{orderId}`

Check:
- ✅ Has `uid` field (not `userId`)
- ✅ `uid` matches your Firebase UID
- ✅ `uid` is not empty

If `uid` is wrong or missing:
1. Click order document
2. Edit: change `userId` → `uid`
3. Make sure it's your actual Firebase UID
4. Save

**Step 4: Check Dashboard Console Logs**

Go to dashboard: http://localhost:3000/dashboard/customer
Press F12 → Console tab

Look for:
```
[Dashboard] Fetching orders with auth token
[Dashboard] Orders API response status: 200
[Dashboard] Got orders: 1
```

**If you see errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `[Dashboard] Error fetching orders: Unauthorized` | Auth token invalid | Log out and back in |
| `[Dashboard] Error fetching orders: No orders found` | API returned empty | Check Firebase has orders with uid field |
| `[Dashboard] Error fetching orders: Failed to fetch` | Network error | Check API endpoint is running |
| `Uncaught ReferenceError: user is undefined` | Not logged in | Go to login page first |

**Step 5: Check API Endpoint**

API route: `/app/api/orders/user/[uid]/route.ts`

Should:
1. ✅ Verify Bearer token
2. ✅ Extract uid from path
3. ✅ Query: `where('uid', '==', uid)`
4. ✅ Return orders array

**To test API manually:**

```bash
# Get your Firebase auth token (hard part)
# Then run:
curl -X GET 'http://localhost:3000/api/orders/user/YOUR_UID' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Should return:
# {"count": 1, "orders": [{...your order...}]}
```

**Step 6: Check Firebase Security Rules**

Go to Firebase Console → Firestore → Rules

Should allow:
```firestore
match /orders/{document=**} {
  allow read, write: if request.auth.uid != null;
}

match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
}
```

---

## SPECIFIC ERROR MESSAGES

### "Error: admin.initializeApp() called more than once"

**Cause:** Firebase Admin SDK already initialized

**Fix in `/app/api/orders/user/[uid]/route.ts`:**
```typescript
// Change from:
admin.initializeApp()

// To:
if (!admin.apps.length) {
  admin.initializeApp()
}
```

### "Error: PERMISSION_DENIED: Missing or insufficient permissions"

**Cause:** Firestore security rules too strict

**Fix:** Go to Firebase Console → Firestore → Rules and set:
```firestore
match /databases/{database}/documents {
  match /orders/{document=**} {
    allow read, write: if request.auth.uid != null;
  }
  match /users/{uid} {
    allow read, write: if request.auth.uid == uid;
  }
}
```

### "Error: [firebase_firestore/no-document] No document to update"

**Cause:** User document doesn't exist when webhook tries to sync

**Fix:**
1. Create user document in Firebase Console first
2. Or: Update webhook to create user if not exists

**In `/backend/services/firebaseService.js`:**
```javascript
const userRef = db.collection('users').doc(uid)

// Option 1: Create if doesn't exist
await userRef.set({
  orders: []
}, { merge: true })

// Then update:
await userRef.update({
  orders: admin.firestore.FieldValue.arrayUnion({...}),
  lastOrderId: orderId,
  lastOrderDate: Timestamp.now()
})
```

### "IndexError: Firestore composite index not found"

**Cause:** Query uses `where` + `orderBy` without composite index

**Fix:**
Click the error message → it gives a link to create the index
OR go to Firebase Console → Firestore → Indexes → Create composite index

Index should be:
- Collection: `orders`
- Fields: `uid` (Ascending), `createdAt` (Descending)

---

## QUICK FIX CHECKLIST

If orders still not showing after payment:

- [ ] **Step 1:** Check Firestore → orders collection has documents
  - [ ] Order has `uid` field (not `userId`)
  - [ ] Order has correct uid matching your user
  - [ ] Order has `createdAt` timestamp

- [ ] **Step 2:** Check Firestore → users/{YOUR_UID} document
  - [ ] User document exists
  - [ ] Has `orders` field (Array type)
  - [ ] orders array has at least one entry
  - [ ] Entry has `orderId` matching order document

- [ ] **Step 3:** Check server logs
  - [ ] "checkout.session.completed" received
  - [ ] "Order created in orders collection"
  - [ ] "Order synced to customer account"
  - [ ] No error messages

- [ ] **Step 4:** Check browser console
  - [ ] Logged in (user object exists)
  - [ ] Able to get auth token
  - [ ] "[Dashboard] Got orders: X" message
  - [ ] No "Unauthorized" errors

- [ ] **Step 5:** If manual test worked
  - [ ] Clear browser cache
  - [ ] Log out and back in
  - [ ] Try dashboard again

---

## If Everything Else Fails

### Nuclear Option: Manually Sync One Order

1. **In Firebase Console:**
   - Go to users → YOUR_UID
   - Click "Edit document"
   - Find the `orders` array
   - Click "Add element"
   - Paste order data:
   ```json
   {
     "orderId": "order-1707614123456789",
     "email": "your@email.com",
     "amount": 45.50,
     "status": "confirmed",
     "createdAt": <CURRENT_TIMESTAMP>,
     "estimatedWeight": 5,
     "deliverySpeed": "standard",
     "deliveryAddress": {
       "line1": "Your Address",
       "line2": "",
       "city": "Your City",
       "state": "VIC",
       "postcode": "3000"
     }
   }
   ```
   - Save

2. **In dashboard:**
   - Refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Go to `/dashboard/customer`
   - Check "Active Orders" tab

If order appears now: Firebase is working, webhook is the issue
If order still doesn't appear: API/dashboard is the issue

### Debug the API Directly

In browser console at `/dashboard/customer`:
```javascript
// Get auth token
const user = await firebase.auth().currentUser;
const token = await user.getIdToken();
console.log('Token:', token);

// Call API
fetch(`/api/orders/user/${user.uid}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('API Response:', d));
```

This will show exactly what the API is returning.

---

## Getting Help

If you're still stuck, provide:

1. **Firestore structure screenshot** - show users and orders collections
2. **Server logs** - from `npm run dev` terminal
3. **Browser console logs** - from F12 Developer Tools
4. **Which step fails:**
   - [ ] Order not in Firestore
   - [ ] Order in Firestore but not synced to user.orders
   - [ ] Dashboard not fetching orders
   - [ ] API returning error
   - [ ] Auth token issue

---

**Remember: The flow must work end-to-end:**
```
Payment → Webhook → Firebase Order Created → Order Synced to User → API Fetches → Dashboard Shows Order
```

If any step breaks, the whole flow breaks!
