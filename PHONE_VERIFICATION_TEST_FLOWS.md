# Phone Verification Testing Flow

## Automated Test Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│  START: ./test-phone-verification.sh                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  [PRE] Verify dev server is running on :3000              │
│        - Check $API_URL = http://localhost:3000           │
│        - Timeout if server unavailable                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  [1] Test New User Signup with Phone                       │
│      ├─ POST /api/auth/signup                              │
│      ├─ Payload: email, password, phone                    │
│      ├─ Expected: { success: true, userId }               │
│      └─ Verify: phone stored in users table               │
└─────────────────────────────────────────────────────────────┘
                    PASS ✓ │          │ FAIL ✗
                           │          │
                    [result OK]  [log failure]
                           │          │
                           ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│  [2] Test Login - Unverified User Routing                  │
│      ├─ POST /api/auth/login                               │
│      ├─ Payload: email, password (phone_verified=false)   │
│      ├─ Expected: Redirect to /auth/phone-verification    │
│      └─ Verify: Location header present                    │
└─────────────────────────────────────────────────────────────┘
                    PASS ✓ │          │ FAIL ✗
                           │          │
                    [result OK]  [log failure]
                           │          │
                           ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│  [3] Test Send Phone Code                                  │
│      ├─ POST /api/auth/send-phone-code                     │
│      ├─ Payload: userId, phone: "0412345678"              │
│      ├─ Expected: { success: true, testCode }             │
│      └─ Verify: Code stored in verification_codes table   │
└─────────────────────────────────────────────────────────────┘
                    PASS ✓ │          │ FAIL ✗
                           │          │
                    [result OK]  [log failure]
                           │          │ ← SAVE testCode
                           ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│  [4] Test Verify Valid Code                                │
│      ├─ POST /api/auth/verify-phone-code                   │
│      ├─ Payload: userId, code: testCode from [3]          │
│      ├─ Expected: { success: true }                        │
│      └─ Verify: phone_verified = TRUE in users table      │
└─────────────────────────────────────────────────────────────┘
                    PASS ✓ │          │ FAIL ✗
                           │          │
                    [result OK]  [log failure]
                           │          │
                           ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│  [5] Test Duplicate Phone Detection                        │
│      ├─ POST /api/auth/send-phone-code                     │
│      ├─ Payload: userId2, phone: "0412345678" (used)      │
│      ├─ Expected: { error: "Phone already registered" }   │
│      └─ Verify: 409 Conflict status code                  │
└─────────────────────────────────────────────────────────────┘
                    PASS ✓ │          │ FAIL ✗
                           │          │
                    [result OK]  [log failure]
                           │          │
                           ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│  [6] Test Invalid Phone Format                             │
│      ├─ POST /api/auth/send-phone-code                     │
│      ├─ Payload: userId, phone: "INVALID123"              │
│      ├─ Expected: { error: "Invalid phone format" }       │
│      └─ Verify: 400 Bad Request status code               │
└─────────────────────────────────────────────────────────────┘
                    PASS ✓ │          │ FAIL ✗
                           │          │
                    [result OK]  [log failure]
                           │          │
                           ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│  [7] Test Invalid Code (Wrong Digits)                      │
│      ├─ POST /api/auth/verify-phone-code                   │
│      ├─ Payload: userId, code: "000000" (incorrect)       │
│      ├─ Expected: { error: "Invalid code" }               │
│      └─ Verify: 400 Bad Request status code               │
└─────────────────────────────────────────────────────────────┘
                    PASS ✓ │          │ FAIL ✗
                           │          │
                    [result OK]  [log failure]
                           │          │
                           ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│  [8] Test Expired Code (>15 minutes)                       │
│      ├─ POST /api/auth/verify-phone-code                   │
│      ├─ Payload: userId, code: "oldcode" (expired)        │
│      ├─ Expected: { error: "Code expired" }               │
│      └─ Verify: 400 Bad Request status code               │
└─────────────────────────────────────────────────────────────┘
                    PASS ✓ │          │ FAIL ✗
                           │          │
                    [result OK]  [log failure]
                           │          │
                           ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│  [9] Test Pro Signup - Existing Customer Flow              │
│      ├─ Navigate to pro signup page (logged in)            │
│      ├─ Expected: Skip email verification step             │
│      ├─ Expected: Show work address step                   │
│      └─ Verify: Step progression = Step 0 → Step 2       │
└─────────────────────────────────────────────────────────────┘
                    PASS ✓ │          │ FAIL ✗
                           │          │
                    [result OK]  [log failure]
                           │          │
                           ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│  GENERATE RESULTS                                          │
│  ├─ Count: PASS ✓ vs FAIL ✗                               │
│  ├─ Calculate: success rate %                              │
│  ├─ Generate: test-results.json                           │
│  └─ Display: Summary in terminal                           │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
          ┌──────────────────┐  ┌──────────────────┐
          │ All Tests Pass ✓ │  │ Some Tests Fail ✗│
          │  Success Rate:  │  │  See test-results│
          │      100%       │  │    .json file    │
          │   Ready for     │  │  Debug & retry   │
          │  production!    │  │                  │
          └──────────────────┘  └──────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌──────────────────────────┐
                    │ END: Test Suite Complete │
                    │ Check exit code:         │
                    │   0 = Success            │
                    │   1 = Failures detected  │
                    └──────────────────────────┘
