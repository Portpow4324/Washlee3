# Complete Authentication Testing Guide

## ✅ STEP 1: Email Service Implementation - DONE

Your Gmail credentials are now configured:
- **Email**: lukaverde045@gmail.com
- **Employer Notifications**: Sent to lukaverde045@gmail.com
- **Status**: ✅ Ready to send emails

The email service will:
- Send verification codes when users sign up
- Send confirmation emails to new employees
- Send admin notifications when new pros apply

---

## 📝 STEP 2: Test Customer Signup

### 2A. Basic Customer Signup Test

1. **Open browser**: Go to `http://localhost:3000/auth/signup`

2. **Fill in the form**:
   - First Name: `Test`
   - Last Name: `Customer`
   - Email: `testcustomer_$(date +%s)@gmail.com` (use a real email you can check)
   - Password: `TestPassword123!`
   - Personal Use: Select one option
   - Age: Select one option
   - Plan: Select one option
   - Accept terms

3. **Expected Results**:
   - ✅ Account created in Firebase Auth
   - ✅ Customer profile created in Firestore
   - ✅ Redirected to home page within ~350-400ms
   - ✅ Console shows timing logs

4. **Verify in Firestore**:
   - Go to Firebase Console
   - Open Firestore Database
   - Navigate to `customers` collection
   - Verify customer document was created with:
     - `firstName`, `lastName`, `email`, `phone`
     - `personalUse` value
     - `ageOver65` value
     - `selectedPlan` value
     - `createdAt` timestamp

### 2B. Check Email Was Sent

1. **Check your email inbox**
   - Go to `lukaverde045@gmail.com`
   - Look for verification code email from Washlee
   - If you don't see it, check Spam folder

2. **Expected Email Content**:
   - Subject: `🔐 Your Washlee Verification Code`
   - Contains: 6-digit verification code
   - HTML formatted with Washlee branding

---

## 🚀 STEP 3: Test Pro Signup

### 3A. Pro Signup Form Test

1. **Open browser**: Go to `http://localhost:3000/auth/pro-signup-form`

2. **Step 1 - Personal Info**:
   - First Name: `Pro`
   - Last Name: `Worker`
   - Email: `properson_$(date +%s)@gmail.com` (different email)
   - Phone: `0412345678`
   - State: `NSW`
   - Accept Terms: Check the box
   - Click Next

3. **Step 2 - Email Confirmation**:
   - Just click Next (simulated)

4. **Step 3 - Phone Verification**:
   - Enter any 6-digit code: `123456`
   - Click Next

5. **Step 4 - ID Verification**:
   - Just click Next (simulated)

6. **Step 5 - Washlee Intro**:
   - Just click Next (auto-passes)

7. **Step 6 - Availability**:
   - Select some days
   - Add comments if you want
   - Click Next

8. **Step 7 - Workplace Verification**:
   - Answer ALL YES to:
     - Has work right
     - Has valid license
     - Has transport
     - Has equipment
     - Age verified
   - Click Next

9. **Step 8 - Skills Assessment**:
   - Enter at least 50 characters
   - Example: "I have 5 years of laundry service experience with excellent customer satisfaction"
   - Click Submit

### 3B. Expected Results After Submit

1. **Firestore - Check employees collection**:
   - Document created with key = user's Firebase UID
   - Contains:
     - `firstName`, `lastName`, `email`, `phone`, `state`
     - `employeeIdPending: true` (ID being generated)
     - `status: "pending"`
     - `verificationStatus` with all booleans
     - `createdAt` timestamp
   
2. **Check Cloud Function Generated ID**:
   - Within 1-2 seconds, the `employeeIdPending` should become `false`
   - `employeeId` should appear (6-digit number like `456789`)
   - In Firebase Console, check Cloud Functions logs

3. **Check Emails Received**:
   - **Employee Confirmation Email**:
     - Subject: `🎉 Welcome to Washlee Pro!`
     - To: pro person's email
     - Contains their employee ID
   
   - **Employer Notification Email**:
     - Subject: `📋 New Pro Application: Pro Worker`
     - To: `lukaverde045@gmail.com`
     - Contains all application details

### 3C. Check Inquiry Creation

After pro form submission, an inquiry should be created:

1. **Firestore - Check inquiries collection**:
   - Document created with auto-generated ID
   - Contains:
     - `userId`, `firstName`, `lastName`, `email`, `phone`, `state`
     - `workVerification` object
     - `skillsAssessment`, `availability`, `comments`
     - `status: "pending"`
     - `createdAt` timestamp

---

## 🔑 STEP 4: Test Pro Signin

### 4A. Get Employee ID

1. **From previous test**, you should have an employee ID (6 digits)
   - If you skipped pro signup, create one first
   - Or check Firestore `employees` collection for the ID

### 4B. Pro Signin Test

1. **Open browser**: Go to `http://localhost:3000/auth/pro-signin`

2. **Fill in form**:
   - Employee ID: The 6-digit ID from above
   - Email: The email used during pro signup
   - Password: The password you created
   - Click Sign In

3. **Expected Results**:
   - ✅ User authenticated
   - ✅ Redirected to `/dashboard/pro`
   - ✅ Success message shows employee's first name

