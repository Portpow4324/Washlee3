# Order Flow Diagram & Architecture

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WASHLEE ORDER PAYMENT FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

STAGE 1: USER ENTERS BOOKING DETAILS
════════════════════════════════════════════════════════════════════════════════

  User at http://localhost:3000/booking
         │
         ├─ Logs in with Firebase
         │  └─ Gets: uid = "9g4GphSrUuVH8jxWnVleXTPiPax2"
         │
         ├─ Fills booking form:
         │  ├─ Weight: 5 kg
         │  ├─ Delivery: Standard
         │  ├─ Address: 123 Main St
         │  ├─ Pickup: Soon
         │  └─ Add-ons: None
         │
         └─ Clicks "Confirm & Pay"
            └─ Calls: POST /api/checkout
               └─ Sends:
                  {
                    uid: "9g4GphSrUuVH8jxWnVleXTPiPax2",
                    estimatedWeight: 5,
                    deliverySpeed: "standard",
                    deliveryAddress: { line1: "123 Main St", ... },
                    amount: 4550  // cents
                  }


STAGE 2: CHECKOUT API CREATES STRIPE SESSION
════════════════════════════════════════════════════════════════════════════════

  /app/api/checkout/route.ts (frontend API)
         │
         ├─ Receives booking data + uid from /booking page
         │
         ├─ Creates Stripe Checkout Session
         │  └─ session = stripe.checkout.sessions.create({
         │       payment_method_types: ["card"],
         │       customer_email: "user@email.com",
         │       line_items: [{...}],
         │       mode: "payment",
         │       metadata: {
         │         uid: "9g4GphSrUuVH8jxWnVleXTPiPax2",  ← CRITICAL
         │         orderId: "order-1707614123...",
         │         estimatedWeight: "5",
         │         deliverySpeed: "standard",
         │         deliveryAddressLine1: "123 Main St",
         │         deliveryCity: "Melbourne",
         │         deliveryState: "VIC",
         │         deliveryPostcode: "3000"
         │       }
         │     })
         │
         ├─ Returns session.url
         │
         └─ User redirected to Stripe Checkout Page
            └─ https://checkout.stripe.com/pay/cs_test_...


STAGE 3: USER PAYS ON STRIPE
════════════════════════════════════════════════════════════════════════════════

  User at Stripe Checkout
         │
         ├─ Enters card details:
         │  ├─ Card: 4242 4242 4242 4242
         │  ├─ Expiry: 12/34
         │  └─ CVC: 123
         │
         ├─ Clicks "Pay $45.50"
         │
         └─ Stripe processes payment
            ├─ ✅ Payment Successful
            │
            └─ Stripe sends webhook event to backend


STAGE 4: WEBHOOK RECEIVES PAYMENT CONFIRMATION
════════════════════════════════════════════════════════════════════════════════

  Stripe Event: checkout.session.completed
         │
         └─ POST /api/webhooks/stripe (backend route)
            │
            ├─ Verifies Stripe signature
            │
            ├─ Extracts session data:
            │  ├─ uid: "9g4GphSrUuVH8jxWnVleXTPiPax2"
            │  ├─ orderId: "order-1707614123..."
            │  ├─ amount_total: 4550
            │  ├─ customer_email: "user@email.com"
            │  └─ metadata: { weight: "5", delivery: "standard", ... }
            │
            └─ Calls: firebaseService.createOrder(uid, orderData)
               └─ Server logs:
                  [Webhook] Received event: checkout.session.completed
                  [Webhook] Processing laundry booking completion
                  [Webhook] User verified: xxxxx


