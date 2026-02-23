# Complete Order Flow - From Booking to Dashboard

## Overview
This document explains the complete order lifecycle: how orders are created, paid for, synced to customer accounts, and displayed in dashboards.

---

## STEP 1: BOOKING PAGE (Frontend) 🛒
**File:** `/app/booking/page.tsx`  
**What Happens:** User fills out laundry booking form

### User Input
```
- Weight: 5 kg
- Services: Wash & fold, hang dry, etc.
- Delivery: Standard or Same-day
- Address: Pickup/delivery location
- Preferences: Detergent, water temp, etc.
```

### Form Data Structure
```typescript
bookingData = {
  estimatedWeight: '5',
  deliverySpeed: 'standard',
  pickupTime: 'soon',
  scheduleDate: '',
  scheduleTime: '',
  detergent: 'eco-friendly',
  waterTemp: 'warm',
  foldingPreference: 'folded',
  specialCare: '',
  deliveryAddress: { address details },
  addOns: {
    hangDry: false,
    delicatesCare: false,
    comforterService: false,
    stainTreatment: 0,
    ironing: false,
  },
}
```

### Price Calculation
```javascript
// Base: weight × $3.00
let orderTotal = 5 * 3.0 = $15.00

// Add services
+ hangDry: 5 * $3.30 = $16.50 ❌ (not selected)
+ delicatesCare: 5 * $4.40 = $22.00 ❌ (not selected)
+ comforterService: $25.00 ❌
+ stainTreatment: items × $0.50 ❌
+ ironing: weight × $6.60 ❌

// Add delivery
+ sameDay: $5.00 ❌ (standard delivery)

= Total: $15.00 ❌ BELOW MINIMUM!

// User adds more weight or services...
= Total: $45.50 ✅ ABOVE MINIMUM ($24)
```

### Action: User Clicks "Confirm & Pay"
The booking page calls the checkout API:

```typescript
const checkoutResponse = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId,                          // temp or from Firestore
    orderTotal: 45.50,               // validated total
    customerEmail: user.email,       // "user@example.com"
    customerName: userData?.name,    // "John Doe"
    uid: user.uid,                   // Firebase user ID
    bookingData,                     // All form data above
  }),
})
```

---

## STEP 2: CHECKOUT API (Backend) 💳
**File:** `/app/api/checkout/route.ts`  
**What Happens:** Creates Stripe checkout session

### API Receives
```typescript
{
  orderId: "temp-1707123456789-abcd123" or "order-123",
  orderTotal: 45.50,
  customerEmail: "user@example.com",
  customerName: "John Doe",
  uid: "firebase-user-id-12345",
  bookingData: { ... all booking details ... },
}
```

### API Validates
```javascript
✓ orderId exists
✓ orderTotal provided
✓ customerEmail provided
✓ orderTotal >= $24.00 (minimum)
```

### API Creates Stripe Session
```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      name: 'Laundry Service',
      description: '5 kg wash & fold',
      amount: Math.round(45.50 * 0.70 * 100), // $31.85
    },
    {
      name: 'Delivery Fee',
      description: 'Pickup and delivery',
      amount: Math.round(45.50 * 0.30 * 100), // $13.65
    },
  ],
  mode: 'payment',
  success_url: 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'http://localhost:3000/booking?cancelled=true',
  customer_email: 'user@example.com',
  
  // ⭐ CRITICAL: All booking data stored here for webhook
  metadata: {
    orderId: "temp-1707123456789-abcd123",
    customerName: "John Doe",
    customerEmail: "user@example.com",
    uid: "firebase-user-id-12345",                    // ← CRITICAL!
    estimatedWeight: "5",
    deliverySpeed: "standard",
    pickupTime: "soon",
    detergent: "eco-friendly",
    waterTemp: "warm",
    foldingPreference: "folded",
    specialCare: "",
    deliveryAddressLine1: "123 Main St",
    deliveryAddressLine2: "Apt 4B",
    deliveryCity: "Melbourne",
    deliveryState: "VIC",
    deliveryPostcode: "3000",
    deliveryNotes: "",
    addOnsJson: "{\"hangDry\":false,...}",            // ← As JSON string
  },
})
```

