# Dashboard Plans Page - Testing Guide

## ✅ Quick Start

### 1. Start the Dev Server
```bash
cd /Users/lukaverde/Desktop/Website.BUsiness
npm run dev
```

### 2. Navigate to Plans Page
```
http://localhost:3000/dashboard/subscriptions
```

### 3. Expected Behavior
- If logged in: See "Your Plans" page
- If not logged in: Redirected to /auth/login
- If subscribed: Current plan displayed in hero card
- If not subscribed: See alert message to choose a plan

---

## 📝 Test Scenarios

### Scenario 1: Viewing Plans (Not Subscribed)
**Steps:**
1. Login as user with no subscription
2. Navigate to `/dashboard/subscriptions`
3. Should see "No Active Plan" alert
4. Plan grid shows all 3 plans (Monthly, Quarterly, Annual)
5. Benefits section visible
6. FAQ section visible

**Expected Results:**
- ✅ No database lock errors in console
- ✅ Page loads within 2 seconds
- ✅ All content visible and readable
- ✅ No console errors

---

### Scenario 2: Viewing Current Plan (Subscribed)
**Steps:**
1. Login as user with active subscription
2. Navigate to `/dashboard/subscriptions`
3. Should see current plan hero card
4. Current plan should have ring border and be scaled up
5. Hero card shows status, renewal date, payment method

**Expected Results:**
- ✅ Current plan highlighted with blue ring
- ✅ Hero card displays correct subscription details
- ✅ Upgrade and Cancel buttons visible
- ✅ Plan grid shows all plans
- ✅ Other plans not highlighted

---

### Scenario 3: Payment Success
**Steps:**
1. Navigate to `/dashboard/subscriptions?success=true`
2. Should see green success banner at top
3. Banner shows checkmark and "Payment Successful!"
4. Current plan should be active

**Expected Results:**
- ✅ Green banner appears
- ✅ Success message visible
- ✅ Checkmark icon displayed
- ✅ Banner closes after reading
- ✅ Plan is marked as "Current Plan"

---

### Scenario 4: Upgrade Plan
**Steps:**
1. Click "Choose Plan" button on any plan
2. Modal should open with "Upgrade Your Plan" text
3. "Browse Plans" button should appear
4. Click outside modal to close

**Expected Results:**
- ✅ Modal opens with fade-in animation
- ✅ Correct title displayed
- ✅ Browse Plans button functional
- ✅ Modal closes on outside click
- ✅ Modal closes on X button

---

### Scenario 5: Cancel Subscription
**Steps:**
1. Click "Cancel" button on current plan hero card
2. Modal opens with "Cancel Subscription" title
3. Shows current plan end date
4. Shows "Keep Plan" and "Confirm Cancel" buttons
5. Click "Confirm Cancel"

**Expected Results:**
- ✅ Modal displays cancellation warning
- ✅ Plan end date shown correctly
- ✅ Confirmation message appears
- ✅ Subscription status updates
- ✅ User notified of cancellation

---

### Scenario 6: Responsive Design (Mobile)
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (iPhone SE size)
3. Navigate to `/dashboard/subscriptions`
4. Scroll through page

**Expected Results:**
- ✅ Single column layout
- ✅ Cards full width
- ✅ Text readable
- ✅ Buttons full width
- ✅ Modal fits screen
- ✅ No horizontal scrolling
- ✅ Images scale properly

---

### Scenario 7: Responsive Design (Tablet)
**Steps:**
1. Toggle device toolbar (iPad size)
2. Navigate to `/dashboard/subscriptions`

**Expected Results:**
- ✅ 2-column plan grid
- ✅ 2-column FAQ grid
- ✅ Proper spacing
- ✅ Hero card layout adjusted
- ✅ All content visible

---

### Scenario 8: Database Lock Error Recovery
**Steps:**
1. Deliberately lock database with multiple requests
2. Navigate to plans page
3. Should NOT hang
4. Should load within 5 seconds

**Expected Results:**
- ✅ Page loads despite lock (max 5 seconds)
- ✅ No frozen UI
- ✅ Graceful fallback to null subscription
- ✅ User sees "No Active Plan" message
- ✅ No error alerts to user

---

## 🐛 Console Testing

### Check for Lock Errors
```javascript
// Open browser console and watch for:
// ❌ "Lock broken by another request" - PROBLEM
// ❌ "Database error" - PROBLEM
// ✅ No errors - GOOD
// ✅ Subscription loaded - GOOD
```

### Check API Response
```javascript
// Network tab should show:
// GET /api/subscriptions/get-current - 200 OK
// Response: { subscription: {...} } or { subscription: null }
```

### Check Component Logs
```javascript
// Look for helpful logs like:
// [Plans] Loading subscription...
// [Plans] No subscription found
// [Plans] Current subscription loaded
```

---

## ⚡ Performance Testing

### Load Time
```bash
# Should be < 2 seconds even with database lock
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/dashboard/subscriptions
```

### Timeout Verification
```javascript
// API should never hang longer than 5 seconds
// Check Network tab: GET /api/subscriptions/get-current
// Should complete or error within 5 seconds
```

---

## 🎨 Visual Regression Testing

### Hero Card Colors
- Background: Teal to mint gradient (#48C9B0 → #7FE3D3)
- Text: White (#FFFFFF)
- Border: Subtle shadow

### Button States
- **Primary**: Teal background, white text
- **Outline**: Teal border, teal text
- **Ghost**: Transparent, teal text
- **Disabled**: Gray background

### Card Styling
- **Popular Plan**: Scaled up 105%, shadow-2xl
- **Current Plan**: Ring border in teal
- **Normal**: Standard card shadow

### Typography
- **H1**: 48px, bold, #1f2d2b
- **H2**: 30px, bold, #1f2d2b
- **Body**: 16px, regular, #6b7b78
- **Small**: 14px, regular, #6b7b78

---

## 🔧 Debugging Tips

### If Page Shows "Loading..." Forever
```bash
# Check API endpoint
curl -H "Authorization: Bearer YOUR_USER_ID" \
     http://localhost:3000/api/subscriptions/get-current

# Should return: { "subscription": null } or { "subscription": {...} }
```

### If Database Lock Error
```javascript
// Check Supabase connection
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Auth state:', user) // Should have user.uid
```

### If Modal Doesn't Open
```javascript
// Check state management
console.log('showManageModal:', showManageModal)
console.log('selectedAction:', selectedAction)
// Both should update when buttons clicked
```

### If Styling Looks Wrong
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
npm run dev
```

---

## ✨ Final Quality Checklist

- [ ] All 3 plans display correctly
- [ ] Current plan highlighted if subscribed
- [ ] Success banner shows on payment success
- [ ] Modals open/close smoothly
- [ ] No console errors
- [ ] No database lock errors
- [ ] Mobile responsive works
- [ ] All buttons functional
- [ ] Text is readable
- [ ] Icons display correctly
- [ ] Colors match brand guidelines
- [ ] Loading spinner shows while fetching
- [ ] No layout shift on load
- [ ] Accessibility features working

---

## 📞 Support

If you encounter issues:

1. **Check the console** for errors
2. **Verify .env.local** has correct API keys
3. **Clear browser cache** and hard refresh
4. **Restart dev server** with `npm run dev`
5. **Check Supabase status** if lock errors occur
6. **Review logs** in `.next/dev/logs/`

---

**Last Updated:** March 27, 2026
**Status:** Ready for QA Testing