```

---

## Manual Browser Testing Flow

```
┌──────────────────────────────────────────────────────────────┐
│ Manual Test Scenario: Complete Phone Verification Flow      │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ npm run dev       │
                    │ Wait for startup  │
                    └───────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  New Customer Signup                │
        │  URL: /auth/signup                  │
        └─────────────────────────────────────┘
                              │
        ┌─────────────────────┴────────────────┐
        │                                      │
        ▼                                      ▼
    ┌────────┐                          ┌────────┐
    │Customer│                          │Pro User│
    └────────┘                          └────────┘
        │                                      │
        ▼                                      ▼
    Fill form:                          Fill form:
    - Email                             - Email
    - Password                          - Password
    - Phone ←── KEY FIELD               - Phone ←── KEY FIELD
                                        - Work Address
    ▼                                      ▼
    ┌─────────────────────┐              ┌──────────────────┐
    │ Successfully signed │              │ Successfully     │
    │ up as customer      │              │ signed up as pro │
    │ phone saved in DB   │              │ phone saved      │
    └─────────────────────┘              └──────────────────┘
              │                                    │
              ▼                                    ▼
    ┌─────────────────────┐              ┌──────────────────┐
    │ Log out             │              │ Log in required  │
    └─────────────────────┘              │ Already logged?  │
              │                          │ Skip this step   │
              ▼                          └──────────────────┘
    ┌─────────────────────┐                      │
    │ Log in with email   │                      ▼
    │ password            │              ┌──────────────────┐
    └─────────────────────┘              │ System detects   │
              │                          │ phone_verified   │
              ▼                          │ = FALSE          │
    ┌─────────────────────┐              └──────────────────┘
    │ System checks       │                      │
    │ phone_verified flag │                      │
    │ = FALSE!            │                      │
    └─────────────────────┘                      │
              │                                  │
              └──────────────┬───────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ REDIRECT TO:                 │
              │ /auth/phone-verification     │
              └──────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Phone Verification Page      │
              │ [STEP 1: Enter Phone]        │
              │ ┌────────────────────────┐   │
              │ │ Phone: [auto-loaded]   │   │
              │ │ or [0412345678]        │   │
              │ └────────────────────────┘   │
              │ [Send Code]                  │
              └──────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Code sent via email!         │
              │ Check inbox for:             │
              │ "Your Washlee code: 123456" │
              └──────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
               [Dev Mode?]         [Production]
                    │                 │
                    ▼                 ▼
            ┌─────────────┐    ┌──────────────┐
            │ Yellow box: │    │ Check email  │
            │ "Test Code: │    │ inbox        │
            │ 123456"     │    └──────────────┘
            │ [Auto-fill] │           │
            └─────────────┘           ▼
                    │         ┌──────────────┐
                    └────┬────┤ Copy code    │
                         │    │ From email   │
                         ▼    └──────────────┘
              ┌──────────────────────────────┐
              │ Phone Verification Page      │
              │ [STEP 2: Enter Code]         │
              │ ┌────────────────────────┐   │
              │ │ Code: [123456]         │   │
              │ └────────────────────────┘   │
              │ [Verify Code]                │
              └──────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ System validates:            │
              │ ✓ Code is correct           │
              │ ✓ Not expired (< 15 min)    │
              │ ✓ Matches user              │
              └──────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Database updates:            │
              │ ✓ phone_verified = TRUE      │
              │ ✓ Code marked as used       │
              │ ✓ Expiration cleaned up     │
              └──────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ SUCCESS! ✓                   │
              │ Redirected to dashboard      │
              │ Phone verified!              │
              └──────────────────────────────┘
```

---

## Test Data Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ DATABASE TEST DATA FLOW                                 │
└─────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────────────┐
│ SETUP: Create test users    │
│ - test.new@washlee.com.au   │
│ - test.nophone@...          │
│ - test.verified@...         │
│ - test.unverified@...       │
└─────────────────────────────┘
  │
  ▼
┌─────────────────────────────┐
│ Test 1-3: Signup & Login    │
│ users.phone updated: ✓      │
└─────────────────────────────┘
  │
  ▼
┌─────────────────────────────┐
│ Test 3-4: Send Code         │
│ verification_codes: ✓       │
│ Stores: code + expires_at   │
└─────────────────────────────┘
  │
  ▼
┌─────────────────────────────┐
│ Test 4: Verify Code         │
│ users.phone_verified ← TRUE │
│ verification_codes: cleaned │
└─────────────────────────────┘
  │
  ▼
┌─────────────────────────────┐
│ Test 5-8: Edge cases        │
│ Error scenarios tested      │
│ No DB changes for failures  │
└─────────────────────────────┘
  │
  ▼
┌─────────────────────────────┐
│ CLEANUP: Delete test data   │
│ DELETE FROM users WHERE...  │
│ DELETE FROM codes WHERE...  │
└─────────────────────────────┘
  │
  ▼
 END
```

