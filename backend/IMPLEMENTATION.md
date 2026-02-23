# Washlee Backend - Complete Implementation

**Status:** ✅ Production-Ready  
**Created:** February 8, 2026  
**Version:** 1.0.0

---

## 📋 Overview

Full-stack backend for Washlee laundry service with:
- ✅ Firebase Admin SDK integration
- ✅ Stripe payment processing
- ✅ Admin sorting & management endpoints
- ✅ Webhook automation
- ✅ Role-based access control
- ✅ Production-ready error handling

---

## 📁 Project Structure

```
backend/
├── app.js                          # Express server entry point
├── package.json                    # Dependencies
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── setup.sh                        # Quick setup script
│
├── services/
│   ├── firebaseService.js         # Firestore operations
│   └── stripeService.js           # Stripe API wrapper
│
├── middleware/
│   └── auth.middleware.js         # Auth & admin verification
│
├── routes/
│   ├── admin.routes.js            # Admin sorting endpoints
│   ├── payments.routes.js         # Payment checkout
│   └── webhook.routes.js          # Stripe webhooks
│
└── docs/
    ├── README.md                  # Setup & overview
    ├── INTEGRATION_GUIDE.md        # Step-by-step integration
    ├── API_REFERENCE.md           # All endpoints
    └── IMPLEMENTATION.md          # This file
```

---

## 🔑 Key Features

### 1. Authentication Middleware
- **Location:** `middleware/auth.middleware.js`
- Verifies Firebase ID tokens
- Attaches user uid & admin status to request
- Reusable on all protected routes

### 2. Admin Sorting (5 Endpoints)
- **Location:** `routes/admin.routes.js`
- Pending payments
- Active subscriptions
- Wash club members
- Employees
- Customers only

### 3. Stripe Integration
- **Location:** `services/stripeService.js`
- Create checkout sessions
- Webhook signature verification
- Automatic subscription activation

### 4. Firebase Operations
- **Location:** `services/firebaseService.js`
- User CRUD operations
- Query by conditions
- Firestore timestamp handling
- Automatic error logging

### 5. Webhook Automation
- **Location:** `routes/webhook.routes.js`
- Auto-activate subscriptions on payment success
- Auto-deactivate on payment failure
- Stripe signature verification (no auth bypass)

---

## 🚀 Quick Start

### 1. Install & Setup
```bash
cd backend
bash setup.sh
```

### 2. Configure Environment
```bash
nano .env
# Add:
# - FIREBASE_SERVICE_ACCOUNT_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
```

### 3. Start Server
```bash
npm run dev
```

### 4. Test
```bash
curl http://localhost:3001/health
```

---

## 🔗 API Endpoints

### Public
- `GET /health` - Server status

### Protected (Firebase Auth)
- `POST /payments/create-checkout-session` - Start checkout
- `GET /admin/users/pending-payments` - Admin only
- `GET /admin/users/subscriptions` - Admin only
- `GET /admin/users/wash-club` - Admin only
- `GET /admin/users/employees` - Admin only
- `GET /admin/users/customers-only` - Admin only
- `POST /admin/users/:uid/confirm-payment` - Admin only
- `POST /admin/users/:uid/reject-payment` - Admin only

### Webhooks (Stripe Signature)
- `POST /webhooks/stripe` - No auth required

**Full reference:** See `API_REFERENCE.md`

---

## 🔐 Security Features

✅ **Firebase Token Verification**
- Validates ID tokens
- Checks custom claims for admin status
- Automatic token expiry handling

✅ **Admin-Only Routes**
- Middleware checks `admin: true` claim
- Returns 403 Forbidden if not admin
- Detailed logging of admin actions

✅ **Stripe Webhook Verification**
- Uses HMAC SHA256 signature
- Verifies using `STRIPE_WEBHOOK_SECRET`
- Bypasses auth middleware only for webhooks

✅ **No Hardcoded Secrets**
- All keys in environment variables
- `.env` in `.gitignore`
- Example template in `.env.example`

✅ **CORS Configured**
- Limited to `FRONTEND_URL`
- Prevents cross-origin attacks

---

## 📊 Firestore Schema

### users Collection

```json
{
  "uid": "firebase-auth-uid",
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
    "confirmedBy": "admin-uid or stripe",
    "confirmedAt": "Timestamp"
  },
  "createdAt": "Timestamp"
}
```

**Fields Modified by Backend:**
- `subscription.active` ✏️
- `subscription.paymentStatus` ✏️
- `subscription.plan` ✏️
- `adminApproval.*` ✏️

**Read-Only (Frontend Sets):**
- `isEmployee`
- `loyaltyMember`
- `email`
- `createdAt`

---

## 🔄 Payment Flow

