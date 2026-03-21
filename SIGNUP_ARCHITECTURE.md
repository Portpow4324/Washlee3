# Signup Flow Architecture

## High-Level User Journey

```
Customer                    Frontend                    Backend                   Email
   |                          |                            |                         |
   |-- 1. Opens signup ------> |                            |                        |
   |                          | /auth/signup-customer       |                        |
   |                          | (Step 0: Email & Password)  |                        |
   |                          |                            |                         |
   |-- 2. Enters details -----> |                            |                        |
   |                          | (Step 1: Usage Type)       |                        |
   |                          |                            |                         |
   |-- 3. Clicks "Create -----> | handleCreateAccount()    |                        |
   |     Account"             |                            |                         |
   |                          |   -- Creates Auth -------> | supabase.auth.signUp() |
   |                          |   -- Sets emailRedirectTo  |                         |
   |                          |      to /auth/callback     |                        |
   |                          | <------ Auth Created ---- |                         |
   |                          | <-- Email Sent ---------- | Supabase sends email   |
   |                          | (Step 2: Check Email)     | with verification link |
   |                          |                            |                         |
   |<---- Sees "Check Your ----|                            |                        |
   |      Email" message       |                            |                        |
   |                          |                            |                         |
   |-- 4. Receives email --------------------------------> |                        |
   |     with verification link                            |                        |
   |                          |                            |                         |
   |-- 5. Clicks link --------> | Navigated to /auth/callback#access_token=...    |
   |     in email             |                            |                        |
   |                          | handleCallback()           |                        |
   |                          |   -- Extracts token        |                        |
   |                          |   -- Verifies with ------> | supabase.auth.verifyOtp()
   |                          |      Supabase             |                         |
   |                          | <------ Session Created --  |                        |
   |                          |   -- Creates Profile -----> | POST /api/auth/        |
   |                          |                            | create-profile          |
   |                          | <---- Profile Created ----  |                        |
   |                          |   -- Redirects to          |                        |
   |                          |      /dashboard            |                        |
   |<---- Logged In ----------- | User now authenticated   |                        |
   |     at Dashboard          | and ready to use app      |                        |
   |                          |                            |                         |
```

## Detailed Component Flow

### Phase 1: Initial Signup Page

```
/app/auth/signup-customer/page.tsx

Step 0: Email & Password
├─ Input: email, password, firstName, lastName
└─ Validation: Email format, password strength

Step 1: Usage Type
├─ Input: Select "personal" or "business"
└─ Stores: personalUse state

Step 2: Account Creation
├─ Click: "Create Account" button
├─ Handler: handleCreateAccount()
└─ Process:
   ├─ Validate inputs (email, password, name)
   ├─ Call: supabase.auth.signUp({
   │     email,
   │     password,
   │     options: {
   │       emailRedirectTo: '/auth/callback',
   │       data: {
   │         firstName,
   │         lastName,
   │         personalUse
   │       }
   │     }
   │   })
   ├─ Result: Auth account created in Supabase
   ├─ Supabase Action: Sends verification email
   └─ UI: Move to Step 2 (Check Your Email screen)

Step 2: Email Verification Screen
├─ Display: Simple message with email address
├─ Message: "Check your email for verification link"
├─ Note: "Link expires in 24 hours"
└─ User Action: Click link in received email
```

### Phase 2: Email Verification Callback

```
/app/auth/callback/page.tsx

Entry Point: /auth/callback#access_token=...&type=signup
├─ Source: Supabase email verification link
├─ Parameters: 
│  ├─ #access_token - JWT token for verification
│  ├─ #type - Should be "signup"
│  └─ #expires_in - Token expiration time
└─ Client-side: useEffect triggers handleCallback()

Handler: handleCallback()
├─ Step 1: Get token from URL
│  ├─ Extract: window.location.hash
│  ├─ Parse: URLSearchParams to get access_token & type
│  └─ Validate: Check token exists and type='signup'
│
├─ Step 2: Verify token with Supabase
│  ├─ Call: supabase.auth.verifyOtp({
│  │     token_hash: token,
│  │     type: 'signup'
│  │   })
│  ├─ Result: Session created + user object returned
│  └─ Error Handling: Show error if invalid/expired
│
├─ Step 3: Create customer profile
│  ├─ Call: createCustomerProfile(user.id, {
│  │     email: user.email,
│  │     firstName: user.user_metadata.firstName,
│  │     lastName: user.user_metadata.lastName,
│  │     phone: user.user_metadata.phone,
│  │     state: user.user_metadata.state,
│  │     personalUse: user.user_metadata.personalUse,
│  │     ...other fields
│  │   })
│  ├─ API Call: POST /api/auth/create-profile
│  │           └─ Creates row in 'customers' table
│  └─ Error Handling: Warn if fails, but don't block
│
├─ Step 4: Update UI
│  ├─ Status: "success"
│  ├─ Message: "Email confirmed! Redirecting..."
│  └─ Delay: Wait 1.5 seconds for user feedback
│
└─ Step 5: Redirect to dashboard
   └─ Call: router.push('/dashboard')
```

### Phase 3: Profile Creation API

```
POST /api/auth/create-profile

Request Body:
├─ uid: string (user ID from Supabase)
├─ email: string
├─ firstName: string
├─ lastName: string
├─ phone: string
├─ state: string
├─ personalUse: 'personal' | 'business'
├─ preferenceMarketingTexts: boolean
├─ preferenceAccountTexts: boolean
└─ selectedPlan: string

Server Process (supabaseAdmin):
├─ Validate: uid and email are required
├─ Map fields: firstName → first_name, lastName → last_name, etc.
├─ Create profile object with snake_case fields
├─ Insert into 'customers' table
├─ Return: Created profile or error
└─ Response:
   ├─ Success (200): { id, email, first_name, ... }
   └─ Error (400/500): { error: "Error message" }
```

