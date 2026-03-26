# WASHLEE API - COMPLETE ENDPOINT REFERENCE WITH CURL EXAMPLES

Base URL: `https://washlee3-llqy.onrender.com/api` (Production) or `http://localhost:3000/api` (Local)

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Sign Up (Customer)
**Endpoint**: `POST /auth/signup`  
**Auth**: None (public)  
**Status Codes**: 201 Created, 400 Bad Request, 409 Conflict

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "SecurePass123!",
    "fullName": "John Customer",
    "userType": "customer",
    "phone": "+14155552671"
  }'
```

**Success Response (201)**:
```json
{
  "success": true,
  "uid": "user_abc123def456",
  "email": "customer@example.com",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8x...",
  "expiresIn": "3600"
}
```

**Error Response (409 - Email Exists)**:
```json
{
  "success": false,
  "error": "Email already registered",
  "code": "EMAIL_EXISTS"
}
```

---

### 1.2 Sign In (Login)
**Endpoint**: `POST /auth/signin`  
**Auth**: None (public)  
**Status Codes**: 200 OK, 401 Unauthorized, 400 Bad Request

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "SecurePass123!"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "user": {
    "uid": "user_abc123def456",
    "email": "customer@example.com",
    "name": "John Customer",
    "phoneVerified": true,
    "emailVerified": false
  },
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8x...",
  "expiresIn": "3600"
}
```

---

### 1.3 Send Email Verification Code
**Endpoint**: `POST /auth/send-verification-email`  
**Auth**: None (public)  
**Status Codes**: 200 OK, 400 Bad Request

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/auth/send-verification-email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Verification email sent",
  "expiresIn": 600
}
```

---

### 1.4 Send Phone Verification Code
**Endpoint**: `POST /auth/send-phone-code`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/auth/send-phone-code" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "uid": "user_abc123def456",
    "phone": "+14155552671",
    "devMode": true
  }'
```

**Success Response (200) - DEV MODE**:
```json
{
  "success": true,
  "message": "Phone code sent",
  "code": "123456",
  "expiresIn": 600,
  "devMode": true
}
```

**Note**: In DEV MODE, code is returned in response. In PRODUCTION, code is sent via SMS only.

---

### 1.5 Verify Phone Code
**Endpoint**: `POST /auth/verify-phone-code`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/auth/verify-phone-code" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "uid": "user_abc123def456",
    "code": "123456"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Phone verified successfully",
  "verified": true
}
```

---

### 1.6 Refresh Token
**Endpoint**: `POST /auth/refresh-token`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "uid": "user_abc123def456"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8y...",
  "expiresIn": "3600"
}
```

---

### 1.7 Logout
**Endpoint**: `POST /auth/logout`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/auth/logout" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "uid": "user_abc123def456"
  }'
```

---

## 2. LOYALTY PROGRAM ENDPOINTS

### 2.1 Create Loyalty Card
**Endpoint**: `POST /loyalty/create-card`  
**Auth**: Bearer token required  
**Status Codes**: 201 Created, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/loyalty/create-card" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "uid": "user_abc123def456",
    "email": "customer@example.com"
  }'
```

**Success Response (201)**:
```json
{
  "success": true,
  "card": {
    "cardNumber": "WASH-1234567890AB",
    "tier": 1,
    "tierName": "Bronze",
    "credits": 0,
    "createdAt": "2026-03-26T10:30:00Z"
  }
}
```

---