### API Returns to Frontend
```typescript
return {
  sessionId: "cs_test_b1o2NF5xPWW2Q0zVRwztm3Dw...",
  url: "https://checkout.stripe.com/pay/cs_test_b1o2NF5xPWW2Q0zVRwztm3Dw...",
  success: true,
}
```

### Frontend Action
```typescript
if (url) {
  window.location.href = url  // Redirect to Stripe checkout
}
```

---

## STEP 3: STRIPE PAYMENT 💰
**What Happens:** User enters payment details and pays

### User Fills Payment Form
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
Name: John Doe
Email: user@example.com
```

### Stripe Processes Payment
```
1. Validates card ✓
2. Charges account ✓
3. Creates payment intent ✓
4. Marks session as completed ✓
5. Sends checkout.session.completed webhook event ✓
```

### Stripe Redirects User
```
After payment succeeds → Redirects to success_url

success_url = "http://localhost:3000/checkout/success?session_id=cs_test_b1o2NF5xPWW2Q0zVRwztm3Dw..."
```

---

## STEP 4: WEBHOOK PROCESSING 🔔
**File:** `/backend/routes/webhook.routes.js`  
**What Happens:** Backend receives payment confirmation and creates order

### Stripe Sends Webhook Event
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_b1o2NF5xPWW2Q0zVRwztm3Dw",
      "payment_intent": "pi_test_12345",
      "amount_total": 4550,                    // cents: $45.50
      "customer_email": "user@example.com",
      "metadata": {
        "orderId": "temp-1707123456789-abcd123",
        "uid": "firebase-user-id-12345",
        "estimatedWeight": "5",
        "deliverySpeed": "standard",
        "detergent": "eco-friendly",
        "deliveryCity": "Melbourne",
        "addOnsJson": "{...}"
        // ... all other metadata
      }
    }
  }
}
```

### Webhook Handler
```javascript
async function handleCheckoutSessionCompleted(session) {
  // 1. Extract data from Stripe metadata
  const uid = session.metadata?.uid                    // ← Get user ID
  const orderId = session.metadata?.orderId            // ← Get order ID
  const email = session.customer_email

  // 2. Verify user exists in Firebase
  const user = await getUser(uid)
  if (!user) {
    console.error('User not found!')
    return
  }

  // 3. Reconstruct booking data from metadata strings
  const bookingData = {
    estimatedWeight: parseFloat(session.metadata?.estimatedWeight || '5'),
    deliverySpeed: session.metadata?.deliverySpeed || 'standard',
    pickupTime: session.metadata?.pickupTime || 'soon',
    detergent: session.metadata?.detergent || 'eco-friendly',
    waterTemp: session.metadata?.waterTemp || 'warm',
    foldingPreference: session.metadata?.foldingPreference || 'folded',
    specialCare: session.metadata?.specialCare || '',
    deliveryAddress: {
      line1: session.metadata?.deliveryAddressLine1 || '',
      line2: session.metadata?.deliveryAddressLine2 || '',
      city: session.metadata?.deliveryCity || '',
      state: session.metadata?.deliveryState || '',
      postcode: session.metadata?.deliveryPostcode || '',
    },
    deliveryNotes: session.metadata?.deliveryNotes || '',
    addOns: JSON.parse(session.metadata?.addOnsJson || '{}'),  // ← Parse back from JSON
  }

  // 4. Create order with full booking details
  const order = await createOrder(uid, {
    orderId,
    email,
    bookingData,
    amount: session.amount_total / 100,              // Convert cents to dollars
    sessionId: session.id,
    paymentId: session.payment_intent,
    status: 'confirmed',
  })

  console.log('✓ Order created and synced:', order.orderId)
}
```

