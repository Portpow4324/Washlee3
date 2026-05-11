# 🔌 Backend API Reference - Complete
## Washlee Mobile App Integration

**Version:** 1.0  
**Last Updated:** April 29, 2026  
**Status:** Production Ready

---

## 📑 API Endpoints Quick Reference

### Base URL
```
Production: https://washlee.com/api
Development: http://localhost:3000/api
```

### Authentication Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## 🔐 Authentication Endpoints

### 1. Sign Up (Create Account)

**Endpoint:** `POST /api/auth/signup`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "phone": "+1 (234) 567-8900",
  "userType": "customer"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "user_metadata": {
      "name": "John Doe",
      "phone": "+1 (234) 567-8900",
      "user_type": "customer",
      "created_at": "2026-04-29T10:00:00Z"
    }
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "sbr_refresh_token_value",
    "expires_in": 3600
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

---

### 2. Sign In (Login)

**Endpoint:** `POST /api/auth/signin`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "sbr_refresh_token_value",
    "expires_in": 3600
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 3. Refresh Token

**Endpoint:** `POST /api/auth/refresh-token`

**Request:**
```json
{
  "refresh_token": "sbr_refresh_token_value"
}
```

**Response (200):**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

---

### 4. Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:** Authorization required

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "user_metadata": {
    "name": "John Doe",
    "phone": "+1 (234) 567-8900",
    "user_type": "customer"
  }
}
```

---

### 5. Logout

**Endpoint:** `POST /api/auth/logout`

**Headers:** Authorization required

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📦 Order Endpoints

### 1. Create New Order

**Endpoint:** `POST /api/orders`

**Headers:** Authorization required

**Request:**
```json
{
  "uid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "customerName": "John Doe",
  "orderTotal": 170.00,
  "bookingData": {
    "deliverySpeed": "standard",
    "pickupAddress": "123 Main St, Springfield, IL 62701",
    "pickupAddressDetails": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701"
    },
    "pickupSpot": "front-door",
    "pickupInstructions": "Ring doorbell twice",
    "detergent": "classic-scented",
    "detergentCustom": null,
    "hangDry": true,
    "estimatedWeight": 20,
    "protectionPlan": "premium",
    "deliveryAddress": "456 Oak Ave, Springfield, IL 62702",
    "deliveryAddressDetails": {
      "street": "456 Oak Ave",
      "city": "Springfield",
      "state": "IL",
      "zip": "62702"
    },
    "additionalRequests": false,
    "additionalRequestsText": null
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "order-1714396800000-xyz123",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "delivery_speed": "standard",
    "total_price": 170.00,
    "status": "pending",
    "weight": 20,
    "created_at": "2026-04-29T10:00:00Z",
    "pickup_address": "123 Main St, Springfield, IL 62701",
    "delivery_address": "456 Oak Ave, Springfield, IL 62702"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Order total must be at least $75"
}
```

---

### 2. Get All User Orders

**Endpoint:** `GET /api/orders`

**Query Parameters:**
- `status` - Filter: 'all', 'pending', 'confirmed', 'picked_up', 'in_washing', 'delivered', 'cancelled'
- `limit` - Items per page (default: 20)
- `offset` - Pagination offset (default: 0)
- `sort` - Sort field: 'date', 'price' (default: 'date')

**Example:** `GET /api/orders?status=delivered&limit=10&offset=0&sort=date`

**Headers:** Authorization required

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-1714396800000-xyz123",
      "status": "delivered",
      "total_price": 170.00,
      "weight": 20,
      "delivery_speed": "standard",
      "created_at": "2026-04-28T10:00:00Z",
      "pickup_address": "123 Main St, Springfield, IL 62701",
      "delivery_address": "456 Oak Ave, Springfield, IL 62702",
      "estimated_delivery": "2026-04-29T18:00:00Z"
    },
    {
      "id": "order-1714310400000-abc456",
      "status": "completed",
      "total_price": 85.50,
      "weight": 12,
      "delivery_speed": "express",
      "created_at": "2026-04-27T14:00:00Z",
      "pickup_address": "123 Main St, Springfield, IL 62701",
      "delivery_address": "456 Oak Ave, Springfield, IL 62702",
      "estimated_delivery": "2026-04-27T20:00:00Z"
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 3. Get Order Details

**Endpoint:** `GET /api/orders/{orderId}`

**Headers:** Authorization required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "order-1714396800000-xyz123",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "in_washing",
    "total_price": 170.00,
    "weight": 20,
    "delivery_speed": "standard",
    "created_at": "2026-04-28T10:00:00Z",
    "estimated_delivery": "2026-04-29T18:00:00Z",
    "pickup_address": "123 Main St, Springfield, IL 62701",
    "delivery_address": "456 Oak Ave, Springfield, IL 62702",
    "bookingData": {
      "detergent": "classic-scented",
      "hangDry": true,
      "protectionPlan": "premium",
      "pickupSpot": "front-door",
      "pickupInstructions": "Ring doorbell twice"
    },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2026-04-28T10:00:00Z",
        "message": "Order placed - awaiting payment"
      },
      {
        "status": "confirmed",
        "timestamp": "2026-04-28T10:05:00Z",
        "message": "Payment received, order confirmed"
      },
      {
        "status": "picked_up",
        "timestamp": "2026-04-28T14:00:00Z",
        "message": "Laundry picked up by John (Pro #1234)"
      },
      {
        "status": "in_washing",
        "timestamp": "2026-04-28T15:00:00Z",
        "message": "Laundry being processed and washed"
      },
      {
        "status": "in_transit",
        "timestamp": "2026-04-29T17:00:00Z",
        "message": "Laundry in transit for delivery"
      }
    ],
    "pro_assigned": {
      "id": "pro-123",
      "name": "John Smith",
      "rating": 4.9,
      "phone": "+1 (555) 123-4567"
    }
  }
}
```