STAGE 5: FIREBASE CREATES ORDER
════════════════════════════════════════════════════════════════════════════════

  firebaseService.createOrder()
         │
         ├─ Creates in "orders" collection
         │  │
         │  └─ orders/order-1707614123...
         │     │
         │     ├─ orderId: "order-1707614123..."
         │     ├─ uid: "9g4GphSrUuVH8jxWnVleXTPiPax2"  ← CRITICAL FIELD
         │     ├─ email: "user@email.com"
         │     ├─ amount: 45.50
         │     ├─ status: "confirmed"
         │     ├─ createdAt: Timestamp
         │     ├─ estimatedWeight: 5
         │     ├─ deliverySpeed: "standard"
         │     ├─ deliveryAddress: {...}
         │     ├─ bookingData: {...all booking details...}
         │     └─ timeline: [...]
         │
         ├─ Server logs:
         │  [Firebase] Order created in orders collection: order-1707614123...
         │
         ├─ Syncs to "users" collection
         │  │
         │  └─ users/9g4GphSrUuVH8jxWnVleXTPiPax2
         │     │
         │     ├─ orders: [
         │     │   {
         │     │     orderId: "order-1707614123...",
         │     │     email: "user@email.com",
         │     │     amount: 45.50,
         │     │     status: "confirmed",
         │     │     createdAt: Timestamp,
         │     │     estimatedWeight: 5,
         │     │     deliverySpeed: "standard",
         │     │     deliveryAddress: {...}
         │     │   }
         │     │ ]
         │     ├─ lastOrderId: "order-1707614123..."
         │     └─ lastOrderDate: Timestamp
         │
         └─ Server logs:
            [Firebase] ✓ Order synced to customer account: xxxxx
            [Webhook] ✓ Order created and synced to user account


STAGE 6: USER SEES SUCCESS PAGE
════════════════════════════════════════════════════════════════════════════════

  /checkout/success page
         │
         ├─ Displays:
         │  ├─ ✅ Payment Confirmed
         │  ├─ Order ID: order-1707614123...
         │  ├─ Amount: $45.50
         │  ├─ Status: Confirmed
         │  ├─ Booking Details:
         │  │  ├─ Weight: 5 kg
         │  │  ├─ Delivery: Standard
         │  │  ├─ Address: 123 Main St, Melbourne VIC 3000
         │  │  └─ Pickup: Soon
         │  │
         │  └─ Button: "Go to Dashboard"
         │
         └─ User clicks "Go to Dashboard"
            └─ Navigates to: /dashboard/customer


STAGE 7: DASHBOARD FETCHES ORDERS
════════════════════════════════════════════════════════════════════════════════

  /dashboard/customer page loads
         │
         ├─ useEffect runs fetchOrders()
         │  │
         │  ├─ Gets auth token:
         │  │  const token = await user.getIdToken(true)  ← Force refresh
         │  │
         │  ├─ Calls API with Bearer token:
         │  │  fetch('/api/orders/user/9g4GphSrUuVH8jxWnVleXTPiPax2', {
         │  │    headers: { 'Authorization': 'Bearer {token}' }
         │  │  })
         │  │
         │  └─ Browser console logs:
         │     [Dashboard] Fetching orders with auth token
         │     [Dashboard] Orders API response status: 200
         │     [Dashboard] Got orders: 1
         │
         └─ API receives request


STAGE 8: API ENDPOINT VALIDATES AND FETCHES
════════════════════════════════════════════════════════════════════════════════

  /api/orders/user/[uid]/route.ts
         │
         ├─ Receives request with Bearer token
         │
         ├─ Verifies Firebase token
         │  const decodedToken = admin.auth().verifyIdToken(token)
         │  ├─ ✅ Valid token
         │  └─ Gets uid: "9g4GphSrUuVH8jxWnVleXTPiPax2"
         │
         ├─ Validates uid matches request
         │  if (decodedToken.uid !== uid) → 403 Forbidden
         │  ✅ Match: Continue
         │
         ├─ Queries Firestore
         │  db.collection('orders')
         │    .where('uid', '==', '9g4GphSrUuVH8jxWnVleXTPiPax2')  ← CORRECT FIELD
         │    .orderBy('createdAt', 'desc')
         │    .get()
         │
         ├─ Found: 1 order
         │  {
         │    orderId: "order-1707614123...",
         │    uid: "9g4GphSrUuVH8jxWnVleXTPiPax2",
         │    email: "user@email.com",
         │    amount: 45.50,
         │    status: "confirmed",
         │    estimatedWeight: 5,
         │    deliverySpeed: "standard",
         │    deliveryAddress: {...},
         │    createdAt: Timestamp
         │  }
         │
         └─ Returns JSON response
            {
              count: 1,
              orders: [{...order...}]
            }


