# ORDER SYNC FIX - QUICK SUMMARY

## The Problem
Orders were created in Firebase but **NOT synced to the customer's account**. The dashboard couldn't find them.

## The Root Cause (3-part failure)
1. **Missing uid** - Webhook didn't know which user to associate the order with
2. **Wrong metadata** - Only payment info passed, no booking details (weight, delivery, etc.)
3. **No account sync** - Order created in orders collection but never added to user.orders array

## The Fix (4 files modified)

### 1. Booking Page → Checkout API
✅ Now passes `uid: user.uid` to the checkout API

### 2. Checkout API → Stripe Session
✅ Now passes ALL booking details to Stripe metadata:
- estimatedWeight, deliverySpeed, pickupTime
- detergent, waterTemp, foldingPreference
- Full delivery address (line1, line2, city, state, postcode)
- All add-ons as JSON
- **Most importantly: uid** for the webhook

### 3. Webhook → Order Creation
✅ Now extracts booking data from Stripe metadata
✅ Reconstructs full bookingData object
✅ Creates order with laundry service details (not subscription)

### 4. Firebase Service → ACCOUNT SYNC
✅ **This was the missing piece!**
✅ When creating order, NOW also updates user.orders array:
```javascript
await userRef.update({
  orders: admin.firestore.FieldValue.arrayUnion({ orderId, email, amount, ... }),
  lastOrderId: orderId,
  lastOrderDate: timestamp,
})
```

## Data Flow Now
```
Booking Form
    ↓ (with uid + bookingData)
Checkout API
    ↓ (passes to Stripe metadata)
Stripe Session
    ↓ (user pays)
Webhook
    ↓ (reads uid + bookingData from metadata)
Firebase: Create order in TWO places:
  1. orders/{orderId}
  2. users/{uid}/orders array ← THIS IS NEW
    ↓
Dashboard can query user.orders
    ↓
✅ Order appears in customer's Washlee account
```

## Files Changed
- `/app/booking/page.tsx` - Line 270: Add uid to request
- `/app/api/checkout/route.ts` - Lines 10-22, 85-116: Accept and forward all booking data
- `/backend/routes/webhook.routes.js` - Lines 50-115: Handle booking orders with full data
- `/backend/services/firebaseService.js` - Lines 176-235: Add account sync

## Testing
1. Complete payment with Stripe test card: 4242 4242 4242 4242
2. Check Firebase Firestore:
   - `orders/{orderId}` should exist ✓
   - `users/{uid}/orders` should have the order in array ✓
3. Check Dashboard: Order should appear in Active Orders ✓

## Status
✅ FIXED - Orders now properly sync to customer accounts

---

**Before:** Order exists but customer can't see it  
**After:** Order created AND automatically linked to customer account