---

## STEP 5: FIREBASE SERVICE - CREATE & SYNC ORDER 🔥
**File:** `/backend/services/firebaseService.js`  
**What Happens:** Order is created in Firestore AND synced to customer account

### Function Call
```javascript
const order = await createOrder(uid, {
  orderId: "temp-1707123456789-abcd123",
  email: "user@example.com",
  bookingData: { ... laundry details ... },
  amount: 45.50,
  sessionId: "cs_test_b1o2NF5xPWW2Q0zVRwztm3Dw",
  paymentId: "pi_test_12345",
  status: 'confirmed',
})
```

### Part 1: Create Order Document
```javascript
// Save to orders collection (searchable by orderId)
await db.collection('orders').doc(orderId).set({
  orderId: "temp-1707123456789-abcd123",
  uid: "firebase-user-id-12345",
  email: "user@example.com",
  amount: 45.50,
  sessionId: "cs_test_b1o2NF5xPWW2Q0zVRwztm3Dw",
  paymentId: "pi_test_12345",
  status: "confirmed",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  
  // Full booking details
  estimatedWeight: 5,
  deliverySpeed: "standard",
  pickupTime: "soon",
  deliveryAddress: { ... },
  bookingData: { ... full object ... },
  
  timeline: [
    {
      status: 'confirmed',
      timestamp: Timestamp.now(),
      message: 'Order confirmed with payment',
    }
  ],
})

// ✓ Order now exists in:
// Firestore → orders → temp-1707123456789-abcd123
```

### Part 2: SYNC TO CUSTOMER ACCOUNT ⭐ (THE CRITICAL PART!)
```javascript
// Update customer's user document
await db.collection('users').doc(uid).update({
  
  // Add order to customer's orders array
  orders: FieldValue.arrayUnion({
    orderId: "temp-1707123456789-abcd123",
    email: "user@example.com",
    amount: 45.50,
    status: "confirmed",
    createdAt: Timestamp.now(),
    estimatedWeight: 5,
    deliverySpeed: "standard",
    deliveryAddress: { ... },
  }),
  
  // Update last order info for dashboard
  lastOrderId: "temp-1707123456789-abcd123",
  lastOrderDate: Timestamp.now(),
})

// ✓ Order now linked to:
// Firestore → users → firebase-user-id-12345 → orders array
```

### Firestore Structure After Step 5
```
firestore-root/
│
├─ orders/
│  └─ temp-1707123456789-abcd123  (order document)
│     ├─ uid: "firebase-user-id-12345"
│     ├─ email: "user@example.com"
│     ├─ amount: 45.50
│     ├─ estimatedWeight: 5
│     ├─ deliverySpeed: "standard"
│     ├─ status: "confirmed"
│     ├─ createdAt: Timestamp
│     └─ bookingData: { ... }
│
└─ users/
   └─ firebase-user-id-12345  (customer account)
      ├─ email: "user@example.com"
      ├─ name: "John Doe"
      ├─ phone: "0412345678"
      ├─ address: "123 Main St..."
      │
      ├─ orders: [              ← ⭐ THIS IS NEW!
      │  {
      │    orderId: "temp-1707123456789-abcd123",
      │    email: "user@example.com",
      │    amount: 45.50,
      │    status: "confirmed",
      │    createdAt: Timestamp,
      │    estimatedWeight: 5,
      │    deliverySpeed: "standard",
      │    deliveryAddress: { ... },
      │  }
      │ ]
      ├─ lastOrderId: "temp-1707123456789-abcd123"  ← ⭐ THIS IS NEW!
      └─ lastOrderDate: Timestamp                    ← ⭐ THIS IS NEW!
```

---

