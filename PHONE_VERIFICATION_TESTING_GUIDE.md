# Phone Verification Testing Guide - Local Development

## Quick Start

### Enable Dev Mode
Add `?dev=true` to phone verification URLs:
- Manual: `/auth/phone-verification?email=test@example.com&dev=true`
- Or: Codes will auto-display in development mode

### What Dev Mode Includes
- ✅ Verification codes displayed in yellow box on verification screen
- ✅ "Click to auto-fill" button to paste code instantly
- ✅ Console logs showing generated codes: `[SEND_PHONE_CODE] 🔧 DEV MODE: Test code = 123456`
- ✅ No external SMS/email required (emails still sent but codes shown in UI)

---

## Testing Checklist (Step-by-Step)

### ✅ Test 1: New User Signup with Phone

**Steps:**
1. Go to `/auth/signup` → Select "Pro"
2. Fill signup form:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `newuser123@example.com`
   - Phone: `0412345678`
   - State: `Victoria (VIC)`
   - Password: `TestPass123!`
3. Click "Create Account"
4. Verify:
   - ✅ No errors
   - ✅ Account created (console shows `[SIGNUP] ✓ New pro registered`)
   - ✅ Phone stored in database

**Check in Database:**
```sql
-- Via Supabase UI or terminal
SELECT id, email, phone, phone_verified FROM users 
WHERE email = 'newuser123@example.com';
-- Should show: phone = '0412345678', phone_verified = false
```

---

### ✅ Test 2: New User Login → Routes to Phone Verification

**Steps:**
1. Go to `/auth/login`
2. Enter credentials:
   - Email: `newuser123@example.com`
   - Password: `TestPass123!`
3. Click "Log In"
4. Verify:
   - ✅ Redirects to `/auth/phone-verification`
   - ✅ NOT redirected to dashboard
   - ✅ Phone input step shows
   - ✅ Dev code displayed if `dev=true`

**Expected Behavior:**
- New user who hasn't verified phone → phone verification page
- Message shows: "We'll send a verification code to confirm your phone number"

---

### ✅ Test 3: Returning User Without Phone → Prompted to Enter

**Steps:**
1. Create new user WITHOUT phone in signup:
   - Go to `/auth/signup` → Pro
   - Leave phone field empty
   - Fill all other required fields
   - Create account
2. Log out
3. Log in with new credentials
4. Verify:
   - ✅ Redirects to `/auth/phone-verification`
   - ✅ Phone input step shown (empty)
   - ✅ Message: "We'll send a verification code..."
5. Enter phone: `0298765432`
6. Click "Send Verification Code"
7. Verify:
   - ✅ Code displayed in yellow dev box
   - ✅ Steps to "Verification Code" step
   - ✅ Shows phone number that code was sent to

**Verification:**
- Input: `0298765432`
- Dev Code: Shows in yellow box
- Click "Click to auto-fill" → auto-fills code input
- Click "Verify Phone"
- Verify:
  - ✅ Phone marked as verified in database
  - ✅ Redirects to `/dashboard/customer`

---

### ✅ Test 4: Returning User With Phone → Auto-loads → Verifies

**Steps:**
1. Use first test user from Test 1: `newuser123@example.com` with phone `0412345678`
2. Log out, then log back in
3. Verify:
   - ✅ Redirects to `/auth/phone-verification`
   - ✅ Phone field pre-filled with `0412345678`
   - ✅ Already on verification step (not input step)
   - ✅ Dev code displayed
4. Click "Click to auto-fill" OR manually enter code
5. Click "Verify Phone"
6. Verify:
   - ✅ Success message: "Phone verified successfully!"
   - ✅ Redirects to `/dashboard/customer`
   - ✅ `phone_verified = true` in database

---

### ✅ Test 5: Duplicate Phone Check → Error Message

**Steps:**
1. Create User A with phone `0412000000`
2. Create User B (new account)
3. In User B's phone verification:
   - Enter same phone as User A: `0412000000`
   - Click "Send Verification Code"
4. Verify:
   - ✅ Error message: "This phone number is already registered to another account"
   - ✅ NOT redirected to verification step
   - ✅ Still on phone input step

**Database Check:**
```sql
SELECT email, phone FROM users WHERE phone = '0412000000';
-- Should show User A only, not User B
```

---

### ✅ Test 6: Invalid Phone Format → Validation Error

**Steps:**
1. Go to phone verification (as logged in user)
2. Try invalid formats:
   - Enter: `1234567` (too short)
   - Click "Send Verification Code"
   - Verify: ✅ Error: "Please enter a valid Australian phone number"
   - Enter: `notaphone`
   - Verify: ✅ Same error
   - Enter: `+61412345678` (international format - not supported)
   - Verify: ✅ Same error

**Valid formats (should work):**
- `0412345678`
- `02 1234 5678`
- `04XX XXX XXX`

---

### ✅ Test 7: Expired Verification Code → Error Message

**Steps:**
1. Go to phone verification
2. Send code (dev code appears)
3. Wait 15+ minutes (or manipulate server time in testing)
4. Enter the code
5. Click "Verify Phone"
6. Verify:
   - ✅ Error: "Invalid or expired verification code"
   - ✅ NOT redirected to dashboard

