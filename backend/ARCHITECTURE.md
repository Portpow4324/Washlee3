# 🚀 Washlee Backend - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - Subscribe Button                                  │   │
│  │ - Admin Dashboard                                   │   │
│  │ - Payment Hooks                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     │ + Firebase Token
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  WASHLEE BACKEND (Node.js)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ EXPRESS SERVER (Port 3001)                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✓ CORS Middleware                                  │   │
│  │ ✓ Auth Middleware (Firebase Token)                 │   │
│  │ ✓ Admin Middleware (Custom Claims)                 │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ROUTES:                                             │   │
│  │ • /health (public)                                  │   │
│  │ • /payments/* (auth)                                │   │
│  │ • /admin/* (auth + admin)                           │   │
│  │ • /webhooks/stripe (Stripe signature)               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ SERVICES:                                           │   │
│  │ • firebaseService.js                               │   │
│  │ • stripeService.js                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└────┬──────────────────────────────────────────┬────────────┘
     │                                           │
     │ Firebase Admin SDK                        │ Stripe API
     │                                           │
     ▼                                           ▼
┌──────────────────────┐              ┌──────────────────────┐
│  FIREBASE FIRESTORE  │              │    STRIPE PAYMENTS   │
├──────────────────────┤              ├──────────────────────┤
│ users/               │              │ • Checkout Sessions  │
│  ├─ subscription     │              │ • Webhook Events     │
│  ├─ adminApproval    │              │ • Customer Data      │
│  └─ loyaltyMember    │              │ • Transaction Status │
│                      │              │                      │
│ Auth:                │              │ Signature:           │
│ • Custom Claims      │              │ • HMAC SHA256        │
│ • ID Tokens          │              │ • Webhook Secret     │
└──────────────────────┘              └──────────────────────┘
```

---

## Request Flow - Payment Checkout

```
USER                    FRONTEND               BACKEND                STRIPE
 │                        │                      │                      │
 │─ Click Subscribe ─────►│                      │                      │
 │                        │                      │                      │
 │                        │─ GET ID Token ──────────────────────────┐   │
 │                        │◄─────────────────────────────────────────┘   │
 │                        │                      │                      │
 │                        │─ POST /payments/create-checkout-session ─►│
 │                        │   Authorization: Bearer {token}           │
 │                        │   Body: { plan, priceId }                │
 │                        │                      │                      │
 │                        │                      │─ Verify Token       │
 │                        │                      │                      │
 │                        │                      │─ Create Session ────►│
 │                        │                      │◄──── Return URL ─────│
 │                        │                      │                      │
 │                        │◄─── Return URL ──────┤                      │
 │                        │                      │                      │
 │─ Redirect to Stripe ──────────────────────────────────────────────►│
 │                        │                      │                      │
 │                        │◄──── Checkout UI ────┤                      │
 │                        │                      │                      │
 │ Fill Card Info         │                      │                      │
 │─ Complete Checkout ───────────────────────────────────────────────►│
 │                        │                      │                      │
 │                        │                      │◄─ Webhook: Session ──│
 │                        │                      │   Completed          │
 │                        │                      │                      │
 │                        │                      │─ Update Firestore    │
 │                        │                      │  subscription.active │
 │                        │                      │  paymentStatus:paid  │
 │                        │                      │                      │
 │                        │◄─ Redirect ─────────┤                      │
 │◄─ Success Page ────────┤                      │                      │
```

---

## Admin Sorting Endpoints

```
┌────────────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD                               │
└────────────────────────────────────────────────────────────┘
                         │
                    Requires:
                    • Firebase Token
                    • admin: true
                         │
     ┌───────────┬────────┼────────┬───────────┐
     │           │        │        │           │
     ▼           ▼        ▼        ▼           ▼
┌────────┐  ┌──────┐ ┌─────┐ ┌──────┐ ┌─────────┐
│Pending │  │Active│ │Wash │ │Emplo-│ │Customer │
│Payments│  │Subs  │ │Club │ │yees  │ │Only     │
└────────┘  └──────┘ └─────┘ └──────┘ └─────────┘
    │           │        │        │           │
    │           │        │        │           │
    ▼           ▼        ▼        ▼           ▼
 WHERE         WHERE    WHERE   WHERE       WHERE
 payment       active   loyalty employee   no
 Status        = true   Member  = true     subscriptions
 = pending             = true
```

---

## Data Flow - Admin Actions

```
ADMIN                   BACKEND               FIRESTORE
 │                        │                      │
 │─ View Pending ────────►│                      │
 │                        │─ Query:              │
 │                        │  paymentStatus=pending
 │                        │                      │
 │                        │◄─ Return Users ──────┤
 │◄─ See Pending List ────┤                      │
 │                        │                      │
 │─ Click Confirm ───────►│                      │
 │                        │─ Update User:        │
 │                        │  active: true        │
 │                        │  paymentStatus: paid │
 │                        │  confirmedBy: admin  │
 │                        │  confirmedAt: now    │
 │                        │                      │
 │                        │◄─ Confirmed ────────┤
 │◄─ User Activated ──────┤                      │
```

---

## Webhook Processing

```
STRIPE                  BACKEND              FIRESTORE
 │                        │                      │
 │─ Payment Completed ───►│                      │
 │   Webhook Event        │                      │
 │   stripe-signature     │                      │
 │                        │                      │
 │                        │─ Verify Signature    │
 │                        │  (HMAC SHA256)       │
 │                        │                      │
 │                        │─ Extract:            │
 │                        │  firebaseUID         │
 │                        │  plan                │
 │                        │                      │
 │                        │─ Update User:        │
 │                        │  active: true        │
 │                        │  paymentStatus: paid │
 │                        │  plan: wash_club     │
 │                        │  confirmedBy: stripe │
 │                        │                      │
 │                        │◄─ Success ───────────┤
 │◄─ OK (200) ────────────┤                      │
```

---

## Security Layers

```
┌─────────────────────────────────────────────────┐
│         REQUEST ARRIVES AT BACKEND              │
└────────────────────┬────────────────────────────┘
                     │
         ┌───────────┴────────────┬──────────┐
         │                        │          │
         ▼                        ▼          ▼
    Public              Protected Routes    Webhooks
   /health         /payments /admin/*    /webhooks/stripe
        │                │                   │
        │                │                   │
    No Auth         Check:                Check:
        │         • Bearer Token          • Stripe
        │         • Firebase              Signature
        │         • Expiry                (HMAC)
        │                │                   │
        │                ├──────────────┬────┘
        │                │              │
        │                ▼              ▼
        │         Is Admin?        Signature
        │         (Custom Claim)   Valid?
        │                │              │
        │            No  │  Yes     No  │  Yes
        │            │   │         │    │
        │         401  proceed   400  proceed
        │            │   │         │    │
        └────────────┴───┼─────────┴────┘
                        │
                        ▼
              ┌──────────────────┐
              │ PROCESS REQUEST  │
              │ Access Firestore │
              │ Call Stripe API  │
              └──────────────────┘
```

---

## Database Structure

```
FIRESTORE
│
└─ users/ (collection)
   │
   ├─ user-123/ (document)
   │  ├─ uid: "user-123"
   │  ├─ email: "john@example.com"
   │  ├─ isEmployee: false
   │  ├─ loyaltyMember: false
   │  ├─ subscription: {
   │  │  ├─ active: true
   │  │  ├─ plan: "wash_club"
   │  │  └─ paymentStatus: "paid"
   │  ├─ adminApproval: {
   │  │  ├─ status: "confirmed"
   │  │  ├─ confirmedBy: "stripe"
   │  │  └─ confirmedAt: <timestamp>
   │  └─ createdAt: <timestamp>
   │
   ├─ user-456/ (document)
   │  ├─ subscription: {
   │  │  └─ paymentStatus: "pending" ◄─ ADMIN SEES THIS
   │  ...
   │
   └─ user-789/ (document)
      ├─ isEmployee: true ◄─ ADMIN SORTS BY THIS
      ...
```

---

## Environment Variables

```
┌─────────────────────────────────────────────────┐
│              .env FILE                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Server Config]                                 │
│ PORT=3001                                       │
│ NODE_ENV=development                            │
│ FRONTEND_URL=http://localhost:3000              │
│                                                 │
│ [Firebase]                                      │
│ FIREBASE_SERVICE_ACCOUNT_KEY=                   │
│   {"type":"service_account",...}                │
│                                                 │
│ [Stripe]                                        │
│ STRIPE_SECRET_KEY=sk_test_...                   │
│ STRIPE_WEBHOOK_SECRET=whsec_...                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## File Organization

```
backend/
│
├── 📄 Configuration
│  ├─ app.js (Express server)
│  ├─ package.json (Dependencies)
│  ├─ .env.example (Template)
│  └─ .gitignore (Git rules)
│
├── 📁 services/ (Business Logic)
│  ├─ firebaseService.js (Firestore)
│  └─ stripeService.js (Payments)
│
├── 📁 middleware/ (Request Processing)
│  └─ auth.middleware.js (Auth checks)
│
├── 📁 routes/ (Endpoints)
│  ├─ admin.routes.js (5 endpoints)
│  ├─ payments.routes.js (Checkout)
│  └─ webhook.routes.js (Webhooks)
│
└── 📁 docs/ (Documentation)
   ├─ README.md
   ├─ INTEGRATION_GUIDE.md
   ├─ API_REFERENCE.md
   ├─ IMPLEMENTATION.md
   ├─ FRONTEND_INTEGRATION.md
   ├─ DELIVERY.md
   └─ INDEX.md
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│           PRODUCTION ENVIRONMENT                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │    FRONTEND (Vercel/Netlify)           │    │
│  │    https://washlee.com                 │    │
│  └────────────────────────────────────────┘    │
│                    │                             │
│            HTTPS + Firebase Token               │
│                    │                             │
│  ┌────────────────┴────────────────────┐    │
│  │  BACKEND (Vercel/Heroku/Cloud Run)  │    │
│  │  https://api.washlee.com             │    │
│  │  - Node.js 18+                       │    │
│  │  - Express.js                        │    │
│  │  - Environment Variables             │    │
│  └────────────────┬────────────────────┘    │
│                    │                         │
│           ┌────────┴────────┐                │
│           │                 │                │
│           ▼                 ▼                │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  FIRESTORE   │  │  STRIPE API  │        │
│  │  (GCP)       │  │  (Stripe)    │        │
│  └──────────────┘  └──────────────┘        │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Success Indicators ✅

When everything is working:

```
✅ Health Check
   curl http://localhost:3001/health
   → { "status": "ok", "timestamp": "..." }

✅ Firebase Connection
   Server logs: "[Firebase] User authenticated"

✅ Admin Access
   GET /admin/users/pending-payments
   → Returns list of users

✅ Payment Creation
   POST /payments/create-checkout-session
   → Returns Stripe checkout URL

✅ Webhook Processing
   POST /webhooks/stripe
   → Updates Firestore subscription

✅ Real-Time Updates
   Frontend sees subscription.active = true
```

---

## Development vs Production

```
DEVELOPMENT                          PRODUCTION
────────────────────────────────────────────────
PORT: 3001                          PORT: 443 (HTTPS)
NODE_ENV: development               NODE_ENV: production
STRIPE_SECRET_KEY: sk_test_*        STRIPE_SECRET_KEY: sk_live_*
FRONTEND_URL: http://localhost:3000 FRONTEND_URL: https://washlee.com
npm run dev (with auto-reload)      npm start (no auto-reload)
Console logs visible                Error tracking enabled
Debug mode on                       Debug mode off
```

---

**Visual Architecture Created:** February 8, 2026  
**Status:** Production Ready ✅
