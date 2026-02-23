# 🧪 COMPREHENSIVE APPLICATION TEST GUIDE

## Overview
Your Washlee application has been fixed and is ready for comprehensive testing. This guide walks you through testing every critical user flow.

---

## 🚀 QUICK START

**Dev Server Status:** ✅ Running  
**URL:** https://72bc-49-183-35-3.ngrok-free.app/  
**Test Account:** lukaverde6@gmail.com / 35Malcolmst!

---

## 📋 TEST FLOWS

### TEST 1: Sign Up (New User)
**Time:** 5-10 minutes  
**Goal:** Verify signup works and user is created in Firebase

**Steps:**
1. Go to: `/auth/signup`
2. Click "Sign up as Customer"
3. **Step 1 - Email & Password:**
   - Email: `newtest@example.com`
   - Password: `TestPassword123!` (meets all requirements)
   - Confirm: `TestPassword123!`
   - Click Next
4. **Step 2 - Name:**
   - First Name: `John`
   - Last Name: `Doe`
   - Phone: `0412345678` (Australian format)
   - Click Next
5. **Step 3 - Usage Type:**
   - Select "Personal Use"
   - Click Next
6. **Step 4 - Age & Preferences:**
   - Check "I'm 65 or older" (optional)
   - Check marketing preferences
   - Click Next
7. **Step 5 - Plan Selection:**
   - Select a plan (or "None")
   - Check "I agree to Terms"
   - Click "Create Account"

**What to Watch For:**
- [ ] All form fields accept input
- [ ] Next buttons work at each step
- [ ] Password requirements show as you type
- [ ] Spinner appears on final step
- [ ] **Spinner completes (not stuck!)**
- [ ] Redirects to home page
- [ ] No red error messages
- [ ] Browser console shows `[Signup]` logs

**Console Check (F12):**
```
[Signup] Starting account creation for: newtest@example.com
[Signup] Creating Firebase auth user...
[Signup] Auth user created: [uid]
[Signup] Creating user profiles...
[Signup] User profiles created successfully
[Signup] Redirecting to home...
```

---

### TEST 2: Login (Existing User)
**Time:** 2-3 minutes  
**Goal:** Verify authentication and dashboard access

**Steps:**
1. Go to: `/auth/login`
2. Enter:
   - Email: `lukaverde6@gmail.com`
   - Password: `35Malcolmst!`
3. Click "Sign In"

**What to Watch For:**
- [ ] Login form accepts input
- [ ] Spinner shows while signing in
- [ ] Successful redirect to home or dashboard
- [ ] User data loads (check header for user name)
- [ ] No error messages
- [ ] Browser console shows `[Auth]` logs

**Console Check (F12):**
```
[Auth] State changed: lukaverde6@gmail.com
[Auth] User authenticated: lukaverde6@gmail.com
[Auth] User data loaded: [name]
```

---

### TEST 3: Booking Flow
**Time:** 5-10 minutes  
**Goal:** Verify booking form works and validates input

**Prerequisites:** Must be logged in (from Test 2)

**Steps:**
1. Go to: `/booking`
2. **Step 1 - Delivery Address:**
   - Type address: `123 Main Street, Sydney NSW 2000`
   - Select from Google Places autocomplete
   - Click Next
3. **Step 2 - Date & Time:**
   - Select a future date
   - Select time (e.g., 9:00 AM)
   - Click Next
4. **Step 3 - Items & Options:**
   - Add items (shirts, pants, etc.)
   - Select delivery speed (Standard/Express)
   - Add any extras (hang dry, stain treatment, etc.)
   - Click Next
5. **Step 4 - Preferences:**
   - Add any special instructions
   - Click Next
6. **Step 5 - Confirmation:**
   - Review order summary
   - Check "I agree to Terms"
   - Click "Confirm & Pay"

**What to Watch For:**
- [ ] Address field accepts input
- [ ] Google Places autocomplete works
- [ ] Australian postcode validation works
- [ ] Date picker opens and accepts dates
- [ ] Item selection works
- [ ] Delivery speed options available
- [ ] Add-ons can be selected
- [ ] Order summary shows correct totals
- [ ] Proceed to checkout without errors

**Validation Tests:**
- Try invalid postcode (not 4 digits) - should show error
- Try invalid phone - should show error
- Try submitting with missing fields - should show error

---

### TEST 4: Payment & Checkout
**Time:** 5 minutes  
**Goal:** Verify payment processing with Stripe test card

**Prerequisites:** Must be in checkout (from Test 3)

**Steps:**
1. You should see checkout page with:
   - Order summary
   - Delivery address
   - Payment form
2. In **Stripe Payment Section:**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - Postal Code: `2000`
3. Click "Complete Payment" or "Pay"

**What to Watch For:**
- [ ] Payment form loads without errors
- [ ] Card field accepts input
- [ ] Stripe form appears properly
- [ ] Payment processes (spinner shows)
- [ ] Success page displays (order confirmation)
- [ ] Order ID shown
- [ ] Redirects to dashboard or success page
- [ ] No error messages
- [ ] Console shows no errors

**Expected Result:**
- ✅ Order created successfully
- ✅ Payment processed
- ✅ Order appears in dashboard (next test)

---

### TEST 5: Dashboard Verification
**Time:** 3-5 minutes  
**Goal:** Verify orders appear in customer dashboard

**Steps:**
1. Go to: `/dashboard/customer`
2. Check **Orders Tab:**
   - Should see order from Test 4
   - Order shows address, date, time
   - Order shows total price
   - Order status visible
3. Click on order to expand details:
   - Shows items ordered
   - Shows delivery speed
   - Shows add-ons
   - Shows timeline

