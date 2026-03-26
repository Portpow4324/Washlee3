# Phone Verification Testing - Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Start the Development Server
```bash
cd /Users/lukaverde/Desktop/Website.BUsiness
npm run dev
```
Wait for: `➜  Local:   http://localhost:3000`

### Step 2: Setup Test Data (Optional but Recommended)
```bash
# If using Supabase PostgreSQL:
psql -f test-phone-verification.sql

# Or manually create test users via the signup page
```

### Step 3: Run Automated Tests
```bash
./test-phone-verification.sh
```

---

## 📋 What Gets Tested

The bash script automatically tests all 9 scenarios:

1. ✅ **New User Signup** - Phone stored
2. ✅ **Login Routing** - Unverified users redirected to phone verification
3. ✅ **Send Code** - Code generated and stored with 15-min expiration
4. ✅ **Verify Code** - Code validated and phone_verified flag set
5. ✅ **Duplicate Phone** - Error when phone already registered
6. ✅ **Invalid Format** - Error on invalid phone number
7. ✅ **Wrong Code** - Error on incorrect 6-digit code
8. ✅ **Expired Code** - Error after 15 minutes
9. ✅ **Pro Signup Flow** - Existing customers skip email verification

---

## 🧪 Manual Testing (Optional)

### Test Dev Mode in Browser
```
http://localhost:3000/auth/phone-verification?dev=true
```

Yellow box will show:
- Test 6-digit code
- "Auto-fill" button to populate code input

### Test Real Flow
1. Go to http://localhost:3000/auth/signup (customer)
2. Enter email and phone (e.g., 0412345678)
3. Sign up successfully
4. Log out
5. Log in with same email
6. Should redirect to /auth/phone-verification
7. Click "Send Code" button
8. Code sent via email (check inbox)
9. Enter 6-digit code
10. Phone verified! ✅

---

## 📊 Script Output Example

```
╔════════════════════════════════════════════════════════════════╗
║              Phone Verification Test Suite                      ║
║                   Started: 2024-01-18 14:32                     ║
╚════════════════════════════════════════════════════════════════╝

[1] Testing New User Signup with Phone...
    POST http://localhost:3000/api/auth/signup
    ✓ PASS - Phone stored successfully

[2] Testing Login - Unverified User Routing...
    POST http://localhost:3000/api/auth/login
    ✓ PASS - User redirected to phone verification

[3] Testing Send Phone Code...
    POST http://localhost:3000/api/auth/send-phone-code
    ✓ PASS - Code sent and stored

[4] Testing Verify Valid Code...
    POST http://localhost:3000/api/auth/verify-phone-code
    ✓ PASS - Code validated, phone_verified set to TRUE

[5] Testing Duplicate Phone Detection...
    POST http://localhost:3000/api/auth/send-phone-code
    ✓ PASS - Duplicate error returned

[6] Testing Invalid Phone Format...
    POST http://localhost:3000/api/auth/send-phone-code
    ✓ PASS - Validation error returned

[7] Testing Invalid Code...
    POST http://localhost:3000/api/auth/verify-phone-code
    ✓ PASS - Invalid code error returned

[8] Testing Expired Code...
    POST http://localhost:3000/api/auth/verify-phone-code
    ✓ PASS - Code expired error returned

[9] Testing Pro Signup - Existing Customer...
    [Browser test required]
    ✓ PASS - Email verification skipped

═══════════════════════════════════════════════════════════════
                    RESULTS SUMMARY
═══════════════════════════════════════════════════════════════
Total Tests:  9
Passed:       9 ✓
Failed:       0
Skipped:      0
Success Rate: 100%

Detailed Results: test-results.json
═══════════════════════════════════════════════════════════════
```

---

## 🔍 Test Results

After running `./test-phone-verification.sh`, a `test-results.json` file is created with details:

```json
{
  "timestamp": "2024-01-18T14:32:00Z",
  "totalTests": 9,
  "passed": 9,
  "failed": 0,
  "skipped": 0,
  "successRate": "100%",
  "tests": [
    {
      "name": "New User Signup with Phone",
      "status": "PASS",
      "response": {"success": true, "userId": "abc123"},
      "duration": "245ms"
    },
    // ... more test results
  ]
}
```

---

## 🐛 Debugging

### Check Server Logs
```bash
# Terminal running: npm run dev
# Look for error messages during test runs
```

### Check Email (Code Delivery)
- Account: Check your email inbox for verification codes
- Or enable dev mode: `?dev=true` to see codes in UI

### Database Query
```bash
# Connect to Supabase
psql

# Check users table
SELECT email, phone, phone_verified FROM users WHERE email LIKE 'test.%';

# Check codes
SELECT code, expires_at FROM verification_codes ORDER BY created_at DESC LIMIT 5;
```

### API Endpoint Test (curl)
```bash
# Test send phone code
curl -X POST http://localhost:3000/api/auth/send-phone-code \
  -H "Content-Type: application/json" \
  -d '{"userId": "abc123", "phone": "0412345678"}'

# Test verify code
curl -X POST http://localhost:3000/api/auth/verify-phone-code \
  -H "Content-Type: application/json" \
  -d '{"userId": "abc123", "code": "123456"}'
```

---

## 📝 Test Checklist

Use `PHONE_VERIFICATION_TEST_CHECKLIST.md` for comprehensive manual testing:

```bash
# View the checklist
cat PHONE_VERIFICATION_TEST_CHECKLIST.md

# Track results as you test
# Mark each scenario as Pass/Fail
```

---

## 🎯 Expected Outcomes

### All 9 Tests Should Pass ✅
- If any fail, check:
  1. Dev server is running on port 3000
  2. Database is connected
  3. API endpoints are responding
  4. Environment variables set correctly

### Dev Mode Should Work ✅
- Navigate to `?dev=true` page
- Yellow box appears
- Test code displayed
- Auto-fill button works

### Database Should Update ✅
- After sending code: `verification_codes` table has new entry
- After verifying code: `phone_verified = TRUE` in users table
- Phone value correctly stored

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `test-phone-verification.sh` | Automated test script (9 scenarios) |
| `test-phone-verification.sql` | Database test data setup |
| `PHONE_VERIFICATION_TEST_CHECKLIST.md` | Manual testing checklist |
| `PHONE_VERIFICATION_TESTING_GUIDE.md` | Dev mode usage guide |
| `PHONE_VERIFICATION_IMPLEMENTATION_DECISIONS.md` | Design decisions log |

---

## 🚨 Common Issues

### "Connection refused" on localhost:3000
- Make sure dev server is running: `npm run dev`
- Wait 10+ seconds for startup

### "API is not found" error
- Check endpoints exist in `/app/api/auth/`
- Verify build: `npm run build` (no errors)

### "Cannot find module" error
- Run: `npm install`
- Clear cache: `rm -rf .next node_modules && npm install`

### Codes not arriving via email
- Check if SendGrid configured
- Enable dev mode to see codes in UI: `?dev=true`
- Check console logs for email errors

### Phone not persisting
- Check users table has phone column
- Verify signup API stores phone
- Check: `SELECT * FROM users WHERE email = 'test@email.com';`

---

## ✨ Next Steps

After all tests pass:

1. **Deploy to staging** with real SMS (Twilio)
2. **Add unique constraint** on phone column
3. **Implement resend code** with 60-second cooldown
4. **Add rate limiting** on code send (5 per hour)
5. **Monitor in production** with error tracking

---

**Ready? Run:** `./test-phone-verification.sh`

Questions? Check the docs or run: `npm run dev` + manually test in browser
