# Washlee Backend

Production-ready Node.js + Express backend with Firebase Admin SDK, Stripe integration, and admin sorting.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: Firebase Firestore (Admin SDK)
- **Payments**: Stripe
- **Auth**: Firebase Authentication (ID token verification)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Firebase Service Account Key:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the entire JSON and paste as the value (keep it in quotes)

**Stripe Keys:**
1. Go to Stripe Dashboard → Developers → API Keys
2. Copy Secret Key and Webhook Secret

### 3. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

---

## API Endpoints

### Authentication

All endpoints (except webhooks) require:

```
Authorization: Bearer {firebaseIdToken}
```

### Admin Routes

#### Get Pending Payments
```
GET /admin/users/pending-payments
```
Returns users with `subscription.paymentStatus == "pending"`

#### Get Active Subscriptions
```
GET /admin/users/subscriptions
```
Returns users with `subscription.active == true`

#### Get Wash Club Members
```
GET /admin/users/wash-club
```
Returns users with `loyaltyMember == true`

#### Get Employees
```
GET /admin/users/employees
```
Returns users with `isEmployee == true`

#### Get Customers Only
```
GET /admin/users/customers-only
```
Returns users with no subscriptions, no loyalty, not employees

#### Confirm Payment (Admin Override)
```
POST /admin/users/:uid/confirm-payment
```
Sets `subscription.active = true`, `paymentStatus = "paid"`, `adminApproval.status = "confirmed"`

#### Reject Payment
```
POST /admin/users/:uid/reject-payment
```
Sets `subscription.active = false`, `paymentStatus = "none"`, `adminApproval.status = "rejected"`

### Payment Routes

#### Create Checkout Session
```
POST /payments/create-checkout-session
Content-Type: application/json
Authorization: Bearer {firebaseIdToken}

{
  "plan": "wash_club",
  "priceId": "price_..."
}
```

Response:
```json
{
  "url": "https://checkout.stripe.com/pay/...",
  "sessionId": "cs_..."
}
```

### Webhook Routes

#### Stripe Webhook
```
POST /webhooks/stripe
Stripe-Signature: {signature}
```

Handles:
- `checkout.session.completed` → Auto-activates subscription
- `payment_intent.payment_failed` → Deactivates subscription

---

## Firestore Structure

### users Collection

```json
{
  "uid": "firebase_auth_uid",
  "email": "user@example.com",
  "isEmployee": false,
  "loyaltyMember": false,
  "subscription": {
    "active": false,
    "plan": "basic | pro | wash_club",
    "paymentStatus": "none | pending | paid"
  },
  "adminApproval": {
    "status": "none | confirmed | rejected",
    "confirmedBy": "admin_uid | stripe",
    "confirmedAt": "timestamp"
  },
  "createdAt": "timestamp"
}
```

---

## Security

- ✅ Firebase ID token verification on all auth routes
- ✅ Admin-only routes require `admin: true` custom claim
- ✅ Stripe webhook signature verification (no auth required)
- ✅ CORS configured for frontend origin
- ✅ No hardcoded secrets

---

## Flow: Subscription Checkout

1. **User clicks "Subscribe"** → Frontend creates checkout session
2. **POST /payments/create-checkout-session** 
   - Backend verifies user
   - Creates Stripe session
   - Sets `paymentStatus = "pending"`
   - Returns Stripe checkout URL
3. **User completes payment in Stripe**
4. **Stripe fires webhook** → `checkout.session.completed`
5. **POST /webhooks/stripe**
   - Backend verifies signature
   - Sets `subscription.active = true`
   - Sets `paymentStatus = "paid"`
   - Sets `adminApproval.status = "confirmed"`
6. **Admin dashboard updates** (real-time Firestore listener on frontend)

---

## Admin Sorting: Use Cases

### View Pending Payments
Admin needs to manually review uncertain transactions:
```bash
curl -H "Authorization: Bearer {adminToken}" \
  http://localhost:3001/admin/users/pending-payments
```

### View Active Subscriptions
Marketing/retention team tracks paying customers:
```bash
curl -H "Authorization: Bearer {adminToken}" \
  http://localhost:3001/admin/users/subscriptions
```

### View Wash Club Members
VIP customer retention program:
```bash
curl -H "Authorization: Bearer {adminToken}" \
  http://localhost:3001/admin/users/wash-club
```

### View Employees
HR dashboard:
```bash
curl -H "Authorization: Bearer {adminToken}" \
  http://localhost:3001/admin/users/employees
```

### View Regular Customers
Sales team targets non-subscribers:
```bash
curl -H "Authorization: Bearer {adminToken}" \
  http://localhost:3001/admin/users/customers-only
```

### Override Payment Confirmation
In case of Stripe issues:
```bash
curl -X POST -H "Authorization: Bearer {adminToken}" \
  http://localhost:3001/admin/users/{uid}/confirm-payment
```

---

## Logging

All operations are logged to console with prefixes:

- `[Server]` - Server startup
- `[Auth]` - Authentication events
- `[Payments]` - Payment creation
- `[Stripe]` - Stripe API calls
- `[Webhook]` - Webhook events
- `[Firebase]` - Firestore operations
- `[Admin]` - Admin operations
- `[Error]` - Error events

---

## Testing Stripe Webhook Locally

Use Stripe CLI:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to your Stripe account
stripe login

# Forward webhook events to local server
stripe listen --forward-to localhost:3001/webhooks/stripe

# Run tests (in another terminal)
stripe trigger payment_intent.succeeded
```

---

## Troubleshooting

### "Invalid or expired token"
- Ensure frontend sends valid Firebase ID token
- Check token hasn't expired (usually 1 hour)
- Verify `Authorization: Bearer {token}` format

### "Admin privileges required"
- User's Firebase account must have `admin: true` custom claim
- Set in Firebase Console or via Admin SDK

### "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` matches webhook endpoint
- Ensure webhook uses raw body (not JSON-parsed)

### "User not found"
- User document must exist in `users` collection
- UID must match Firebase Auth UID

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production Stripe keys (sk_live_...)
- [ ] Enable HTTPS only
- [ ] Set FRONTEND_URL to production domain
- [ ] Configure Stripe webhook endpoint in dashboard
- [ ] Add error tracking (Sentry, DataDog, etc.)
- [ ] Set up monitoring/alerting
- [ ] Use secure secret management (AWS Secrets Manager, etc.)
- [ ] Enable Firebase Firestore backups
- [ ] Configure CORS for production domain only

---

## License

ISC