**What to Watch For:**
- [ ] Dashboard loads without errors
- [ ] Orders list shows all orders
- [ ] Order details visible
- [ ] Correct address displayed
- [ ] Correct total shown
- [ ] Order created date matches
- [ ] Timeline/status tracking shows

**Alternative Navigation:**
- Check Header for "Orders" or "Dashboard" link
- Should redirect you to dashboard

**Console Check (F12):**
```
[Dashboard] Fetching orders with auth token
[Orders API] Returning X orders for user
```

---

### TEST 6: Pro Signup (Optional)
**Time:** 5 minutes  
**Goal:** Verify pro signup flow works

**Steps:**
1. Go to: `/pro`
2. Scroll down and click "Apply as Pro"
3. Fill form:
   - Email: `pro@example.com`
   - Full Name: `John Doe`
   - Phone: `0412345678`
   - Years Experience: `2+`
   - Check agreements
4. Click "Submit Application"

**What to Watch For:**
- [ ] Form loads
- [ ] Fields accept input
- [ ] Submit button works
- [ ] Success message shows
- [ ] No validation errors

---

### TEST 7: Legal Pages
**Time:** 2 minutes  
**Goal:** Verify all legal pages load correctly

**Check these pages:**
- [ ] `/privacy-policy` - Should load
- [ ] `/terms-of-service` - Should load
- [ ] `/cookie-policy` - Should load
- [ ] `/security` - Should load
- [ ] `/help-center` - Should load
- [ ] `/about` - Should load
- [ ] `/contact` - Should load

**What to Watch For:**
- [ ] All pages load without 404 errors
- [ ] Content displays properly
- [ ] No missing sections
- [ ] Links work (click a few)

---

## 🔍 ERROR CHECKING DURING ALL TESTS

### Browser Console (Press F12)
```
✓ Look for RED ERRORS
✗ Should NOT see:
  - Uncaught errors
  - Failed API calls
  - Missing CSS
  - Undefined variables
  
✓ Should see (normal):
  - [Signup] logs during signup
  - [Auth] logs during login
  - [Dashboard] logs on dashboard
  - Normal API responses
```

### Network Tab (F12 → Network)
```
✓ All requests should show 200 or 2xx status
✗ Avoid:
  - 404 (Not Found)
  - 500 (Server Error)
  - 403 (Forbidden)
  
✓ Watch for:
  - /auth/signup - Should POST
  - /api/checkout - Should POST
  - /api/orders/user/[uid] - Should GET with 200
```

### Server Terminal
```
✓ Should show normal logs like:
  GET /booking 200 in 150ms
  POST /api/checkout 200 in 500ms
  
✗ Avoid:
  ERROR: [...]
  FATAL: [...]
  Cannot find module [...]
```

---

## ✅ SUCCESS CRITERIA

### Signup Test
- [ ] Spinner doesn't hang
- [ ] Completes and redirects
- [ ] User appears in Firebase
- [ ] Console shows `[Signup]` logs

### Login Test
- [ ] Authentication succeeds
- [ ] Redirects to home/dashboard
- [ ] User data loads
- [ ] No console errors

### Booking Test
- [ ] Form validates input
- [ ] Submits without errors
- [ ] Proceeds to checkout

### Payment Test
- [ ] Stripe card accepted
- [ ] Payment processes
- [ ] Order created in Firestore
- [ ] Success page shown

### Dashboard Test
- [ ] Orders list shows
- [ ] Order details accurate
- [ ] API call succeeds
- [ ] No missing data

### Overall
- [ ] No 500 errors on any page
- [ ] No 404s (except intentional)
- [ ] No JavaScript errors in console
- [ ] All forms submit successfully
- [ ] All redirects work correctly

---

## 🎯 QUICK REFERENCE

| Test | URL | Expected Result |
|------|-----|-----------------|
| Signup | `/auth/signup` | Redirects to home |
| Login | `/auth/login` | Redirects to dashboard |
| Booking | `/booking` | Proceeds to checkout |
| Payment | `/checkout` | Success page |
| Dashboard | `/dashboard/customer` | Shows orders |
| Pro | `/pro` | Form submits |

---

## 🐛 IF YOU FIND AN ERROR

### Document These Details:
1. **What were you doing?** (step-by-step)
2. **What did you expect?** (what should happen)
3. **What actually happened?** (what went wrong)
4. **Error message:** (copy the exact error)
5. **Screenshot:** (if possible)
6. **Browser console:** (share error)
7. **Server logs:** (share error)

### Example Error Report:
```
TEST: Signup Form
STEP: Clicked "Create Account" on step 5
EXPECTED: Should show success page and redirect
ACTUAL: Shows spinner but never completes
ERROR: Console shows "Cannot write to database"
```

---

## 📞 KEY DETAILS

**Dev Server:** localhost:3000 (via ngrok)  
**URL:** https://72bc-49-183-35-3.ngrok-free.app/  

**Test Credentials:**
```
Email: lukaverde6@gmail.com
Password: 35Malcolmst!
```

**Stripe Test Card:**
```
Card: 4242 4242 4242 4242
Exp: Any future date (e.g., 12/25)
CVC: Any 3 digits
```

---

## ⏱️ ESTIMATED TIME

- Test 1 (Signup): 5-10 min
- Test 2 (Login): 2-3 min
- Test 3 (Booking): 5-10 min
- Test 4 (Payment): 5 min
- Test 5 (Dashboard): 3-5 min
- Test 6 (Pro): 5 min (optional)
- Test 7 (Legal Pages): 2 min

**Total: 25-40 minutes**

---

## 🎉 SUMMARY

Everything is ready. Start with the signup test to verify the fix works. If signup completes successfully and redirects to home without hanging, the main issue is resolved. Then test the other flows to ensure everything works end-to-end.

**Good luck! Let me know if you find any issues.**

---

*Test Guide Created: January 18, 2026*