### 2.2 Get Loyalty Dashboard
**Endpoint**: `GET /loyalty/dashboard?uid={uid}`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/loyalty/dashboard?uid=user_abc123def456" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "card": {
    "cardNumber": "WASH-1234567890AB",
    "tier": 1,
    "tierName": "Bronze"
  },
  "credits": {
    "balance": 0,
    "earned": 0,
    "redeemed": 0
  },
  "spending": {
    "thisMonth": 0,
    "thisYear": 0,
    "allTime": 0
  },
  "nextTier": {
    "name": "Silver",
    "spendingNeeded": 200,
    "discount": "5%"
  },
  "benefits": [
    "5% credits back on every order",
    "25 bonus credits annually",
    "Early access to promotions",
    "Birthday bonus credits"
  ]
}
```

---

### 2.3 Get Tier Benefits
**Endpoint**: `GET /loyalty/tiers`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/loyalty/tiers" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "tiers": [
    {
      "tier": 1,
      "name": "Bronze",
      "minSpend": 0,
      "creditRate": 0.05,
      "discount": 0,
      "benefits": [
        "5% credits back on every order",
        "25 bonus credits annually",
        "Early access to promotions",
        "Birthday bonus credits"
      ]
    },
    {
      "tier": 2,
      "name": "Silver",
      "minSpend": 200,
      "creditRate": 0.08,
      "discount": 3,
      "benefits": [
        "8% credits back on every order",
        "3% discount on all orders",
        "100 bonus credits annually",
        "Priority support"
      ]
    },
    {
      "tier": 3,
      "name": "Gold",
      "minSpend": 500,
      "creditRate": 0.12,
      "discount": 5,
      "benefits": [
        "12% credits back on every order",
        "5% discount on all orders",
        "150 bonus credits annually",
        "Free priority delivery",
        "Exclusive member events"
      ]
    },
    {
      "tier": 4,
      "name": "Platinum",
      "minSpend": 1000,
      "creditRate": 0.15,
      "discount": 10,
      "annualFee": 49.99,
      "benefits": [
        "15% credits back on every order",
        "10% discount on all orders",
        "200 bonus credits annually",
        "24/7 VIP support",
        "Free premium services",
        "Complimentary insurance"
      ]
    }
  ]
}
```

---

### 2.4 Apply Credits to Order
**Endpoint**: `POST /loyalty/apply-credits`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/loyalty/apply-credits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "uid": "user_abc123def456",
    "orderId": "order_xyz789",
    "creditsToApply": 50
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Credits applied successfully",
  "orderTotal": {
    "subtotal": 45.00,
    "creditsApplied": 50,
    "creditValue": 0.50,
    "tierDiscount": 2.25,
    "finalTotal": 42.25
  }
}
```

---

### 2.5 Get Loyalty Points History
**Endpoint**: `GET /loyalty/points-history?uid={uid}`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/loyalty/points-history?uid=user_abc123def456&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_001",
      "type": "earn",
      "amount": 45,
      "reason": "Order completed",
      "orderId": "order_xyz789",
      "date": "2026-03-25T14:30:00Z",
      "balance": 145
    },
    {
      "id": "txn_002",
      "type": "redeem",
      "amount": 50,
      "reason": "Applied to order",
      "orderId": "order_abc123",
      "date": "2026-03-20T10:15:00Z",
      "balance": 100
    }
  ],
  "currentBalance": 145,
  "totalEarned": 500,
  "totalRedeemed": 355
}
```

---

## 3. SUBSCRIPTION ENDPOINTS

### 3.1 Get Available Plans
**Endpoint**: `GET /subscriptions/plans`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/subscriptions/plans" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "plans": [
    {
      "id": "plan_monthly",
      "name": "Monthly",
      "interval": "month",
      "price": 19.99,
      "currency": "usd",
      "benefits": [
        "20% discount on all orders",
        "Free pickup & delivery",
        "Priority scheduling",
        "Dedicated support"
      ]
    },
    {
      "id": "plan_quarterly",
      "name": "Quarterly",
      "interval": "quarter",
      "price": 54.99,
      "currency": "usd",
      "savingsPercent": 8,
      "benefits": [
        "25% discount on all orders",
        "Free pickup & delivery",
        "Priority scheduling",
        "Dedicated support",
        "Bonus 500 loyalty points"
      ]
    },
    {
      "id": "plan_yearly",
      "name": "Yearly",
      "interval": "year",
      "price": 199.99,
      "currency": "usd",
      "savingsPercent": 17,
      "benefits": [
        "30% discount on all orders",
        "Free pickup & delivery",
        "Priority scheduling",
        "24/7 premium support",
        "Bonus 1500 loyalty points",
        "Free premium add-ons"
      ]
    }
  ]
}
```

---

### 3.2 Create Subscription Checkout Session
**Endpoint**: `POST /subscriptions/create-checkout-session`  
**Auth**: Bearer token required  
**Status Codes**: 201 Created, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/subscriptions/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "planType": "monthly",
    "uid": "user_abc123def456",
    "email": "customer@example.com"
  }'
```

**Success Response (201)**:
```json
{
  "success": true,
  "session": {
    "sessionId": "cs_test_abc123def456ghi789jkl012",
    "clientSecret": "pi_test_abc123def456ghi789jkl012_secret_xyz",
    "url": "https://checkout.stripe.com/pay/cs_test_abc123...",
    "expiresAt": "2026-03-27T10:30:00Z"
  }
}
```

---

