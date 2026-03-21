# Signup Flow Testing Guide

## Quick Start Testing

### Prerequisites
- ✅ Dev server running on `http://localhost:3000`
- ✅ Supabase project configured in `.env.local`
- ✅ Email provider configured in Supabase

### Test Scenario 1: Complete Signup Flow (Happy Path)

#### Step 1: Open Signup Page
1. Navigate to: `http://localhost:3000/auth/signup-customer`
2. Should see: Step 0 form with email, password, name fields

#### Step 2: Fill Form
- Email: `test-user-$(date +%s)@example.com` (unique)
- Password: `Test123!@#`
- First Name: `Test`
- Last Name: `User`
- Click: "Continue"

#### Step 3: Select Usage Type
- Choose: "Personal" or "Business" (either works)
- Click: "Continue"

#### Step 4: Create Account
- Click: "Create Account"
- Browser console should show:
  ```
  [SignUpForm] Submitting form with data
  [SignUpForm] Account created successfully
  [SignUpForm] Setting user data and moving to step 2
  ```
- UI should show: "Check Your Email" message with email address

#### Step 5: Get Verification Link
**Option A: Check Browser Console**
1. Open DevTools → Console
2. Look for log message: `[SignUpForm] Verification link sent to: {email}`
3. The link should be in the logs or check Supabase auth logs

**Option B: Check Email**
1. Check your actual email inbox
2. Look for "Confirm your signup" email from Supabase
3. Copy the verification link

**Option C: Check Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user with your test email
3. Verify email status shows "Email confirmed: No"

#### Step 6: Verify Email
1. Copy verification link from Step 5
2. Paste into browser address bar
3. You should be redirected to `/auth/callback`
4. Browser console should show:
   ```
   [AuthCallback] Processing email verification...
   [AuthCallback] Verifying token...
   [AuthCallback] ✓ Email verified: {userId}
   [AuthCallback] Creating your profile...
   [AuthCallback] ✓ Customer profile created
   [AuthCallback] ✓ Redirecting to dashboard
   ```
5. After ~1.5 seconds, should redirect to `/dashboard`
6. User should be logged in!

### Test Scenario 2: Email Verification Error

#### Test Expired Token
1. Use old verification link from more than 24 hours ago
2. Expected: Error message "Invalid verification link"
3. Should show: "Try Again" button
4. Click button → Returns to signup page

#### Test Invalid Token
1. Manually modify verification link (change token)
2. Expected: Error message "Failed to verify email"
3. Should show: "Try Again" button

### Test Scenario 3: Profile Creation Edge Cases

#### Profile Already Exists
1. Try signup with same email twice
2. First signup: Creates auth + profile
3. Second signup: Creates auth but profile creation might fail
4. Expected: Still logs in (profile creation warning ignored)

#### Missing Required Fields
1. Open DevTools
2. In callback, intentionally remove firstName
3. Expected: Profile created with firstName as "User"
4. Should still complete flow

### Test Scenario 4: Network Issues

#### Simulate Network Error
1. Close dev server
2. Click verification link (or manually navigate to `/auth/callback`)
3. Expected: Error message "Failed to verify email"
4. Should show: "Try Again" button
5. Restart dev server
6. Click "Try Again" → Should work

## Expected User Journey

```
Time    User Action              System Response            Console Output
─────────────────────────────────────────────────────────────────────────────
0:00    Opens signup page        Shows Step 0 form          Page loads
0:10    Fills email & password   Form validates             Input accepted
0:15    Clicks Continue          Shows Step 1 form          Navigation works
0:20    Selects usage type       Shows Step 2 preview       Option accepted
0:25    Clicks Create Account    Shows "Check Email"        [SignUpForm] Account created
0:30    Auth account created     Email sent by Supabase     [SignUpForm] Verification link sent
1:00    Receives email           Email with link received   [Email] Confirm your signup
2:00    Clicks link in email     Redirected to /callback    Browser navigates
2:05    Callback processes       Verifying email            [AuthCallback] Processing...
2:10    Token verified           Profile created            [AuthCallback] ✓ Email verified
2:15    Profile created          Creating profile           [AuthCallback] Creating profile...
2:20    Auto-signin ready        Redirecting                [AuthCallback] Redirecting to dashboard
2:25    At dashboard             User logged in             Page loads dashboard
```

## Browser Console Expected Output

