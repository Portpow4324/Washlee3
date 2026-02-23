# Employee Inquiry System - Visual Diagrams & Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     WASHLEE PRO INQUIRY SYSTEM                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐         ┌─────────────────────────┐
│   APPLICANT FLOW        │         │   MANAGER/OWNER FLOW    │
├─────────────────────────┤         ├─────────────────────────┤
│ 1. Login/Signup         │         │ 1. Login as Admin       │
│ 2. Start Pro App        │         │ 2. View Dashboard       │
│ 3. Fill Form (0-7)      │         │ 3. Review Inquiries     │
│ 4. Submit Inquiry       │         │ 4. Verify & Decide      │
│ 5. Receive Email        │         │ 5. Send Offer/Reject    │
│ 6. Click Accept Link    │         │                         │
│ 7. Accept Offer         │         │                         │
│ 8. Access Dashboard     │         │                         │
└─────────────────────────┘         └─────────────────────────┘
         ↓                                      ↑
         └──────── DATABASE (Firestore) ───────┘

```

---

## Data Flow Diagram

```
APPLICANT SIDE                          ADMIN SIDE
═══════════════════════════════════════════════════════════════════

┌─────────────────────┐
│  Pro Signup Form    │
│  Steps 0-5          │
│  + Step 6 (Legal)   │
│  + Step 7 (Skills)  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Validation         │
│  ✓ All fields OK    │
│  ✓ Step 6 ALL YES   │
│  ✓ Step 7 ≥50 chars │
└──────────┬──────────┘
           │
           ↓
    ┌──────────────┐
    │ POST REQUEST │
    │ /api/        │
    │ inquiries/   │
    │ create       │
    └──────┬───────┘
           │
           ├─────────────────────────────────┐
           │                                 │
           ↓                                 ↓
    ┌─────────────┐              ┌───────────────────┐
    │ Firestore   │              │ User UI Feedback  │
    │ Save to:    │              │ "Thanks for       │
    │ /inquiries/ │              │ Applying!"        │
    │ {docId}     │              │ Status: Pending   │
    └─────────────┘              └───────────────────┘

═══════════════════════════════════════════════════════════════════

                    ADMIN DASHBOARD
                    ═════════════════

    /admin/inquiries (isAdmin ONLY)
             ↓
    ┌───────────────────────────────┐
    │ List All Inquiries            │
    │ + Status Filter Buttons       │
    │ + Cards with Summary          │
    └───────────────────────────────┘
             ↓
    Click Card → Detail Modal
             ↓
    ┌───────────────────────────────┐
    │ Show Full Details:            │
    │ • Contact info                │
    │ • Work verification answers   │
    │ • Skills assessment text      │
    │ • Review & Verify button      │
    └───────────────────────────────┘
             ↓
    ┌─────────────────────────────────────┐
    │ Click Review & Verify              │
    │ → Approval Modal                    │
    └─────────────────────────────────────┘
         ↙         ↘
    APPROVE      REJECT
        ↓            ↓
    ┌────────┐   ┌──────────────────┐
    │ Yes:   │   │ No:              │
    │ ✓      │   │ Enter reason     │
    │ Send   │   │ Click Reject     │
    │ Offer  │   └──────────┬───────┘
    └────┬───┘             │
         │                 │
         ├─────────────────┤
         ↓                 ↓
    ┌──────────────────────────────┐
    │ Firestore Update:            │
    │ • Status → approved/rejected │
    │ • reviewedAt → timestamp     │
    │ • reviewedBy → admin UID     │
    │ • rejectionReason (if reject)│
    └──────────────────────────────┘
         │
         ├─────────────────────────┐
         ↓ (if APPROVED)          ↓ (if REJECTED)
    ┌────────────────────┐   ┌──────────────┐
    │ Generate Employee  │   │ Send Email   │
    │ ID: EMP-timestamp  │   │ Rejection    │
    └────────┬───────────┘   └──────────────┘
             │
             ↓
    ┌────────────────────┐
    │ Generate Offer     │
    │ Letter HTML        │
    └────────┬───────────┘
             │
             ↓
    ┌────────────────────────────────┐
    │ Send Email:                    │
    │ • To: applicant@email          │
    │ • Subject: Congratulations!    │
    │ • Body: Offer letter HTML      │
    │ • Link: /dashboard/employee/   │
    │   accept-offer?employeeId=     │
    │   EMP-xxxx                     │
    └────────┬───────────────────────┘
             │
             ↓
    ┌────────────────────┐
    │ Applicant Receives │
    │ Email + Link       │
    └────────┬───────────┘
             │
             ↓
    UPDATE USER RECORD:
    • isEmployee: true
    • employeeId: EMP-xxxx
    • approvalDate: timestamp

