# Wash Club Signup Flow - Quick Start Testing

## 🎯 Test the Flow in 5 Minutes

### 1. Start Dev Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 2. Navigate to Signup
```
http://localhost:3000/auth/signup
```

### 3. Fill Signup Form
```
- First Name: John
- Last Name: Doe
- Email: test@example.com
- Password: Test123!
- Address: 123 Main St, Sydney NSW 2000
- Phone: +61412345678
- Plan: Select any or skip
```

### 4. Click "Create Account"
```
✅ Expected: Modal appears asking "Join Wash Club?"
❌ Not happening? Check console for errors
```

### 5. Click "Join Now"
```
✅ Expected: Redirects to /wash-club/onboarding
- Should show "Step 1 of 4"
```

### 6. Go Through Steps
```
Step 1: Click "Continue"

Step 2: 
  - Click "Send Verification Code"
  - Check browser console (F12) for 6-digit code
  - Paste code into field
  - Click "Verify"

Step 3:
  - Scroll to bottom of terms
  - Check all 3 boxes
  - Click "Confirm"

Step 4:
  - See "Welcome to Wash Club!"
  - Shows 25 credit bonus
  - Click "Go to Home"
```

### 7. Verify in Firestore
```
Firebase Console → Firestore:
- Collection: wash_clubs
- Find document with user's ID
- Should show:
  * tier: 1 (Bronze)
  * creditsBalance: 25
  * status: "active"
```

---

## 🧪 Alternative Test: Skip Wash Club

### After clicking "Create Account"
1. Modal appears
2. Click "No Thanks" instead
3. ✅ Expected: Redirect to home page
4. ❌ No Wash Club records created

---

## 🐛 Troubleshooting

### Modal not appearing
```
1. Open browser console (F12 → Console)
2. Look for JavaScript errors
3. Verify signup form submitted successfully
4. Check network tab for any failed API calls
```

### Verification code not working
```
1. Look for log in console: "Verification code: XXXXXX"
2. Make sure you copy exact 6-digit code
3. Codes expire in 15 minutes
4. Click "Send Verification Code" again if expired
```

### Can't complete enrollment
```
1. Make sure you scroll to bottom of terms
2. All 3 checkboxes must be checked
3. "Confirm" button should be enabled then
4. Check console for any errors
```

### Records not in Firestore
```
1. Create collections if missing:
   - wash_clubs
   - wash_club_verification
   - transactions
2. Verify Firebase project configured in .env.local
3. Check enrollment completed successfully
```

---

## ✅ What You Should See

### Signup Page ✓
- Form with fields for name, email, password, address, phone
- Google Places autocomplete for address
- Next/Previous step buttons

### Modal After Signup ✓
- Title: "Join Wash Club?"
- 3 benefits listed
- "Join Now" and "No Thanks" buttons
- No page redirect - modal overlay

### Onboarding Step 1 ✓
- "Step 1 of 4" header
- Progress bar at 25%
- Wash Club info text
- "Continue" button

### Onboarding Step 2 ✓
- "Step 2 of 4" header  
- Email field (pre-filled)
- "Send Verification Code" button
- 6-digit code input field
- "Verify" button

### Onboarding Step 3 ✓
- "Step 3 of 4" header
- Full terms text
- 3 checkboxes
- "Confirm" button (disabled until scrolled + all checked)

### Onboarding Step 4 ✓
- "Step 4 of 4" header
- Success checkmark
- "Welcome to Wash Club!" message
- "25 Credits - Sign-up Bonus"
- "Go to Home" button

---

## 📊 Flow Diagram

```
Sign Up Page
    ↓
Sign Up Form (fill fields)
    ↓
Click "Create Account"
    ↓
Firebase Auth Creates Account
    ↓
Modal: "Join Wash Club?"
    ├─→ "Join Now" → /wash-club/onboarding
    │                      ↓
    │              Step 1: Info Overview
    │                      ↓
    │              Step 2: Email Verification
    │                      ↓
    │              Step 3: Terms & Agreements
    │                      ↓
    │              Step 4: Confirmation
    │                      ↓
    │              Firestore: membership created + 25 credits
    │                      ↓
    │              → Home Page
    │
    └─→ "No Thanks" → Home Page (no Wash Club)
```

---

## 🎮 Test Scenarios to Try

### Scenario 1: Complete Flow
✅ Full signup → Join → All steps → Confirmation

### Scenario 2: Skip Wash Club
✅ Signup → Modal → No Thanks → Home

### Scenario 3: Wrong Code
✅ Step 2 → Wrong code → Error message → Retry with correct code

### Scenario 4: Expired Code
✅ Step 2 → Wait 15+ min → Try to verify → Error → Resend

### Scenario 5: Mobile View
✅ Resize browser to mobile → Complete full flow

### Scenario 6: Browser Back
✅ At any onboarding step → Click back → Redirects to home

---

## 📝 Test Results Template

```
TEST DATE: [DATE]
TESTER: [NAME]

Signup Form:
  ✅ Form loads
  ✅ All fields work
  ✅ Address autocomplete works
  ✅ Form submits

Modal Display:
  ✅ Modal appears after signup
  ✅ Modal styling correct
  ✅ Buttons clickable

Onboarding:
  ✅ Step 1 displays
  ✅ Step 2 verification works
  ✅ Step 3 terms display
  ✅ Step 4 confirmation shows

Firestore:
  ✅ wash_clubs collection created
  ✅ Membership document created
  ✅ 25 credits awarded
  ✅ Status shows "active"

Issues Found:
- [List any issues]

Overall Status: PASS/FAIL
```

---

## 🚀 Ready to Test!

Everything is set up and ready to go. Just:

1. **Start server:** `npm run dev`
2. **Go to signup:** `http://localhost:3000/auth/signup`
3. **Fill form and create account**
4. **See modal appear**
5. **Join Wash Club and complete flow**

The complete signup-to-enrollment flow now works seamlessly with professional email verification and legal agreements!

---

**Last Updated:** March 16, 2026
**Status:** ✅ Ready for Testing