STAGE 9: DASHBOARD DISPLAYS ORDER
════════════════════════════════════════════════════════════════════════════════

  Dashboard state updated with orders
         │
         ├─ setOrders([{...order...}])
         │
         ├─ Renders Active Orders tab
         │  │
         │  └─ Active Orders
         │     │
         │     └─ [order-1707614123...]
         │        ├─ Status: ✅ Confirmed
         │        ├─ Weight: 5 kg
         │        ├─ Delivery: Standard
         │        ├─ Pickup: Soon
         │        ├─ Address: 123 Main St, Melbourne VIC 3000
         │        ├─ Amount: $45.50
         │        └─ [View Details] button
         │
         └─ User sees their order! ✅


════════════════════════════════════════════════════════════════════════════════
                              FLOW COMPLETE ✅
════════════════════════════════════════════════════════════════════════════════
```

---

## Data Flow Visualization

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    WHERE DATA GOES IN THE ORDER FLOW                         │
└──────────────────────────────────────────────────────────────────────────────┘

BOOKING FORM (user's device)
         │ (filled by user)
         ├─ uid
         ├─ estimatedWeight
         ├─ deliverySpeed
         ├─ deliveryAddress
         ├─ scheduleDate
         ├─ scheduleTime
         └─ addOns

         ↓ (sent to)

CHECKOUT API
         │
         ├─ Creates Stripe Session
         │
         └─ Stores in metadata:
            ├─ uid
            ├─ orderId
            ├─ estimatedWeight
            ├─ deliverySpeed
            ├─ deliveryAddress.line1
            ├─ deliveryCity
            ├─ deliveryState
            ├─ deliveryPostcode
            └─ addOnsJson

         ↓ (user pays on Stripe)

STRIPE WEBHOOK
         │
         ├─ Receives: checkout.session.completed event
         │
         ├─ Extracts from session.metadata:
         │  ├─ uid
         │  ├─ orderId
         │  ├─ estimatedWeight
         │  ├─ deliverySpeed
         │  └─ all other metadata fields
         │
         └─ Reconstructs bookingData object

         ↓ (passes to)

FIREBASE SERVICE - createOrder()
         │
         ├─ Creates in orders/{orderId}:
         │  ├─ orderId
         │  ├─ uid ← KEY FIELD
         │  ├─ email
         │  ├─ amount
         │  ├─ status
         │  ├─ estimatedWeight
         │  ├─ deliverySpeed
         │  ├─ deliveryAddress
         │  └─ bookingData (full original data)
         │
         └─ Updates users/{uid}/orders array:
            ├─ orderId
            ├─ email
            ├─ amount
            ├─ status
            ├─ estimatedWeight
            ├─ deliverySpeed
            └─ deliveryAddress

         ↓ (user navigates to dashboard)

DASHBOARD useEffect
         │
         ├─ Gets auth token
         │
         └─ Calls: /api/orders/user/{uid}

         ↓ (API processes)

API ENDPOINT
         │
         ├─ Verifies token
         │
         ├─ Queries: orders where uid == {uid}
         │
         └─ Returns orders array

         ↓ (dashboard receives)

DASHBOARD STATE
         │
         └─ setOrders([{...order...}])

         ↓ (renders)

ACTIVE ORDERS TAB
         │
         └─ Displays order with all details ✅
```

---

## Database Structure

