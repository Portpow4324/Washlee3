# Washlee Authentication System - Complete Guide

## Overview
The Washlee authentication system supports three types of users:
1. **Customers** - Use laundry service
2. **Employees/Pros** - Provide laundry service
3. **Admins** - Manage the platform

---

## Frontend Pages (UI/Forms)

### 1. CUSTOMER SIGNUP
**Path:** `/app/auth/signup-customer/page.tsx`
- 8-step signup process
- Steps: Details → Email Verification → Phone → ID Verification → Availability → Preferences → Review → Confirmation
- Collects: First/Last name, email, phone, state, password, personal use preference
- Features: Password validation rules, Australian phone/state validation
- Modal: WashClub signup enrollment option

**Key Functions:**
```typescript
- handleSignup() - Creates account with Supabase
- handleEmailVerification() - Sends verification code via SendGrid
- handlePhoneVerification() - Verifies phone via SMS
- handleSubmit() - Completes signup flow
```

---

### 2. CUSTOMER LOGIN
**Path:** `/app/auth/login/page.tsx`
- Simple email/password login with optional Google OAuth
- Password reset functionality
- Email confirmation check
- Redirect parameter support (?redirect=/path)

**Key Features:**
```typescript
- handleSubmit() - Email/password login
- handleGoogleSignIn() - OAuth login
- handlePasswordReset() - Forgot password flow
- Email verification check before allowing login
```

---

### 3. SIGNUP CHOICE (Customer vs Pro)
**Path:** `/app/auth/signup/page.tsx`
- Landing page to choose between customer signup or pro application
- Redirects to respective signup flows
- Auto-redirects logged-in users to home

---

### 4. EMPLOYEE/PRO SIGNUP
**Path:** `/app/auth/signup-customer/page.tsx` (same form as customers)
- **IMPORTANT:** Employee signup uses the SAME form as customer signup
- The difference is the `userType: 'pro'` parameter sent to `/api/auth/signup`
- Employees get:
  - Access to employee dashboard at `/employee/dashboard`
  - Employee privileges (view jobs, earnings, ratings)
  - Auto-filled addresses from admin setup
  - Different login page (employee ID required)

**Same as Customer Signup:**
```typescript
- Email verification via SendGrid (6-digit code)
- Uses Supabase admin API to bypass confirmation email
- Saves account to users + employees table
- 8-step onboarding process
```

**Key Difference in Backend:**
- When `userType: 'pro'` is sent, creates record in `employees` table instead of `customers`
- Employee addresses auto-filled from admin setup
- Employee ID created for login
- Receives employee dashboard access instead of customer dashboard

---

### 5. EMPLOYEE LOGIN
**Path:** `/app/auth/employee-signin/page.tsx`
- Employee login with Employee ID + Email + Password
- Accepts multiple Employee ID formats:
  - 6-digit: `123456`
  - Standard: `EMP-1773230849589-1ZE64`
  - Payslip: `PS-20240304-X9K2L`
- **Remember Me option** - 7-day persistent login (localStorage)
- Session-only option (cleared on tab close)
- Routes to `/employee/dashboard` instead of customer `/dashboard`

**Key Features:**
```typescript
- Multiple Employee ID format support
- Remember me functionality (localStorage 7 days)
- Session-only login (sessionStorage)
- Email validation
- Strict session management for employee security
```

---

## API Routes

### 1. CUSTOMER SIGNUP API
**Endpoint:** `POST /api/auth/signup`
```typescript
Request Body:
{
  email: string
  password: string
  name: string
  phone: string
  userType: 'customer' | 'pro'
  state: string
  personalUse: boolean
}

Response:
{
  success: boolean
  message: string
  userId: string
  user: {
    id: string
    email: string
    emailConfirmed: boolean
  }
}
```

**Logic:**
- Creates Supabase Auth user via admin API (bypasses rate limits)
- Inserts user record in `users` table
- Sets user_type as 'customer'
- Requires email confirmation
- Returns user ID for next steps

**Error Handling:**
- `409` - Duplicate email (already registered)
- `429` - Rate limit (too many signups)
- `400` - Validation errors
- `500` - Server errors

---

### 2. CUSTOMER LOGIN API
**Endpoint:** `POST /api/auth/login`
```typescript
Request Body:
{
  email: string
  password: string
  rememberMe: boolean  // Optional: persist login for 7 days
}

Response:
{
  success: true
  message: 'Login successful'
  user: {
    id: string
    email: string
    userType: string
  }
  session: {
    access_token: string
    refresh_token: string
  }
}
```

**Logic:**
- Uses Supabase signInWithPassword()
- Fetches user profile from `users` table
- If customer, fetches from `customers` table
- If `rememberMe: true`, stores token in localStorage for 7 days
- Returns session tokens

**Error Handling:**
- `401` - Invalid credentials or email not confirmed
- `400` - Missing fields or authentication failed
- `500` - Server errors

---

### 3. VERIFY CODE API
**Endpoint:** `POST /api/auth/verify-code`
```typescript
Request Body:
{
  email: string
  code: string  // 6-digit code
}

Response:
{
  success: true
  message: 'Code verified'
  email: string
}
```

