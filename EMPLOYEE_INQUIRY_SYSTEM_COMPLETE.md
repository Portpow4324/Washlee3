# Employee Inquiry & Verification System - Complete Implementation

## Overview
The Washlee Pro employee verification system provides a comprehensive workflow for recruiting, vetting, approving, and onboarding new service providers. The system includes:

1. **Multi-step application form** with Australian workplace verification
2. **Admin/Manager review dashboard** for approval/rejection
3. **Automated offer letter generation** with employee ID assignment
4. **Email notification system** for applicants
5. **Offer acceptance page** with employee dashboard access

---

## System Components

### 1. Employee Inquiry Form (Customer-Facing)
**Location:** `/app/auth/pro-signup-form/page.tsx`

#### Form Steps:
- **Steps 0-5:** Original pro-signup steps (name, location, availability, services, comments)
- **Step 6: Australian Workplace Verification**
  - Work rights in Australia (yes/no)
  - Valid driver's license & 18+ years old (yes/no)
  - Reliable transportation (yes/no)
  - Access to laundry equipment (yes/no)
  - Confirmation of information accuracy (yes/no)
  - **Validation:** ALL answers must be "YES" to proceed

- **Step 7: Skills Assessment**
  - Text area for applicant to describe laundry experience
  - **Validation:** Minimum 50 characters required

#### Form Data Structure:
```typescript
{
  // Original fields (steps 0-5)
  firstName: string
  lastName: string
  state: string
  availableDays: string[]
  availableHours: { from: string, to: string }
  offersHangDry: boolean
  offersDelicates: boolean
  offersComforters: boolean
  offersStainTreatment: boolean
  additionalComments: string
  
  // New inquiry fields (steps 6-7)
  hasWorkRight: boolean | null
  hasValidLicense: boolean | null
  hasTransport: boolean | null
  hasEquipment: boolean | null
  ageVerified: boolean | null
  skillsAssessment: string
}
```

#### Submission Flow:
1. User completes all 8 steps
2. Form validates each step according to rules
3. `handleSubmitInquiry()` POSTs to `/api/inquiries/create`
4. Inquiry stored in Firestore with `status: 'pending'`
5. User sees "Thanks for Applying!" success message
6. Inquiry awaits admin review

---

### 2. Inquiry Submission API
**Location:** `/app/api/inquiries/create/route.ts`

#### Validation:
- Checks for required fields: `userId`, `email`, `phone`
- Prevents duplicate active inquiries (checks for existing 'pending' or 'under-review' status)

#### Firestore Collection Structure:
```
Collection: inquiries
Document: {
  userId: string                    // Reference to user doc
  firstName: string
  lastName: string
  email: string
  phone: string
  state: string
  status: 'pending' | 'under-review' | 'approved' | 'rejected'
  
  // Verification answers
  workVerification: {
    hasWorkRight: boolean
    hasValidLicense: boolean
    hasTransport: boolean
    hasEquipment: boolean
    ageVerified: boolean
  }
  skillsAssessment: string
  
  // Metadata
  submittedAt: timestamp
  reviewedAt: timestamp | null
  reviewedBy: userId | null
  adminName: string | null
  rejectionReason: string | null
}
```

---

### 3. Admin Inquiry Management Dashboard
**Location:** `/app/admin/inquiries/page.tsx`

#### Features:
- **Access Control:** Restricted to users with `isAdmin: true` in userData
- **Status Filtering:** View inquiries by status (All, Pending, Under Review, Approved, Rejected)
- **Inquiry Cards:** Display applicant info, work verification status, submission date
- **Detail Modal:** Click card to view full inquiry details
- **Verification Actions:** Approve with offer letter or Reject with reason

#### Interface:
```typescript
// Filter by status
Status filters: All, Pending, Under Review, Approved, Rejected

// For each inquiry, display:
- Applicant name and location
- Contact info (email, phone)
- Work verification summary (checkmarks for each requirement)
- Submission date

// Detail view includes:
- Full contact information
- All work verification answers with check/cross icons
- Skills assessment full text
- Action buttons (Review & Verify)
```