```
1. User clicks "Subscribe"
   ↓
2. Frontend: POST /payments/create-checkout-session
   ├─ Backend verifies user
   ├─ Creates Stripe session
   └─ Sets paymentStatus = "pending"
   ↓
3. User completes Stripe checkout
   ↓
4. Stripe fires webhook: checkout.session.completed
   ↓
5. Backend: POST /webhooks/stripe
   ├─ Verifies signature
   ├─ Sets subscription.active = true
   ├─ Sets paymentStatus = "paid"
   └─ Sets adminApproval.status = "confirmed"
   ↓
6. Frontend listens to Firestore
   └─ Real-time dashboard update
```

---

## 🎯 Admin Use Cases

### View Pending Payments
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/admin/users/pending-payments
```
Uncertain transactions that need review.

### View Active Subscriptions
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/admin/users/subscriptions
```
Paying customers for retention campaigns.

### Manual Payment Confirmation
```bash
curl -X POST -H "Authorization: Bearer {token}" \
  http://localhost:3001/admin/users/user-123/confirm-payment
```
Override Stripe if needed (e.g., manual bank transfer).

---

## 📝 Logging

All operations logged with prefixes:

```
[Server]    Server startup
[Auth]      Token verification, user authentication
[Payments]  Checkout session creation
[Stripe]    Stripe API calls
[Webhook]   Webhook event processing
[Firebase]  Firestore read/write operations
[Admin]     Admin actions
[Error]     All errors
```

Enable verbose logging:
```bash
DEBUG=* npm run dev
```

---

## ✅ Checklist Before Deployment

- [ ] Environment variables set in production
- [ ] Firebase custom claims configured for admins
- [ ] Stripe webhook endpoint created and verified
- [ ] FRONTEND_URL set correctly
- [ ] CORS configured for production domain
- [ ] Firestore security rules configured
- [ ] Database indexes created for queries
- [ ] Error tracking integrated (Sentry, etc.)
- [ ] Monitoring set up (CloudWatch, etc.)
- [ ] Backups configured

---

## 🛠️ Development

### Run Tests
```bash
npm test
```

### Format Code
```bash
npm run lint
```

### Watch Mode
```bash
npm run dev
```

---

## 📖 Documentation Files

1. **README.md** - Setup, tech stack, endpoints overview
2. **INTEGRATION_GUIDE.md** - Step-by-step integration (Firebase, Stripe, etc.)
3. **API_REFERENCE.md** - Detailed endpoint documentation
4. **IMPLEMENTATION.md** - This document, architecture overview

---

## 🚨 Error Handling

Centralized error handling with:
- ✅ Try/catch blocks in all async functions
- ✅ Descriptive error messages
- ✅ HTTP status codes (400, 401, 403, 404, 500)
- ✅ Logging for debugging
- ✅ User-friendly responses

Example Error Response:
```json
{
  "error": "Failed to create checkout session",
  "message": "Stripe API error details..."
}
```

---

## 🔍 Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Test Payment Creation
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "wash_club",
    "priceId": "price_..."
  }' \
  http://localhost:3001/payments/create-checkout-session
```

### Test Webhook (with Stripe CLI)
```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
stripe trigger checkout.session.completed
```

---

## 🌍 Deployment Options

### Vercel
```bash
vercel --prod
```

### Heroku
```bash
heroku create washlee-backend
git push heroku main
```

### Google Cloud Run
```bash
gcloud run deploy washlee-backend --source .
```

### AWS Lambda
Use serverless-http wrapper + AWS API Gateway

---

## 📞 Support

### Troubleshooting

**"Cannot find module"**
```bash
npm install
```

**"Invalid token"**
- Verify Firebase credentials in .env
- Check token hasn't expired (usually 1 hour)

**"Webhook signature failed"**
- Verify webhook secret matches Stripe dashboard
- Use `stripe listen` for local testing

**"Admin privileges required"**
- Set `admin: true` custom claim in Firebase
- Refresh token after setting claim

---

## 📚 Learn More

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Express.js Guide](https://expressjs.com/)
- [Firestore Query Docs](https://firebase.google.com/docs/firestore/query-data/queries)

---

## 📄 License

ISC

---

## 🎉 Summary

You now have a **production-ready backend** with:

- ✅ Firebase authentication
- ✅ Stripe payment processing  
- ✅ Admin sorting & management
- ✅ Automated webhooks
- ✅ Role-based access control
- ✅ Complete documentation

**Next Steps:**
1. Set up environment variables
2. Configure Firebase & Stripe
3. Deploy to production
4. Monitor transactions
5. Iterate based on user feedback

---

**Built:** February 8, 2026  
**By:** Claude Haiku 4.5  
**Status:** Production Ready ✅