**Logic:**
- Looks up code in `verification_codes` table
- Checks code is valid and not expired (15 min expiry)
- Marks code as used
- Confirms email in Supabase Auth
- Creates customer profile if needed

**Error Handling:**
- `400` - Invalid or expired code
- `500` - Server errors

---

### 4. SEND VERIFICATION CODE API
**Endpoint:** `POST /api/verification/send-code`
```typescript
Request Body:
{
  email: string
  codeType: 'signup' | 'verification' | 'phone'
}

Response:
{
  success: true
  message: 'Code sent'
  email: string
  expiresIn: number  // seconds
}
```

**Logic:**
- Generates 6-digit random code
- Stores in `verification_codes` table with 15-min expiry
- Sends via SendGrid email or SMS based on type
- Rate limits: 3 codes per email per hour

---

### 5. EMPLOYEE LOGIN API
**Endpoint:** `POST /api/auth/employee-login`
**Status:** ENABLED
```typescript
Request Body:
{
  employeeId: string    // 6-digit, EMP-xxx, or PS-xxx format
  email: string
  password: string
  rememberMe: boolean   // Optional: 7-day persistent login
}

Response:
{
  success: true
  token: string         // JWT or session token
  employee: {
    id: string
    email: string
    firstName: string
    lastName: string
    employeeId: string
  }
}
```

**Logic:**
- Validates employee ID format (6-digit, EMP-xxx, PS-xxx)
- Looks up employee in `employees` table via email + employeeId
- Verifies password against Supabase auth
- If `rememberMe: true`, stores token in localStorage for 7 days
- Returns session token for localStorage storage
- Different from customer login - uses custom token instead of Supabase session

---

### 6. LOGOUT API
**Endpoint:** `POST /api/auth/logout`
```typescript
Request: No body required
Response:
{
  success: true
  message: 'Logged out successfully'
}
```

**Logic:**
- Calls Supabase `signOut()`
- Clears session tokens
- Redirects to home

---

### 7. PASSWORD RESET API
**Endpoint:** `POST /api/auth/password-reset`
```typescript
Request Body:
{
  email: string
}

Response:
{
  success: true
  message: 'Password reset link sent'
  email: string
}
```

**Logic:**
- Verifies email exists in `users` table
- Generates reset token
- Sends email with reset link
- Token expires in 1 hour

---

## Database Tables

### users
```typescript
{
  id: string (UUID)
  email: string
  user_type: 'customer' | 'pro' | 'admin'
  created_at: timestamp
  updated_at: timestamp
}
```

### customers
```typescript
{
  id: string (UUID) // Foreign key to users.id
  email: string
  first_name: string
  last_name: string
  phone: string
  state: string
  personal_use: boolean
  preference_marketing_texts: boolean
  preference_account_texts: boolean
  selected_plan: 'none' | 'monthly' | 'quarterly' | 'yearly'
  account_status: 'active' | 'suspended' | 'deleted'
  role: 'customer' | 'business'
  created_at: timestamp
  updated_at: timestamp
}
```

### employees
```typescript
{
  id: string (UUID)
  email: string
  first_name: string
  last_name: string
  phone: string
  state: string
  work_address: string
  id_verified: boolean
  email_verified: boolean
  phone_verified: boolean
  availability: JSON (days of week)
  created_at: timestamp
  updated_at: timestamp
}
```

### verification_codes
```typescript
{
  id: string
  email: string
  code: string (6 digits)
  code_type: 'signup' | 'verification' | 'phone'
  used: boolean
  expires_at: timestamp
  created_at: timestamp
}
```

---

## Authentication Flow

### CUSTOMER SIGNUP FLOW
```
1. User visits /auth/signup-customer
2. Fills personal details (Step 0)
   - First name, last name, email, phone, state, password
3. Click Continue → Calls handleNext()
   - POST /api/auth/signup with email, password, name, userType
   - Supabase creates auth user
   - INSERT into users table
   - Sends verification code via SendGrid
4. Step 1 - Email Verification
   - User enters 6-digit code
   - POST /api/auth/verify-code
   - Code marked as used, email confirmed in auth
5. Step 2 - Phone Verification
   - SMS code sent via Twilio (or similar)
   - User enters code
6. Step 3+ - Additional info (ID, address, preferences)
7. Final - Create customer profile
   - INSERT into customers table
   - Success redirect to /dashboard
```

### CUSTOMER LOGIN FLOW
```
1. User visits /auth/login
2. Enters email + password
3. Optionally checks "Remember Me" (7-day persistent login)
4. Click Login
   - POST /api/auth/login with email, password, rememberMe
   - Supabase signInWithPassword()
   - If rememberMe=true, token stored in localStorage (7 days)
   - Check email confirmed (via verification_codes table)
   - If not confirmed → Show "Confirm email" screen
5. Success
   - If rememberMe: Store token in localStorage
   - Else: Session token in sessionStorage
   - Redirect to /dashboard or ?redirect URL
6. On return visit (if Remember Me):
   - Check localStorage token validity
   - Auto-login without password
```