#### Approval Workflow:
1. Manager/owner clicks "Review & Verify" on inquiry
2. Approval modal appears with optional reason text area
3. Manager confirms all details are correct and legally compliant
4. System processes approval:
   - Updates inquiry status to 'approved'
   - Generates unique Employee ID: `EMP-{timestamp}`
   - Updates user record with `isEmployee: true`, `employeeId`, `approvalDate`
   - Generates professional offer letter HTML
   - Sends offer letter email to applicant
5. Applicant receives email with offer and acceptance link

#### Rejection Workflow:
1. Manager/owner chooses "Reject" option
2. Enters rejection reason (required)
3. System processes rejection:
   - Updates inquiry status to 'rejected'
   - Sends rejection email with feedback to applicant
   - Stores rejection reason in Firestore for reference

---

### 4. Offer Letter Generation
**Location:** `/lib/offer-letter.ts`

#### Features:
- Professional HTML email template
- Branded Washlee design with colors and logo
- Includes employee ID prominently
- Details all terms and conditions
- Clear earnings structure ($3.00/kg + add-ons)
- Lists responsibilities and obligations
- Includes acceptance button with unique link

#### Generated Letter Includes:
- Employee ID and offer date
- Position & responsibilities
- Compensation structure
- Professional obligations
- Duration & termination terms
- Next steps with acceptance link
- Dashboard access info

#### Email Delivery:
Configured to support multiple email services:
- **Resend** (primary - recommended)
- **SendGrid** (SMTP integration)
- **Custom SMTP** (any provider)
- **Development mode** (logs to console)

---

### 5. Email Service System
**Location:** `/lib/email-service.ts`

#### Functions:
- `sendEmail(options)`: Generic email sending
- `sendOfferLetter()`: Send approval offer with letter
- `sendRejectionEmail()`: Send rejection with feedback

#### Configuration:
Set environment variables for email service:
```env
# Option 1: Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_SENDER_EMAIL=noreply@washlee.com

# Option 2: SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# Option 3: Custom SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
NEXT_PUBLIC_SENDER_EMAIL=noreply@washlee.com

# Option 4: Application URL (for offer link)
NEXT_PUBLIC_APP_URL=https://washlee.com
```

---

### 6. Offer Acceptance Page
**Location:** `/app/dashboard/employee/accept-offer/page.tsx`

#### Features:
- Secure offer acceptance flow
- Validates employee ID from URL parameter
- Shows offer terms summary
- Displays what employee gets access to
- Tracks acceptance in database
- Automatically redirects to employee dashboard

#### Process:
1. User clicks link in email: `https://app.washlee.com/dashboard/employee/accept-offer?employeeId=EMP-xxxxx`
2. Page displays offer details and acceptance form
3. User clicks "Accept Offer"
4. System updates user record with `offerAcceptedAt`, `employeeDashboardAccess: true`
5. Creates employee record in 'employees' collection
6. Redirects to `/dashboard/employee`

#### Success States:
- Shows green checkmark and welcome message
- Lists 4 key features employee now has access to
- Displays employee ID in prominent teal box
- Auto-redirects or provides dashboard button

---

## API Endpoints

### 1. Create Inquiry
**POST** `/api/inquiries/create`
```json
{
  "userId": "user-id",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+61412345678",
  "state": "NSW",
  "workVerification": {
    "hasWorkRight": true,
    "hasValidLicense": true,
    "hasTransport": true,
    "hasEquipment": true,
    "ageVerified": true
  },
  "skillsAssessment": "I have 5 years of professional laundry experience..."
}
```

**Response:**
```json
{
  "success": true,
  "inquiryId": "inquiry-doc-id"
}
```

### 2. List Inquiries
**GET** `/api/inquiries/list`