═══════════════════════════════════════════════════════════════════

APPLICANT ACCEPTANCE
════════════════════════════════════════════════════════════════════

Click Email Link:
/dashboard/employee/accept-offer?employeeId=EMP-xxxx
             ↓
┌──────────────────────────────────┐
│ Offer Acceptance Page            │
│ • Show terms summary             │
│ • Display Employee ID            │
│ • List benefits & access         │
│ • Accept/Decline buttons         │
└──────────────────────────────────┘
             ↓
        Click ACCEPT
             ↓
    ┌─────────────────────────────────┐
    │ /api/offers/accept              │
    │ • Find user by employeeId       │
    │ • Update user record:           │
    │   - offerAcceptedAt: timestamp  │
    │   - employeeDashboardAccess:    │
    │     true                        │
    │   - status: active              │
    │ • Create employee record        │
    └─────────────────────────────────┘
             ↓
    ┌─────────────────────────────────┐
    │ Show Success Screen:            │
    │ ✓ Offer Accepted!              │
    │ • Employee ID in bold           │
    │ • 4 Access benefits listed      │
    │ • Redirect to /dashboard/       │
    │   employee                      │
    └─────────────────────────────────┘
             ↓
    ┌─────────────────────────────────┐
    │ Employee Dashboard Access       │
    │ Ready to view jobs & earn       │
    └─────────────────────────────────┘
```

---

## Database Collection Structure

```
FIRESTORE DATABASE
══════════════════════════════════════════════════════════════════