### EMPLOYEE LOGIN FLOW
```
1. User visits /auth/employee-signin
2. Enters Employee ID + email + password
3. Optionally checks "Remember Me" (7-day persistent login)
4. Click Sign In
   - POST /api/auth/employee-login with employeeId, email, password, rememberMe
   - Validates Employee ID format
   - Checks employee in employees table
   - Verifies password against Supabase
   - If rememberMe=true, token stored in localStorage (7 days)
   - Else: Session-only (sessionStorage, cleared on tab close)
5. Success
   - Store token in localStorage or sessionStorage
   - Sign into Supabase with email/password for authenticated operations
   - Redirect to /employee/dashboard
6. On return visit (if Remember Me):
   - Check localStorage token validity
   - Auto-login without credentials
```

---

## Key Utilities & Helpers

### Authentication Context (`lib/AuthContext.tsx`)
```typescript
export const useAuth = () => {
  return {
    user: User | null        // Current authenticated user
    userData: Profile | null // User's profile data
    loading: boolean         // Auth state loading
    logout: () => Promise    // Sign out function
  }
}
```

### User Management (`lib/userManagement.ts`)
```typescript
- createCustomerProfile(userId, data)  // Create customer record
- createEmployeeProfile(userId, data)  // Create employee record
- getCustomerProfile(userId)           // Fetch customer data
- getEmployeeProfile(userId)           // Fetch employee data
- updateUserProfile(userId, data)      // Update profile
```

### Verification (`lib/verification.ts`)
```typescript
- requestVerificationCode(email, codeType)    // Send code via email/SMS
- verifyCode(email, code)                     // Validate code
- getVerificationCodeForTesting(email)        // Dev: Get code from DB
- isAdminUser(userId)                        // Check admin status
```

### Validation (`lib/australianValidation.ts`)
```typescript
- validateEmail(email)              // Email format validation
- validateAustralianPhone(phone)    // Australian phone format
- formatAustralianPhone(phone)      // Format phone to standard
- AUSTRALIAN_STATES                // Array of state codes
- getEmailSuggestions(email)        // Typo suggestions (Gmail, etc)
```

---

## Reusable Components

### Button Component
```tsx
<Button 
  variant="primary" | "outline" | "ghost"
  size="sm" | "md" | "lg"
  disabled={boolean}
  onClick={handler}
>
  Text
</Button>
```

### Spinner Component
```tsx
<Spinner /> // Loading indicator
```

### Card Component
```tsx
<Card hoverable={boolean} className={string}>
  Content
</Card>
```

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Email Service
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@washlee.com

# Phone Verification
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx

# Authentication
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

---

## Common Patterns

### Email Input with Suggestions
```tsx
const [email, setEmail] = useState('')
const [suggestions, setSuggestions] = useState<string[]>([])

const handleEmailChange = (value: string) => {
  setEmail(value)
  if (value.includes('@')) {
    setSuggestions(getEmailSuggestions(value))
  }
}
```

### Phone Validation with Formatting
```tsx
import { validateAustralianPhone, formatAustralianPhone } from '@/lib/australianValidation'

const phone = '0412345678'
if (validateAustralianPhone(phone)) {
  const formatted = formatAustralianPhone(phone) // +61 4 1234 5678
}
```

### Verification Code Flow
```tsx
// 1. Request code
const sendCode = async (email: string) => {
  const response = await fetch('/api/verification/send-code', {
    method: 'POST',
    body: JSON.stringify({ email, codeType: 'signup' })
  })
}

// 2. User enters code
const verifyCode = async (email: string, code: string) => {
  const response = await fetch('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code })
  })
}
```

---

## Testing

### Test Credentials (Development)
```
Email: test@example.com
Password: TestPassword123!

Phone: 0412345678
Code: 123456 (if in dev mode)
```

### Getting Codes in Development
```typescript
import { getVerificationCodeForTesting } from '@/lib/verification'

const code = await getVerificationCodeForTesting('test@example.com')
console.log('Code:', code) // Logs the actual code from database
```

---

## Common Issues & Solutions

### Email Already Registered
**Response:** `409` with code `DUPLICATE_EMAIL`
**Solution:** User needs to login instead or use different email

### Email Not Confirmed
**Issue:** Login fails saying "Email not confirmed"
**Solution:** Send verification code, user confirms email, then can login

### Rate Limit Hit
**Response:** `429` with code `RATE_LIMIT`
**Solution:** Wait 60 seconds before retrying signup

### Invalid Verification Code
**Response:** `400` with message "Invalid or expired verification code"
**Solution:** 
- Code is 6 digits only (not letters)
- Code expires in 15 minutes
- Code can only be used once

---

## Useful Links

- **Supabase Dashboard:** https://app.supabase.com
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **SendGrid:** https://sendgrid.com
- **Twilio:** https://www.twilio.com
- **Google OAuth:** https://console.cloud.google.com

---

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Biometric login (fingerprint/face ID)
- [ ] Social login (Facebook, Apple)
- [ ] Single sign-on (SSO) for business accounts
- [ ] Magic link authentication (passwordless)
- [ ] Session management improvements
- [ ] Login activity logs
- [ ] Device management
