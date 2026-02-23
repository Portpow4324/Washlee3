# Employee Inquiry System - Testing Guide

Complete step-by-step instructions for testing the employee inquiry and verification system.

---

## Prerequisites

✓ Admin account set up with `isAdmin: true` (see ADMIN_SETUP_EMPLOYEE_INQUIRY.md)
✓ Email service configured in `.env.local` (Resend, SendGrid, or SMTP)
✓ Nodemailer package installed (`npm install`)
✓ Firestore collections created: `inquiries`, `users`, `employees`

---

## Test Scenario 1: Complete Application Flow

### Step 1A: Submit Employee Inquiry

1. **Open the Pro Signup Form**
   - Go to: `http://localhost:3000/auth/pro-signup-form`
   - You should be logged in as a regular user (not admin)

2. **Complete Steps 0-5**
   - Step 0: Enter first and last name
   - Step 1: Select a state/location
   - Step 2: Select availability (days and hours)
   - Step 3: Select services offered (check at least one):
     - [ ] Hang Dry
     - [ ] Delicates Care
     - [ ] Comforter Service
     - [ ] Stain Treatment
   - Step 4: Add optional comments
   - Step 5: Confirm and proceed to Step 6

3. **Complete Step 6: Australian Workplace Verification**
   - Question 1: "Do you have the right to work in Australia?" → Select **YES**
   - Question 2: "Do you have a valid driver's license and are 18+?" → Select **YES**
   - Question 3: "Do you have reliable transportation?" → Select **YES**
   - Question 4: "Do you have access to laundry equipment?" → Select **YES**
   - Question 5: "Confirm all information is true and accurate?" → Select **YES**
   - Click Next to proceed to Step 7

   **Note:** If you select "NO" for any question, you won't be able to proceed to the next step. All must be "YES".

4. **Complete Step 7: Skills Assessment**
   - Text area: Enter your laundry experience (minimum 50 characters)
   - Example: "I have worked in professional laundry services for 3 years, specializing in delicate fabrics and commercial accounts."
   - Click Submit

5. **Verify Success Message**
   - You should see: "Thanks for Applying! An Agent will get into contact with you shortly. Typical response time: 24-48 hours"
   - Form resets and shows success page

### Step 1B: Verify Inquiry in Database

1. **Check Firestore Console**
   - Go to Firebase Console → Firestore Database
   - Navigate to `inquiries` collection
   - Should see new document with:
     - `status: "pending"`
     - `submittedAt: [current timestamp]`
     - All form data preserved

2. **Check User Record Updated**
   - Go to `users` collection
   - Find your user document
   - Verify `userId` matches in inquiry

---

## Test Scenario 2: Admin Review & Approval

### Step 2A: Access Admin Dashboard

1. **Log out current user**
   - Click profile → Logout

2. **Log in as Admin**
   - Use account with `isAdmin: true`
   - Or navigate directly to `/admin/inquiries`

3. **Verify Dashboard Loads**
   - Should see: "Employee Inquiries" page
   - Status filter buttons: All, Pending, Under Review, Approved, Rejected
   - Should show the inquiry you just submitted under "Pending"

### Step 2B: Review the Inquiry

1. **Click on the Pending Inquiry Card**
   - Card shows applicant name, state, email, phone
   - Shows work verification summary with checkmarks
   - Click to open detail modal

2. **Verify Detail Modal Shows:**
   - Applicant name and location
   - Contact information (email, phone)
   - All 5 work verification answers with ✓ icons
   - Full skills assessment text
   - Submit date
   - "Review & Verify" button

3. **Click "Review & Verify"**
   - Approval modal appears
   - Optional text area for rejection reason
   - Shows "Approve" and "Reject" buttons

### Step 2C: Approve the Inquiry

1. **Click "Approve" Button**
   - Modal shows processing state
   - System generates Employee ID: `EMP-{timestamp}`
   - Firestore updates:
     - Inquiry status → "approved"
     - User record → `isEmployee: true`, `employeeId: EMP-xxxxx`
     - New document in `employees` collection

2. **Check Email Sent**
   - **Development Mode:** Check server logs
     - Should show: `[Email] Sending email to [applicant-email]`
     - Subject: "Congratulations! Washlee Pro Offer - Employee ID EMP-xxxxx"
   
   - **Production (Resend/SendGrid):** Check email inbox
     - Applicant receives professional offer letter
     - Includes Employee ID
     - Contains acceptance link with unique URL
     - Has all terms and conditions

3. **Verify Modal Closes**
   - Inquiry status on card should update to "Approved"
   - Inquiry moves out of "Pending" filter results

---

## Test Scenario 3: Offer Acceptance

### Step 3A: Extract Employee ID from Email/Logs

