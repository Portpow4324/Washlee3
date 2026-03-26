# Phone Verification Testing Checklist

## Pre-Test Setup
- [ ] Make sure dev server is running: `npm run dev`
- [ ] Server should be available at http://localhost:3000
- [ ] Check database is connected
- [ ] Run SQL setup script to create test users: `psql -f test-phone-verification.sql`
- [ ] Verify test users exist in database

## Automated Testing (Bash Script)
```bash
./test-phone-verification.sh
```

### Test Scenarios in Script

#### Scenario 1: New User Signup with Phone
- **Purpose**: Verify phone is stored during customer signup
- **Expected**: Phone saved to users table
- **Command**: POST /api/auth/signup
- **Status**: [ ] Pass / [ ] Fail

#### Scenario 2: New User Login - Not Phone Verified
- **Purpose**: Verify routing to phone verification after login
- **Expected**: Redirects to /auth/phone-verification
- **Command**: POST /api/auth/login
- **Status**: [ ] Pass / [ ] Fail

#### Scenario 3: Returning User - Send Code
- **Purpose**: Verify code generation and email sending
- **Expected**: Code sent, stored in verification_codes table
- **Command**: POST /api/auth/send-phone-code
- **Status**: [ ] Pass / [ ] Fail

#### Scenario 4: Verify Valid Code
- **Purpose**: Verify code validation and phone_verified flag update
- **Expected**: phone_verified set to TRUE
- **Command**: POST /api/auth/verify-phone-code
- **Status**: [ ] Pass / [ ] Fail

#### Scenario 5: Duplicate Phone Detection
- **Purpose**: Verify duplicate phone check works
- **Expected**: 409 Conflict error
- **Command**: POST /api/auth/send-phone-code (same phone twice)
- **Status**: [ ] Pass / [ ] Fail

#### Scenario 6: Invalid Phone Format
- **Purpose**: Verify phone validation
- **Expected**: 400 Bad Request error
- **Command**: POST /api/auth/send-phone-code (invalid format)
- **Status**: [ ] Pass / [ ] Fail

#### Scenario 7: Invalid Code
- **Purpose**: Verify code validation
- **Expected**: 400 Bad Request error
- **Command**: POST /api/auth/verify-phone-code (wrong code)
- **Status**: [ ] Pass / [ ] Fail

#### Scenario 8: Expired Code
- **Purpose**: Verify code expiration check
- **Expected**: 400 Bad Request error (code expired)
- **Command**: POST /api/auth/verify-phone-code (15+ min old)
- **Status**: [ ] Pass / [ ] Fail

#### Scenario 9: Pro Signup - Existing Customer Flow
- **Purpose**: Verify existing customers skip email verification
- **Expected**: Redirects to work address, not email verification
- **Command**: Test pro-signup-form page flow
- **Status**: [ ] Pass / [ ] Fail

---

## Manual Testing Checklist

### Dev Mode UI Testing
- [ ] Navigate to http://localhost:3000/auth/phone-verification?dev=true
- [ ] Verify yellow test code box appears
- [ ] Verify test code is displayed in box
- [ ] Click "Auto-fill" button - code should populate in input field
- [ ] Check browser console for test code logs

### Phone Input Validation
- [ ] Enter valid Australian format: `0412345678` → Should accept
- [ ] Enter invalid format: `INVALID123` → Should show error
- [ ] Enter incomplete: `041234` → Should show error
- [ ] Enter with spaces: `0412 345 678` → Test if accepted/stripped
- [ ] Leave blank and submit → Should show error

### Code Entry Testing
- [ ] Valid code (from yellow box) → Should verify
- [ ] Invalid code: `000000` → Should show error
- [ ] Partially filled code: `123` → Should show error
- [ ] Wait 15 minutes → Code should expire

### Database State Verification
```sql
-- Check user phone was stored
SELECT email, phone, phone_verified FROM users WHERE email = 'test.new@washlee.com.au';

-- Check code was created with 15-min expiry
SELECT code, expires_at, EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_remaining 
FROM verification_codes ORDER BY created_at DESC LIMIT 1;

-- Check phone_verified flag was updated
SELECT email, phone, phone_verified FROM users WHERE phone = '0412345678';
```

### Edge Cases
- [ ] User with NULL phone arrives at phone-verification page
- [ ] User with existing unverified phone - does it auto-load?
- [ ] User tries to verify with different phone number
- [ ] Multiple users attempt same phone number
- [ ] Code sent, user closes browser, comes back later

### Error Scenarios
- [ ] Network error during code send - show error message
- [ ] Network error during code verify - show error message
- [ ] Timeout during API calls - show error message
- [ ] Database connection error - graceful failure

---

## Performance Testing

- [ ] Code send response time < 2 seconds
- [ ] Code verify response time < 1 second
- [ ] UI remains responsive during API calls
- [ ] Loading states display correctly
- [ ] No console errors or warnings

---

## Security Testing

- [ ] Codes not exposed in network traffic (HTTPS in production)
- [ ] Codes not logged to browser console in production
- [ ] Cannot brute force codes (5+ wrong attempts)
- [ ] Cannot reuse expired codes
- [ ] Cannot verify code for different user
- [ ] Email fallback works but SMS ready for Twilio

---

## Integration Testing

### Login Flow
- [ ] Unverified user logs in → Redirected to phone-verification
- [ ] Verified user logs in → Goes to dashboard directly
- [ ] User enters phone → Sent to dashboard

### Signup Flow
- [ ] New customer signs up → Phone stored in users table
- [ ] Email verification skipped for existing customers
- [ ] Work address step shows for existing customers
- [ ] New pro should go to phone verification after signup

### Dashboard Access
- [ ] Unverified user cannot access /dashboard/customer
- [ ] Verified user can access /dashboard/customer
- [ ] Protection working for /dashboard/pro

---

## Browser Compatibility

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Chrome (iOS)
- [ ] Mobile Safari (iOS)

---

## Results Summary

**Date Tested**: _______________

**Total Tests**: 9 automated + X manual
**Passed**: _____ / _____
**Failed**: _____ / _____
**Skipped**: _____ / _____

**Critical Issues**: 
- [ ] None
- [ ] See notes below

**Minor Issues**:
- [ ] None
- [ ] See notes below

**Notes**:
```
[Add any findings, blockers, or unexpected behavior here]
```

**Next Steps**:
1. [ ] Deploy to staging
2. [ ] Add SMS integration (Twilio)
3. [ ] Add unique constraint on phone column
4. [ ] Add resend code endpoint
5. [ ] Add rate limiting

---

## Test Data Cleanup

After testing, run cleanup SQL:
```sql
DELETE FROM verification_codes WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'test.%@washlee.com.au'
);

UPDATE users 
SET phone = NULL, phone_verified = FALSE 
WHERE email IN (
  'test.new@washlee.com.au',
  'test.nophone@washlee.com.au',
  'test.unverified@washlee.com.au'
);
```

Or run the SQL file:
```bash
psql -f test-phone-verification.sql
```