## STEP 6: PAYMENT SUCCESS PAGE 🎉
**File:** `/app/checkout/success/page.tsx`  
**What Happens:** User is redirected to success page after payment

### URL from Stripe
```
http://localhost:3000/checkout/success?session_id=cs_test_b1o2NF5xPWW2Q0zVRwztm3Dw...
```

### Success Page Loads
```typescript
const sessionId = searchParams.get('session_id')  // From URL

useEffect(() => {
  // 1. Wait for auth to initialize
  // Gets current user (already logged in)
  const auth = getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // User must be logged in
      setError('Please sign in to view your order')
      return
    }

    // 2. Get auth token
    const idToken = await user.getIdToken(true)

    // 3. Fetch user's orders from API
    const res = await fetch(`/api/orders/user/${user.uid}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      }
    })

    const data = await res.json()

    // 4. Get most recent order (just created)
    if (data.orders && data.orders.length > 0) {
      setOrder(data.orders[0])  // Most recent order
    }
  })
}, [])
```

### API Endpoint: `/api/orders/user/{uid}`
```javascript
// This endpoint returns user's orders
export async function GET(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    // 1. Verify auth token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const decodedToken = await admin.auth().verifyIdToken(token)
    
    // 2. Ensure user can only see their own orders
    if (decodedToken.uid !== params.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 3. Query Firestore for user's orders
    const userDoc = await db.collection('users').doc(params.uid).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ orders: [] })
    }

    // 4. Return orders array from user document
    const orders = userDoc.data().orders || []
    
    return NextResponse.json({
      orders: orders,
      count: orders.length,
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
```

### Success Page Displays
```typescript
return (
  <div>
    <h1>Payment Successful! ✅</h1>
    
    {order && (
      <div className="order-details">
        <p>Order ID: {order.orderId}</p>
        <p>Weight: {order.estimatedWeight} kg</p>
        <p>Delivery: {order.deliverySpeed}</p>
        <p>Address: {order.deliveryAddress.line1}, {order.deliveryAddress.city}</p>
        <p>Amount: ${order.amount.toFixed(2)}</p>
        <p>Status: {order.status}</p>
      </div>
    )}

    <Button onClick={() => router.push('/dashboard/customer')}>
      View in Dashboard
    </Button>
  </div>
)
```

---

## STEP 7: CUSTOMER DASHBOARD 📊
**File:** `/app/dashboard/customer/page.tsx`  
**What Happens:** User sees their order in dashboard

### Dashboard Loads
```typescript
useEffect(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Get auth token
    const idToken = await user.getIdToken(true)

    // Fetch user's orders
    const res = await fetch(`/api/orders/user/${user.uid}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      }
    })

    const { orders } = await res.json()
    
    // Filter active orders
    const activeOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'pending')
    
    setActiveOrders(activeOrders)
  })
}, [])
```

### Dashboard Displays
```
┌─────────────────────────────────────────┐
│ Customer Dashboard                      │
├─────────────────────────────────────────┤
│                                         │
│ Active Orders                           │
│                                         │
│ ┌────────────────────────────────────┐ │
│ │ Order ID: temp-17071234...         │ │
│ │ Status: Confirmed                  │ │
│ │ Weight: 5 kg                        │ │
│ │ Delivery: Standard                 │ │
│ │ Address: 123 Main St, Melbourne    │ │
│ │ Amount: $45.50                     │ │
│ │ Placed: Feb 9, 2025                │ │
│ │                                    │ │
│ │ [Track Order] [View Details]       │ │
│ └────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## COMPLETE FLOW DIAGRAM

```
CUSTOMER SIDE                          SERVER SIDE                         FIRESTORE
─────────────────────────────────────────────────────────────────────────────────────

1. Booking Form
   └─ Fill details
   └─ Click "Confirm & Pay"
      └──────────→ POST /api/checkout
                  (uid, bookingData, orderTotal)
                      │
                      ├──→ Create Stripe Session
                      │    └─ Store all data in metadata
                      │
                      └──→ Return { sessionId, url }
                          │
2. Redirect to Stripe    ←─┘
   └─ User pays
      └──────────→ Stripe Payment Processing
                  └─ Charge card
                  └─ Create payment_intent
                  └─ Mark session completed
                      │
3. Payment Success       │   4. Webhook Processing
   └─ Stripe redirects   │      └──→ POST /webhooks/stripe
      to /checkout/success   (checkout.session.completed)
      └──────────────────────→  Extract uid, orderId, bookingData
                                 from metadata
                                 │
                                 ├──→ Verify user exists
                                 │
                                 └──→ Call createOrder(uid, bookingData)
                                      │
                                      ├──→ Create order document ─→ orders/orderId ────┐
                                      │                                                │
                                      └──→ Update user document                        │
                                           └─ Add to orders array ─→ users/uid/orders ├─ SYNCED! ✓
                                           └─ Update lastOrderId ─→ users/uid ────────┘

4. Success Page Loads
   └─ Verify auth
   └─ Get auth token
      └──────────→ GET /api/orders/user/{uid}
                  (with Authorization header)
                      │
                      └──→ Query users/{uid}/orders
                          └─ Return orders array ──→ Display "Payment Successful!"
                                                    └─ Show order details
                                                    └─ Show "View in Dashboard" link
                                                       │
5. User Clicks Dashboard         ←─────────────────────────────────────────────────────┘
   └─ Load /dashboard/customer
   └─ Fetch orders
      └──────────→ GET /api/orders/user/{uid}
                      │
                      └──→ Query users/{uid}/orders
                          └─ Return all orders ──→ Display in dashboard
                                                    ├─ Order ID
                                                    ├─ Status
                                                    ├─ Weight
                                                    ├─ Delivery type
                                                    ├─ Address
                                                    ├─ Amount
                                                    └─ Track/Details buttons
```

---

## KEY POINTS

### Why This Works
1. ✅ **UID is passed through entire chain** - From booking → checkout → Stripe → webhook
2. ✅ **All booking data stored in Stripe metadata** - No data loss during redirect
3. ✅ **Webhook reconstructs order** - From metadata strings
4. ✅ **Order created in TWO places** - orders collection AND user.orders array
5. ✅ **User account is synced** - Dashboard can fetch from user.orders
6. ✅ **Success page queries API** - Uses auth token to verify access
7. ✅ **Dashboard queries API** - Same API endpoint, user can see all their orders

### The Critical Step (What Was Missing)
```javascript
// Before: Order created but not linked
await db.collection('orders').doc(orderId).set(order)

// After: Order created AND synced to account
await db.collection('orders').doc(orderId).set(order)
await db.collection('users').doc(uid).update({         // ← THIS SYNC
  orders: FieldValue.arrayUnion({ orderId, ... }),
  lastOrderId: orderId,
  lastOrderDate: timestamp,
})
```

### Error That Was Happening
**"Failed to get document because the client is offline"**  
- Old payment success page tried to use client-side Firebase
- New success page uses API with server-side validation
- No more offline errors ✓

---

## Checklist for Testing

After payment, verify:

1. **Stripe Webhook Fires**
   - Check server logs for: `[Webhook] Processing laundry booking completion:`

2. **Firebase Orders Collection**
   - Check `orders/temp-1707...` document exists
   - Verify all fields: uid, email, weight, delivery, address, status

3. **Firebase Users Document**
   - Check `users/{uid}` has `orders` array
   - Verify order is in array with all details
   - Check `lastOrderId` and `lastOrderDate` updated

4. **Success Page**
   - Shows real order ID (not "temp...")
   - Shows all order details
   - "View in Dashboard" button works

5. **Customer Dashboard**
   - Order appears in "Active Orders"
   - All details display correctly
   - Can click to view more details

If all ✓, then orders are working end-to-end!
