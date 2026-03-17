# 🧪 Washlee Website - Complete Testing Guide

**Estimated Test Duration:** 30-45 minutes  
**Date:** March 12, 2026  
**Dev Server:** `http://localhost:3001`

---

## 🎯 Test Objectives

By the end of this testing session, you should validate:
1. ✅ Website loads without errors
2. ✅ All navigation links work
3. ✅ Customer signup flow completes
4. ✅ Employee signin flow completes
5. ✅ Dashboards display correctly
6. ✅ Forms submit without errors
7. ✅ No console errors in browser

---

## 🚀 Quick Start

### Start Development Server
```bash
cd /Users/lukaverde/Desktop/Website.BUsiness
npm run dev
# Server will run on http://localhost:3001
```

### Open Browser DevTools
- **Chrome/Edge:** Press `F12`
- **Firefox:** Press `F12`
- **Safari:** Cmd + Option + I
- Go to **Console** tab to watch for errors

---

## 📋 Test Suite 1: Smoke Test (5 minutes)

### 1.1 Homepage Load
1. Navigate to `http://localhost:3001`
2. **Verify:**
   - ✅ Page loads without errors
   - ✅ Washlee logo visible (top left)
   - ✅ "Reclaim Your Time" hero visible
   - ✅ Navigation menu visible (desktop)
   - ✅ Hamburger menu visible (mobile)
   - ✅ Console has no RED errors

### 1.2 Navigation Links
1. **Desktop Menu** (test each link):
   - Home → should stay on homepage
   - How It Works → `/how-it-works` should load
   - Pricing → `/pricing` should load
   - Plans → `/subscriptions` should load
   - Wholesale → `/wholesale` should load
   - FAQ → `/faq` should load
   - WASH Club → `/loyalty` should load
   - Pro → `/pro` should load

2. **Verify:** No 404 errors, all pages load

### 1.3 Mobile Menu
1. **On mobile/tablet view:**
   - Click hamburger menu (☰)
   - Menu should slide open
   - Should see same links as desktop
   - Click link should navigate
   - Menu should close after click

2. **Verify:** All links work on mobile

### 1.4 Footer
1. Scroll to bottom of homepage
2. **Verify:**
   - ✅ Footer visible
   - ✅ All footer links work
   - ✅ Social links present
   - ✅ Contact info visible

---

## 📋 Test Suite 2: Authentication - Customer Signup (10 minutes)

### 2.1 Navigate to Signup
1. Click **"Sign up for free"** (bottom of login page)
   - Or navigate to `/auth/signup`
2. **Should see:** Two choice cards
   - "Customer Sign Up"
   - "Become a Washlee Pro"

### 2.2 Start Customer Signup
1. Click **"Customer Sign Up"** card
2. **Should navigate to:** `/auth/signup-customer`
3. **Should see:** Step 1 of 4 form

### 2.3 Step 1: Account Creation
1. **Enter:**
   - Email: `test-customer@example.com`
   - Password: `TestPass123!` (meets requirements)
   - Confirm Password: `TestPass123!`

2. **Verify:**
   - ✅ Password strength indicator shows green
   - ✅ "Continue" button is enabled
   - ✅ No error messages

3. **Click:** "Continue"

### 2.4 Step 2: Personal Information
1. **Enter:**
   - First Name: `John`
   - Last Name: `Doe`
   - Phone: `0412 345 678`

2. **Verify:**
   - ✅ Phone validation works (Australian format)
   - ✅ "Continue" button enabled

3. **Click:** "Continue"

### 2.5 Step 3: Delivery Address
1. **Select:** State: `NSW`
2. **Enter:** 
   - Suburb/Postcode: `Sydney 2000`
3. **Verify:**
   - ✅ Address auto-completes or validates
   - ✅ "Continue" button enabled

4. **Click:** "Continue"

### 2.6 Step 4: Preferences
1. **Select:** Subscription plan (e.g., "Starter" or "None")
2. **Check boxes:**
   - [ ] Marketing texts (optional)
   - [ ] Account texts (optional - select at least one)

3. **Verify:**
   - ✅ At least one checkbox can be checked
   - ✅ "Create Account" button enabled

4. **Click:** "Create Account"

### 2.7 Verify Signup Success
1. **Should see:**
   - ✅ Success message: "Account created successfully"
   - ✅ Spinner animation
   - ✅ Auto-redirect to dashboard

2. **After redirect:**
   - Should be at `/dashboard/` or `/dashboard/orders`
   - Should see customer name in header
   - No errors in console

---

## 📋 Test Suite 3: Authentication - Employee Signin (10 minutes)

### 3.1 Navigate to Employee Signin
1. Navigate to `http://localhost:3001/auth/signin`
2. **Should see:** Two choice cards
   - "Customer Sign In"
   - "Washlee Pro Sign In"

