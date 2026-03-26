# Employee Signup Flow - Visual Architecture

## Complete End-to-End Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EMPLOYEE SIGNUP FLOW                                   │
│                    (Pro User Registration)                                  │
└─────────────────────────────────────────────────────────────────────────────┘


PHASE 1: ACCOUNT CREATION
═══════════════════════════

  Frontend                                Backend              Supabase
  ────────                                ───────              ────────
  
  Pro Signup Form                        
  (Step 0)                               
     │                                   
     │ email, password, phone,           
     │ firstName, lastName,              
     │ state, userType='pro'             
     │                                   
     ├──────────────────────────────────>│
                                         │
                                    /api/auth/signup
                                    (Admin API)
                                         │
                                         ├──────────────────────────────────>│
                                         │  admin.createUser()              │
                                         │  (Supabase Auth)                 │
                                         │<───────────────────────────────┬─┤
                                         │  user.id + email               │ │
                                         │  + email_confirmed: false      │ │
                                         │                                │ │
                                         │ INSERT users table             │ │
                                         │ INSERT customers table         │ │
                                         │ INSERT employees table         │ │
                                         │                                │ │
     │<─────────────────────────────────┤                                │ │
     │                                   │                                │ │
  { success: true,                       │                                │ │
    user.id: "...",                      │                                │ │
    requiresEmailVerification: true }    │                                │ │
     │                                   │                                │ │
     │ Store in state                    │                                │ │
     │ Continue to Step 1                │                                │ │
     │                                   │                                │ │
     └─────────────────────────────────────────────────────────────────────┘


PHASE 2: EMAIL VERIFICATION - SEND CODE
═════════════════════════════════════════

  Frontend                                Backend              Supabase/Email
  ────────                                ───────              ──────────────
  
  Pro Signup Form (Step 1)
  "Verify Your Email"
     │
     │ email, phone, firstName,
     │ type='email'
     │
     ├──────────────────────────────────>│
                                         │
                                    /api/verification/send-code
                                         │
                                         ├─ generateVerificationCode()
                                         │  Random: 753661
                                         │
                                         ├─ storeVerificationCode()
                                         │
                                         │  Key: email:phone
                                         │  "test@example.com:614412345678"
                                         │
                                         │  In-Memory Map:
                                         │  {
                                         │    code: "753661",
                                         │    expiresAt: now+900000ms,
                                         │    used: false
                                         │  }
                                         │
                                         │  ┌──────────────────────────────┐
                                         │  │ In-Memory Storage            │
                                         │  │ (serverVerification.ts)      │
                                         │  └──────────────────────────────┘
                                         │
                                         ├──────────────────────────────────>│
                                         │ Email via /api/email/send...   │
                                         │ To: test@example.com           │
                                         │ Subject: Verify Your Account   │
                                         │ Body: Code = 753661            │
                                         │<───────────────────────────────┤
                                         │ 200 OK (email sent)            │
                                         │
     │<─────────────────────────────────┤
     │
  { success: true,
    code: "753661" }  (dev mode only)
     │
     │ Show "Enter code from email"
     │ Start 15-minute countdown
     │


PHASE 3: EMAIL VERIFICATION - VERIFY CODE
═══════════════════════════════════════════

  Frontend                                Backend              Supabase
  ────────                                ───────              ────────
  
  Pro Signup Form (Step 1)
  User enters code: 753661
     │
     │ email, phone, code
     │
     ├──────────────────────────────────>│
                                         │
                                    /api/auth/verify-code
                                         │
                                         ├─ verifyCode(email, phone, code)
                                         │
                                         │ 1. Normalize email
                                         │    "test@example.com" → lowercase
                                         │
                                         │ 2. Normalize phone
                                         │    "0412345678" → "614412345678"
                                         │
                                         │ 3. Construct key
                                         │    "test@example.com:614412345678"
                                         │
                                         │ 4. Look up in-memory storage
                                         │    Found: { code, expiresAt, used }
                                         │
                                         │ 5. Validate not expired
                                         │    now < expiresAt ✓
                                         │
                                         │ 6. Validate not used
                                         │    used == false ✓
                                         │
                                         │ 7. Validate code matches
                                         │    "753661" == "753661" ✓
                                         │
                                         │ 8. Mark as used
                                         │    verificationCodes.set(key, {used:true})
                                         │
                                         ├─ Find user by email
                                         │  authUsers.find(u => u.email == email)
                                         │  Found: user_id
                                         │
                                         ├──────────────────────────────────>│
                                         │ admin.updateUserById(              │
                                         │   user_id,                         │
                                         │   { email_confirm: true }          │
                                         │ )                                  │
                                         │<────────────────────────────────┤
                                         │ Updated: email_confirmed=true   │
                                         │
     │<─────────────────────────────────┤
     │
  { success: true,
    email_confirmed: true,
    userId: "...",
    message: "Email verified successfully" }
     │
     │ Move to Step 2 (Phone Verification)
     │


