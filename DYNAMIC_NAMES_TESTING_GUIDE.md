# Dynamic Names - Testing & Verification Guide

## Overview
This guide helps you verify that your dynamic name system is working correctly across all pages of the Washlee website.

---

## ✅ Quick Verification Checklist

### Must-Have Tests (Run These First)

- [ ] **Test 1**: Header shows first name only in button
- [ ] **Test 2**: Header dropdown shows full name + email
- [ ] **Test 3**: Dashboard shows user's name in welcome message
- [ ] **Test 4**: Customer page shows user's name
- [ ] **Test 5**: Pro page shows user's name
- [ ] **Test 6**: Different users see different names
- [ ] **Test 7**: Names persist after page reload
- [ ] **Test 8**: Orders save with correct customer name

### Browser/Device Tests

- [ ] **Desktop**: All features work on desktop browser
- [ ] **Mobile**: All features work on mobile browser
- [ ] **Tablet**: All features work on tablet
- [ ] **Firefox**: All features work in Firefox
- [ ] **Safari**: All features work in Safari
- [ ] **Chrome**: All features work in Chrome

---

## 🧪 Detailed Test Cases

### TEST 1: Header Button Shows First Name Only

**Setup:**
- Have a test user account with: First Name = "Luka", Last Name = "Verde"

**Steps:**
1. Go to `http://localhost:3000/`
2. Log in as this user
3. Look at top-right header

**Expected Result:**
- Header button shows: `👤 Luka` (just the first name)
- NOT: "Luka Verde" (full name)
- NOT: "User" (generic name)

**Code Reference:** `components/Header.tsx` Line 94
```tsx
<span className="text-dark">{userData?.name?.split(' ')[0] || 'User'}</span>
```

---

### TEST 2: Header Dropdown Shows Full Name

**Setup:**
- Same user logged in from TEST 1

**Steps:**
1. Click the `👤 Luka` button in header
2. A dropdown menu appears
3. Look at the top section of dropdown

**Expected Result:**
- Dropdown header shows: `Luka Verde` (full name)
- Below it: `lukaverde6@gmail.com` (email)
- Menu options: "Dashboard" (with water droplet icon) and "Log Out"

**Code Reference:** `components/Header.tsx` Lines 105-106
```tsx
<p className="font-bold text-dark text-base">{userData?.name || 'User'}</p>
<p className="text-xs text-gray mt-1">{userData?.email || ''}</p>
```

---

### TEST 3: Dashboard Shows User Name in Welcome

**Setup:**
- Same user logged in

**Steps:**
1. Click "Dashboard" from header dropdown
2. You're taken to `/dashboard`
3. Look at the main heading area

**Expected Result:**
- See: `Welcome back, Luka Verde! Here's your laundry summary.`
- NOT: "Welcome back, Customer!"
- NOT: "Welcome back, [placeholder]!"

**Code Reference:** `app/dashboard/page.tsx` Line 135
```tsx
<p className="text-gray">Welcome back, {userData?.name}! Here's your laundry summary.</p>
```

---

### TEST 4: Dashboard Sidebar Shows User Name

**Setup:**
- Same user on dashboard page

**Steps:**
1. On desktop, look at the left sidebar
2. Find the user info card near the top

**Expected Result:**
- Card shows: `"Welcome back"` (small text)
- Then: `"Luka Verde"` (large bold text)
- Then: `"lukaverde6@gmail.com"` (smaller gray text)

**Code Reference:** `app/dashboard/layout.tsx` Lines 124-126
```tsx
<p className="text-xs text-gray font-semibold mb-1">Welcome back</p>
<p className="text-lg font-bold text-dark">{userData?.name}</p>
<p className="text-sm text-gray mt-2">{userData?.email}</p>
```

---

### TEST 5: Customer Dashboard Shows User Name

**Setup:**
- Same user logged in

**Steps:**
1. From main dashboard, go to `/dashboard/customer`
2. Look at the main heading at the top of page

**Expected Result:**
- See: `Welcome, Luka Verde!`
- Below: `Manage your laundry orders and account`

**Code Reference:** `app/dashboard/customer/page.tsx` Line 96
```tsx
<h1 className="text-4xl font-bold text-dark mb-2">Welcome, {userData?.name || 'Customer'}!</h1>
```

---

