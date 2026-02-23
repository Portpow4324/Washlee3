# Backend Integration Guide

Complete setup instructions for Washlee backend.

## Prerequisites

- Node.js 18+ installed
- Firebase project created
- Stripe account with API keys
- Backend repository cloned

---

## Step 1: Firebase Setup

### Create Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **⚙️ Project Settings** (top-left)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file downloads - open it

### Extract Key

The downloaded JSON contains all needed values. Copy the entire file content.

---

## Step 2: Stripe Setup

### Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API Keys**
3. Copy the **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Create Webhook Endpoint

1. Go to **Developers → Webhooks**
2. Click **Add an endpoint**
3. URL: `https://your-backend-url/webhooks/stripe`
4. Events: Select both:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Create endpoint
6. Copy the **Signing secret** (starts with `whsec_`)

---

## Step 3: Backend Configuration

### Create .env File

In the `backend/` folder, create `.env`:

```bash
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase (from Step 1)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Stripe (from Step 2)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Important:** Keep the quotes around the Firebase key and don't add spaces after `=`

### Verify .env

```bash
# Check file exists
ls -la backend/.env

# Verify it's readable (should show contents)
cat backend/.env
```

---

## Step 4: Install Dependencies

```bash
cd backend
npm install
```

Expected output should show:
- express
- firebase-admin
- stripe
- cors
- dotenv

---

## Step 5: Start Server

### Development

```bash
npm run dev
```

Expected output:
```
[Server] Washlee backend running on port 3001
[Server] Frontend URL: http://localhost:3000
[Server] Environment: development
```

### Production

```bash
npm start
```

---

## Step 6: Test Endpoints

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T..."
}
```

### Test Auth (requires Firebase token)

```bash
# In your frontend console, get a token:
const token = await user.getIdToken()
console.log(token)

# Then test:
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/admin/users/customers-only
```

---

## Step 7: Frontend Integration

### Update Frontend Environment

In frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Create Payment Service

```typescript
// lib/paymentService.ts
async function createCheckoutSession(plan: string, priceId: string) {
  const token = await user.getIdToken()
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/payments/create-checkout-session`,
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
  if (data.url) {
    window.location.href = data.url
  }
}
```

---

## Step 8: Firebase Custom Claims (Admin Setup)

To make a user an admin:

```bash
# Via Firebase CLI
firebase auth:import users.json --hash-algo=scrypt --hash-key=... --project=your-project

# Or via Admin SDK in a separate script:
const admin = require('firebase-admin')
admin.auth().setCustomUserClaims('uid', { admin: true })
```

Or use this quick script:

```javascript
// scripts/setAdmin.js
const admin = require('firebase-admin')
const serviceAccount = require('../backend/.env.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const uid = 'user-uid-here'

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => console.log(`Admin claim set for ${uid}`))
  .catch(err => console.error('Error:', err))
```

Run:
```bash
node scripts/setAdmin.js
```

---

## Step 9: Test Stripe Webhook

### Using Stripe CLI

```bash
# Install Stripe CLI (https://stripe.com/docs/stripe-cli)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/webhooks/stripe
```

### Trigger Test Event

In another terminal:

```bash
stripe trigger checkout.session.completed
```

### Check Logs

Webhook logs appear in server console:
```
[Webhook] Received event: checkout.session.completed
[Webhook] Processing payment completion for user ...
```

---

## Step 10: Database Verification

Verify Firestore structure matches backend expectations:

### Required Fields

User document should have:

```json
{
  "email": "user@example.com",
  "isEmployee": false,
  "loyaltyMember": false,
  "subscription": {
    "active": false,
    "plan": "basic",
    "paymentStatus": "none"
  },
  "adminApproval": {
    "status": "none",
    "confirmedBy": null,
    "confirmedAt": null
  },
  "createdAt": "2026-02-08T..."
}
```

**If fields are missing**, the backend will fail. Migrate existing users:

```javascript
// scripts/migrateUsers.js
const admin = require('firebase-admin')
const serviceAccount = require('../backend/.env.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function migrateUsers() {
  const snapshot = await db.collection('users').get()
  
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const updates = {}
    
    // Add missing fields
    if (!data.subscription) {
      updates['subscription'] = {
        active: false,
        plan: 'basic',
        paymentStatus: 'none',
      }
    }
    
    if (!data.adminApproval) {
      updates['adminApproval'] = {
        status: 'none',
        confirmedBy: null,
        confirmedAt: null,
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates)
      console.log(`Updated ${doc.id}`)
    }
  }
  
  console.log('Migration complete')
}

migrateUsers().catch(console.error)
```

Run:
```bash
node scripts/migrateUsers.js
```

---

## Troubleshooting

### "Cannot find module 'firebase-admin'"

```bash
npm install firebase-admin
```

### "FIREBASE_SERVICE_ACCOUNT_KEY is not set"

- Verify `.env` file exists in `backend/` folder
- Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is set (view with `cat .env`)
- Restart server after adding env vars

### "Webhook signature verification failed"

- Verify webhook secret in `.env` matches Stripe dashboard
- Ensure webhook endpoint URL is correct in Stripe dashboard
- Use `stripe listen` for local testing, not hardcoded URL

### "Admin privileges required"

- User must have `admin: true` custom claim in Firebase
- Token must be refreshed after setting claim (logout/login)
- Check token in Firebase Console → Authentication → Custom Claims

### 404 on webhook

- Webhook must be before `verifyFirebaseAuth` middleware in `app.js`
- Check that webhook URL in Stripe is `/webhooks/stripe` (not `/webhook`)

---

## API Response Examples

### Success: Create Checkout

```json
{
  "url": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_..."
}
```

### Success: Admin Endpoint

```json
{
  "count": 5,
  "users": [
    {
      "uid": "user-123",
      "email": "user@example.com",
      "subscription": {
        "active": false,
        "plan": "basic",
        "paymentStatus": "pending"
      },
      ...
    }
  ]
}
```

### Error: Missing Token

```json
{
  "error": "Missing or invalid Authorization header"
}
```

### Error: Admin Required

```json
{
  "error": "Forbidden",
  "message": "Admin privileges required"
}
```

---

## Production Deployment

### Environment Variables

Use production values:
```env
NODE_ENV=production
FRONTEND_URL=https://washlee.com
STRIPE_SECRET_KEY=sk_live_... (NOT sk_test_)
STRIPE_WEBHOOK_SECRET=whsec_... (from production webhook)
```

### Deploy Options

**Vercel** (easiest):
```bash
vercel --prod
```

**Heroku**:
```bash
heroku create washlee-backend
heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY='...'
heroku config:set STRIPE_SECRET_KEY='sk_live_...'
git push heroku main
```

**AWS Lambda** (serverless):
- Bundle with `serverless-http`
- Set environment variables in Lambda console

**Google Cloud Run**:
```bash
gcloud run deploy washlee-backend --source . --region us-central1
```

---

## Monitoring

Add error tracking (recommended for production):

```bash
npm install sentry
```

In `app.js`:
```javascript
const Sentry = require('@sentry/node')

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})

app.use(Sentry.Handlers.errorHandler())
```

---

## Support

For issues:
1. Check server logs: `npm run dev`
2. Verify .env variables: `cat backend/.env`
3. Test Firebase: `firebase auth:list --project=your-project`
4. Test Stripe: `stripe api /checkout/sessions`

---

**Next Steps:**

- ✅ Backend running
- ✅ Firebase connected
- ✅ Stripe integrated
- 👉 **Deploy to production**
- 👉 **Test full checkout flow**
- 👉 **Monitor transactions**
