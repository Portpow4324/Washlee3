# ⚡ IMMEDIATE ACTION STEPS - Get Fresh Start Working NOW

## 🎯 Problem
You want to start fresh: delete all test users and data, then test signup cleanly.

## ⚠️ Pre-Check (2 min)

✅ Your `.env.local` has all keys configured (I verified):
- ✅ Supabase connection
- ✅ Stripe keys  
- ✅ SendGrid API key
- ✅ Google Maps API
- ✅ Email credentials

**You're ready to proceed!**

---

## 📋 DO THIS NOW (5 minutes)

### Step 1: Clean Database
**Time: 2 min**

1. Open **Supabase Console**: https://app.supabase.com
2. Select your **Washlee project**
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Go to your workspace folder
6. Open file: `CLEAN_START_FRESH.sql`
7. **Copy ALL text**
8. **Paste into Supabase SQL Editor**
9. Click **Run**
10. Wait for success message

**You should see:**
```
auth_users_count: 0
public_users_count: 0
orders_count: 0
employees_count: 0
customers_count: 0
```

✅ If all zeros → Move to Step 2

❌ If NOT zeros → Run again or contact support

---

### Step 2: Restart Dev Server
**Time: 1 min**

In terminal:

```bash
# Stop current server
Ctrl+C

# Start fresh
npm run dev
```

Wait for:
```
▲ Next.js 16.1.3 (stale)
◢ Turbopack
   ready - started server on 0.0.0.0:3001, url: http://localhost:3001
```

---

### Step 3: Test Fresh Signup
**Time: 2 min**

1. Open: `http://localhost:3001/auth/signup`
2. Select **Customer**
3. Fill in:
   - Email: `testcust1@gmail.com` (new, clean)
   - Password: `TestPass123!`
   - Name: `Test Customer`
   - Phone: Leave blank (optional)
4. Click **Sign Up**

**Expected:**
- ✅ Page shows "Check your email to verify your account"
- ✅ No red error message
- ✅ Console has `[SIGNUP] ✓ New customer registered:`

**Error?** → Go to **Troubleshooting** below

---

## 🔍 Troubleshooting

### Error: "API error: {}"

**Most likely cause:** Empty response from API

**Fix:**

1. Open **Browser DevTools** (F12 or Cmd+Option+I)
2. Go to **Console tab**
3. Scroll up and look for messages starting with `[SIGNUP]`
4. Find the line that shows the actual error
5. Come back with that exact error message

**Common errors:**

| Error | Fix |
|-------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` undefined | Add to `.env.local`, restart npm run dev |
| `sendgrid_api_key_invalid` | SendGrid key is wrong - get new one at sendgrid.com |
| `fetch failed` | Network issue - check internet |
| `email already registered` | Run `CLEAN_START_FRESH.sql` again |

### Error: "Missing required fields"

Make sure you filled in:
- ✅ Email (must be valid)
- ✅ Password (8+ characters)
- ✅ Name (first and last)
- ✅ User type selected (Customer or Pro)

### Error: "Too many signup attempts"

**This is actually good!** It means old accounts still exist.

**Fix:** Run `CLEAN_START_FRESH.sql` again

### No Error But Nothing Happens

1. Check **Network tab** in DevTools (F12)
2. Should see POST request to `/api/auth/signup`
3. Should return 200 or 201
4. If 400/500 → Check console for error details

---

## ✅ Success Checklist

After fresh signup works:

```
□ Signup page loads (/auth/signup)
□ Can enter email, password, name
□ Click Sign Up → No error
□ See "Check your email" message
□ Can see verification email (check Gmail inbox/spam)
□ Can click link to verify account
□ Can login with new email/password (/auth/login)
□ Login redirects to /dashboard
□ Dashboard loads with "Welcome" message
□ Can see stats cards (Active Orders, etc.)
```

---

## 🎉 What's Next (After Success)

Once fresh signup works:

1. **Test Pro Signup** (same flow, select "Pro" type)
2. **Test Booking** (create an order in /booking)
3. **Test Tracking** (track order with /tracking?id=ORDER_ID)
4. **Test Live Maps** (should show Google Maps)
5. **Test Dashboards** (customer and pro dashboards)

All documented in `QUICK_START_GOOGLE_MAPS_DASHBOARDS.md`

---

## 📞 Quick Support

**If something breaks:**

1. Check **Console logs** (look for `[SIGNUP]` messages)
2. Verify **Database is empty** (all counts = 0 from CLEAN_START_FRESH.sql)
3. Check **Dev server is running** (`npm run dev`)
4. Check **Internet connection**
5. Try **different email** (not old test email)

---

## 🚀 TL;DR

```bash
# 1. Clean database
# → Supabase Console → SQL Editor → Run CLEAN_START_FRESH.sql

# 2. Restart server
npm run dev

# 3. Test signup
# → http://localhost:3001/auth/signup

# 4. Enter new email & password → Sign up

# 5. Check for success in Console (F12)
```

**Status:** You have everything configured. Just need to run the SQL and test!