4. **Troubleshooting**:
   - If "Employee ID not found": Make sure you use the correct ID from Firestore
   - If "Email doesn't match": Use the exact email from pro signup
   - If "Wrong password": Use the password created during pro signup

---

## 🔐 STEP 5: Test Customer Login

### 5A. Customer Signin Test

1. **Open browser**: Go to `http://localhost:3000/auth/login`

2. **Fill in form**:
   - Email: The customer email from Step 2
   - Password: The password you created in Step 2
   - Click Sign In

3. **Expected Results**:
   - ✅ User authenticated
   - ✅ Redirected to home or dashboard
   - ✅ Success message appears

---

## 🌐 STEP 6: Test Redirect Flows

### 6A. Login with Redirect Parameter

1. **Test redirect after login**:
   ```
   http://localhost:3000/auth/login?redirect=/dashboard/customer
   ```

2. **After login**, should redirect to `/dashboard/customer`

### 6B. Signup Flow with Google OAuth

1. **On signup page**, click "Sign up with Google"
2. **Expected**:
   - ✅ Google sign-in popup appears
   - ✅ After approval, account created
   - ✅ Redirected to home

---

## 🔒 STEP 7: Security Validation

### 7A. Test Firestore Rules

1. **Try unauthorized write** (should fail):
   - Open browser DevTools Console
   - Run:
   ```javascript
   const { setDoc, doc } = await import('firebase/firestore');
   const { db } = await import('@/lib/firebase');
   
   // This should fail with permission error
   await setDoc(doc(db, 'employees', 'random-uid'), {
     email: 'test@test.com'
   })
   ```

2. **Expected**: Permission denied error

3. **Try authenticated write** (should succeed):
   - Verify in AuthContext that user is logged in
   - Updates to own profile should work
   - Updates to others' profiles should fail

### 7B. Test Custom Claims (Admin)

1. **Check your user's token**:
   - Open Firebase Console
   - Go to Authentication
   - View your test user
   - Check for custom claims (if you set any)

### 7C. Test Session Persistence

1. **Close and reopen browser**
2. **Go to**: `http://localhost:3000`
3. **Expected**:
   - ✅ User still logged in
   - ✅ User data loads from Firestore
   - ✅ User context available to components

---

## 📊 API Response Codes - Expected

| Endpoint | Method | Status | Expected Response |
|----------|--------|--------|-------------------|
| `/auth/login` | GET | 200 | HTML form |
| `/auth/signup` | GET | 200 | HTML form |
| `/auth/pro-signin` | GET | 200 | HTML form |
| `/auth/pro-signup-form` | GET | 200 | HTML form |
| `/api/inquiries/create` | POST | 201 | `{ success: true, inquiryId: "..." }` |
| `/api/email/send-verification-code` | POST | 200 | `{ success: true, message: "..." }` |
| `/api/email/send-employee-confirmation` | POST | 200 | `{ success: true, message: "..." }` |
| `/api/email/send-employer-notification` | POST | 200 | `{ success: true, message: "..." }` |
| `/api/auth/employee-login` | POST | 200 | `{ success: true, token: "...", employee: {...} }` |

---

## 🐛 Debugging Tips

### Check Console Logs
1. **Browser Console**: F12 → Console tab
   - Look for `[Signup]`, `[Email]`, `[Auth]` logs
   - Timing information
   - Error messages

2. **Terminal Console**: Where dev server is running
   - Look for `[Email] ✅ Email sent` or `[Email] Error`
   - Cloud Function logs
   - Firebase initialization logs

### Check Firestore
1. Go to Firebase Console → Firestore Database
2. View collections:
   - `customers` - Customer profiles
   - `employees` - Pro profiles
   - `inquiries` - Applications
   - `users` - User metadata

3. Look for missing fields or incorrect data types

### Check Firebase Auth
1. Go to Firebase Console → Authentication
2. Verify users are created with correct email
3. Check custom claims if applicable

### Network Requests
1. Browser DevTools → Network tab
2. Check API calls for:
   - Status codes
   - Response bodies
   - Error messages
   - Request payload

---

## 📋 Quick Checklist

- [ ] Step 2A: Customer signup works
- [ ] Step 2B: Verification email received
- [ ] Step 3A: Pro signup form completes
- [ ] Step 3B: Emails sent to both user and admin
- [ ] Step 3C: Inquiry created in Firestore
- [ ] Step 4B: Pro signin with employee ID works
- [ ] Step 5A: Customer login works
- [ ] Step 6A: Redirect parameters work
- [ ] Step 7A: Firestore rules prevent unauthorized access
- [ ] Step 7C: Session persists after browser close

---

## 🚀 What's Next

After all tests pass:

1. **Deploy to production** (Vercel/Firebase Hosting)
2. **Set up real email service** (SendGrid recommended)
3. **Configure SMS service** (Twilio for phone verification)
4. **Set up payment processing** (Stripe webhook configuration)
5. **Enable analytics** (Firebase Analytics)
6. **Set up error tracking** (Sentry/LogRocket)

Good luck testing! 🎉