**Response:**
```json
{
  "inquiries": [
    {
      "id": "inquiry-id",
      "firstName": "John",
      "status": "pending",
      ...
    }
  ],
  "total": 5
}
```

### 3. Approve Inquiry
**POST** `/api/inquiries/approve`
```json
{
  "inquiryId": "inquiry-id",
  "adminId": "admin-user-id",
  "adminName": "Manager Name"
}
```

**Response:**
```json
{
  "success": true,
  "inquiryId": "inquiry-id",
  "employeeId": "EMP-1234567890",
  "emailSent": true
}
```

### 4. Reject Inquiry
**POST** `/api/inquiries/reject`
```json
{
  "inquiryId": "inquiry-id",
  "adminId": "admin-user-id",
  "adminName": "Manager Name",
  "rejectionReason": "Application doesn't meet requirements"
}
```

**Response:**
```json
{
  "success": true,
  "inquiryId": "inquiry-id",
  "emailSent": true
}
```

### 5. Accept Offer
**POST** `/api/offers/accept`
```json
{
  "employeeId": "EMP-1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "employeeId": "EMP-1234567890",
  "userId": "user-id",
  "message": "Offer accepted successfully"
}
```

---

## User Database Updates

### When Inquiry Submitted:
```
inquiries collection:
{
  id: auto-generated,
  status: "pending",
  submittedAt: current timestamp,
  ... all inquiry data
}
```

### When Inquiry Approved:
```
users/{userId}:
{
  isEmployee: true,
  employeeId: "EMP-timestamp",
  approvalDate: timestamp,
  approvedBy: adminUserId
}

inquiries/{inquiryId}:
{
  status: "approved",
  reviewedAt: timestamp,
  reviewedBy: adminUserId,
  adminName: "Manager Name"
}

employees/{employeeId}:
{
  userId: user-id,
  employeeId: "EMP-timestamp",
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  state: string,
  onboardedAt: timestamp,
  status: "active",
  approvedAt: timestamp
}
```

### When Offer Accepted:
```
users/{userId}:
{
  offerAcceptedAt: timestamp,
  employeeDashboardAccess: true,
  status: "active"
}
```

---

## Security & Access Control

### Authentication:
- Admin dashboard requires `user` and `userData.isAdmin === true`
- Redirects non-admin users to home page
- Uses AuthContext for user verification

### Authorization:
- Only users with `isAdmin` custom claim can access admin panel
- Firebase custom claims set via Firebase Admin SDK
- Inquiry approvals tracked by adminId and adminName

### Data Validation:
- Inquiry creation validates required fields (userId, email, phone)
- Phone duplicate checking via `/api/users/check-phone`
- Employment status tracked via `isEmployee` flag
- Employee ID generation uses timestamp for uniqueness

### Email Security:
- Offer links include employee ID as URL parameter
- 30-day expiration on acceptance links
- Sender email verified via environment variables
- HTML content properly escaped

---

## How to Use as Admin/Manager

### Accessing the Dashboard:
1. Ensure your account has `isAdmin: true` set in Firestore users collection
2. Log in to the application
3. Navigate to `/admin/inquiries`

### Reviewing Applications:
1. Filter by "Pending" status to see new applications
2. Click on an inquiry card to view full details
3. Review work verification answers and skills assessment
4. Click "Review & Verify"

### Approving Applications:
1. In approval modal, verify all information is correct
2. Click "Approve" button
3. System automatically:
   - Generates Employee ID (EMP-xxxxx)
   - Sends professional offer letter email
   - Updates user records
   - Grants employee dashboard access

### Rejecting Applications:
1. Enter reason for rejection (e.g., "Incomplete driver's license verification")
2. Click "Reject"
3. System sends rejection email with your feedback

---

## Testing the System

### Step 1: Submit Inquiry
1. Go to `/auth/pro-signup-form`
2. Complete all 8 steps
3. Answer "YES" to all workplace verification questions
4. Enter skills assessment (50+ chars)
5. Click submit
6. See success message