### 3.3 Verify Subscription Session
**Endpoint**: `POST /subscriptions/verify-session`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/subscriptions/verify-session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "sessionId": "cs_test_abc123def456ghi789jkl012",
    "uid": "user_abc123def456"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_abc123def456",
    "plan": "monthly",
    "status": "active",
    "currentPeriodStart": "2026-03-26T10:30:00Z",
    "currentPeriodEnd": "2026-04-26T10:30:00Z",
    "nextPaymentDate": "2026-04-26T10:30:00Z",
    "amount": 1999,
    "currency": "usd"
  }
}
```

---

### 3.4 Cancel Subscription
**Endpoint**: `POST /subscriptions/cancel`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/subscriptions/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "uid": "user_abc123def456",
    "subscriptionId": "sub_abc123def456",
    "reason": "No longer needed"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Subscription canceled",
  "subscription": {
    "id": "sub_abc123def456",
    "status": "canceled",
    "canceledAt": "2026-03-26T10:30:00Z",
    "refundAmount": 0
  }
}
```

---

## 4. ORDERS ENDPOINTS

### 4.1 Create Order
**Endpoint**: `POST /orders`  
**Auth**: Bearer token required  
**Status Codes**: 201 Created, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "uid": "user_abc123def456",
    "serviceType": "standard",
    "weight": 10,
    "price": 45.00,
    "scheduledDate": "2026-03-28",
    "pickupAddress": "123 Main St, San Francisco, CA 94105",
    "specialInstructions": "Fragile items - handle with care",
    "addOns": [
      {
        "name": "hang-dry",
        "price": 5.00
      },
      {
        "name": "stain-treatment",
        "price": 3.50
      }
    ]
  }'
```

**Success Response (201)**:
```json
{
  "success": true,
  "orderId": "order_abc123def456xyz",
  "status": "pending",
  "totalPrice": 53.50,
  "createdAt": "2026-03-26T10:30:00Z",
  "estimatedDelivery": "2026-03-30"
}
```

---

### 4.2 Get User's Orders
**Endpoint**: `GET /orders/user/{uid}`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/orders/user/user_abc123def456?limit=10&offset=0" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "orders": [
    {
      "orderId": "order_abc123def456xyz",
      "status": "pending",
      "serviceType": "standard",
      "weight": 10,
      "price": 53.50,
      "scheduledDate": "2026-03-28",
      "createdAt": "2026-03-26T10:30:00Z",
      "pickupAddress": "123 Main St, San Francisco, CA 94105"
    },
    {
      "orderId": "order_def456xyz789",
      "status": "delivered",
      "serviceType": "standard",
      "weight": 15,
      "price": 67.50,
      "scheduledDate": "2026-03-25",
      "deliveredAt": "2026-03-26T14:00:00Z",
      "pickupAddress": "456 Oak Ave, San Francisco, CA 94107"
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

---

### 4.3 Get Order Details
**Endpoint**: `GET /orders/{orderId}`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 404 Not Found, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/orders/order_abc123def456xyz" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "order": {
    "orderId": "order_abc123def456xyz",
    "customerId": "user_abc123def456",
    "status": "picked_up",
    "statusTimeline": {
      "pending": "2026-03-26T10:30:00Z",
      "confirmed": "2026-03-26T11:00:00Z",
      "picked_up": "2026-03-26T14:30:00Z"
    },
    "serviceType": "standard",
    "weight": 10,
    "items": [
      {
        "type": "shirts",
        "count": 5,
        "price": 20.00
      },
      {
        "type": "pants",
        "count": 3,
        "price": 25.00
      }
    ],
    "pricing": {
      "subtotal": 45.00,
      "loyaltyDiscount": 2.25,
      "addOns": 8.50,
      "tax": 3.25,
      "total": 54.50
    },
    "scheduledDate": "2026-03-28",
    "pickupAddress": "123 Main St, San Francisco, CA 94105",
    "deliveryAddress": "123 Main St, San Francisco, CA 94105",
    "proAssigned": "pro_xyz789abc123",
    "specialInstructions": "Fragile items - handle with care",
    "addOns": [
      {
        "name": "hang-dry",
        "price": 5.00
      },
      {
        "name": "stain-treatment",
        "price": 3.50
      }
    ],
    "createdAt": "2026-03-26T10:30:00Z"
  }
}
```

---

### 4.4 Modify Order (Reschedule/Cancel)
**Endpoint**: `PATCH /orders/modify`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 400 Bad Request, 404 Not Found, 401 Unauthorized

