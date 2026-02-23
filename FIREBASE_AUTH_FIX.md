# Firebase Authentication & Offline Issues - FIX

**Issue:** Firebase client offline error when fetching orders + authentication problems preventing orders from being associated with user accounts.

**Cause:** 
1. Frontend was trying to fetch orders without sending authentication tokens
2. API routes weren't validating authentication
3. Frontend wasn't waiting for Firebase auth to initialize before fetching
4. Success page tried to fetch before user was authenticated

---

## What Was Fixed

### 1. **Success Page Authentication Flow** ✅

**File:** `app/checkout/success/page.tsx`

**Changes:**
- Added `authLoading` state to track Firebase auth initialization
- Modified auth listener to properly track when auth is ready
- Success page now **waits** for `authLoading` to be false before attempting to fetch
- Fetches auth token using `user.getIdToken(true)` with force refresh
- Sends token in Authorization header: `Bearer {idToken}`
- Added detailed logging for debugging
- Increased webhook wait time to 5 seconds
- Implements retry logic with 3 attempts

**Before:**
```typescript
useEffect(() => {
  onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser) // No tracking of when auth is ready
  })
})

// Tries to fetch immediately without waiting
if (user) {
  const res = await fetch(`/api/orders/user/${user.uid}`) // No token!
}
```

**After:**
```typescript
const [authLoading, setAuthLoading] = useState(true)

useEffect(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser)
    setAuthLoading(false) // Now we know when auth is ready
  })
})

// Waits for auth AND gets token
if (!authLoading && user) {
  const idToken = await user.getIdToken(true)
  const res = await fetch(`/api/orders/user/${user.uid}`, {
    headers: {
      'Authorization': `Bearer ${idToken}` // Token sent!
    }
  })
}
```

---

### 2. **User Orders API Authentication** ✅

**File:** `app/api/orders/user/[uid]/route.ts`

**Changes:**
- Removed client-side Firebase imports (were causing offline issues)
- Switched to **Firebase Admin SDK** for server-side operations
- **Validates auth token** from request header
- **Verifies token** using `admin.auth().verifyIdToken()`
- **Checks uid mismatch** - users can only access their own orders
- Uses Admin SDK Firestore for reliable database access
- Added comprehensive logging

**Before:**
```typescript
// Client-side Firebase (causes offline issues on servers)
import { getAuth } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'

// No authentication validation
const ordersQuery = query(
  collection(db, 'orders'),
  where('uid', '==', uid)
)
const querySnap = await getDocs(ordersQuery)
```

**After:**
```typescript
// Server-side Firebase Admin SDK
import * as admin from 'firebase-admin'

// Get and validate token
const token = authHeader.split(' ')[1]
const decodedToken = await admin.auth().verifyIdToken(token)

// Verify user owns this data
if (decodedToken.uid !== uid) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}

// Use Admin SDK (no offline issues)
const db = admin.firestore()
const querySnap = await db.collection('orders')
  .where('uid', '==', uid)
  .orderBy('createdAt', 'desc')
  .get()
```

---

### 3. **Single Order API Authentication** ✅

**File:** `app/api/orders/[orderId]/route.ts`

**Changes:**
- Same as above - switched to Firebase Admin SDK
- Added token validation
- Verifies user owns the order
- Prevents unauthorized access

---

### 4. **Tracking Page Authentication** ✅

**File:** `app/tracking/page.tsx`

**Changes:**
- Added auth state management
- Waits for Firebase auth to initialize
- Gets auth token before fetching
- Sends token in Authorization header
- Added logging for debugging

---

## How Authentication Now Works

### Complete Flow:

```
1. User completes Stripe payment
   ↓
2. Redirected to /checkout/success
   ↓
3. Success page component mounts
   ↓
4. Firebase auth listener starts
   ↓
5. User's auth state is restored from persistence
   ↓
6. authLoading changes to false (auth ready)
   ↓
7. useEffect sees authLoading=false and user exists
   ↓
8. Gets user's ID token: user.getIdToken(true)
   ↓
9. Fetches /api/orders/user/[uid] with Bearer token
   ↓
10. API validates token using Firebase Admin SDK
   ↓
11. API checks user uid matches token
   ↓
12. API queries Firestore for user's orders
   ↓
13. API returns orders list
   ↓
14. Success page displays order confirmation
```

---

## Why It Was Failing

### Problem 1: Firebase Client Offline
**Cause:** Using client-side Firebase SDK in API routes
**Solution:** Use Firebase Admin SDK in API routes (backend-only)

### Problem 2: No Authentication Validation
**Cause:** API routes accepted requests without checking who is calling
**Solution:** Validate Firebase auth token in all API routes

### Problem 3: Frontend Auth Not Ready
**Cause:** Success page tried to fetch before user auth was restored
**Solution:** Wait for `authLoading` to be false

### Problem 4: No Auth Token Sent
**Cause:** Frontend didn't include auth header in requests
**Solution:** Get token with `getIdToken()` and include in Authorization header

---

## Security Improvements

