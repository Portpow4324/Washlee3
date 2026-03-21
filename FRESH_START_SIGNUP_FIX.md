# 🚀 Fresh Start & Signup Error Fix Guide

## Problem
You're seeing `[Signup] API error: {}` when trying to create an account. This means the API response is empty or malformed.

## Root Causes & Solutions

### ✅ STEP 1: Clean Your Database
This removes all old test users and data:

1. **Go to Supabase Console** → Your Project
2. **Click SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Copy entire contents of `CLEAN_START_FRESH.sql`**
5. **Paste into SQL Editor**
6. **Click "Run"**

Expected output:
```
auth_users_count: 0
public_users_count: 0
orders_count: 0
employees_count: 0
customers_count: 0
email_confirmations_count: 0
payment_confirmations_count: 0
```

If any counts are NOT 0, run again or check for constraint errors.

### ✅ STEP 2: Check Environment Variables

Open `.env.local` and verify these are set:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# SendGrid (for emails)
SENDGRID_API_KEY=your-sendgrid-key-here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**Missing variables?** That's why signup fails silently!

### ✅ STEP 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then:
npm run dev
```

### ✅ STEP 4: Check API Logs

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Try signing up again**
4. **Look for messages like:**
   - `[SIGNUP] Request body received:`
   - `[SIGNUP] Auth error:`
   - `[SIGNUP] User table insert failed:`

These logs tell you exactly what's breaking.

### ✅ STEP 5: Test Fresh Signup

1. Go to `http://localhost:3001/auth/signup`
2. Fill in:
   - Email: `testuser@gmail.com` (fresh, clean email)
   - Password: `TestPass123!`
   - Name: `Test User`
   - Select: `Customer` or `Pro`
3. Click "Sign Up"

**Expected behavior:**
- ✅ Page shows "Check your email..."
- ✅ No error message
- ✅ Console shows `[SIGNUP] ✓ New customer/pro registered: testuser@gmail.com`

### ❌ STEP 6: If Still Getting Error

**The issue is likely:**

| Error | Cause | Fix |
|-------|-------|-----|
| `API error: {}` | Missing env variables | Check Step 2 |
| `email already registered` | Old test account exists | Run CLEAN_START_FRESH.sql again |
| `TypeError: fetch failed` | SendGrid API key missing | Add `SENDGRID_API_KEY` to `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY missing` | Not set in env | Add to `.env.local` and restart |

## Quick Troubleshooting Checklist

```
□ Database cleaned (ran CLEAN_START_FRESH.sql)
□ All env variables set in .env.local
□ Dev server restarted (npm run dev)
□ Using fresh test email (not old test email)
□ Console logs visible (opened DevTools F12)
□ No typos in password (must be 8+ chars)
□ Account type selected (Customer or Pro)
□ Email confirmed (if required)
```

## Testing Flow After Fix

### Test 1: Customer Signup ✅
```
1. Go to /auth/signup
2. Select "Customer"
3. Email: test-cust-1@gmail.com
4. Pass: Password123!
5. Name: Test Customer
6. Phone: (optional)
7. Click "Sign Up"
8. Should see "Check your email"
9. Look for verification email
```

### Test 2: Pro Signup ✅
```
1. Go to /auth/signup
2. Select "Pro"
3. Email: test-pro-1@gmail.com
4. Pass: Password123!
5. Name: Test Pro
6. Phone: (optional)
7. State: Select from dropdown
8. Terms: Check box
9. Click "Sign Up"
10. Should see "Check your email"
```

### Test 3: Login After Verification ✅
```
1. Go to /auth/login
2. Email: test-cust-1@gmail.com
3. Password: Password123!
4. Click "Log In"
5. Should redirect to /dashboard
```

### Test 4: Dashboard Load ✅
```
1. After login, should see:
   - Welcome message
   - Stats cards (Active Orders, etc.)
   - Recent Orders table
   - Quick Actions sidebar
```

## Common Issues & Fixes

### Issue: "Missing auth.users" or constraint errors

**Fix:** Your Supabase project might not have tables. Run this:

```sql
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'pro')),
  state TEXT,
  usage_type TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_active BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT,
  subscription_status TEXT,
  payment_status TEXT,
  delivery_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create employees table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rating DECIMAL(3,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  earnings DECIMAL(10,2) DEFAULT 0,
  availability_status TEXT,
  service_areas TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Issue: "Email confirmations not working"

**Fix:** Make sure SendGrid is configured:

1. Go to Supabase Console → Email Templates
2. Click "SendGrid" option
3. Enter your SendGrid API key
4. Test email delivery

### Issue: "Password validation failing"

**Requirements:**
- Minimum 8 characters ✅
- Letters ✅
- Numbers ✅
- Special characters NOT required ✓

### Issue: "Phone number giving error"

**Fix:** Phone is optional! Leave blank if you get errors.

## After Everything Works

### Clean Up Test Users (When Ready)

Use this SQL to delete only test accounts:

```sql
DELETE FROM auth.users 
WHERE email LIKE 'test%@%'
   OR email LIKE 'testuser%@%'
   OR email LIKE '%@example.com%';
```

## Need Help?

### Check These Logs First:

1. **Browser Console** (F12) → Messages starting with `[SIGNUP]`
2. **Supabase Logs** → Project Settings → Logs
3. **SendGrid Dashboard** → Activity/Email logs

### What the Logs Tell You:

```
[SIGNUP] Request body received: ✅ Frontend sent data correctly
[SIGNUP] Validation failed: ❌ Missing email/password/name
[SIGNUP] Auth error: ❌ Supabase auth failed (check env vars)
[SIGNUP] User table insert failed: ⚠️ Database table missing (non-critical)
[SIGNUP] ✓ New customer registered: ✅ SUCCESS!
```

---

**Status:** Ready to test!  
**Next:** Run CLEAN_START_FRESH.sql → Check .env.local → Restart npm run dev → Try signup
