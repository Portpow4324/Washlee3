# Debugging Session - Checkout Error Resolution

## Problem Statement
When submitting a booking and proceeding to checkout, the user receives an error response with an empty body `{}` instead of proper error details.

**Console Error**:
```
[BOOKING] Checkout Error Response: {}
Invalid checkout data
```

## Root Cause Investigation

The validation is failing at `/api/checkout` endpoint, but the error response appears empty. This could be due to:

1. **Validation Error**: One of the required fields in CheckoutSessionSchema is not passing validation
2. **Serialization Error**: The error response body is being serialized incorrectly
3. **JSON Parsing Error**: The response is being parsed as empty when it shouldn't be

## Changes Made for Debugging

### 1. Enhanced Browser Console Logging (booking/page.tsx)

Added detailed logging before and after the checkout API call:

```typescript
console.log('[BOOKING] Checkout Payload:', {
  orderId: checkoutPayload.orderId,
  orderTotal: checkoutPayload.orderTotal,
  customerEmail: checkoutPayload.customerEmail,
  customerName: checkoutPayload.customerName,
  uid: checkoutPayload.uid,
  hasBookingData: !!checkoutPayload.bookingData,
})

console.log('[BOOKING] Response Status:', checkoutResponse.status)
console.log('[BOOKING] Response OK:', checkoutResponse.ok)
```

Added better error parsing:
```typescript
if (!checkoutResponse.ok) {
  let errorData = {}
  try {
    // Try to parse error response as JSON
    errorData = await checkoutResponse.json()
  } catch (parseError) {
    console.error('[BOOKING] Failed to parse error response as JSON:', parseError)
  }
  console.error('[BOOKING] Checkout Error Response:', errorData)
}
```

### 2. Enhanced Client Token Logging (lib/firebaseAuthClient.ts)

Added detailed logging to track authentication:

```typescript
console.log('[AUTH] Getting ID token for user:', auth.currentUser.uid)
console.log('[AUTH] Successfully got ID token:', token.substring(0, 20) + '...')
console.log('[AUTH] Making authenticated request with Bearer token')
console.log('[AUTH] Response status:', response.status)
```

### 3. Enhanced Server Validation Logging (app/api/checkout/route.ts)

Added detailed validation error logging:

```typescript
console.error('[CHECKOUT-API] Validation failed with errors:', {
  fields: Object.keys(fieldErrors),
  details: fieldErrors
})
console.error('[CHECKOUT-API] Body content:', {
  orderId: body.orderId ? body.orderId.substring(0, 20) : 'MISSING',
  orderTotal: typeof body.orderTotal,
  customerEmail: body.customerEmail ? body.customerEmail.substring(0, 20) : 'MISSING',
  customerName: body.customerName,
  uid: body.uid ? body.uid.substring(0, 20) : 'MISSING',
  hasBookingData: !!body.bookingData,
})
```

## Expected Checkout Flow

1. **Client**: Submit booking form
   ```
   → Console: [BOOKING] Checkout Payload: {orderId, orderTotal, ...}
   → Console: [AUTH] Getting ID token for user: user_uid
   → Console: [AUTH] Successfully got ID token: eyJhbG...
   → Console: [AUTH] Making authenticated request with Bearer token
   → Console: [BOOKING] Response Status: 201 or 400
   ```

2. **Server**: Receive checkout request
   ```
   → Log: [CHECKOUT-API] Authentication verified for user: user_uid
   → If valid: Create Stripe session
   → If invalid: Log validation errors
   ```

3. **Expected Responses**:
   - **Success**: Status 201, Body: `{ success: true, sessionId: "...", url: "..." }`
   - **Validation Error**: Status 400, Body: `{ success: false, error: "Invalid checkout data", details: {...} }`
   - **Auth Error**: Status 401, Body: `{ success: false, error: "Unauthorized" }`

## Validation Schema Reference

The CheckoutSessionSchema requires:
```typescript
{
  orderId: string (min 10 chars)         // e.g., "ORD-123456789"
  orderTotal: number (min 24, max 10000) // Dollar amount
  customerEmail: string (valid email)     // e.g., "user@example.com"
  customerName: string (2-100 chars)      // e.g., "John Doe"
  uid: string (min 20 chars)             // Firebase UID (28 chars)
  bookingData: object (nested schema)     // All fields optional
}
```

## Next Steps

1. **Run a test booking submission**:
   - Open browser DevTools Console
   - Ensure user is logged in
   - Complete booking form
   - Click "Book Service"
   - Observe console logs

2. **Collect logs from both browser and server**:
   - Browser: Watch for `[BOOKING]` and `[AUTH]` logs
   - Server: Watch for `[CHECKOUT-API]` and `[ORDERS-API]` logs

3. **Identify the issue**:
   - If token logs show `[AUTH] Successfully got ID token` → Token is working
   - If validation error logs show which fields failed → Know what to fix
   - If validation passes but checkout fails → Check Stripe configuration

4. **Resolution path**:
   - If field validation fails → Ensure booking form sends correct data types
   - If Stripe fails → Check API keys and environment variables
   - If auth fails → Verify Firebase configuration

## Files Modified

- `/app/booking/page.tsx` - Added checkout logging and better error parsing
- `/lib/firebaseAuthClient.ts` - Added authentication token logging
- `/app/api/checkout/route.ts` - Added validation error logging
- `/app/api/orders/route.ts` - Enhanced authentication logging (from previous changes)

## Development Server Status

✅ Running on http://localhost:3000
✅ Hot-reload enabled
✅ All changes should be reflected immediately

---

**Status**: Ready for Testing
**Action**: Complete a booking submission and observe console logs
**Expected Output**: Detailed logs identifying the root cause of the error response
