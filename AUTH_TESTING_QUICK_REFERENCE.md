# Quick Reference - Firebase Authentication Testing

## Development Server
```bash
# Start dev server
npm run dev

# Server runs on http://localhost:3001
# Kill any existing process: pkill -f "next dev"
```

## Key Files Modified

### New Utility Files
- `lib/firebaseAuthClient.ts` - Client-side: `getAuthToken()`, `authenticatedFetch()`
- `lib/firebaseAuthServer.ts` - Server-side: `verifyToken()`

### Updated to Use Authentication
- `app/booking/page.tsx` - Uses `authenticatedFetch()` for `/api/orders` and `/api/checkout`
- `app/dashboard/page.tsx` - Uses `authenticatedFetch()` for `/api/orders/user/{uid}`
- `app/api/orders/route.ts` - Verifies Firebase token in POST handler
- `app/api/checkout/route.ts` - Verifies Firebase token in POST handler

## Test Scenarios

### ✅ Test 1: Book an Order (With Auth)
```
1. Go to http://localhost:3001/booking
2. Login if not already
3. Fill form: Service type, Pickup address, Delivery address, Weight
4. Click "Book Service"

Expected: 
- Network tab shows POST /api/orders with Authorization: Bearer header
- Response: 201 Created with orderId
- Console: "[ORDERS-API] Authentication verified for user: {uid}"
- Order appears in Firestore
```

### ✅ Test 2: View Dashboard Orders (With Auth)
```
1. Go to http://localhost:3001/dashboard/customer
2. Wait for page to fully load

Expected:
- Network tab shows GET /api/orders/user/{uid} with Authorization: Bearer header
- Response: 200 OK with orders array
- Dashboard displays user's orders
- No 401 errors
```

### ✅ Test 3: Unauthenticated Request (Without Auth)
```
1. Open browser console (F12 or Cmd+Option+J on Mac)
2. Type:
   fetch('/api/orders', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({})
   }).then(r => r.json()).then(console.log)

Expected:
- Response status: 401
- Response: {success: false, error: 'Unauthorized', code: 'UNAUTHORIZED'}
```

### ✅ Test 4: Checkout with Auth
```
1. Start order from /booking
2. Complete form and proceed to checkout
3. Click "Confirm & Pay"

Expected:
- Network tab shows POST /api/checkout with Authorization: Bearer header
- Response: 201 Created with sessionId and Stripe URL
- Redirected to Stripe checkout page
```

## Verification Commands

### Check if changes were applied
```bash
# View authenticatedFetch usage
grep -r "authenticatedFetch" app/

# View verifyToken usage
grep -r "verifyToken" app/api/

# View new files
ls -la lib/firebaseAuth*
```

### Monitor build
```bash
npm run build

# Look for:
# ✓ Compiled successfully
# ✓ Generating static pages: 142 pages
# (no errors about useSearchParams or duplicates)
```

### Monitor dev server logs
```
# Server logs should show:
# [ORDERS-API] Authentication verified for user: {uid}
# [CHECKOUT-API] Authentication verified for user: {uid}
```

## Network Tab Verification

When testing, check Network tab for these headers:

### POST /api/orders
```
Headers:
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Imsa...
  Content-Type: application/json

Response:
  Status: 201 Created
  {
    "success": true,
    "orderId": "ORD123...",
    "customerId": "user_uid"
  }
```

### GET /api/orders/user/{uid}
```
Headers:
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Imsa...

Response:
  Status: 200 OK
  {
    "success": true,
    "count": 2,
    "orders": [...]
  }
```

## Firestore Verification

After creating orders, check Firestore:

```
Collections → orders
  Document: {orderId}
    Fields:
      customerId: "{user_uid}"  ← Should match current user's uid
      createdAt: {timestamp}
      pickupAddress: "..."
      deliveryAddress: "..."
      ...
```

## Common Issues

### Issue: 401 Unauthorized on /api/orders
**Cause**: User not logged in or token expired
**Solution**: Ensure user is authenticated before submitting form

### Issue: 500 Internal Server Error
**Cause**: Token verification failed silently
**Solution**: Check console logs for `[ORDERS-API]` messages

### Issue: Network shows no Authorization header
**Cause**: authenticatedFetch() not being used
**Solution**: Verify imports and function calls in page.tsx files

### Issue: CORS errors
**Cause**: Development server port issue
**Solution**: Kill process and restart: `pkill -f "next dev" && npm run dev`

## Quick Debug Checklist

- [ ] Dev server running on port 3001
- [ ] User logged in (check Auth section in Firebase Console)
- [ ] Network tab open when submitting order
- [ ] Authorization header visible in Network tab
- [ ] Response status is 201 (not 401 or 500)
- [ ] Order appears in Firestore with correct customerId
- [ ] Console shows auth verification logs
- [ ] No errors in browser console

## Important Notes

1. **Token lifetime**: Firebase ID tokens expire after 1 hour
   - `authenticatedFetch()` calls `getIdToken(true)` to refresh automatically

2. **User authentication**: Booking/Dashboard pages require user to be logged in
   - If not logged in, token will be null
   - Request will fail with 401

3. **Firestore Security Rules**: Should allow reads/writes when `request.auth.uid` matches customerId
   - Check Firebase Console → Firestore → Rules tab

4. **Rate Limiting**: Still applied after authentication check
   - Checkout: 5 requests per minute
   - Orders: 10 requests per minute
   - Orders user: 30 requests per minute

---

**Quick Summary**: All requests now include Firebase ID tokens automatically, server verifies tokens, only authenticated users can create orders/checkout sessions.