Collection: inquiries
───────────────────────────────────────────────────────────────────
│
├─ Document: inquiry_001
│  ├─ userId: "user-uid-123"
│  ├─ firstName: "John"
│  ├─ lastName: "Doe"
│  ├─ email: "john@example.com"
│  ├─ phone: "+61412345678"
│  ├─ state: "NSW"
│  ├─ status: "pending" | "approved" | "rejected"
│  ├─ workVerification: {
│  │  ├─ hasWorkRight: true
│  │  ├─ hasValidLicense: true
│  │  ├─ hasTransport: true
│  │  ├─ hasEquipment: true
│  │  └─ ageVerified: true
│  ├─ skillsAssessment: "I have 5 years of..."
│  ├─ submittedAt: 2024-01-15T10:30:00Z
│  ├─ reviewedAt: 2024-01-15T14:45:00Z (null until reviewed)
│  ├─ reviewedBy: "admin-uid-456" (null until reviewed)
│  ├─ adminName: "Jane Smith" (null until reviewed)
│  └─ rejectionReason: null (only if rejected)
│
└─ Document: inquiry_002
   └─ ... similar structure ...


Collection: users
───────────────────────────────────────────────────────────────────
│
├─ Document: user-uid-123
│  ├─ (existing fields)
│  ├─ uid: "user-uid-123"
│  ├─ email: "john@example.com"
│  ├─ name: "John Doe"
│  ├─ userType: "pro"
│  │
│  ├─ (NEW FIELDS ADDED AFTER APPROVAL)
│  ├─ isEmployee: true
│  ├─ employeeId: "EMP-1704067845123"
│  ├─ approvalDate: 2024-01-15T14:45:00Z
│  ├─ approvedBy: "admin-uid-456"
│  │
│  ├─ (NEW FIELDS AFTER ACCEPTANCE)
│  ├─ offerAcceptedAt: 2024-01-15T16:20:00Z
│  ├─ employeeDashboardAccess: true
│  └─ status: "active"
│
└─ Document: user-uid-124
   └─ ... similar structure ...


Collection: employees
───────────────────────────────────────────────────────────────────
│
├─ Document: EMP-1704067845123
│  ├─ userId: "user-uid-123"
│  ├─ employeeId: "EMP-1704067845123"
│  ├─ firstName: "John"
│  ├─ lastName: "Doe"
│  ├─ email: "john@example.com"
│  ├─ phone: "+61412345678"
│  ├─ state: "NSW"
│  ├─ onboardedAt: 2024-01-15T16:20:00Z
│  ├─ status: "active" | "inactive"
│  └─ approvedAt: 2024-01-15T14:45:00Z
│
└─ Document: EMP-1704067845124
   └─ ... similar structure ...

```

---

## Request/Response Flow

```
╔════════════════════════════════════════════════════════════════╗
║                   STEP 1: SUBMIT INQUIRY                       ║
╚════════════════════════════════════════════════════════════════╝

BROWSER (Client)                    NEXT.JS API
─────────────────────────────────────────────────────────────────

POST /api/inquiries/create
{
  "userId": "user-123",
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
  "skillsAssessment": "I have 5 years..."
}                                   ──────→ Process & Validate
                                            ↓
                                    Query Firestore:
                                    Check duplicate
                                    active inquiries
                                            ↓
                                    Save to /inquiries
                                    Create new document
                                            ↓
                    ←──────────── Response:
{                                   {
  "success": true,                    "success": true,
  "inquiryId": "kJ9xL2mN..."          "inquiryId": "doc-id"
}                                   }
                    
Show Success Message


╔════════════════════════════════════════════════════════════════╗
║                   STEP 2: ADMIN APPROVAL                        ║
╚════════════════════════════════════════════════════════════════╝

ADMIN BROWSER                       NEXT.JS API
─────────────────────────────────────────────────────────────────

GET /api/inquiries/list ─────→ Query Firestore
                               Get all inquiries
                               Sort by submittedAt
                    ←─────── Return array of inquiries
Display list with filters

Click Approve ───────→ POST /api/inquiries/approve
                      {
                        "inquiryId": "doc-id",
                        "adminId": "admin-uid",
                        "adminName": "Jane Smith"
                      }
                               ↓
                      Update Firestore:
                      • status → "approved"
                      • reviewedAt → now
                      • reviewedBy → admin-uid
                      
                      Generate Employee ID:
                      EMP-{timestamp}
                      
                      Update user record:
                      • isEmployee: true
                      • employeeId: EMP-xxxx
                      
                      Generate HTML offer letter
                      
                      Send email via nodemailer
                      ↓
                    ←─────── Response:
{                              {
  "success": true,               "success": true,
  "employeeId": "EMP-xxxx",      "employeeId": "EMP-xxxx",
  "emailSent": true              "emailSent": true
}                              }

Update UI - Show as "Approved"


╔════════════════════════════════════════════════════════════════╗
║                 STEP 3: APPLICANT ACCEPTS OFFER                 ║
╚════════════════════════════════════════════════════════════════╝

APPLICANT BROWSER               NEXT.JS API
─────────────────────────────────────────────────────────────────

Click email link:
/dashboard/employee/accept-offer
?employeeId=EMP-xxxx

Display offer page

Click "Accept Offer" ────→ POST /api/offers/accept
                          {
                            "employeeId": "EMP-xxxx"
                          }
                               ↓
                          Query Firestore:
                          Find user by employeeId
                          
                          Update user record:
                          • offerAcceptedAt → now
                          • employeeDashboardAccess → true
                          • status → "active"
                          
                          Create employee record
                          ↓
                    ←──────── Response:
{                            {
  "success": true,             "success": true,
  "employeeId": "EMP-xxxx",    "userId": "user-123",
  "message": "Offer accepted"  "message": "Success"
}                            }

Show success screen
Auto-redirect to
/dashboard/employee

```

---

## State Machine Diagram

```
                        ┌──────────┐
                        │  Created │
                        │ (Form OK)│
                        └────┬─────┘
                             │
                             ↓
                      ┌─────────────┐
         ┌───────────→│   Pending   │←───────────┐
         │            │  (Awaiting  │            │
         │            │   Review)   │            │
         │            └─────────────┘            │
         │                 │                     │
         │                 │ Admin clicks        │
         │                 │ Review & Verify     │
         │                 ↓                     │
         │            ┌─────────────┐            │
    No More           │Under Review │            │
    Action            │             │            │
                      └─────────────┘            │
         │                 │                     │
         │                 │ Admin Decision      │
         │                 │                     │
         │        ┌────────┴────────┐            │
         │        │                 │            │
         │        ↓                 ↓            │
         │   ┌─────────┐      ┌──────────┐      │
         │   │Approved │      │ Rejected │      │
         │   │(Offer   │      │(Email    │      │
         │   │ Sent)   │      │ Sent)    │      │
         │   └────┬────┘      └──────────┘      │
         │        │                             │
         │        │ Email sent to applicant     │
         │        │                             │
         │        ↓                             │
         │   ┌──────────────┐                   │
         │   │ Awaiting     │                   │
         │   │ Acceptance   │                   │
         │   │ (30-day link)│                   │
         │   └────┬─────────┘                   │
         │        │                             │
         │        │ Applicant clicks link       │
         │        │ & accepts offer             │
         │        ↓                             │
         │   ┌──────────────┐                   │
         │   │ Offer        │                   │
         │   │ Accepted ✓   │                   │
         │   │ Dashboard    │                   │
         │   │ Access OK    │                   │
         │   └──────────────┘                   │
         │        ↑ Success!                    │
         │        │                             │
         └────────┴─────────────────────────────┘
              Retry or
              Reapply Later

```

---

## Email Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    EMAIL SERVICE LAYER                        │
│                  /lib/email-service.ts                        │
└──────────────────────────────────────────────────────────────┘

┌─ INITIALIZATION ─────────────────────────────────────────────┐
│                                                               │
│  initializeTransporter()                                      │
│  ├─ Check RESEND_API_KEY ──→ Use Resend SMTP               │
│  ├─ Check SENDGRID_API_KEY ──→ Use SendGrid                │
│  ├─ Check SMTP_* vars ──→ Use Custom SMTP                  │
│  └─ Fallback ──→ Development console logging                │
│                                                               │
└────────────────────────────────────────────────────────────┘

┌─ SENDING FUNCTIONS ──────────────────────────────────────────┐
│                                                               │
│  sendEmail(options)                                           │
│  ├─ Generic email sender                                     │
│  └─ Used by all specific senders                             │
│                                                               │
│  sendOfferLetter(email, name, html, id)                     │
│  ├─ Called after admin approval                              │
│  ├─ Sends professional offer letter                          │
│  └─ Includes 30-day acceptance link                          │
│                                                               │
│  sendRejectionEmail(email, name, reason)                    │
│  ├─ Called after admin rejection                             │
│  ├─ Includes reason for feedback                             │
│  └─ Professional template                                    │
│                                                               │
└────────────────────────────────────────────────────────────┘

┌─ EMAIL FLOW ─────────────────────────────────────────────────┐
│                                                               │
│  Admin Action                                                 │
│  (Approve/Reject)                                             │
│         │                                                     │
│         ↓                                                     │
│  API Route                                                    │
│  (/api/inquiries/approve)                                    │
│         │                                                     │
│         ├─ Update Firestore                                   │
│         ├─ Generate Employee ID (if approve)                  │
│         ├─ Generate Offer HTML (if approve)                   │
│         │                                                     │
│         ↓                                                     │
│  Call sendOfferLetter() or sendRejectionEmail()             │
│         │                                                     │
│         ↓                                                     │
│  Initialize Transporter                                       │
│  (if not already)                                             │
│         │                                                     │
│         ├─ Resend? ──→ SMTP: smtp.resend.com                │
│         ├─ SendGrid? ──→ SendGrid API                        │
│         ├─ SMTP? ──→ Custom SMTP server                      │
│         └─ Dev? ──→ Console.log                              │
│         │                                                     │
│         ↓                                                     │
│  Send Email                                                   │
│         │                                                     │
│         ├─ From: NEXT_PUBLIC_SENDER_EMAIL                    │
│         ├─ To: applicant@email                                │
│         ├─ Subject: Professional subject                      │
│         ├─ Body: HTML template                                │
│         └─ Return: success boolean                            │
│         │                                                     │
│         ↓                                                     │
│  Log Results                                                  │
│  [Email] Sending/Sent/Failed                                 │
│         │                                                     │
│         ↓                                                     │
│  Return to API Route                                          │
│  (Continue with next steps)                                   │
│                                                               │
└────────────────────────────────────────────────────────────┘

```

---

## Security & Access Control

```
┌─────────────────────────────────────────────────────────────┐
│              ACCESS CONTROL ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────┘

PUBLIC PAGES (No Auth Required)
├─ /auth/login
├─ /auth/signup
├─ /auth/pro-signup-form (Only for logged-in users)
├─ / (homepage)
└─ ... all public pages ...


CUSTOMER PAGES (Logged-in Users Only)
├─ /dashboard/customer
├─ /dashboard/profile
└─ /booking


ADMIN-ONLY PAGES (isAdmin: true Required)
├─ /admin/inquiries
├─ /admin/dashboard
└─ ... other admin pages ...

    ↓
    
CHECKING ADMIN STATUS:
    ├─ Firebase Custom Claims: admin: true
    │  (Set in Firebase Console or Admin SDK)
    │
    ├─ Firestore User Document: isAdmin: true
    │  (Fallback/redundant check)
    │
    └─ AuthContext.userData.isAdmin
       (Checked in page component)


FLOW:
┌──────────────────┐
│ User navigates   │
│ to /admin/page   │
└────────┬─────────┘
         │
         ↓
    Check AuthContext
    ├─ Is user logged in?
    ├─ Does userData exist?
    └─ Is userData.isAdmin === true?
         │
         ├─ YES ──→ Show admin page
         │
         └─ NO ──→ router.push('/') [redirect home]


API ENDPOINT SECURITY:
├─ Inquiry creation: Validates userId matches auth user
├─ Admin actions: Requires isAdmin custom claim
│  (Firebase Admin SDK checks this automatically)
├─ Offer acceptance: Validates employee ID exists
└─ All endpoints: Firestore security rules


FIRESTORE RULES (Must be configured):
├─ read/write /inquiries: admin == true
├─ create /inquiries: user owns the doc (userId == auth.uid)
├─ read /users/{uid}: auth.uid == uid or admin == true
└─ write /users/{uid}: auth.uid == uid or admin == true

```

---

## Component Integration Map

```
┌──────────────────────────────────────────────────────────────┐
│            SYSTEM COMPONENTS & DEPENDENCIES                  │
└──────────────────────────────────────────────────────────────┘

SHARED COMPONENTS (Existing)
├─ Header (Navigation)
├─ Footer (Site footer)
├─ Button (Reusable button)
├─ Card (Reusable card)
└─ Spinner (Loading indicator)


NEW COMPONENTS
├─ /app/admin/inquiries/page.tsx
│  ├─ Uses: Header, Footer, Button, Card, Spinner
│  ├─ Calls: /api/inquiries/list, /api/inquiries/approve, /api/inquiries/reject
│  ├─ Auth: AuthContext (requires isAdmin)
│  └─ State: Modal, filtering, loading states
│
├─ /app/auth/pro-signup-form/page.tsx (MODIFIED)
│  ├─ Added: Steps 6-7 (work verification + skills)
│  ├─ Uses: Header, Footer, Button, Card
│  ├─ Calls: /api/inquiries/create
│  ├─ Auth: AuthContext (requires logged-in user)
│  └─ Validation: Step-by-step validation rules
│
└─ /app/dashboard/employee/accept-offer/page.tsx
   ├─ Uses: Header, Footer, Button, Card, Spinner
   ├─ Calls: /api/offers/accept
   ├─ Auth: None (uses employeeId from URL)
   └─ State: Success/error states


API LAYER
├─ /api/inquiries/create/route.ts
│  ├─ Firebase: admin.firestore()
│  ├─ Validates: userId, email, phone
│  ├─ Checks: Duplicate active inquiries
│  └─ Stores: To /inquiries collection
│
├─ /api/inquiries/list/route.ts
│  ├─ Firebase: admin.firestore()
│  ├─ Query: All inquiries, sorted by date
│  └─ Returns: Array of inquiry docs
│
├─ /api/inquiries/approve/route.ts
│  ├─ Firebase: admin.firestore()
│  ├─ Updates: inquiry status → approved
│  ├─ Calls: generateOfferLetterHTML()
│  ├─ Calls: sendOfferLetter()
│  └─ Updates: user record with employeeId
│
├─ /api/inquiries/reject/route.ts
│  ├─ Firebase: admin.firestore()
│  ├─ Updates: inquiry status → rejected
│  ├─ Stores: rejectionReason
│  └─ Calls: sendRejectionEmail()
│
└─ /api/offers/accept/route.ts
   ├─ Firebase: admin.firestore()
   ├─ Query: Find user by employeeId
   ├─ Updates: user record & employee status
   └─ Creates: employee document


UTILITY LIBRARIES
├─ /lib/offer-letter.ts
│  ├─ Function: generateOfferLetterHTML()
│  ├─ Returns: Professional HTML email template
│  └─ Used by: /api/inquiries/approve
│
├─ /lib/email-service.ts
│  ├─ Functions:
│  │  ├─ sendEmail() - Generic sender
│  │  ├─ sendOfferLetter() - Offer email
│  │  └─ sendRejectionEmail() - Rejection email
│  ├─ Providers: Resend, SendGrid, SMTP, Dev
│  ├─ Uses: nodemailer package
│  └─ Used by: /api/inquiries/approve, reject
│
└─ /lib/firebase-admin.ts (Existing)
   ├─ Initializes: Firebase Admin SDK
   └─ Used by: All API routes


EXTERNAL DEPENDENCIES
├─ firebase-admin (Admin SDK)
├─ nodemailer (Email sending)
├─ lucide-react (Icons)
├─ next/router (Navigation)
└─ react (Core framework)


DATABASE
├─ Firebase Auth (Authentication)
├─ Firestore (Data storage)
│  ├─ /inquiries collection
│  ├─ /users collection
│  └─ /employees collection
└─ Firestore Security Rules (Authorization)

```

---

This comprehensive visual documentation helps understand the complete system architecture, data flows, and component interactions.

**For more details, see:** EMPLOYEE_INQUIRY_SYSTEM_COMPLETE.md