```
FIRESTORE DATABASE STRUCTURE
═════════════════════════════════════════════════════════════════════════════

Firestore Root
│
├─ collection: "orders"
│  │
│  └─ document: "order-1707614123456789abc"
│     │
│     ├─ orderId: string = "order-1707614123456789abc"
│     ├─ uid: string = "9g4GphSrUuVH8jxWnVleXTPiPax2"          ← KEY FIELD
│     ├─ email: string = "user@email.com"
│     ├─ amount: number = 45.50
│     ├─ status: string = "confirmed"
│     ├─ createdAt: Timestamp = Jan 11, 2025 2:30 PM
│     ├─ updatedAt: Timestamp = Jan 11, 2025 2:30 PM
│     ├─ sessionId: string = "cs_test_abc123..."
│     ├─ paymentId: string = "pi_test_abc123..."
│     ├─ estimatedWeight: number = 5
│     ├─ deliverySpeed: string = "standard"
│     ├─ pickupTime: string = "soon"
│     ├─ scheduleDate: string = "2025-01-15"
│     ├─ scheduleTime: string = "14:00"
│     ├─ specialCare: string = ""
│     ├─ deliveryAddress: object
│     │  ├─ line1: string = "123 Main St"
│     │  ├─ line2: string = "Apt 5"
│     │  ├─ city: string = "Melbourne"
│     │  ├─ state: string = "VIC"
│     │  └─ postcode: string = "3000"
│     ├─ deliveryNotes: string = "Please ring doorbell"
│     ├─ bookingData: object = {complete booking details}
│     └─ timeline: array
│        └─ [0]: object
│           ├─ status: string = "confirmed"
│           ├─ timestamp: Timestamp = Jan 11, 2025 2:30 PM
│           └─ message: string = "Order confirmed with payment"
│
│
├─ collection: "users"
│  │
│  └─ document: "9g4GphSrUuVH8jxWnVleXTPiPax2"  ← Use Firebase UID as ID
│     │
│     ├─ email: string = "user@email.com"
│     ├─ name: string = "John Doe"
│     ├─ phone: string = "+61412345678"
│     ├─ createdAt: Timestamp = ...
│     ├─ lastOrderId: string = "order-1707614123456789abc"
│     ├─ lastOrderDate: Timestamp = Jan 11, 2025 2:30 PM
│     │
│     └─ orders: array = [                    ← ORDER SYNC ARRAY
│        {
│          orderId: "order-1707614123456789abc",
│          email: "user@email.com",
│          amount: 45.50,
│          status: "confirmed",
│          createdAt: Timestamp,
│          estimatedWeight: 5,
│          deliverySpeed: "standard",
│          deliveryAddress: {
│            line1: "123 Main St",
│            line2: "Apt 5",
│            city: "Melbourne",
│            state: "VIC",
│            postcode: "3000"
│          }
│        }
│      ]
│
│
└─ collection: "authentication"
   │
   └─ (handled by Firebase Authentication service)
      └─ Users: [
         {
           uid: "9g4GphSrUuVH8jxWnVleXTPiPax2",
           email: "user@email.com",
           displayName: "John Doe",
           ...
         }
       ]


CRITICAL FIELDS TO REMEMBER
───────────────────────────────────────────────────────────────────────────────

✅ CORRECT:
   orders/{orderId}: { uid: "..." }
   Dashboard query: where('uid', '==', uid)

❌ WRONG:
   orders/{orderId}: { userId: "..." }
   Dashboard query: where('userId', '==', uid)

The ENTIRE flow uses "uid", not "userId"!
```

---

## Request/Response Flow