---

### 4. Cancel Order

**Endpoint:** `DELETE /api/orders/{orderId}`

**Headers:** Authorization required

**Response (200):**
```json
{
  "success": true,
  "message": "Order cancelled and refund initiated",
  "refundId": "refund-1714396800000",
  "refundAmount": 170.00
}
```

**Error (400):**
```json
{
  "error": "Cannot cancel order - already picked up"
}
```

---

### 5. Submit Order Review

**Endpoint:** `POST /api/orders/{orderId}/review`

**Headers:** Authorization required

**Request:**
```json
{
  "rating": 5,
  "comment": "Excellent service! Clothes were perfectly clean and on time.",
  "issues": []
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review submitted successfully"
}
```

---

## 💳 Payment Endpoints

### 1. Create Stripe Checkout Session

**Endpoint:** `POST /api/stripe/create-checkout-session`

**Headers:** Authorization required

**Request:**
```json
{
  "orderId": "order-1714396800000-xyz123",
  "orderTotal": 170.00,
  "successUrl": "washlee://payment-success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "washlee://payment-cancel"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_a1B2C3D4E5F6G7H8I9",
    "clientSecret": "pi_test_a1b2c3d4e5f6g7h8i9_secret_x1y2z3",
    "publishableKey": "pk_test_51StlVu38bIfbwMU6AxPVmVw4LledOTJ81le8rNUeMH9cnvRDQ909bJ42iSWUFxxDvdkkMy5GkVB1yKbRXHatAd5y00epXjzqjo",
    "url": "https://checkout.stripe.com/pay/cs_test_a1B2C3D4E5F6G7H8I9"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Order not found"
}
```

---

### 2. Verify Payment Session

**Endpoint:** `POST /api/stripe/verify-session`

**Headers:** Authorization required

**Request:**
```json
{
  "sessionId": "cs_test_a1B2C3D4E5F6G7H8I9"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_a1B2C3D4E5F6G7H8I9",
    "paymentStatus": "paid",
    "amount": 17000,
    "currency": "aud",
    "customerEmail": "user@example.com",
    "metadata": {
      "orderId": "order-1714396800000-xyz123"
    }
  }
}
```

---

## 📊 Dashboard Endpoints

### 1. Get Dashboard Metrics

**Endpoint:** `GET /api/dashboard/metrics`

**Headers:** Authorization required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "user@example.com",
      "phone": "+1 (234) 567-8900"
    },
    "stats": {
      "activeOrders": 2,
      "completedOrders": 8,
      "totalSpent": 1456.75,
      "savingsAmount": 145.68,
      "loyaltyPoints": 1456,
      "currentTier": "silver"
    },
    "recentOrders": [
      {
        "id": "order-1714396800000-xyz123",
        "status": "in_washing",
        "totalPrice": 170.00,
        "weight": 20,
        "deliverySpeed": "standard",
        "created_at": "2026-04-28T10:00:00Z",
        "estimated_delivery": "2026-04-29T18:00:00Z",
        "pickupAddress": "123 Main St, Springfield, IL 62701",
        "deliveryAddress": "456 Oak Ave, Springfield, IL 62702"
      }
    ]
  }
}
```

---

## 💳 Subscription Endpoints

### 1. Get Available Plans

**Endpoint:** `GET /api/subscriptions/plans`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "none",
        "name": "Pay Per Order",
        "monthlyPrice": 0,
        "annualPrice": 0,
        "discountPercentage": 0,
        "features": [
          "No subscription fee",
          "Pay only for orders"
        ],
        "popular": false
      },
      {
        "id": "starter",
        "name": "Starter",
        "monthlyPrice": 29,
        "annualPrice": 290,
        "discountPercentage": 15,
        "features": [
          "15% discount on all services",
          "Unlimited pickups & deliveries",
          "Priority support",
          "Free basic protection"
        ],
        "popular": false
      },
      {
        "id": "professional",
        "name": "Professional",
        "monthlyPrice": 59,
        "annualPrice": 590,
        "discountPercentage": 20,
        "features": [
          "20% discount on all services",
          "Unlimited pickups & deliveries",
          "Priority support + Express lane",
          "Free premium protection",
          "Monthly loyalty bonus"
        ],
        "popular": true
      },
      {
        "id": "washly",
        "name": "Washly Premium",
        "monthlyPrice": 99,
        "annualPrice": 990,
        "discountPercentage": 25,
        "features": [
          "25% discount on all services",
          "Unlimited pickups & deliveries",
          "24/7 dedicated support",
          "Free premium+ protection",
          "Triple loyalty points",
          "Monthly laundry credit",
          "VIP member benefits"
        ],
        "popular": false
      }
    ]
  }
}
```

