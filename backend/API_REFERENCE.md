# Washlee Backend - API Reference

Quick reference for all API endpoints.

---

## Authentication

All endpoints (except `/health` and `/webhooks/stripe`) require:

```
Authorization: Bearer {firebaseIdToken}
```

Get token in frontend:
```javascript
const token = await user.getIdToken()
```

---

## Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T12:34:56.789Z"
}
```

---

## Admin Endpoints

**Base:** `GET /admin/users/{endpoint}`  
**Auth:** Required (admin only)

### Pending Payments

```
GET /admin/users/pending-payments
```

**Response:**
```json
{
  "count": 2,
  "users": [
    {
      "uid": "user-abc123",
      "email": "john@example.com",
      "subscription": {
        "paymentStatus": "pending",
        "plan": "wash_club"
      }
    }
  ]
}
```

### Active Subscriptions

```
GET /admin/users/subscriptions
```

**Response:**
```json
{
  "count": 15,
  "users": [...]
}
```

### Wash Club Members

```
GET /admin/users/wash-club
```

### Employees

```
GET /admin/users/employees
```

### Customers Only

```
GET /admin/users/customers-only
```

---

## Admin Actions

### Confirm Payment

```
POST /admin/users/:uid/confirm-payment
```

**Example:**
```bash
curl -X POST -H "Authorization: Bearer {token}" \
  http://localhost:3001/admin/users/user-123/confirm-payment
```

**Response:**
```json
{
  "message": "Payment confirmed successfully",
  "user": {
    "subscription": {
      "active": true,
      "paymentStatus": "paid"
    },
    "adminApproval": {
      "status": "confirmed",
      "confirmedBy": "admin-uid-456",
      "confirmedAt": "2026-02-08T12:34:56Z"
    }
  }
}
```

### Reject Payment

```
POST /admin/users/:uid/reject-payment
```

**Example:**
```bash
curl -X POST -H "Authorization: Bearer {token}" \
  http://localhost:3001/admin/users/user-123/reject-payment
```

---

## Payment Endpoints

### Create Checkout Session

```
POST /payments/create-checkout-session
```

**Required Headers:**
```
Authorization: Bearer {firebaseIdToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "plan": "wash_club",
  "priceId": "price_1234567890abcdef"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_..."
}
```

**JavaScript Example:**
```javascript
async function checkout(plan, priceId) {
  const token = await user.getIdToken()
  
  const response = await fetch(
    'http://localhost:3001/payments/create-checkout-session',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan, priceId }),
    }
  )
  
  const data = await response.json()
  window.location.href = data.url
}
```

---

## Webhook Endpoint

```
POST /webhooks/stripe
```

**Headers (Stripe sends automatically):**
```
Stripe-Signature: t=...,v1=...
Content-Type: application/json
```

**No Authentication Required**

**Handled Events:**
- ✅ `checkout.session.completed` → Activates subscription
- ✅ `payment_intent.payment_failed` → Deactivates subscription

---

## Error Responses

### 400 - Bad Request

```json
{
  "error": "Missing required fields: plan, priceId"
}
```

### 401 - Unauthorized

```json
{
  "error": "Missing or invalid Authorization header"
}
```

### 403 - Forbidden

```json
{
  "error": "Forbidden",
  "message": "Admin privileges required"
}
```

### 404 - Not Found

```json
{
  "error": "User not found"
}
```

### 500 - Server Error

```json
{
  "error": "Failed to create checkout session",
  "message": "Stripe API error details..."
}
```

---

## Rate Limits

No built-in rate limiting. Recommended for production:
- Use API gateway (AWS API Gateway, Kong, etc.)
- Implement rate limiting middleware: `npm install express-rate-limit`

Example:
```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
})

app.use('/payments', limiter)
```

---

## Firestore Data Structure

### Users Collection

```
users/
  {uid}/
    uid: string
    email: string
    isEmployee: boolean
    loyaltyMember: boolean
    subscription: {
      active: boolean
      plan: "basic" | "pro" | "wash_club"
      paymentStatus: "none" | "pending" | "paid"
    }
    adminApproval: {
      status: "none" | "confirmed" | "rejected"
      confirmedBy: string (admin uid or "stripe")
      confirmedAt: timestamp
    }
    createdAt: timestamp
```

---

## Curl Examples

### Get Pending Payments

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/admin/users/pending-payments
```

### Create Checkout

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "wash_club",
    "priceId": "price_1234567890abcdef"
  }' \
  http://localhost:3001/payments/create-checkout-session
```

### Confirm Payment (Admin)

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/admin/users/user-123/confirm-payment
```

### Test Webhook (with Stripe CLI)

```bash
stripe trigger checkout.session.completed
```

---

## Stripe Test Cards

Use these for testing Stripe checkout in test mode:

| Card | Status |
|------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0000 0000 0341 | 3D Secure |
| 5555 5555 5555 4444 | Mastercard |

**Expiry:** Any future date  
**CVC:** Any 3 digits

---

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| PORT | No | 3001 |
| NODE_ENV | No | development |
| FRONTEND_URL | No | http://localhost:3000 |
| FIREBASE_SERVICE_ACCOUNT_KEY | Yes | {"type":"service_account",...} |
| STRIPE_SECRET_KEY | Yes | sk_test_... |
| STRIPE_WEBHOOK_SECRET | Yes | whsec_... |

---

## Logging

Server logs include prefixes:

```
[Server]    Server startup messages
[Auth]      Authentication events
[Payments]  Payment creation
[Stripe]    Stripe API calls
[Webhook]   Webhook processing
[Firebase]  Firestore operations
[Admin]     Admin actions
[Error]     Error messages
```

Enable verbose logging:
```bash
DEBUG=* npm run dev
```

---

## Performance Tips

### Admin Queries

Large user counts can slow queries. Optimize with:

1. **Firestore Indexes**
   - Dashboard → Firestore → Composite Indexes
   - Create index for `(subscription.active, createdAt)`

2. **Pagination** (add to backend)
   ```javascript
   router.get('/users/subscriptions?limit=50&page=1')
   ```

3. **Caching** (Redis)
   ```bash
   npm install redis
   ```

### Stripe Webhooks

Webhooks should respond within 3 seconds. For long operations:

```javascript
// Acknowledge immediately
res.json({ received: true })

// Process in background
processPayment(uid).catch(err => {
  console.error('[Webhook] Background job failed:', err)
})
```

---

## Production Checklist

- [ ] Switch to `sk_live_*` Stripe keys
- [ ] Update Stripe webhook URL to production
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only (`https://` URLs)
- [ ] Enable CORS for production domain only
- [ ] Set up error tracking (Sentry, DataDog)
- [ ] Enable database backups
- [ ] Configure Firebase Firestore rules
- [ ] Use environment secret management (AWS Secrets Manager)
- [ ] Monitor server health
- [ ] Set up alerting for payment failures

---

**Last Updated:** February 8, 2026