### Signup Page
```
[SignUpForm] Submitting form with data
[SignUpForm] Account created successfully
[SignUpForm] Verification link sent to: user@example.com
[SignUpForm] Setting user data and moving to step 2
```

### Callback Page (Success)
```
[AuthCallback] Processing email verification...
[AuthCallback] Verifying token...
[AuthCallback] ✓ Email verified: {user-id-uuid}
[AuthCallback] Creating your profile...
[UserMgmt] Creating customer profile via API: {user-id-uuid}
[AuthCallback] ✓ Customer profile created
[AuthCallback] ✓ Redirecting to dashboard
```

### Callback Page (Error)
```
[AuthCallback] Error: Invalid verification link
```

## Database Checks

### Verify Auth Account Created
**Supabase Dashboard:**
1. Go to Authentication → Users
2. Should see user with:
   - Email: Your test email
   - Confirmed: "No" (until email verified)
   - Created: Recent timestamp

### Verify Profile Created
**Supabase Dashboard:**
1. Go to SQL Editor
2. Run:
   ```sql
   SELECT id, email, first_name, account_status, created_at
   FROM customers
   WHERE email = 'your-test-email@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
3. Should see: Profile with your test data

## Troubleshooting

### Issue: "Check Your Email" screen but no email received
**Solutions:**
1. Check spam/junk folder
2. Check browser console for verification link
3. Check Supabase Auth Logs (Dashboard → Logs)
4. Verify email service is configured in Supabase

### Issue: Verification link returns to signup page
**Solutions:**
1. Check browser console for errors
2. Verify token in URL: Should have `#access_token=...&type=signup`
3. Try link again (token might have expired)
4. Check Supabase logs for verification errors

### Issue: Redirect to /dashboard but not logged in
**Solutions:**
1. Check if profile creation succeeded (see database checks above)
2. Check browser console for errors
3. Verify Supabase session exists in AuthContext
4. Check Network tab for API errors

### Issue: Dev server shows "lock" error
**Solution:**
```bash
# Kill old process
lsof -ti:3000 | xargs kill -9
# Clean and restart
rm -rf .next
npm run dev
```

## Performance Baselines

Healthy metrics:
- Signup form load: < 2 seconds
- Auth account creation: < 3 seconds
- Email delivery: 30 seconds - 5 minutes
- Email link click → Dashboard: < 3 seconds
- Total flow: 2-10 minutes (mostly waiting for email)

## Checklist for Full Testing

### Auth Creation Phase
- [ ] Signup page loads without errors
- [ ] Form validation works (empty fields, weak password)
- [ ] Email field validates email format
- [ ] Password field accepts secure passwords
- [ ] First/Last name fields accept text
- [ ] Form submission shows loading state
- [ ] Auth account created in Supabase
- [ ] User sees "Check Your Email" screen
- [ ] Correct email address displayed in message

### Email Verification Phase
- [ ] Email received from Supabase
- [ ] Email has verification link
- [ ] Link format: `/auth/callback#access_token=...&type=signup`
- [ ] Link is clickable
- [ ] Link is unique for each user
- [ ] Link expires after 24 hours

### Callback Phase
- [ ] Clicking link navigates to /auth/callback
- [ ] Callback page shows "Verifying..." message
- [ ] Browser console shows verification logs
- [ ] Token is verified successfully
- [ ] Profile is created in customers table
- [ ] "Success" message appears
- [ ] After ~1.5 seconds, redirects to /dashboard

### Post-Signup Phase
- [ ] User is logged in (AuthContext has user)
- [ ] Can access protected routes (e.g., /dashboard)
- [ ] Profile data is correct in database
- [ ] Can see customer information on dashboard
- [ ] Can modify account settings
- [ ] Logout works correctly

### Error Handling
- [ ] Expired token shows error
- [ ] Invalid token shows error
- [ ] Network errors show error with retry
- [ ] Error messages are helpful
- [ ] "Try Again" button returns to signup
- [ ] Errors don't crash the app

## Success Criteria

✅ **Complete Flow Works**
- User can create account
- User receives verification email
- User clicks link
- User is verified and logged in
- User sees dashboard

✅ **No Console Errors**
- No TypeScript errors
- No runtime errors
- No auth errors
- No API errors

✅ **Database Integrity**
- Auth account created
- Profile created
- Fields are correct
- Timestamps are accurate

✅ **User Experience**
- Flow is smooth
- Messages are clear
- No unexpected redirects
- Error handling is helpful

---

**Ready to Test**: Dev server is running and all code is in place!