```
BOOKING PAGE REQUEST
───────────────────────────────────────────────────────────────────────────────

Browser → POST /api/checkout
Headers:
  Content-Type: application/json

Body:
{
  "uid": "9g4GphSrUuVH8jxWnVleXTPiPax2",
  "email": "user@email.com",
  "estimatedWeight": 5,
  "deliverySpeed": "standard",
  "pickupTime": "soon",
  "scheduleDate": "2025-01-15",
  "scheduleTime": "14:00",
  "detergent": "eco-friendly",
  "waterTemp": "warm",
  "foldingPreference": "folded",
  "specialCare": "",
  "deliveryAddress": {
    "line1": "123 Main St",
    "line2": "Apt 5",
    "city": "Melbourne",
    "state": "VIC",
    "postcode": "3000"
  },
  "deliveryNotes": "Ring doorbell",
  "addOns": {
    "hangDry": true,
    "delicates": false
  },
  "amount": 4550
}

Response:
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}


DASHBOARD API REQUEST (JUST FIXED)
───────────────────────────────────────────────────────────────────────────────

Browser → GET /api/orders/user/9g4GphSrUuVH8jxWnVleXTPiPax2
Headers:
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...

Response:
{
  "count": 1,
  "orders": [
    {
      "orderId": "order-1707614123456789abc",
      "uid": "9g4GphSrUuVH8jxWnVleXTPiPax2",
      "email": "user@email.com",
      "amount": 45.50,
      "status": "confirmed",
      "createdAt": "2025-01-11T14:30:45.000Z",
      "estimatedWeight": 5,
      "deliverySpeed": "standard",
      "deliveryAddress": {
        "line1": "123 Main St",
        "line2": "Apt 5",
        "city": "Melbourne",
        "state": "VIC",
        "postcode": "3000"
      }
    }
  ]
}


WEBHOOK REQUEST (FROM STRIPE)
───────────────────────────────────────────────────────────────────────────────

Stripe → POST /api/webhooks/stripe
Headers:
  stripe-signature: t=1707614445,v1=1234567890abcdef...
  Content-Type: application/json

Body:
{
  "id": "evt_test_1234567890abc",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc123",
      "customer_email": "user@email.com",
      "amount_total": 4550,
      "payment_intent": "pi_test_abc123",
      "metadata": {
        "uid": "9g4GphSrUuVH8jxWnVleXTPiPax2",
        "orderId": "order-1707614123456789abc",
        "estimatedWeight": "5",
        "deliverySpeed": "standard",
        "deliveryCity": "Melbourne",
        "deliveryState": "VIC",
        "deliveryPostcode": "3000"
      }
    }
  }
}

Response:
{
  "received": true
}
```

---

## State Management

```
DASHBOARD COMPONENT STATE
═════════════════════════════════════════════════════════════════════════════

State Variables:
├─ orders: Order[] = []
├─ loading: boolean = true
├─ error: string | null = null
├─ activeTab: "active" | "history" = "active"
└─ selectedOrder: Order | null = null


FETCHORDERS EFFECT (useEffect)
───────────────────────────────────────────────────────────────────────────────

1. Component mounts
   └─ useEffect hook runs

2. Check if user is logged in
   └─ const user = await auth.currentUser
   └─ if (!user) return

3. Get fresh auth token
   └─ const token = await user.getIdToken(true)
   └─ "true" = force refresh, don't use cached token

4. Call API with Bearer token
   └─ fetch('/api/orders/user/{uid}', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

5. Verify response is OK
   └─ if (!response.ok) throw error
   └─ const data = response.json()

6. Map response to state
   └─ const orders = data.orders.map(order => ({
        orderId: order.orderId,
        uid: order.uid,
        email: order.email,
        amount: order.amount,
        status: order.status,
        estimatedWeight: order.estimatedWeight,
        deliverySpeed: order.deliverySpeed,
        deliveryAddress: order.deliveryAddress,
        createdAt: new Date(order.createdAt)
      }))

7. Update state
   └─ setOrders(orders)
   └─ setLoading(false)
   └─ setError(null)

8. Handle errors
   └─ catch (error)
   └─ setError(error.message)
   └─ setLoading(false)
   └─ console.error('[Dashboard] Error:', error)


CLEANUP
───────────────────────────────────────────────────────────────────────────────

Return function in useEffect:
└─ Cleanup code (optional)
└─ Cancel pending requests if component unmounts
```

---

**This complete architecture ensures orders flow from payment → Firebase → API → Dashboard correctly!**

All critical fields (especially `uid`) flow through consistently at each step.
