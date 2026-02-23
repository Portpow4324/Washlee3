# 🚀 Quick Start - 5 Minutes

Get the Washlee backend running in 5 minutes.

---

## Step 1: Install (1 minute)

```bash
cd backend
npm install
```

---

## Step 2: Setup (2 minutes)

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Step 3: Start (1 minute)

```bash
npm run dev
```

You should see:
```
[Server] Washlee backend running on port 3001
```

---

## Step 4: Test (1 minute)

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

✅ **Done!** Backend is running.

---

## Next Steps

1. **Set up Firebase & Stripe:** Read `INTEGRATION_GUIDE.md`
2. **Integrate frontend:** Use code from `FRONTEND_INTEGRATION.md`
3. **Learn endpoints:** Check `API_REFERENCE.md`

---

## Troubleshooting

**"Cannot find module"**
```bash
npm install
```

**"Module not found: express"**
```bash
npm install express cors dotenv firebase-admin stripe
```

**"Cannot read FIREBASE_SERVICE_ACCOUNT_KEY"**
- Check `.env` file exists
- Verify Firebase key is set
- Restart server

---

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | Overview & setup |
| `INTEGRATION_GUIDE.md` | Complete setup |
| `API_REFERENCE.md` | All endpoints |
| `FRONTEND_INTEGRATION.md` | React code |
| `ARCHITECTURE.md` | Visual diagrams |

---

**That's it!** Your backend is ready. 🎉