### Step 2: Review in Admin Panel
1. Log in with admin account (isAdmin: true)
2. Go to `/admin/inquiries`
3. See new inquiry in "Pending" section
4. Click to view details

### Step 3: Approve & Send Offer
1. Click "Review & Verify"
2. Click "Approve"
3. Check admin user's email (in dev, logs to console)
4. Should contain offer letter with employee ID

### Step 4: Accept Offer
1. Copy employee ID from logs
2. Go to `/dashboard/employee/accept-offer?employeeId=EMP-xxxxx`
3. Click "Accept Offer"
4. See success screen
5. Auto-redirects to employee dashboard

---

## Email Configuration Guide

### Using Resend (Recommended):
1. Create account at https://resend.com
2. Get API key from dashboard
3. Add to `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_SENDER_EMAIL=noreply@washlee.com
```

### Using SendGrid:
1. Create account at https://sendgrid.com
2. Create API key
3. Add to `.env.local`:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
NEXT_PUBLIC_SENDER_EMAIL=noreply@washlee.com
```

### Using Custom SMTP (Gmail, Brevo, etc.):
1. Get SMTP credentials from email provider
2. Add to `.env.local`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NEXT_PUBLIC_SENDER_EMAIL=your-email@gmail.com
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

---

## Files Created/Modified

### New Files Created:
1. `/app/admin/inquiries/page.tsx` - Admin dashboard
2. `/app/api/inquiries/create/route.ts` - Submission API
3. `/app/api/inquiries/list/route.ts` - List API
4. `/app/api/inquiries/approve/route.ts` - Approval API
5. `/app/api/inquiries/reject/route.ts` - Rejection API
6. `/app/api/offers/accept/route.ts` - Offer acceptance API
7. `/app/dashboard/employee/accept-offer/page.tsx` - Acceptance page
8. `/lib/offer-letter.ts` - Offer letter template
9. `/lib/email-service.ts` - Email service layer

### Files Modified:
1. `/app/auth/pro-signup-form/page.tsx` - Added steps 6-7 with inquiry form

### File Dependencies:
- Uses existing `/lib/firebase-admin.ts` for Firestore access
- Uses existing `/lib/AuthContext.tsx` for admin authentication
- Uses existing components: Header, Footer, Button, Card, Spinner
- Requires `nodemailer` package for email delivery

---

## Next Steps / Future Enhancements

1. **Employee Dashboard** (`/app/dashboard/employee`)
   - View assigned jobs
   - Track earnings and payouts
   - Update profile and preferences
   - Access help/support

2. **Analytics**
   - Track approval/rejection rates
   - Monitor employee performance
   - Generate recruitment reports

3. **Background Verification**
   - Integration with verification service
   - Document upload for license/ID
   - Automated checks

4. **Payment Management**
   - Bank details verification
   - Automatic weekly payouts
   - Tax document generation (1099/STP)

5. **Communication Hub**
   - Messages between employees and management
   - Notifications for new jobs
   - Performance feedback system

---

## Troubleshooting

### Inquiry Not Submitting
- Check that user is logged in (userId set)
- Verify all required fields are filled
- Check browser console for error messages
- Ensure Firestore security rules allow writes to 'inquiries' collection

### Admin Can't Access Dashboard
- Verify `isAdmin: true` is set on user record
- Log out and back in to refresh custom claims
- Check that uid matches between Auth and Firestore

### Email Not Sending
- Check email service configuration in `.env.local`
- Verify `NEXT_PUBLIC_SENDER_EMAIL` is set
- For Resend: check API key is valid
- For SMTP: test credentials separately
- Check application server logs for email errors

### Offer Link Not Working
- Verify employee ID in URL matches database
- Check URL format: `/dashboard/employee/accept-offer?employeeId=EMP-xxxxx`
- Ensure link hasn't expired (30 days)
- Check that offer was actually approved in admin panel

---

**Last Updated:** January 2026
**Version:** 1.0 - Complete Implementation
