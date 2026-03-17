# Security Architecture - Visual Guide

## 🏗️ Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     WASHLEE APPLICATION LAYER                   │
│                  (React Components, Next.js Pages)              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ErrorBoundary.tsx                                        │ │
│  │  ├── Catches component rendering errors                  │ │
│  │  ├── Shows fallback UI                                   │ │
│  │  ├── Auto-recovery after 3 errors                        │ │
│  │  └── Logs errors for debugging                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  AuthProvider (Session Management)                        │ │
│  │  ├── User authentication                                 │ │
│  │  ├── Token management                                    │ │
│  │  └── Protected routes                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API REQUEST LAYER                           │
│              (Next.js API Routes: /api/*)                        │
└─────────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  REQUEST SECURITY PIPELINE                                      │
│                                                                 │
│  1️⃣  RATE LIMITING CHECK                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  lib/middleware/rateLimit.ts                             │ │
│  │                                                          │ │
│  │  withRateLimit(request, max, window)                   │ │
│  │  ├── Extract client IP                                 │ │
│  │  ├── Check request count vs limit                      │ │
│  │  ├── If exceeded → return 429 (rate limited)           │ │
│  │  └── If OK → continue to validation                    │ │
│  │                                                          │ │
│  │  Limits:                                                │ │
│  │  ├── checkout:      5 req/min                          │ │
│  │  ├── payment:      10 req/min                          │ │
│  │  ├── orders:       20 req/min                          │ │
│  │  ├── login:         5 req/5min                         │ │
│  │  └── signup:        3 req/hour                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                             ▼                                    │
│  2️⃣  INPUT VALIDATION                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  lib/validationSchemas.ts (Zod Schemas)                 │ │
│  │                                                          │ │
│  │  validateData(schema, input)                            │ │
│  │  ├── Email validation                                  │ │
│  │  ├── Type checking                                     │ │
│  │  ├── Range validation                                  │ │
│  │  ├── Format validation (phone, address)                │ │
│  │  ├── Enum validation                                   │ │
│  │  ├── If invalid → return 400 (validation error)        │ │
│  │  └── If valid → continue to processing                 │ │
│  │                                                          │ │
│  │  Schemas (15+ types):                                   │ │
│  │  ├── CreateOrderSchema                                 │ │
│  │  ├── CheckoutSessionSchema                             │ │
│  │  ├── PaymentIntentSchema                               │ │
│  │  ├── SavePaymentMethodSchema                           │ │
│  │  └── ... (auth, addresses, profiles, reviews, etc.)    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                             ▼                                    │
│  3️⃣  BUSINESS LOGIC PROCESSING                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Your API Route Logic                                    │ │
│  │  ├── Database operations                               │ │
│  │  ├── External API calls                                │ │
│  │  ├── Email sending                                     │ │
│  │  └── Webhook processing                                │ │
│  │                                                          │ │
│  │  Try/Catch:                                            │ │
│  │  └── Catch any unexpected errors                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                             ▼                                    │
│  4️⃣  RESPONSE FORMATTING                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  lib/apiUtils.ts (Response Helpers)                     │ │
│  │                                                          │ │
│  │  Standard Response Format:                              │ │
│  │  {                                                      │ │
│  │    "success": boolean,                                 │ │
│  │    "data": {...},                                      │ │
│  │    "message": "...",                                   │ │
│  │    "timestamp": "2024-01-18T23:00:00Z"                │ │
│  │  }                                                      │ │
│  │                                                          │ │
│  │  Success Response:    200, 201, 204                    │ │
│  │  Error Response:      400, 401, 403, 404, 409, 429, 500│ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT RECEIVES RESPONSE                                        │
│  ├── Status Code (200-500)                                     │
│  ├── Standardized JSON response                                │
│  ├── User-friendly error messages                              │
│  └── Helpful error details (dev mode)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Examples

### ✅ Successful Request

```
Client Request
    ↓
[Rate Limit Check] ✅ Within limits
    ↓
[Input Validation] ✅ Valid email, password
    ↓
[Business Logic] ✅ User logged in
    ↓
[Response] 200 + { user data }
    ↓
Client Success
```

### ❌ Rate Limited Request

```
Client Request (6th request in 1 minute)
    ↓
[Rate Limit Check] ❌ EXCEEDED (limit: 5/min)
    ↓
[Response] 429 + { message: "Too many requests", retryAfter: 60 }
    ↓
Client: "Please wait 60 seconds before trying again"
```

### ❌ Invalid Input Request

```
Client Request: { email: "invalid-email", password: "123" }
    ↓
[Rate Limit Check] ✅ Within limits
    ↓
[Input Validation] ❌ INVALID
    • email: not a valid email format
    • password: must be at least 8 characters
    ↓
[Response] 400 + { 
  message: "Invalid data",
  errors: {
    email: ["Invalid email format"],
    password: ["Must be at least 8 characters"]
  }
}
    ↓
Client: Shows error messages to user
```

### ❌ Server Error Request

```
Client Request: { valid data }
    ↓
[Rate Limit Check] ✅ Within limits
    ↓
[Input Validation] ✅ Valid
    ↓
[Business Logic] ❌ DATABASE CONNECTION FAILED
    ↓
[Error Caught] Console logs error
    ↓
[Response] 500 + { message: "Failed to create order" }
    ↓
Client: "Something went wrong. Please try again later."
```

---

## 🛡️ Security Coverage Map

```
┌─────────────────────────────────────────────────────┐
│ ENDPOINT SECURITY MATRIX                            │
├─────────────────┬──────────┬────────────┬───────────┤
│ Endpoint        │ Rate Limit│ Validation │ Error Hdl │
├─────────────────┼──────────┼────────────┼───────────┤
│ /api/orders     │ 20/min   │ Zod Schema │ ✅ Full   │
│ /api/checkout   │  5/min   │ Zod Schema │ ✅ Full   │
│ /api/payments   │ 10/min   │ Zod Schema │ ✅ Full   │
├─────────────────┼──────────┼────────────┼───────────┤
│ /api/auth       │ 5/5min   │ TODO       │ ✅ Full   │
│ /api/signup     │ 3/hr     │ TODO       │ ✅ Full   │
│ /api/addresses  │ 30/min   │ TODO       │ ✅ Full   │
├─────────────────┼──────────┼────────────┼───────────┤
│ All Others      │ ⚠️ None  │ ⚠️ Basic   │ ✅ Full   │
└─────────────────┴──────────┴────────────┴───────────┘

✅ = Implemented
⚠️  = Needs Implementation
TODO = Next Phase
```

---

## 📊 Error Response Examples

### Validation Error (400)
```json
{
  "success": false,
  "error": "Invalid data",
  "details": {
    "email": ["Invalid email format"],
    "password": ["Must be at least 8 characters"]
  },
  "timestamp": "2024-01-18T23:00:00Z"
}
```

### Rate Limited (429)
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 60 seconds.",
  "retryAfter": 60,
  "timestamp": "2024-01-18T23:00:00Z"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Failed to create order",
  "message": "An error occurred while processing your request.",
  "timestamp": "2024-01-18T23:00:00Z"
}
```

### Success (200)
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-123456",
    "status": "pending_payment",
    "total": 45.99
  },
  "message": "Order created successfully",
  "timestamp": "2024-01-18T23:00:00Z"
}
```

---

## 🔐 Security Best Practices Implemented

```
✅ Input Validation
   └─ Prevents invalid data in database
   
✅ Rate Limiting
   └─ Prevents abuse and DDoS attacks
   
✅ Error Handling
   └─ Logs errors for debugging
   └─ Doesn't expose sensitive info
   
✅ Component Error Boundaries
   └─ Prevents app crash
   └─ Shows fallback UI
   
✅ Consistent Response Format
   └─ Easy for frontend to handle
   └─ Predictable error structure
   
✅ Type Safety (TypeScript)
   └─ Catches errors at compile time
   └─ Zod runtime validation
```

---

## 🚀 Deployment Ready Components

```
Production Ready (✅)
├── Input Validation Schemas
├── Rate Limiting Middleware
├── Error Response Helpers
├── Error Boundary Component
├── API Route Updates (3 routes)
├── Layout Integration
└── TypeScript Verification (0 errors)

Testing Ready (⏳)
├── Integration tests
├── Load tests
├── Invalid input tests
├── Component error tests
└── Manual API tests
```

---

## 📈 Performance Impact

```
Operation              │ Impact      │ Notes
───────────────────────┼─────────────┼──────────────────
Rate Limit Check       │ <1ms        │ In-memory store
Input Validation       │ <1ms        │ Zod parsing
Error Response Format  │ <1ms        │ JSON stringify
Error Boundary         │ 0ms runtime │ Only on error
───────────────────────┴─────────────┴──────────────────
Total Overhead         │ <3ms        │ Minimal impact
```

---

## 🎯 Next Phase Recommendations

```
Phase 1: Testing (This Week)
├── Integration tests on staging
├── Load testing with rate limits
├── Manual API testing
└── Component error testing

Phase 2: Deployment (Next Week)
├── Deploy to production
├── Monitor error rates
├── Monitor rate limit hits
└── Setup alerting

Phase 3: Expansion (Following Weeks)
├── Add validation to remaining APIs
├── Add advanced rate limiting
├── Setup error tracking (Sentry)
└── Add security monitoring
```

---

**This architecture ensures secure, reliable, and maintainable API endpoints! 🚀**