3. **Click:** "Washlee Pro Sign In" card

### 3.2 Employee Signin Page
1. **Should navigate to:** `/auth/employee-signin`
2. **Should see:**
   - Employee ID field (labeled "Employee ID or Payslip Code")
   - Email field
   - Password field
   - Remember Me checkbox
   - Sign In button

### 3.3 Test with Valid Credentials
1. **Enter:**
   - Employee ID: `EMP-1773230849589-1ZE64`
   - Email: `lukaverde0476653333@gmail.com`
   - Password: `35Malcolmst!`

2. **Optional:** Check "Remember me for 7 days"

3. **Click:** "Sign In"

### 3.4 Verify Success
1. **Console should show:**
   ```
   [Employee Login] Sending: › Object
   [Employee Login] Response: › Object
   [Auth] State changed: authenticated as...
   [Employee Login] Successfully signed into Firebase
   ```

2. **After ~2 seconds:**
   - Should redirect to `/dashboard/pro`
   - Dashboard should load without errors
   - Should see pro dashboard tabs:
     - Available Jobs
     - Accepted Jobs
     - Completed Jobs
     - Earnings
     - Ratings & Reviews

### 3.5 Verify Pro Dashboard
1. **Should display:**
   - ✅ Pro header with user name
   - ✅ Job cards (sample data)
   - ✅ Earnings summary
   - ✅ Logout button
   - ✅ Settings menu

---

## 📋 Test Suite 4: Navigation & Routing (8 minutes)

### 4.1 Test Back Navigation
1. **On any page:** Look for back arrow (←) button
2. **If visible:** Click it
3. **Verify:** Returns to previous page or signin page

### 4.2 Test Header Navigation
1. **From pro dashboard:**
   - Click Washlee logo → should go to homepage
   - Click Home → should go to `/`
   - Click on menu links → should navigate

### 4.3 Test Dashboard Navigation
1. **In dashboard:**
   - Click tabs (Orders, Payments, Support, etc.)
   - Each should switch views without page reload
   - No errors in console

### 4.4 Test Mobile Navigation
1. **Switch to mobile view** (DevTools: toggle device toolbar)
2. **Test:**
   - Hamburger menu opens/closes
   - Links navigate correctly
   - No layout breaks

---

## 📋 Test Suite 5: Form Validation (5 minutes)

### 5.1 Signup Form Validation
1. **Try to submit empty form:**
   - Click "Create Account" on step 1 with no data
   - **Should show:** "Email is required" error
   - **Should NOT submit**

2. **Try invalid email:**
   - Enter: `notanemail`
   - **Should show:** "Invalid email address"

3. **Try weak password:**
   - Enter: `123456`
   - **Should show:** Password strength indicator red
   - **Should NOT allow continue**

### 5.2 Employee Signin Validation
1. **Try with missing Employee ID:**
   - Leave empty, fill email/password
   - **Should show:** "Please enter employee ID, email, and password"

2. **Try with invalid Employee ID format:**
   - Enter: `INVALID123`
   - **Should show:** "Invalid employee ID format"

3. **Try with invalid email:**
   - Enter: `notanemail`
   - **Should show:** "Please enter a valid email address"

### 5.3 Contact Form Validation
1. Navigate to `/faq`
2. Scroll to "Contact Us" section
3. **Try to submit empty:**
   - **Should show:** Required field errors
   - **Should NOT submit**

---

## 📋 Test Suite 6: Error Handling (5 minutes)

### 6.1 Network Errors
1. **Open DevTools → Network tab**
2. **Simulate offline:**
   - DevTools → Network tab → Throttling → Offline
   - Navigate to a page
   - **Should show:** Graceful error or offline message
   - DevTools → Network tab → Throttling → Online (restore)

### 6.2 Console Errors
1. **Keep DevTools → Console open**
2. **Navigate through app:**
   - Homepage
   - Signup page
   - Login page
   - Dashboard (if logged in)
3. **Verify:**
   - ✅ No RED errors
   - ✅ No RED warnings
   - Yellow warnings are OK (deprecation notices)

### 6.3 Page Not Found
1. Navigate to `/this-page-does-not-exist`
2. **Should show:** 404 error page or redirect to 404
3. **Should have:** "Go back" button
4. **Click it:** Should return to previous page

---

## 📋 Test Suite 7: Responsive Design (5 minutes)

### 7.1 Test Desktop View
1. DevTools → Set viewport to desktop (1920x1080)
2. **Verify:**
   - ✅ Content doesn't overflow
   - ✅ Desktop menu visible
   - ✅ Hamburger menu NOT visible
   - ✅ Images properly sized

### 7.2 Test Tablet View
1. DevTools → Set viewport to tablet (768x1024 iPad)
2. **Verify:**
   - ✅ Content centered
   - ✅ Menu adapts
   - ✅ Buttons are touch-friendly
   - ✅ No horizontal scroll