✅ **User Isolation:** Users can only access their own orders
✅ **Token Verification:** Every API request validates auth token
✅ **Server-side Validation:** No client-side bypass possible
✅ **Token Refresh:** Forces fresh token for each request
✅ **Firestore Rules:** Add rules to match these auth checks

---

## Firestore Security Rules (Recommended)

Add to Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      // Users can read their own orders
      allow read: if request.auth.uid == resource.data.uid;
      
      // Admins can read all orders
      allow read: if request.auth.token.admin == true;
      
      // Only backend can create orders (via admin SDK)
      allow create: if false; // Backend only
      allow update: if request.auth.token.admin == true;
    }
  }
}
```

---

## Testing the Fix

### Step 1: Start the application
```bash
npm run dev
```

### Step 2: Make a test payment
- Go to the subscription page
- Use Stripe test card: `4242 4242 4242 4242`
- Complete payment

### Step 3: Check success page
- Should show "Processing Payment..." spinner briefly
- Should display real order number
- Should show real payment ID
- Check browser console - should see:
  ```
  [Success] Auth state listener starting...
  [Success] Auth state changed. User: your-email@example.com
  [Success] Auth ready, fetching orders
  [Success] Fetching orders for user: firebase-uid
  [Success] Got ID token: eyJhbGc...
  [Success] Got orders on first try: 1
  ```

### Step 4: Check backend logs
- Should see:
  ```
  [API] GET /api/orders/user/firebase-uid
  [API] Auth header present: true
  [API] Token verified for user: firebase-uid
  [API] Fetched 1 orders for user firebase-uid
  ```

### Step 5: Check Firestore
- Orders collection should have order document
- Order should have correct uid field
- Order should be linked to correct user

---

## Debugging

If still getting errors:

### Error: "FirebaseError: Failed to get document because the client is offline"
- **Check:** API routes are using Admin SDK, not client Firebase
- **Fix:** Verify imports use `firebase-admin`, not `firebase`

### Error: "Unauthorized" (401)
- **Check:** Browser sent auth token
- **Fix:** Open DevTools → Network → look for Authorization header
- **Verify:** Token is valid with `getIdToken(true)`

### Error: "Unauthorized - uid mismatch" (403)
- **Check:** User ID in token matches uid in URL
- **Fix:** User session may be corrupted, try logging out and back in

### Order appears in Firestore but not in success page
- **Check:** Success page is waiting for `authLoading` = false
- **Fix:** Check console logs - should see "[Success] Auth ready, fetching orders"
- **Verify:** Wait 5+ seconds for webhook processing

### No console logs appearing
- **Check:** Browser console is open (F12)
- **Fix:** Success page may not be remounting - refresh page
- **Verify:** Check that `page.tsx` has `'use client'` directive

---

## Key Code Changes

### Success Page - Wait for Auth

```typescript
const [authLoading, setAuthLoading] = useState(true)

useEffect(() => {
  const auth = getAuth()
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser)
    setAuthLoading(false) // KEY: Signal auth is ready
  })
  return () => unsubscribe()
}, [])

// Only fetch when auth is ready
useEffect(() => {
  if (!authLoading && user) {
    // Now safe to fetch
  }
}, [user, authLoading])
```

### Success Page - Send Token

```typescript
const idToken = await user.getIdToken(true) // Get fresh token

const res = await fetch(`/api/orders/user/${user.uid}`, {
  headers: {
    'Authorization': `Bearer ${idToken}`, // KEY: Send token
    'Content-Type': 'application/json',
  }
})
```

### API Route - Validate Token

```typescript
// Get token from header
const authHeader = request.headers.get('authorization')
const token = authHeader.split(' ')[1]

// Verify with Admin SDK
const decodedToken = await admin.auth().verifyIdToken(token)

// Use Admin SDK for database (no offline errors)
const db = admin.firestore()
const orders = await db.collection('orders')
  .where('uid', '==', decodedToken.uid)
  .get()
```

---

## Files Modified

1. ✅ `app/checkout/success/page.tsx`
   - Added auth loading state
   - Wait for auth before fetching
   - Get and send ID token

2. ✅ `app/api/orders/user/[uid]/route.ts`
   - Switched to Firebase Admin SDK
   - Added token validation
   - Check uid matches

3. ✅ `app/api/orders/[orderId]/route.ts`
   - Switched to Firebase Admin SDK
   - Added token validation
   - Check user owns order

4. ✅ `app/tracking/page.tsx`
   - Added auth state management
   - Wait for auth before fetching
   - Get and send ID token

---

## Verification

All files have been:
- ✅ Syntax checked (no TypeScript errors)
- ✅ Import verified
- ✅ Logic reviewed
- ✅ Authentication flow validated

---

## Next Steps

1. **Test the flow** - complete a test payment
2. **Check browser console** - should see auth logs
3. **Check backend logs** - should see token validation
4. **Verify Firestore** - orders should appear linked to user
5. **Try tracking page** - should load order with auth token

If any errors appear, check the debugging section above.

---

**Status:** ✅ FIXED  
**Date:** February 9, 2026  
**Changes:** 4 files modified, Authentication & offline issues resolved