---

## Dev Mode Activation Flow

```
User navigates to:
  /auth/phone-verification?dev=true
        │
        ▼
Component mounts:
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dev = params.get('dev') === 'true'
    setDevMode(dev)
  })
        │
        ▼
User clicks "Send Code":
  POST /api/auth/send-phone-code
  ├─ Backend generates code: "123456"
  ├─ Stores in DB with 15-min expiry
  ├─ Sends email (if not dev mode)
  └─ Returns: { code: "123456", testCode: "123456" }
        │
        ▼
Frontend receives response:
  if (devMode) {
    setTestCode(response.testCode)
    Display yellow box with code ✓
    Show "Auto-fill" button ✓
    Log to console ✓
  }
        │
        ▼
User sees yellow box:
  ┌─────────────────────────┐
  │ 🟡 Test Mode Active     │
  │ Code: 123456            │
  │ [Auto-fill button]      │
  └─────────────────────────┘
        │
        ▼
User clicks "Auto-fill":
  Code input pre-populated: "123456"
  User can now click "Verify"
        │
        ▼
Verification succeeds (same flow as production)
```

---

## Error Handling Tree

```
                    ┌─────────────────────┐
                    │ User Action         │
                    └─────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
            [Send Code]  [Verify Code]  [Other]
                 │            │            │
        ┌────────┴────────┐   │            │
        │                 │   │            │
        ▼                 ▼   ▼            │
    ┌─────────────┐  ┌──────────────────┐  │
    │ Invalid     │  │ Code Invalid     │  │
    │ Phone       │  │ (wrong digits)   │  │
    │ Format?     │  │                  │  │
    └─────────────┘  └──────────────────┘  │
        │ YES             │ YES             │
        │                 │                 │
        ▼                 ▼                 ▼
    ┌─────────────┐  ┌──────────────────┐  │
    │ 400 Error   │  │ 400 Error        │  │
    │ "Invalid"   │  │ "Invalid code"   │  │
    │ "Australian │  └──────────────────┘  │
    │ format"     │
    └─────────────┘
        │
        ▼
    ┌─────────────┐
    │ Duplicate   │
    │ Phone?      │
    └─────────────┘
        │ YES
        │
        ▼
    ┌─────────────┐
    │ 409 Error   │
    │ "Already"   │
    │ "registered"│
    └─────────────┘

                    ┌──────────────────┐
                    │ Code Expired?    │
                    │ (>15 min ago)    │
                    └──────────────────┘
                        │ YES
                        │
                        ▼
                    ┌──────────────────┐
                    │ 400 Error        │
                    │ "Code expired"   │
                    │ Suggest: "Resend"│
                    └──────────────────┘

All errors:
  - Clear user-facing messages
  - Logged to server console
  - Saved to error tracking
  - No sensitive data exposed
```

---

## Timeline: Full Test Execution

```
Start: ./test-phone-verification.sh
│
├─ 0-1s:   Server connectivity check
├─ 1-2s:   Test 1 (signup)
├─ 2-3s:   Test 2 (login routing)
├─ 3-4s:   Test 3 (send code)
├─ 4-5s:   Test 4 (verify code)
├─ 5-6s:   Test 5 (duplicate)
├─ 6-7s:   Test 6 (invalid format)
├─ 7-8s:   Test 7 (wrong code)
├─ 8-9s:   Test 8 (expired code)
├─ 9-10s:  Test 9 (pro signup)
├─ 10-11s: Results aggregation
└─ 11s:    Display summary + save JSON

Expected total: ~11 seconds
Color-coded output in terminal
JSON file: test-results.json
```

---

## Success Criteria

```
✅ ALL PASS CONDITIONS:

[1] Test Suite Execution
    ✓ Script runs without errors
    ✓ Connects to dev server
    ✓ Completes all 9 tests
    ✓ Generates test-results.json

[2] Individual Test Results
    ✓ Test 1: PASS (Phone stored)
    ✓ Test 2: PASS (Routing works)
    ✓ Test 3: PASS (Code sent)
    ✓ Test 4: PASS (Code verified)
    ✓ Test 5: PASS (Duplicate error)
    ✓ Test 6: PASS (Format error)
    ✓ Test 7: PASS (Invalid code)
    ✓ Test 8: PASS (Expired code)
    ✓ Test 9: PASS (Pro flow)

[3] Database State
    ✓ Users table: phone populated
    ✓ Users table: phone_verified = TRUE
    ✓ Verification codes: stored + cleaned
    ✓ No orphaned records

[4] Dev Mode
    ✓ Yellow box displays
    ✓ Test code shown
    ✓ Auto-fill button works
    ✓ Console logs visible

[5] Error Handling
    ✓ Invalid input → Clear error
    ✓ Expired code → Friendly message
    ✓ Network error → Graceful fail
    ✓ No crashes or hangs

Result: 9/9 = 100% Success Rate ✓
```