### 7.3 Test Mobile View
1. DevTools → Set viewport to mobile (375x667 iPhone)
2. **Verify:**
   - ✅ Hamburger menu visible
   - ✅ Content single column
   - ✅ Buttons large enough to tap
   - ✅ No horizontal scroll
   - ✅ Text readable

### 7.4 Test Responsiveness
1. **Resize browser window** (drag edge)
2. **Verify:** Layout adapts smoothly

---

## 📋 Test Suite 8: Performance (3 minutes)

### 8.1 Page Load Speed
1. **DevTools → Performance tab**
2. Navigate to homepage
3. **Record:**
   - Click "Record"
   - Wait for page to fully load
   - Click "Stop"
4. **Check:**
   - ✅ Largest Contentful Paint (LCP) < 3s
   - ✅ First Input Delay (FID) < 100ms
   - ✅ Cumulative Layout Shift (CLS) < 0.1

### 8.2 Console Performance
1. **DevTools → Console**
2. Look for timing logs like:
   ```
   [Performance] Page load: XXXms
   [Firebase] Initialized in XXXms
   ```

### 8.3 Network Performance
1. **DevTools → Network tab**
2. Reload page
3. **Verify:**
   - ✅ CSS files loaded
   - ✅ JS files loaded
   - ✅ Images loaded
   - ✅ No failed requests (red)

---

## 📋 Test Suite 9: Features (varies)

### 9.1 Testimonials Section (Homepage)
1. Scroll to testimonials section
2. **Verify:**
   - ✅ Customer testimonials visible
   - ✅ Star ratings show (4.9★)
   - ✅ Customer names visible
   - ✅ Professional layout

### 9.2 Pricing Section
1. Navigate to `/pricing`
2. **Verify:**
   - ✅ Price per kg ($3.00) shows
   - ✅ Add-ons listed (hang dry, delicates, etc.)
   - ✅ Subscription tiers visible
   - ✅ FAQ questions displayed

### 9.3 Pro Application
1. Navigate to `/pro`
2. **Verify:**
   - ✅ Earnings info visible
   - ✅ "Become a Pro" button clickable
   - ✅ Application form accessible

### 9.4 How It Works
1. Navigate to `/how-it-works`
2. **Verify:**
   - ✅ 4-step process visible
   - ✅ Icons display correctly
   - ✅ Alternating layout on desktop
   - ✅ Stacked layout on mobile

---

## ✅ Checklist Summary

After completing all test suites, verify:

- [ ] **Smoke Test Passed** (5/5 checks)
- [ ] **Customer Signup** Complete & successful
- [ ] **Employee Signin** Complete & redirects to dashboard
- [ ] **Navigation** All links working
- [ ] **Form Validation** Prevents invalid submissions
- [ ] **Error Handling** Graceful errors shown
- [ ] **Responsive Design** Works on desktop, tablet, mobile
- [ ] **Performance** Loads quickly
- [ ] **Features** Display correctly
- [ ] **Console** No RED errors

---

## 🐛 Bug Report Template

If you find an issue, fill this out:

```
### Bug Title
[Brief description]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Screenshot/Console Error
[Paste error or screenshot]

### Browser & OS
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Device: [Desktop/Tablet/Mobile]

### Severity
[ ] Critical (app broken)
[ ] High (feature broken)
[ ] Medium (minor issue)
[ ] Low (cosmetic)
```

---

## 📊 Test Results Template

```markdown
# Test Results - [Date]

## Summary
- Total Test Cases: [X]
- Passed: [X] ✅
- Failed: [X] ❌
- Skipped: [X] ⏭️

## Issues Found
1. [Issue 1]
   - Severity: [Critical/High/Medium/Low]
   - Status: [Open/In Progress/Fixed]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Sign-off
- Tested By: [Name]
- Date: [Date]
- Approved: [Yes/No]
```

---

## 🚀 Test Execution Tips

1. **Clear cache between tests:**
   ```bash
   # Hard refresh in browser
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Monitor console continuously:**
   - Keep DevTools → Console open
   - Watch for errors in real-time

3. **Test with real scenarios:**
   - Use realistic data
   - Test both happy paths and edge cases

4. **Test on real devices:**
   - Desktop browser
   - Tablet/iPad
   - Actual smartphone if possible

5. **Test with different accounts:**
   - Different emails
   - Different employee IDs
   - Different roles (customer/pro)

---

## 📞 Support

**If something breaks:**
1. Check the browser console for error messages
2. Take a screenshot
3. Note the exact steps to reproduce
4. Check if it's in the "Known Issues" section
5. Report using the bug report template above

---

**Version:** 1.0  
**Last Updated:** March 12, 2026  
**Status:** Ready for Testing

Good luck! 🚀