1. **Get Employee ID**
   - From logs: Look for `EMP-{timestamp}` in approval response
   - From email: Check offer letter for Employee ID
   - Format should be: `EMP-1234567890` (EMP- followed by timestamp)

### Step 3B: Access Offer Acceptance Page

1. **Navigate to Acceptance Page**
   - URL: `http://localhost:3000/dashboard/employee/accept-offer?employeeId=EMP-1234567890`
   - Replace `EMP-1234567890` with actual Employee ID

2. **Verify Page Loads**
   - Shows offer details
   - Displays offer terms summary
   - Lists 4 benefits (jobs, earnings, ratings, payments)
   - Shows "Accept Offer" and "Decline" buttons

3. **Click "Accept Offer"**
   - Page shows processing state
   - System updates:
     - User record: `offerAcceptedAt: timestamp`, `employeeDashboardAccess: true`
     - Creates/updates employee record
   - Shows success screen with green checkmark

4. **Verify Success Screen**
   - Shows "Offer Accepted!" heading
   - Displays Employee ID in teal box
   - Lists 4 access benefits with checkmarks
   - Shows "Go to Dashboard" button or auto-redirects after 3 seconds

---

## Test Scenario 4: Application Rejection

### Step 4A: Submit Another Inquiry

1. **Create Another Test Application**
   - Log out as admin, log in as different user
   - Go through complete pro-signup form (Steps 0-7)
   - Submit second inquiry

### Step 4B: Reject from Admin Panel

1. **Access Admin Dashboard**
   - Go to `/admin/inquiries` as admin
   - Should see new "Pending" inquiry

2. **Open and Review Inquiry**
   - Click on the new inquiry card
   - Open detail modal
   - Click "Review & Verify"

3. **Reject the Application**
   - In approval modal, enter rejection reason
   - Example: "Application incomplete - missing key information"
   - Click "Reject" button

4. **Verify Rejection Processing**
   - Inquiry status updates to "Rejected"
   - Email sent with rejection message
   - Check logs for: `[Email] Sending email to [applicant-email]`
   - Subject: "Washlee Pro Application Update"

5. **Verify Database Updates**
   - Firestore inquiry document:
     - `status: "rejected"`
     - `rejectionReason: "[your reason]"`
     - `reviewedAt: [timestamp]`
     - `reviewedBy: [admin-user-id]`

---

## Test Scenario 5: Filter and Status Management

### Step 5A: Test Status Filters

1. **Have Created Multiple Inquiries**
   - At least 1 pending
   - At least 1 approved
   - At least 1 rejected

2. **Test Each Filter Button**
   - Click "Pending" → Shows only pending inquiries
   - Click "Approved" → Shows only approved inquiries
   - Click "Rejected" → Shows only rejected inquiries
   - Click "All" → Shows all inquiries

3. **Verify Count Updates**
   - Each filter button shows count in parentheses
   - Count decreases when you filter
   - Total count shown in "All" matches sum of others

---

## Test Scenario 6: Email Configuration Testing

### Step 6A: Test Email Service

1. **Check Current Configuration**
   - In `.env.local`, verify email settings are present
   - Options: RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_* variables

2. **Test Email Delivery**
   - Submit inquiry and approve it
   - Watch server logs for email processing
   - Check inbox (or spam folder) for offer letter email

3. **Verify Email Contents**
   - Email from: `NEXT_PUBLIC_SENDER_EMAIL`
   - Subject: "Congratulations! Washlee Pro Offer - Employee ID EMP-xxxxx"
   - Contains professional offer letter HTML
   - Has acceptance button/link
   - Includes all terms & conditions
   - Shows employee ID prominently

### Step 6B: Test Rejection Email

1. **Submit and Reject an Inquiry**
   - Go through process as above
   - Reject with specific reason

2. **Check Rejection Email**
   - Subject: "Washlee Pro Application Update"
   - Contains rejection reason
   - Professional tone
   - Encourages future application

---

## Test Scenario 7: Error Handling

### Step 7A: Test Invalid Links

1. **Access Invalid Offer Link**
   - Go to: `/dashboard/employee/accept-offer?employeeId=INVALID-ID`
   - Should show error: "Employee not found"
   - Should not process

2. **Access Missing Employee ID**
   - Go to: `/dashboard/employee/accept-offer`
   - Should show error: "Invalid offer link. Employee ID is missing."

### Step 7B: Test Admin Access Control

1. **Try Accessing Admin Panel as Non-Admin**
   - Log in as regular customer user
   - Try to access: `/admin/inquiries`
   - Should redirect to home page
   - Should not show admin dashboard

2. **Verify No Admin Actions Available**
   - Regular users cannot approve/reject
   - Regular users cannot see other inquiries
   - Regular users cannot access admin features

---

## Test Scenario 8: Database Integrity

### Step 8A: Verify Data Structure