PHASE 4: CONTINUE TO REMAINING STEPS
════════════════════════════════════════

  Frontend                                Backend
  ────────                                ───────
  
  Step 2-8 Continue...
  (Phone verification, ID verification, etc.)
     │
     │ User completes all steps
     │
     └──> Step 8: Success! Account created
          
          Summary:
          ✅ Account created in Supabase Auth
          ✅ Email verified
          ✅ User record in database
          ✅ Customer profile created
          ✅ Employee profile created
          ✅ Ready to login + access dashboards


═══════════════════════════════════════════════════════════════════════════════
```

## Data Flow - Database Perspective

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                                 │
└──────────────────────────────────────────────────────────────────────┘

1. AFTER SIGNUP (/api/auth/signup)
   ════════════════════════════════

   auth.users table:
   ┌─────────────────────────────────────────────────────┐
   │ id          │ email                   │ email_conf. │
   ├─────────────────────────────────────────────────────┤
   │ f01c8d1... │ test@example.com        │ false       │  ← FALSE at first
   └─────────────────────────────────────────────────────┘

   public.users table:
   ┌────────────────────────────────────────────────────────────┐
   │ id          │ email            │ userType │ phone        │ state│
   ├────────────────────────────────────────────────────────────┤
   │ f01c8d1... │ test@example.com │ pro      │ 0412345678   │ VIC  │
   └────────────────────────────────────────────────────────────┘

   public.customers table:
   ┌────────────────────────────────────────────────────────────┐
   │ id          │ user_id     │ email            │ name        │
   ├────────────────────────────────────────────────────────────┤
   │ cust-id... │ f01c8d1... │ test@example.com │ Test User   │
   └────────────────────────────────────────────────────────────┘

   public.employees table:
   ┌─────────────────────────────────────────────────────────────────┐
   │ id         │ user_id    │ employee_id │ email            │ name │
   ├─────────────────────────────────────────────────────────────────┤
   │ emp-id... │ f01c8d1... │ EMP-xxxxx   │ test@example.com │ ...  │
   └─────────────────────────────────────────────────────────────────┘


2. AFTER EMAIL VERIFICATION (/api/auth/verify-code)
   ═════════════════════════════════════════════════

   auth.users table:
   ┌─────────────────────────────────────────────────────┐
   │ id          │ email                   │ email_conf. │
   ├─────────────────────────────────────────────────────┤
   │ f01c8d1... │ test@example.com        │ TRUE        │  ← UPDATED!
   └─────────────────────────────────────────────────────┘


3. VERIFICATION CODES (Not in Database)
   ═══════════════════════════════════════

   In-Memory Storage (serverVerification.ts):
   ┌────────────────────────────────────────────────────────┐
   │ Key: test@example.com:614412345678                     │
   │ Value: {                                               │
   │   code: "753661",                                      │
   │   expiresAt: 1711123456000,    // now + 15 minutes     │
   │   used: true                   // marked after verify  │
   │ }                                                      │
   └────────────────────────────────────────────────────────┘

   Memory persists while server running
   Lost on server restart
```

## Key Data Normalization

