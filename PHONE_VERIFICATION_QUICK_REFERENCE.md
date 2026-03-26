# 🚀 Quick Reference: Phone Verification Testing

## 3-Step Quick Start

### 1️⃣ Start Dev Server
```bash
npm run dev
```

### 2️⃣ Open Phone Verification
```
http://localhost:3000/auth/phone-verification?email=test@example.com&dev=true
```

### 3️⃣ See Test Code in Yellow Box
The code automatically displays! Click "Click to auto-fill" to paste it.

---

## Dev Mode Features

| Feature | What It Does | Where to See |
|---------|-------------|-------------|
| **Yellow Box** | Shows 6-digit test code | Phone verification page |
| **Auto-fill Button** | Clicks to paste code | Under code display |
| **Console Logs** | `[SEND_PHONE_CODE] 🔧 DEV MODE: Test code = ...` | Browser dev tools |
| **No SMS** | Codes in UI instead | Can't send real SMS yet |

---

## The 9 Tests (Condensed)

| # | Test | Expected Result | Time |
|---|------|-----------------|------|
| 1 | New signup with phone | Phone stored in DB | 5m |
| 2 | Login redirects to verification | Goes to phone page, not dashboard | 5m |
| 3 | User without phone enters one | Phone saved + verified after code | 10m |
| 4 | User with phone auto-loads | Phone pre-filled, ready to verify | 5m |
| 5 | Duplicate phone rejected | Error: "already registered to another account" | 5m |
| 6 | Invalid phone format rejected | Error: "valid Australian phone number" | 5m |
| 7 | Expired code rejected | Error: "Invalid or expired" (after 15+ min) | 10m |
| 8 | Wrong code rejected | Error: "Invalid or expired" | 5m |
| 9 | Pro signup flow | Existing customer → phone verification | 10m |

---

## Database Checks

### ✅ Check If Phone Was Stored
```sql
SELECT email, phone, phone_verified FROM users 
WHERE email = 'your-test@example.com';
```

### ✅ Check If Phone Was Verified
```sql
SELECT email, phone, phone_verified, phone_verified_at FROM users 
WHERE email = 'your-test@example.com';
```

### ✅ Check Codes Were Stored
```sql
SELECT code, expires_at FROM verification_codes 
WHERE phone = '0412345678' 
ORDER BY created_at DESC LIMIT 5;
```

### ✅ Test Duplicate Protection
```sql
-- Should show 2+ rows with same phone
SELECT COUNT(*), phone FROM users 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1;
```

---

## Your Decisions

### ✅ Add Unique Constraint on Phone?
**YES** - After tests pass
```sql
ALTER TABLE users 
ADD CONSTRAINT unique_phone UNIQUE (phone) 
WHERE phone IS NOT NULL;
```

### ✅ Add Phone Change Endpoint?
**NOT YET** - Phase 2 (account settings)

### ✅ Integrate Real SMS?
**NOT YET** - Phase 3 (test with dev mode first)

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Code not showing | Check: `?dev=true` in URL or NODE_ENV=development |
| Login not redirecting | Check: phone_verified status in DB |
| Code expired | Wait 15 min or change expiry time in API |
| Duplicate phone error | Use different phone number for test |
| Invalid format error | Use Australian format: `0412345678` or `02 1234 5678` |

---

## Files to Reference

| File | Purpose |
|------|---------|
| `PHONE_VERIFICATION_TESTING_GUIDE.md` | **Read first** - detailed test steps |
| `PHONE_VERIFICATION_IMPLEMENTATION_DECISIONS.md` | Decision points & rationale |
| `app/auth/phone-verification/page.tsx` | Dev mode UI code |
| `app/api/auth/send-phone-code/route.ts` | Code generation & dev response |

---

## Full Test Flow (Copy-Paste Ready)

### Test 1: New Signup
```
1. Go to /auth/signup → Select Pro
2. Fill: test1@example.com, phone 0412111111
3. Create account
4. Check DB: phone should be '0412111111'
```

### Test 2: Login Redirects to Verification
```
1. Go to /auth/login
2. Enter test1@example.com credentials
3. After login, you should be at /auth/phone-verification
4. NOT at /dashboard (because phone_verified=false)
```

### Test 3: Missing Phone
```
1. New signup without phone field
2. Log in
3. Should see phone input step
4. Enter 0412222222
5. Click "Send Verification Code"
6. Yellow code box appears
7. Click "Click to auto-fill"
8. Click "Verify Phone"
9. Check DB: phone_verified=true
```

### Test 4: Existing Phone Auto-Loads
```
1. Use test1@example.com again (has phone 0412111111)
2. Log in
3. Phone should already be filled in
4. Should be on verification step (not input step)
5. Dev code shows
6. Click auto-fill → verify
7. Success! Redirected to dashboard
```

### Test 5: Duplicate Phone
```
1. New user: test2@example.com
2. In phone verification, enter: 0412111111 (same as test1)
3. Click "Send Verification Code"
4. ERROR: "This phone number is already registered to another account"
```

### Test 6: Invalid Format
```
1. Any user in phone verification
2. Try: "123" → error (too short)
3. Try: "notaphone" → error
4. Try: "0412345678" → works (valid)
```

### Test 7: Expired Code (Manual Wait)
```
1. Get code (shows in yellow)
2. WAIT 15+ minutes
3. Try to verify with old code
4. ERROR: "Invalid or expired verification code"

OR: Edit API to use 5-second expiry for testing
```

### Test 8: Wrong Code
```
1. Get code: 123456
2. Enter: 654321 (wrong)
3. Click verify
4. ERROR: "Invalid or expired verification code"
```

### Test 9: Pro Signup as Existing Customer
```
1. Login as existing customer (test1@example.com)
2. Go to /auth/pro-signup-form
3. Fill: phone, state, password
4. Submit
5. Should skip email verification
6. Should show phone verification
7. Dev code shows
8. Auto-fill and verify
9. Should progress to work address verification
```

---

## Success = All Checkmarks ✅

- ✅ All 9 tests pass
- ✅ No console errors (warnings OK)
- ✅ Database records correct
- ✅ Redirects work
- ✅ Errors clear & helpful
- ✅ Dev mode reliable
- ✅ Ready for unique constraint

**Then:** Add unique constraint + commit! 🎉

---

## Need Help?

1. **Can't find test code?** Check browser console for `[SEND_PHONE_CODE]`
2. **Code not appearing in yellow box?** Add `?dev=true` to URL
3. **Phone not saving?** Check database with provided SQL
4. **Wrong redirect?** Check `phone_verified` column in DB
5. **Still confused?** Read the full guide: `PHONE_VERIFICATION_TESTING_GUIDE.md`