1. **Check Inquiry Document Structure**
   ```
   inquiries/{inquiryId}:
   {
     userId: string
     firstName: string
     lastName: string
     email: string
     phone: string
     state: string
     status: string
     workVerification: { object with booleans }
     skillsAssessment: string
     submittedAt: timestamp
     reviewedAt: timestamp | null
     reviewedBy: string | null
     adminName: string | null
     rejectionReason: string | null
   }
   ```

2. **Check User Document Updates**
   ```
   users/{userId}:
   {
     ...existing fields...
     isEmployee: boolean
     employeeId: string (format: EMP-{timestamp})
     approvalDate: timestamp
     approvedBy: string
     offerAcceptedAt: timestamp | null
     employeeDashboardAccess: boolean
   }
   ```

3. **Check Employee Document**
   ```
   employees/{employeeId}:
   {
     userId: string
     employeeId: string
     firstName: string
     lastName: string
     email: string
     phone: string
     state: string
     onboardedAt: timestamp
     status: string
     approvedAt: timestamp
   }
   ```

---

## Troubleshooting Test Issues

### Issue: Inquiry Not Submitting

**Possible Causes:**
- Validation error on current step
- Missing required field
- Form data not being sent to API

**Debug Steps:**
1. Check browser console (F12) for errors
2. Verify all required fields are filled
3. Check network tab to see if POST to `/api/inquiries/create` succeeded
4. Check server logs for API error response

### Issue: Admin Can't See Inquiries

**Possible Causes:**
- User doesn't have `isAdmin: true` custom claim
- Firestore security rules blocking read access
- User not properly logged in

**Debug Steps:**
1. Verify `admin: true` in Firebase custom claims
2. Log out and back in to refresh claims
3. Check Firestore security rules allow admin reads
4. Check server logs for authentication errors

### Issue: Email Not Sending

**Possible Causes:**
- Email service not configured in `.env.local`
- Invalid API key or credentials
- SMTP connection failed
- Email address validation failed

**Debug Steps:**
1. Verify `.env.local` has email configuration
2. Check API keys are valid in email service
3. Watch server logs during approval for email errors
4. Test email service credentials separately
5. Check sender email format

### Issue: Approval Succeeds But No Email

**Possible Causes:**
- Email service not configured
- Email sending succeeded but email bounced
- Email address in form is invalid

**Debug Steps:**
1. Check logs show `[Email] Sending email to...`
2. Verify recipient email is valid
3. Check spam/junk folder for email
4. Test with a different email address
5. Check email service logs/dashboard

### Issue: Offer Acceptance Link Doesn't Work

**Possible Causes:**
- Employee ID in URL doesn't match database
- Employee ID wasn't properly saved
- User already accepted offer

**Debug Steps:**
1. Verify Employee ID in URL matches `employees` collection
2. Check approval process actually created employee record
3. Check if `offerAcceptedAt` already set (accept only once)
4. Check browser console for API errors
5. Watch network tab for `/api/offers/accept` response

---

## Performance Testing

### Load Test Scenario

1. **Create Multiple Inquiries**
   - Submit 10+ inquiries
   - Verify list page still loads quickly

2. **Test Filtering Performance**
   - Switch between filters
   - Should be instant

3. **Test Admin Dashboard Response**
   - Dashboard loads in <2 seconds
   - Inquiries list renders without lag

---

## Security Testing Checklist

- [ ] Non-admin users cannot access `/admin/inquiries`
- [ ] Non-admin users cannot approve inquiries
- [ ] Non-admin users cannot see other users' inquiries
- [ ] Inquiry data properly validated before storing
- [ ] Employee IDs are unique per applicant
- [ ] Offer links expire after 30 days
- [ ] Email addresses are validated
- [ ] Phone numbers properly formatted
- [ ] User can only accept their own offer
- [ ] Firebase security rules properly configured

---

## Sign-Off Checklist

- [ ] Inquiries submit successfully
- [ ] Admin dashboard accessible
- [ ] Admin can review inquiry details
- [ ] Approval generates employee ID
- [ ] Approval sends email with offer letter
- [ ] Rejection sends rejection email
- [ ] Applicant can accept offer
- [ ] Database records properly created/updated
- [ ] Status filters work correctly
- [ ] Email service properly configured
- [ ] Error messages display appropriately
- [ ] Admin access control working
- [ ] Data structure matches expected format

---

## Reporting Issues

If tests fail, create issue with:

1. **Test scenario:** Which test were you running?
2. **Expected behavior:** What should happen?
3. **Actual behavior:** What actually happened?
4. **Error message:** What error was shown?
5. **Logs:** Server logs and browser console output
6. **Environment:** Development or production? Which email service?

---

**Ready to test?** Start with Test Scenario 1 and work through sequentially.

Good luck! 🚀