```
PHONE NORMALIZATION
═══════════════════

Input: "0412345678" (Australian format)
         │
         ├─ Step 1: Extract digits only
         │  "0412345678"
         │
         ├─ Step 2: Check if Australian format (starts with 0, 10 digits)
         │  Yes: "0412345678"
         │
         ├─ Step 3: Convert to E.164 format (add country code)
         │  "0412345678" → "614412345678" (61 + 412345678)
         │
         └─ Output: "614412345678"

LOOKUP KEY GENERATION
═════════════════════

Email: "TestEmployee@Example.com"
Phone: "0412345678"
         │
         ├─ Normalize email: "testemployee@example.com"
         ├─ Normalize phone: "614412345678"
         │
         └─ Key: "testemployee@example.com:614412345678"


CODE VALIDATION SEQUENCE
═════════════════════════

Input Code: "753661"
         │
         ├─ Look up: Map.get("testemployee@example.com:614412345678")
         │
         ├─ Check 1: Code exists?
         │           YES → Continue
         │           NO → FAIL "Code not found"
         │
         ├─ Check 2: Code expired?
         │           (expiresAt < now)
         │           NO → Continue
         │           YES → FAIL "Code expired"
         │
         ├─ Check 3: Already used?
         │           (used == false)
         │           YES → Continue
         │           NO → FAIL "Code already used"
         │
         ├─ Check 4: Code matches?
         │           ("753661" == "753661")
         │           YES → Continue
         │           NO → FAIL "Code doesn't match"
         │
         └─ SUCCESS: Mark used=true, Update Supabase Auth
```

## API Interaction Timeline

```
Timeline (all times approximate)

00:00 User starts signup form
00:05 User clicks "Verify Email"
      │
      ├─ POST /api/auth/signup
      │  Response: user.id, requiresEmailVerification: true
      │  ├─ Create Supabase Auth user
      │  ├─ Insert users table row
      │  ├─ Insert customers table row
      │  └─ Insert employees table row (pro only)
      │  Duration: ~200ms
      │
00:06 │
      ├─ POST /api/verification/send-code
      │  Response: { success: true, code: "753661" }
      │  ├─ Generate random code
      │  ├─ Store in memory
      │  ├─ Send email via SendGrid
      │  └─ Return response
      │  Duration: ~100ms
      │
      └─ Email arrives: "Your code: 753661"

00:10 User receives email with code
00:12 User enters code: 753661
      │
      ├─ POST /api/auth/verify-code
      │  Request: email, phone, code
      │  Response: { success: true, email_confirmed: true, userId: "..." }
      │  ├─ Lookup code in memory
      │  ├─ Validate all checks
      │  ├─ Mark code used
      │  ├─ Update Supabase Auth
      │  └─ Return success
      │  Duration: ~50ms
      │
00:13 Move to Step 2
      │
      └─ ... (remaining steps) ...

TOTAL TIME: ~13 minutes (mostly waiting for user input)
PROCESSING TIME: ~350ms


═══════════════════════════════════════════════════════════════════════════════
```

## Error Handling Flow

```
COMMON ERRORS & RECOVERY
═════════════════════════

┌─ "Invalid or expired verification code"
│  └─ Cause 1: Code not found in memory
│     Action: Request new code
│
│  └─ Cause 2: 15 minutes passed
│     Action: Request new code
│
│  └─ Cause 3: Code already used
│     Action: Request new code
│
│  └─ Cause 4: Phone not passed to verify endpoint
│     Action: Ensure phone in request body
│
└─ "Email and code are required"
   └─ Cause: Missing field in request
      Action: Pass email and code in JSON body


RETRY LOGIC (Recommended Frontend)
═══════════════════════════════════

User enters code: "753661"
  │
  ├─ POST /api/auth/verify-code
  │
  ├─ Success? → Continue to next step
  │
  └─ Error? 
     ├─ Retry immediately? → YES (fast)
     ├─ Show error: "Code invalid or expired"
     ├─ Show options:
     │  ├─ "Didn't receive it? Request another code"
     │  └─ "Check your email again"
     │
     └─ Request new code?
        └─ POST /api/verification/send-code
           (Generate new code, old code marked used in memory)
```

---

**Visual Guide Complete** ✅

This flow diagram shows:
- ✅ All API calls and parameters
- ✅ Database operations
- ✅ Data normalization
- ✅ Validation sequence
- ✅ Error handling
- ✅ Timeline and performance