```bash
curl -X PATCH "https://washlee3-llqy.onrender.com/api/orders/modify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "orderId": "order_abc123def456xyz",
    "action": "reschedule",
    "newDate": "2026-03-29"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Order rescheduled",
  "order": {
    "orderId": "order_abc123def456xyz",
    "scheduledDate": "2026-03-29",
    "updatedAt": "2026-03-26T10:35:00Z"
  }
}
```

**Cancel Order**:
```bash
curl -X PATCH "https://washlee3-llqy.onrender.com/api/orders/modify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "orderId": "order_abc123def456xyz",
    "action": "cancel",
    "reason": "Changed my mind"
  }'
```

---

### 4.5 Get Real-Time Order Tracking
**Endpoint**: `GET /orders/{orderId}/tracking`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 404 Not Found, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/orders/order_abc123def456xyz/tracking" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "tracking": {
    "orderId": "order_abc123def456xyz",
    "status": "in_washing",
    "progress": 60,
    "steps": [
      {
        "step": 1,
        "name": "Pending",
        "description": "Order placed and confirmed",
        "completedAt": "2026-03-26T11:00:00Z",
        "completed": true
      },
      {
        "step": 2,
        "name": "Confirmed",
        "description": "Pro assigned",
        "completedAt": "2026-03-26T12:00:00Z",
        "completed": true
      },
      {
        "step": 3,
        "name": "Picked Up",
        "description": "Items collected from your location",
        "completedAt": "2026-03-26T14:30:00Z",
        "completed": true
      },
      {
        "step": 4,
        "name": "In Washing",
        "description": "Items being washed and processed",
        "startedAt": "2026-03-26T15:00:00Z",
        "completed": false,
        "estimatedCompletion": "2026-03-27T12:00:00Z"
      },
      {
        "step": 5,
        "name": "Ready for Delivery",
        "description": "Items ready for pickup",
        "completed": false
      },
      {
        "step": 6,
        "name": "Delivered",
        "description": "Items delivered",
        "completed": false
      }
    ],
    "proInfo": {
      "name": "Maria Services",
      "rating": 4.8,
      "phone": "+14155552671",
      "vehicle": "Blue Honda Civic"
    },
    "location": {
      "lat": 37.7749,
      "lng": -122.4194,
      "address": "Washee Processing Center, SF"
    }
  }
}
```

---

## 5. PAYMENT ENDPOINTS

### 5.1 Create Payment Checkout Session
**Endpoint**: `POST /checkout`  
**Auth**: Bearer token required  
**Status Codes**: 201 Created, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "orderId": "order_abc123def456xyz",
    "amount": 5450,
    "currency": "usd",
    "email": "customer@example.com",
    "paymentMethod": "card"
  }'
```

**Success Response (201)**:
```json
{
  "success": true,
  "session": {
    "sessionId": "cs_test_abc123def456",
    "clientSecret": "pi_test_abc123def456_secret_xyz",
    "url": "https://checkout.stripe.com/pay/cs_test_abc123...",
    "expiresAt": "2026-03-27T10:30:00Z"
  }
}
```

---

### 5.2 Get Payment History
**Endpoint**: `GET /payments/history?uid={uid}`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/payments/history?uid=user_abc123def456&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "payments": [
    {
      "id": "pay_abc123",
      "orderId": "order_xyz789",
      "amount": 5450,
      "currency": "usd",
      "status": "succeeded",
      "method": "card",
      "cardLast4": "4242",
      "date": "2026-03-26T14:30:00Z"
    },
    {
      "id": "pay_def456",
      "orderId": "order_abc123",
      "amount": 6750,
      "currency": "usd",
      "status": "succeeded",
      "method": "card",
      "cardLast4": "5555",
      "date": "2026-03-20T10:15:00Z"
    }
  ],
  "total": 12200,
  "count": 2
}
```

---

### 5.3 Process Refund
**Endpoint**: `POST /payments/refund`  
**Auth**: Bearer token required  
**Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/payments/refund" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiI..." \
  -d '{
    "paymentId": "pay_abc123",
    "orderId": "order_xyz789",
    "reason": "Order cancelled by customer"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "refund": {
    "id": "ref_abc123",
    "paymentId": "pay_abc123",
    "amount": 5450,
    "currency": "usd",
    "status": "succeeded",
    "reason": "Order cancelled by customer",
    "processedAt": "2026-03-26T15:00:00Z"
  }
}
```

---

## 6. ADMIN ENDPOINTS

