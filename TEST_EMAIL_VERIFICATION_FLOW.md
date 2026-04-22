# Email Verification Testing Guide

## Fixed Issues
✅ Changed from `supabase.auth.verifyOtp()` to custom API `/api/auth/verify-code`
✅ Added proper error handling for API response (checks `success` field, not `user`)
✅ Added "Resend Code" button that calls `/api/auth/resend-verification`

## Test Credentials
- **Email**: lukaverde3@gmail.com
- **Password**: 35Malcolmst!

## Step-by-Step Test Flow

### 1. Login with Unconfirmed Email
1. Go to http://localhost:3000/auth/login
2. Enter email: `lukaverde3@gmail.com`
3. Enter password: `35Malcolmst!`
4. Click "Sign In"

**Expected Result**: 
- ❌ Should show error message: "Email Not Confirmed"
- Shows a yellow/blue box with message and verification code button

### 2. Navigate to Code Verification
1. From the "Email Not Confirmed" message, click button to go to verification
2. OR manually go to: http://localhost:3000/auth/verify-email-code?email=lukaverde3@gmail.com

**Expected Result**:
- Page shows "Verify Your Email"
- Displays email: lukaverde3@gmail.com
- Shows input field for verification code
- Shows "Didn't receive the code? Resend Code" button

### 3. Check Email for Verification Code
1. Check email inbox for `lukaverde3@gmail.com`
2. Look for email from Washlee with subject: "Verify Your Email Address"
3. Copy the 6-character verification code (format: Q7ZGM2)

**Expected Result**:
- Email received with verification code
- Code format is uppercase letters/numbers, 6 characters
- Code expires in 24 hours

### 4. Enter Verification Code
1. On the verify-email-code page, paste the code into the input field
2. Code should auto-format to UPPERCASE
3. Click "Verify Email" button

**Expected Result**:
- ✅ Success message: "Email verified! Redirecting to complete your profile..."
- Page shows green success box with checkmark icon
- After 2 seconds, redirects to `/auth/select-usage-type`

### 5. Select Usage Type
1. Page shows "Choose Your Account Type"
2. Two radio options: "Customer" and "Pro"
3. Customer should be pre-selected for normal users

**Expected Result**:
- Can select between Customer and Pro
- Click "Continue" button
- For Customer: redirects to `/auth/email-confirmed`
- For Pro: redirects to `/auth/pro-signup-form`

### 6. Complete Profile Setup (Customer)
If selected "Customer":
1. Page shows "Complete Your Profile"
2. Fields for: First Name, Last Name, Phone Number
3. Submit button to complete setup

**Expected Result**:
- ✅ Profile saved to Supabase
- Data stored in users table with metadata
- Redirects to `/dashboard/customer` (or appropriate dashboard)

---

## Resend Code Testing

### Test Resend Functionality
1. On verify-email-code page, click "Resend Code" button
2. Should show "Sending..." text while processing
3. After 2-3 seconds, shows: "New verification code sent! Check your email."

**Expected Result**:
- ✅ Old codes marked as `used: true` in database
- ✅ New code generated and stored in verification_codes table
- ✅ Email sent with new code
- Input field cleared for new code entry
- Button re-enabled for verification

---

## Common Issues & Solutions

### Issue: "Token has expired or is invalid"
**Cause**: Was using `supabase.auth.verifyOtp()` instead of custom API
**Fix**: ✅ Changed to `/api/auth/verify-code` endpoint
**Status**: FIXED

### Issue: Code doesn't match after resend
**Cause**: Old codes not marked as used, or new code not generated
**Fix**: Resend endpoint marks old codes as used and generates new one
**Status**: FIXED

### Issue: Email not sending
**Possible Causes**:
- SendGrid/Resend API keys not configured
- Email address not found in users table
- Service error in email sending

**Solution**: Check server logs for [ResendVerification] messages

### Issue: Can't proceed to next step
**Check**:
- Code is correct (6 characters, uppercase)
- Code is not expired (within 24 hours)
- Code hasn't been used already

---

## API Endpoints Used

### Login
- `POST /api/auth/login` or `supabase.auth.signInWithPassword()`
- Returns: User object with `email_confirmed_at` field

### Verify Code
- `POST /api/auth/verify-code`
- Payload: `{ email, code }`
- Returns: `{ success: true, userId, email, email_confirmed: true }`
- Marks code as used in database
- Confirms email in Supabase Auth

### Resend Verification
- `POST /api/auth/resend-verification`
- Payload: `{ email }`
- Returns: `{ success: true, message: '...' }`
- Generates new code
- Marks old codes as used
- Sends email with new code

---

## Browser Console Messages
When testing, you should see in browser DevTools console:
```
[Login] Attempting login with email: lukaverde3@gmail.com
[Login] Email not confirmed: lukaverde3@gmail.com
[VerifyEmailCode] Verifying code for email: lukaverde3@gmail.com
[VerifyEmailCode] ✓ Email verified: <user-id>
```

---

## Database Tables Involved
- `auth.users` - Supabase auth table (email_confirmed_at field)
- `users` - App users table (custom user data)
- `verification_codes` - Stores verification codes with expiry
- `email_confirmations` - Tracks email confirmation status

---

**Last Updated**: April 6, 2026
**Status**: Ready for testing