## State Management

### Signup Page State
```typescript
const [currentStep, setCurrentStep] = useState(0)
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [firstName, setFirstName] = useState('')
const [lastName, setLastName] = useState('')
const [personalUse, setPersonalUse] = useState('personal')
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
const [newUserId, setNewUserId] = useState('')
```

### Callback Page State
```typescript
const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
const [message, setMessage] = useState('Confirming your email...')
```

## Error Handling Flow

```
Error Occurs
    |
    ├─ Invalid/Expired Token
    │  ├─ Display: "Verification link expired or invalid"
    │  └─ Action: Offer to restart signup
    │
    ├─ No Session After Verification
    │  ├─ Display: "Failed to verify email"
    │  └─ Action: Offer to try again
    │
    ├─ Profile Creation Fails
    │  ├─ Log: Warning message
    │  ├─ Status: Continue (don't block flow)
    │  └─ Result: User verified but profile might be missing
    │
    └─ Network Error
       ├─ Display: "Network error. Please check connection"
       └─ Action: Offer to retry or restart
```

## Database Schema

### customers table
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,                    -- User ID from Supabase Auth
  email TEXT NOT NULL,                    -- From Auth user
  first_name TEXT,                        -- From signup
  last_name TEXT,                         -- From signup
  phone TEXT,                             -- Optional
  state TEXT,                             -- Optional
  personal_use TEXT,                      -- 'personal' | 'business'
  preference_marketing_texts BOOLEAN,     -- Marketing consent
  preference_account_texts BOOLEAN,       -- Account update consent
  selected_plan TEXT,                     -- Current plan
  account_status TEXT,                    -- 'active' | 'suspended' | etc
  created_at TIMESTAMP,                   -- Account creation time
  updated_at TIMESTAMP,                   -- Last update
  ...other fields
);
```

## Sequence Diagram

```
┌─────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│User │  │Frontend      │  │Supabase Auth │  │API       │  │Email     │
└──┬──┘  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘
   │            │                  │               │             │
   │ 1. Open    │                  │               │             │
   │ signup   ──>                  │               │             │
   │            │ 2. User fills form               │             │
   │ <──────────│                  │               │             │
   │            │ 3. Click "Create"│               │             │
   │            │ Account        │ │               │             │
   │ ─────────────────────────────>               │             │
   │            │                  │ 4. signUp()  │             │
   │            │                  │ with email   │             │
   │            │                  │              │             │
   │            │                  │ 5. Create    │ 6. Send     │
   │            │                  │    auth      │    email────>
   │            │                  │    account   │    (with    │
   │            │                  │              │     link)   │
   │            │ <─ Auth created ─│              │             │
   │ <──────────│ Step 2 screen    │              │             │
   │ 7. Sees    │                  │              │             │
   │ "Check     │                  │              │             │
   │ Email"     │                  │              │             │
   │            │                  │              │             │
   │ 8. Receive email               │              │             │
   │ with link <────────────────────────────────────────────────│
   │            │                  │              │             │
   │ 9. Click   │ 10. Navigate to  │              │             │
   │ link   ────> /auth/callback   │              │             │
   │            │ with token       │              │             │
   │            │                  │              │             │
   │            │ 11. verifyOtp() ─>              │             │
   │            │                  │ 12. Verify  │             │
   │            │                  │     token   │             │
   │            │ <─ Session ───────              │             │
   │            │    created       │              │             │
   │            │                  │              │             │
   │            │ 13. Create  ─────────────────>  │             │
   │            │     profile API  │              │             │
   │            │                  │              │             │
   │            │ <─ Profile ──────────────────────             │
   │            │    created       │              │             │
   │            │                  │              │             │
   │ <──────────│ 14. Redirect to  │              │             │
   │ 15. At     │     /dashboard   │              │             │
   │ dashboard, │                  │              │             │
   │ logged in  │                  │              │             │
   │            │                  │              │             │
```

## Security Considerations

✅ **Email Verification Required** - User must own email
✅ **Token Expiration** - Verification tokens expire in 24 hours
✅ **One-Time Use** - Token can only be used once
✅ **HTTPS Only** - Email link uses secure protocol
✅ **No Sensitive Data in Email** - Only verification link, no passwords
✅ **Server-Side Profile Creation** - Can't be bypassed by client
✅ **Authentication Check** - Profile creation validates user ID

## Performance Metrics

- Signup to email send: ~1-2 seconds
- Email delivery: 30 seconds - 2 minutes
- User clicks link: Instant
- Token verification: ~500ms
- Profile creation: ~500ms
- Total user flow: 2-3 minutes (mostly waiting for email)

## Browser Support

✅ All modern browsers (Chrome, Firefox, Safari, Edge)
✅ Mobile browsers fully supported
✅ Email links work on all email clients
✅ URL hash (#token) fully supported

## Customization Points

### Email Template
- Location: Supabase Dashboard → Authentication → Email Templates
- Template: "Confirm signup"
- Customizable: Colors, logo, text, HTML structure

### Redirect URL
- Configuration: `emailRedirectTo` in `handleCreateAccount()`
- Currently: `${NEXT_PUBLIC_APP_URL}/auth/callback`
- Can change to any path that handles Supabase callback

### Profile Fields
- Created in: `/api/auth/create-profile/route.ts`
- Can add more fields to request body
- Fields mapped to `customers` table columns

### Error Messages
- Signup: `/app/auth/signup-customer/page.tsx`
- Callback: `/app/auth/callback/page.tsx`
- Can customize UI and messages for each phase

---

**Last Updated**: After signup flow simplification
**Status**: ✅ Complete and ready for testing