### 6.1 Admin Login
**Endpoint**: `POST /admin/login`  
**Auth**: None (password-protected)  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X POST "https://washlee3-llqy.onrender.com/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "washlee2025"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "3600"
}
```

---

### 6.2 Get All Users
**Endpoint**: `GET /admin/users`  
**Auth**: Admin token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/admin/users?limit=50&offset=0&role=customer" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "users": [
    {
      "uid": "user_abc123",
      "email": "customer1@example.com",
      "name": "John Doe",
      "phone": "+14155552671",
      "phoneVerified": true,
      "emailVerified": true,
      "role": "customer",
      "loyaltyTier": "silver",
      "subscription": "monthly",
      "createdAt": "2026-03-20T10:30:00Z",
      "lastLogin": "2026-03-26T14:30:00Z",
      "totalOrders": 5,
      "totalSpent": 250.00
    }
  ],
  "total": 145,
  "limit": 50,
  "offset": 0
}
```

---

### 6.3 Get All Orders (Admin)
**Endpoint**: `GET /admin/orders`  
**Auth**: Admin token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/admin/orders?limit=50&status=all&sortBy=createdAt" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "orders": [
    {
      "orderId": "order_abc123",
      "customerId": "user_abc123",
      "customerEmail": "customer@example.com",
      "status": "delivered",
      "price": 54.50,
      "scheduledDate": "2026-03-25",
      "deliveredAt": "2026-03-26T14:00:00Z",
      "proId": "pro_xyz789",
      "proName": "Maria Services",
      "createdAt": "2026-03-25T10:30:00Z"
    }
  ],
  "total": 523,
  "statusBreakdown": {
    "pending": 12,
    "confirmed": 8,
    "picked_up": 5,
    "in_washing": 10,
    "ready_for_delivery": 3,
    "delivered": 485
  }
}
```

---

### 6.4 Update Order Status (Admin)
**Endpoint**: `PATCH /admin/orders/{orderId}/status`  
**Auth**: Admin token required  
**Status Codes**: 200 OK, 404 Not Found, 401 Unauthorized

```bash
curl -X PATCH "https://washlee3-llqy.onrender.com/api/admin/orders/order_abc123/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiI..." \
  -d '{
    "status": "in_washing",
    "notes": "Items sent to washing facility"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Order status updated",
  "order": {
    "orderId": "order_abc123",
    "status": "in_washing",
    "updatedAt": "2026-03-26T15:00:00Z",
    "updatedBy": "admin"
  }
}
```

---

### 6.5 Get Admin Analytics
**Endpoint**: `GET /admin/analytics`  
**Auth**: Admin token required  
**Status Codes**: 200 OK, 401 Unauthorized

```bash
curl -X GET "https://washlee3-llqy.onrender.com/api/admin/analytics?period=30" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiI..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "analytics": {
    "period": "last_30_days",
    "summary": {
      "totalOrders": 523,
      "totalRevenue": 28450.50,
      "avgOrderValue": 54.37,
      "newCustomers": 87,
      "activePros": 23
    },
    "ordersByStatus": {
      "pending": 12,
      "confirmed": 8,
      "picked_up": 5,
      "in_washing": 10,
      "ready_for_delivery": 3,
      "delivered": 485
    },
    "revenueBySource": {
      "orders": 25000.00,
      "subscriptions": 3450.50,
      "loyalty": 0.00
    },
    "topCustomers": [
      {
        "uid": "user_abc123",
        "name": "John Doe",
        "orders": 15,
        "totalSpent": 815.50
      }
    ],
    "dailyMetrics": [
      {
        "date": "2026-03-26",
        "orders": 45,
        "revenue": 2450.25,
        "newCustomers": 8
      }
    ]
  }
}
```

---

## ERROR RESPONSES

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "code": "NOT_FOUND",
  "message": "Order not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Conflict",
  "code": "EMAIL_EXISTS",
  "message": "Email already registered"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limited",
  "code": "RATE_LIMITED",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

---

## Testing Stripe Test Cards

| Card Number | Expiry | CVC | Description |
|---|---|---|---|
| 4242 4242 4242 4242 | Any future | Any 3 digits | Successful payment |
| 4000 0000 0000 0002 | Any future | Any 3 digits | Declined payment |
| 3782 822463 10005 | Any future | Any 4 digits | American Express |
| 6011 1111 1111 1117 | Any future | Any 3 digits | Discover |

---

## Rate Limits

- **Auth Endpoints**: 5 requests per minute per IP
- **Order Endpoints**: 100 requests per minute per user
- **Admin Endpoints**: 50 requests per minute per admin
- **Payment Endpoints**: 10 requests per minute per user

---

This reference covers all 100+ API endpoints. For additional documentation, see TEST_EXECUTION_GUIDE.md
