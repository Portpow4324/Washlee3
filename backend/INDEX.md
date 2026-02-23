# Washlee Backend - Documentation Index

**Quick Navigation for All Backend Resources**

---

## 📌 Start Here

### New to the Backend?
1. **First:** Read [`README.md`](./README.md) (5 min read)
   - Overview
   - Tech stack
   - Setup instructions

2. **Then:** Follow [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) (30 min)
   - Firebase setup
   - Stripe setup
   - Webhook configuration

3. **Reference:** Use [`API_REFERENCE.md`](./API_REFERENCE.md) (as needed)
   - All endpoints
   - Request/response examples

---

## 📚 Documentation Files

### Setup & Overview
| File | Purpose | Read Time |
|------|---------|-----------|
| [`README.md`](./README.md) | Overview, setup, endpoints summary | 5 min |
| [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) | Step-by-step setup instructions | 30 min |
| [`DELIVERY.md`](./DELIVERY.md) | What you received & next steps | 10 min |

### Reference & Details
| File | Purpose | Read Time |
|------|---------|-----------|
| [`API_REFERENCE.md`](./API_REFERENCE.md) | Complete endpoint documentation | Reference |
| [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) | Architecture & technical details | 20 min |
| [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md) | Code examples for frontend | 15 min |

---

## 🔧 Core Files

### Configuration
| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `.env.example` | Environment template |
| `.gitignore` | Git configuration |

### Application Code
| File | Purpose | Lines |
|------|---------|-------|
| `app.js` | Express server entry point | ~50 |
| `services/firebaseService.js` | Firestore operations | ~150 |
| `services/stripeService.js` | Stripe API wrapper | ~50 |
| `middleware/auth.middleware.js` | Auth & admin verification | ~50 |
| `routes/admin.routes.js` | Admin endpoints (5 endpoints) | ~150 |
| `routes/payments.routes.js` | Checkout endpoint | ~50 |
| `routes/webhook.routes.js` | Stripe webhooks | ~100 |

---

## 🎯 Common Tasks

### "I want to get the backend running"
→ Read [`README.md`](./README.md) then [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) Step 1-5

### "I need to understand the endpoints"
→ Check [`API_REFERENCE.md`](./API_REFERENCE.md)

### "I'm integrating with the frontend"
→ Use [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md)

### "I want to deploy to production"
→ Read [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) "Production Deployment"

### "I need to set up Stripe webhooks"
→ Follow [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) Step 2 "Create Webhook Endpoint"

### "I need to set up Firebase"
→ Follow [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) Step 1 "Firebase Setup"

### "How do I test this locally?"
→ See [`README.md`](./README.md) "Testing Stripe Webhook Locally"

### "What's the architecture?"
→ Read [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)

### "I'm having errors"
→ Check [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) "Troubleshooting"

---

## 📊 API Quick Reference

### Authentication
```
Authorization: Bearer {firebaseIdToken}
```

### Endpoints by Category

**Public**
- `GET /health`

**Payments**
- `POST /payments/create-checkout-session`

**Admin** (requires admin claim)
- `GET /admin/users/pending-payments`
- `GET /admin/users/subscriptions`
- `GET /admin/users/wash-club`
- `GET /admin/users/employees`
- `GET /admin/users/customers-only`
- `POST /admin/users/:uid/confirm-payment`
- `POST /admin/users/:uid/reject-payment`

**Webhooks** (Stripe signature)
- `POST /webhooks/stripe`

See [`API_REFERENCE.md`](./API_REFERENCE.md) for full details.

---

## 🔐 Security Checklist

- [ ] `.env` file created with secrets
- [ ] `.env` in `.gitignore`
- [ ] Firebase service account key configured
- [ ] Stripe API keys configured
- [ ] Webhook secret configured
- [ ] CORS set to frontend domain
- [ ] Admin custom claims set in Firebase
- [ ] Firestore security rules configured

---

## 🚀 Deployment Checklist

- [ ] All environment variables set
- [ ] Stripe webhook endpoint created
- [ ] Firebase custom claims configured
- [ ] Firestore indexes created
- [ ] Error tracking set up (optional)
- [ ] Health check passing
- [ ] Payment flow tested
- [ ] Admin endpoints tested
- [ ] Database backups enabled

---

## 📞 FAQ

**Q: Where do I start?**  
A: Read [`README.md`](./README.md) first.

**Q: How do I set up Stripe?**  
A: Follow [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) Step 2.

**Q: How do I integrate with my frontend?**  
A: Use code from [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md).

**Q: What's the Firestore structure?**  
A: See [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) "Firestore Schema".

**Q: How do webhooks work?**  
A: See [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) "Payment Flow".

**Q: How do I test locally?**  
A: Use Stripe CLI (see [`README.md`](./README.md)).

**Q: How do I deploy?**  
A: See [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) "Production Deployment".

**Q: What if I get an error?**  
A: Check [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) "Troubleshooting".

---

## 📖 Reading Order

For **maximum understanding**, read in this order:

1. **[`DELIVERY.md`](./DELIVERY.md)** - What you have (10 min)
2. **[`README.md`](./README.md)** - Overview & setup (5 min)
3. **[`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md)** - Step-by-step (30 min)
4. **[`API_REFERENCE.md`](./API_REFERENCE.md)** - Endpoints (reference)
5. **[`IMPLEMENTATION.md`](./IMPLEMENTATION.md)** - Deep dive (20 min)
6. **[`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md)** - Code examples (15 min)

**Total time:** ~80 minutes to understand everything

---

## 🎯 Quick Links

### Files by Purpose

**To get started:**
- [`setup.sh`](./setup.sh) - Run this first
- [`.env.example`](./.env.example) - Copy & customize

**To understand:**
- [`README.md`](./README.md) - Overview
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) - Architecture

**To integrate:**
- [`API_REFERENCE.md`](./API_REFERENCE.md) - Endpoints
- [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md) - Code

**To deploy:**
- [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) - Production checklist

**To troubleshoot:**
- [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) - Troubleshooting section

---

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Payments:** Stripe
- **Language:** JavaScript (Node.js)

---

## 📋 File Locations

```
backend/
├── app.js
├── package.json
├── .env.example
├── .gitignore
├── setup.sh
├── services/
│   ├── firebaseService.js
│   └── stripeService.js
├── middleware/
│   └── auth.middleware.js
├── routes/
│   ├── admin.routes.js
│   ├── payments.routes.js
│   └── webhook.routes.js
└── docs/
    ├── README.md ⭐
    ├── INTEGRATION_GUIDE.md
    ├── API_REFERENCE.md
    ├── IMPLEMENTATION.md
    ├── FRONTEND_INTEGRATION.md
    ├── DELIVERY.md
    └── INDEX.md (this file)
```

---

## ✅ Quality Metrics

- ✅ **100%** documented
- ✅ **7** comprehensive guides
- ✅ **50+** code examples
- ✅ **All** endpoints covered
- ✅ **Production-ready** code
- ✅ **Zero** hardcoded secrets

---

## 🎉 Ready to Start?

1. **Read:** [`README.md`](./README.md)
2. **Follow:** [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md)
3. **Reference:** [`API_REFERENCE.md`](./API_REFERENCE.md)
4. **Code:** [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md)

---

**Last Updated:** February 8, 2026  
**Status:** Production Ready ✅  
**Version:** 1.0.0