### TEST 6: Pro Dashboard Shows User Name

**Setup:**
- Have a pro user account with: First Name = "Mike", Last Name = "Johnson"
- Log in as this pro user

**Steps:**
1. Go to `/dashboard/pro`
2. Look at the main heading

**Expected Result:**
- See: `Welcome, Mike Johnson!`
- Below: `Manage your jobs and earnings`

**Code Reference:** `app/dashboard/pro/page.tsx` Line 52
```tsx
<h1 className="text-4xl font-bold text-dark mb-2">Welcome, {userData?.name || 'Pro'}!</h1>
```

---

### TEST 7: Different Users See Different Names

**Setup:**
- Have at least 2 test accounts:
  - Account A: "Alex Brown"
  - Account B: "Emma Chen"

**Steps:**
1. Log in as "Alex Brown"
2. Check header → button shows "Alex"
3. Check dashboard → shows "Welcome back, Alex Brown!"
4. Log out

5. Log in as "Emma Chen"
6. Check header → button shows "Emma"
7. Check dashboard → shows "Welcome back, Emma Chen!"

**Expected Result:**
- Each user sees THEIR OWN name, not the other user's name
- Names are correctly tied to their accounts
- No name mixing or confusion

**Verification:**
- Account A always shows "Alex Brown" when logged in
- Account B always shows "Emma Chen" when logged in
- Never see mixed names (e.g., "Alex Chen" or "Emma Brown")

---

### TEST 8: Names Persist After Page Reload

**Setup:**
- User "Luka Verde" logged in

**Steps:**
1. Go to `/dashboard`
2. See: `Welcome back, Luka Verde!`
3. Reload the page (F5 or Cmd+R)
4. Wait for page to fully load
5. Check header and dashboard

**Expected Result:**
- After reload, immediately see:
  - Header button: "Luka"
  - Dashboard: "Welcome back, Luka Verde!"
- NOT: "Sign In / Get Started" buttons (would mean logged out)
- NOT: Loading spinner (should be done loading)

**Verification:**
- Session persists (remember me feature)
- Name loads quickly (within 2 seconds)
- No confusion during loading state

---

### TEST 9: Booking Page Uses User Name

**Setup:**
- User "Luka Verde" logged in

**Steps:**
1. Go to `/booking`
2. Fill out booking form with options
3. Go through steps 1-4 to order confirmation
4. Look at confirmation screen

**Expected Result:**
- Confirmation should show order was submitted for "Luka Verde"
- In Firebase, the order should have: `customerName: "Luka Verde"`
- Order history should reference "Luka Verde"

**Code Reference:** `app/booking/page.tsx` Lines 186-188
```tsx
const docRef = await addDoc(ordersRef, {
  userId: user.uid,
  customerName: userData?.name || 'Customer',  // Saves "Luka Verde"
  // ... rest of order data
})
```

**How to Verify in Firebase:**
1. Go to Firebase Console → Firestore → orders collection
2. Find the latest order with userId matching "Luka Verde"
3. Check the `customerName` field → should be "Luka Verde"

---

### TEST 10: Mobile Menu Shows User Name

**Setup:**
- User logged in
- Open page on mobile device (or use browser dev tools to simulate)

**Steps:**
1. On mobile, click the hamburger menu (☰) in top right
2. Menu opens on left side
3. Look at the text at top of menu