**To Test Without Waiting:**
- Temporarily reduce expiration in `/api/auth/send-phone-code/route.ts`:
  ```typescript
  expires_at: new Date(Date.now() + 10 * 1000).toISOString() // 10 seconds
  ```
- Send code
- Wait 11 seconds
- Try to verify

---

### ✅ Test 8: Invalid Verification Code → Error Message

**Steps:**
1. Send verification code (dev code shows)
2. Intentionally enter WRONG code:
   - If dev code is `123456`, enter `654321`
3. Click "Verify Phone"
4. Verify:
   - ✅ Error: "Invalid or expired verification code"
   - ✅ NOT redirected to dashboard
   - ✅ Phone not marked as verified

**Edge Cases:**
- Empty code: "Verification code must be 6 digits"
- Only 3 digits entered: Submit button disabled
- Letters entered: Auto-filtered to digits only

---

### ✅ Test 9: Pro Signup Flow → Existing Customer → Routes to Phone Verification

**Steps:**
1. Create and log in existing customer: `customer1@example.com`
2. Go to `/auth/pro-signup-form`
3. Verify:
   - ✅ Already logged in message shows
   - ✅ Step 0 asks for phone/state/password only
   - ✅ Work address field HIDDEN
4. Fill form with:
   - Phone: `0487654321`
   - State: `New South Wales (NSW)`
   - Password: `NewProPass123!`
   - Accept terms
5. Click "Next"
6. Verify:
   - ✅ Email verification step SKIPPED
   - ✅ Phone verification step shown
   - ✅ Dev code displayed
   - ✅ Shows phone: `0487654321`
7. Enter code
8. Click "Verify Phone"
9. Verify:
   - ✅ Moves to work address verification step
   - ✅ Phone marked as verified in database

---

## Database Verification Commands

### Check User Phone Status
```sql
SELECT email, phone, phone_verified, phone_verified_at 
FROM users 
WHERE email = 'test@example.com';
```

### Check Verification Codes (for debugging)
```sql
SELECT email, phone, code, code_type, expires_at, created_at 
FROM verification_codes 
WHERE email = 'test@example.com' 
ORDER BY created_at DESC;
```

### Check for Duplicate Phones
```sql
SELECT phone, COUNT(*) as count, STRING_AGG(email, ', ') as users
FROM users 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1;
```

### Reset Test User Phone
```sql
UPDATE users 
SET phone = NULL, phone_verified = false, phone_verified_at = NULL
WHERE email = 'test@example.com';
```

---

## Troubleshooting

### Dev Code Not Showing
- ✅ Make sure `NODE_ENV === 'development'`
- ✅ Or add `?dev=true` to URL
- ✅ Check browser console for: `[SEND_PHONE_CODE] 🔧 DEV MODE: Test code = ...`

### Email Not Sent
- ✅ Check `.env.local` for `SENDGRID_API_KEY` or Gmail config
- ✅ Check database: should still store code
- ✅ Code should still be available in dev mode

### Phone Not Updating After Verification
- ✅ Check database `users` table
- ✅ Also check `customers` or `employees` table
- ✅ Verify correct user_id being updated

### Redirect Not Working After Verification
- ✅ Check console for errors
- ✅ Verify `phone_verified: true` was set
- ✅ Check login flow logic in `/app/auth/login/page.tsx`

---

## Decision Points: When Ready

### 1. Should I Add Unique Constraint on Phone Column?

**Recommendation: YES, add now**

**Reason:**
- Duplicate phone check is already in frontend
- Unique constraint provides database-level protection
- Prevents data corruption from concurrent requests
- Easy to add, no migration required

**Command:**
```sql
ALTER TABLE users 
ADD CONSTRAINT unique_phone UNIQUE (phone) 
WHERE phone IS NOT NULL;
```

**When to run:** After all 9 tests pass

---

### 2. Should I Add Phone Change/Update Endpoint?

**Recommendation: NOT YET, leave for Phase 2**

**Reason:**
- Current flow works for signup + verification
- Phone change is future feature (account settings)
- Test current flow first without extra complexity
- Add after phone verification is rock-solid

**Add in Phase 2:**
- `/api/auth/change-phone` endpoint
- Phone change form in account settings
- Re-verification of new phone required

---

## Running All Tests in Sequence

**Estimated Time:** 30-45 minutes

1. **Test 1** (5 min): New signup with phone
2. **Test 2** (5 min): New user login redirects to verification
3. **Test 3** (10 min): User without phone enters one
4. **Test 4** (5 min): User with phone auto-loads
5. **Test 5** (5 min): Duplicate phone error
6. **Test 6** (5 min): Invalid phone formats
7. **Test 7** (10 min): Expired code (wait or adjust time)
8. **Test 8** (5 min): Wrong code error
9. **Test 9** (10 min): Pro signup existing customer flow

---

## Success Criteria

✅ All 9 tests pass  
✅ No console errors (warnings OK)  
✅ Database records correct  
✅ Redirects work properly  
✅ Error messages clear and helpful  
✅ Dev mode displays codes reliably  

**Then:** Ready to commit + add unique constraint + move to Phase 2