---

### 2. Create Subscription Checkout

**Endpoint:** `POST /api/subscriptions/create-checkout-session`

**Headers:** Authorization required

**Request:**
```json
{
  "plan": "professional"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_b2C3D4E5F6G7H8I9J",
    "url": "https://checkout.stripe.com/pay/cs_test_b2C3D4E5F6G7H8I9J",
    "clientSecret": "pi_test_b2c3d4e5f6g7h8i9j_secret_y2z3a4"
  }
}
```

---

### 3. Get Current Subscription

**Endpoint:** `GET /api/subscriptions/current`

**Headers:** Authorization required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "plan": "professional",
    "status": "active",
    "startDate": "2026-03-29T10:00:00Z",
    "renewalDate": "2026-05-29T10:00:00Z",
    "discountPercentage": 20,
    "price": 59.00,
    "billingCycle": "monthly"
  }
}
```

---

### 4. Cancel Subscription

**Endpoint:** `POST /api/subscriptions/cancel`

**Headers:** Authorization required

**Response (200):**
```json
{
  "success": true,
  "message": "Subscription cancelled. You can still use Washlee with pay-per-order pricing."
}
```

---

## ⚠️ Error Responses

### Standard Error Format

All errors follow this structure:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created (order, review) |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | User not authorized for resource |
| 404 | Not Found | Order/user not found |
| 409 | Conflict | Duplicate email, order already cancelled |
| 500 | Server Error | Internal server error |

### Error Examples

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "weight": "Weight must be between 10 and 45 kg",
    "deliveryAddress": "Address is required"
  }
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "AUTH_ERROR"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Order not found",
  "code": "NOT_FOUND"
}
```

---

## 🔄 Webhook Events

### Stripe Checkout Completed

**Event:** `checkout.session.completed`

**When:** User successfully completes Stripe payment

**Backend Automatically:**
1. Verifies webhook signature
2. Updates order status to "confirmed"
3. Stores payment details
4. Sends confirmation email
5. Auto-assigns order to available pro

**Webhook Data:**
```json
{
  "id": "evt_1234567890",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_a1B2C3D4E5F6G7H8I9",
      "payment_status": "paid",
      "amount_total": 17000,
      "currency": "aud",
      "metadata": {
        "orderId": "order-1714396800000-xyz123",
        "userId": "550e8400-e29b-41d4-a716-446655440000"
      }
    }
  }
}
```

---

## 📱 Rate Limits

API requests are rate-limited to prevent abuse:

- **Per User:** 100 requests per minute
- **Per IP:** 1000 requests per minute
- **Burst:** 10 requests per second

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1714400000
```

**Rate Limit Error (429):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## 🔒 Security Best Practices

### Token Management
1. Store access token in secure storage
2. Set expiration check (usually 1 hour)
3. Auto-refresh before expiration
4. Remove token on logout

### API Communication
1. Always use HTTPS in production
2. Include Authorization header on protected routes
3. Validate SSL certificates
4. Never log sensitive data (passwords, tokens)

### Error Handling
1. Don't expose internal error details to users
2. Log errors server-side for debugging
3. Show user-friendly error messages
4. Use proper HTTP status codes

### Input Validation
1. Validate all user input client-side
2. Sanitize before sending to API
3. Trust server validation only
4. Reject suspicious patterns

---

## 📞 Support & Debugging

### Enable Debug Logging

```javascript
// Add to API client initialization
const API_CLIENT = {
  enableDebugLogging: true,
  
  async request(url, options) {
    if (this.enableDebugLogging) {
      console.log(`[API] ${options.method} ${url}`);
      console.log('[API] Request:', options.body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (this.enableDebugLogging) {
      console.log('[API] Response:', data);
    }
    
    return data;
  }
};
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token expired, refresh or re-login |
| 400 Bad Request | Check request body structure |
| 404 Not Found | Verify orderId/userId is correct |
| CORS Error | Check API base URL, CORS headers |
| Timeout | Increase timeout, check network |
| Payment declined | Try different card, check Stripe logs |

---

**API Documentation Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** April 29, 2026