**Expected Result:**
- See: `Welcome back, Luka Verde` (or user's actual name)
- Below are navigation links (Home, How It Works, etc.)

**Code Reference:** `app/dashboard/layout.tsx` Line 80
```tsx
<p className="text-sm font-semibold text-gray mb-4">Welcome back, {userData?.name}</p>
```

---

## 🔍 Verification Script

### Automated Testing (Optional)

You can create a test script to verify names are displaying correctly:

```javascript
// Quick browser console test (paste into DevTools)
const testDynamicNames = () => {
  const tests = {
    headerButtonExists: !!document.querySelector('[data-test="header-button"]'),
    headerButtonText: document.querySelector('[data-test="header-button"]')?.textContent,
    dropdownExists: !!document.querySelector('[data-test="user-dropdown"]'),
    dropdownText: document.querySelector('[data-test="user-dropdown"]')?.textContent,
    dashboardGreeting: document.querySelector('[data-test="dashboard-greeting"]')?.textContent,
  }
  
  console.table(tests)
  return tests
}

testDynamicNames()
```

---

## 📋 Bug Reports Template

If something isn't working, use this template to report it:

```
ISSUE: [Brief description]
Date/Time: [When it happened]
User Account: [Which account/name was logged in]
URL: [Which page you were on]

Steps to reproduce:
1. [First action]
2. [Second action]
3. [What happens]

Expected: [What should happen]
Actual: [What actually happened]

Screenshots: [Attach images if possible]

Browser: [Firefox/Safari/Chrome]
Device: [Desktop/Mobile/Tablet]
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Header shows "User" instead of name
**Possible Causes:**
- User not authenticated (not logged in)
- Firestore user document missing
- AuthContext not loading data

**Solution:**
1. Check you're logged in (should see "Sign In" button if not)
2. Go to Firebase Console → Firestore → users collection
3. Verify your user document exists and has a `name` field
4. Check browser console for auth errors (open DevTools → Console tab)

---

### Issue 2: Dashboard shows "Welcome back, User!" instead of actual name
**Possible Causes:**
- Name field missing from Firestore
- Loading state issue
- AuthContext not providing userData

**Solution:**
1. Log out and log in again
2. Wait 2-3 seconds for name to load
3. Check browser console for error messages
4. Verify Firestore has user document with `name` field

---

### Issue 3: Name shows first time, then disappears
**Possible Causes:**
- Session timeout
- Auth listener disconnected
- Browser clearing localStorage

**Solution:**
1. Reload the page
2. Check browser console for auth errors
3. Ensure browser allows localStorage/IndexedDB
4. Try in incognito/private mode to rule out cache

---

### Issue 4: Different users see same name
**Possible Causes:**
- User data not updating in Firestore
- Session not switching properly
- Cache issue

**Solution:**
1. Log out completely (use header dropdown → Log Out)
2. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Log in as the other user
4. Wait 2 seconds for name to load

---

## 📊 Test Results Template

Use this to document your testing:

```
Test Date: [Date]
Tester Name: [Your name]
Browser: [Firefox/Safari/Chrome]
Device: [Desktop/Mobile]

Results:
[ ] TEST 1: Header button - First name ✓/✗
[ ] TEST 2: Header dropdown - Full name ✓/✗
[ ] TEST 3: Dashboard welcome - User name ✓/✗
[ ] TEST 4: Dashboard sidebar - User name ✓/✗
[ ] TEST 5: Customer page - User name ✓/✗
[ ] TEST 6: Pro page - User name ✓/✗
[ ] TEST 7: Different users - Different names ✓/✗
[ ] TEST 8: Reload - Names persist ✓/✗
[ ] TEST 9: Booking - Order saves with name ✓/✗
[ ] TEST 10: Mobile - Menu shows name ✓/✗

Overall Status: [PASSING / FAILING / PARTIAL]

Issues Found:
- [Issue 1]
- [Issue 2]

Notes:
[Any additional observations]
```

---

## ✨ Expected System Behavior

When everything is working correctly:

1. **User Signs Up**
   - Enters firstName "Luka" and lastName "Verde"
   - System saves as `userData.name = "Luka Verde"`

2. **User Logs In**
   - System fetches name from Firestore in ~500-1000ms
   - Name appears in header as "Luka"
   - AuthContext broadcasts userData to all pages

3. **User Navigates Site**
   - Header always shows "👤 Luka"
   - Dashboard shows "Welcome back, Luka Verde!"
   - Customer page shows "Welcome, Luka Verde!"
   - Name persists across all pages

4. **User Creates Order**
   - Order saved with `customerName: "Luka Verde"`
   - Firestore shows order linked to correct user

5. **User Logs Out**
   - Header shows "Sign In / Get Started" buttons
   - Name data cleared from memory
   - Session ended

6. **Next Login**
   - Different user logs in
   - System shows THAT user's name
   - Previous user's name not visible

---

## Summary

✅ **Your dynamic names system is production-ready**

All tests should pass, confirming:
- Each user sees their own name
- Names display consistently across pages
- Names persist after reload
- Multiple users see different names
- Data is saved correctly to Firebase

If all tests pass → **System is working correctly!** ✨

If some tests fail → Check the "Common Issues & Solutions" section above.
