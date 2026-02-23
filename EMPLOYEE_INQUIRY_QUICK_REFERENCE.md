# Employee Inquiry System - Quick Reference

Quick lookup guide for the complete employee inquiry and verification system.

---

## 🚀 Quick Start (5 Minutes)

### 1. Set Up Admin Account
```bash
# Go to Firebase Console → Authentication → Users → Custom Claims
# Add: { "admin": true }
```

### 2. Configure Email Service
```bash
# Choose one option in .env.local:

# Option A: Resend (Recommended)
RESEND_API_KEY=re_your_key_here
NEXT_PUBLIC_SENDER_EMAIL=noreply@washlee.com

# Option B: SendGrid
SENDGRID_API_KEY=SG.your_key_here

# Option C: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=your_app_password
```

### 3. Install Dependencies
```bash
npm install nodemailer
```

### 4. Test the System
1. Submit inquiry at `/auth/pro-signup-form`
2. Approve at `/admin/inquiries` (as admin)
3. Accept at `/dashboard/employee/accept-offer?employeeId=EMP-xxxxx`

---

## 📁 File Locations

### User-Facing Pages
- **Pro Signup Form:** `/app/auth/pro-signup-form/page.tsx`
- **Offer Acceptance:** `/app/dashboard/employee/accept-offer/page.tsx`

### Admin Pages
- **Admin Dashboard:** `/app/admin/inquiries/page.tsx`

### API Endpoints
- **Submit Inquiry:** POST `/api/inquiries/create`
- **List Inquiries:** GET `/api/inquiries/list`
- **Approve Inquiry:** POST `/api/inquiries/approve`
- **Reject Inquiry:** POST `/api/inquiries/reject`
- **Accept Offer:** POST `/api/offers/accept`

### Supporting Libraries
- **Offer Letter:** `/lib/offer-letter.ts`
- **Email Service:** `/lib/email-service.ts`

---

## 📋 Form Structure

### Pro-Signup Form Steps
```
Step 0: Name (first, last)
Step 1: Location (state)
Step 2: Availability (days, hours)
Step 3: Services (hang dry, delicates, etc.)
Step 4: Comments (optional)
Step 5: Confirmation
Step 6: Work Verification (5 YES/NO questions) ← NEW
Step 7: Skills Assessment (50+ char textarea) ← NEW
```

### Work Verification Questions (Step 6)
1. Right to work in Australia? ✓ YES required
2. Valid driver's license & 18+? ✓ YES required
3. Reliable transportation? ✓ YES required
4. Access to laundry equipment? ✓ YES required
5. Info accuracy confirmed? ✓ YES required

**Validation:** ALL must be YES to proceed

### Skills Assessment (Step 7)
- Text area for laundry experience
- Minimum 50 characters required

---

## 🎯 User Flows

### Flow 1: Submit Inquiry (Applicant)
```
1. Go to /auth/pro-signup-form
2. Complete steps 0-7
3. Submit form
4. See success message: "Thanks for Applying!"
5. Wait for admin review (24-48 hours)
```

### Flow 2: Review & Approve (Admin)
```
1. Go to /admin/inquiries
2. Filter by "Pending"
3. Click inquiry card to view details
4. Click "Review & Verify"
5. Click "Approve" (no reason needed)
6. System sends offer email automatically
7. Check "Approved" filter to confirm
```

### Flow 3: Reject Application (Admin)
```
1. Go to /admin/inquiries
2. Click inquiry card
3. Click "Review & Verify"
4. Enter rejection reason
5. Click "Reject"
6. System sends rejection email
7. Check "Rejected" filter to confirm
```

### Flow 4: Accept Offer (Applicant)
```
1. Click link in offer email
2. URL: /dashboard/employee/accept-offer?employeeId=EMP-xxxxx
3. Review offer terms
4. Click "Accept Offer"
5. See success screen
6. Access employee dashboard
```

---

## 💾 Database Schema

### Inquiry Document
```
/inquiries/{inquiryId}
├── userId: string
├── firstName: string
├── lastName: string
├── email: string
├── phone: string
├── state: string
├── status: "pending|under-review|approved|rejected"
├── workVerification: {
│   ├── hasWorkRight: boolean
│   ├── hasValidLicense: boolean
│   ├── hasTransport: boolean
│   ├── hasEquipment: boolean
│   └── ageVerified: boolean
├── skillsAssessment: string
├── submittedAt: timestamp
├── reviewedAt: timestamp (null until reviewed)
├── reviewedBy: userId (null until reviewed)
├── adminName: string (null until reviewed)
└── rejectionReason: string (only if rejected)
```

### User Updates
```
/users/{userId}
├── isEmployee: boolean
├── employeeId: "EMP-1234567890"
├── approvalDate: timestamp
├── approvedBy: userId
├── offerAcceptedAt: timestamp (null until accepted)
└── employeeDashboardAccess: boolean
```

### Employee Document
```
/employees/{employeeId}
├── userId: string
├── employeeId: "EMP-1234567890"
├── firstName: string
├── lastName: string
├── email: string
├── phone: string
├── state: string
├── onboardedAt: timestamp
├── status: "active|inactive"
└── approvedAt: timestamp
```

---

## 🔑 Key Features

| Feature | Location | Access |
|---------|----------|--------|
| Submit Inquiry | `/auth/pro-signup-form` | All logged-in users |
| View Own Status | (Future) | Inquiry creators |
| Review Inquiries | `/admin/inquiries` | Admin only (`isAdmin: true`) |
| Approve/Reject | `/admin/inquiries` | Admin only |
| Accept Offer | `/dashboard/employee/accept-offer` | Approved applicants |
| Employee Dashboard | `/dashboard/employee` | Accepted applicants |

---

## ✉️ Email Templates

### Offer Letter Email
- **To:** Applicant email
- **Subject:** "Congratulations! Washlee Pro Offer - Employee ID EMP-xxxxx"
- **Content:**
  - Professional branded HTML
  - Employee details
  - Role & responsibilities
  - Compensation ($3/kg + add-ons)
  - Terms & conditions
  - Acceptance button/link

### Rejection Email
- **To:** Applicant email
- **Subject:** "Washlee Pro Application Update"
- **Content:**
  - Professional HTML
  - Rejection reason
  - Encouragement to reapply

---

## 🔒 Security Features

- ✅ Admin access control via custom claims
- ✅ User can only create own inquiry
- ✅ Admin-only approval/rejection
- ✅ Unique Employee IDs per applicant
- ✅ Phone duplicate checking
- ✅ Email validation before sending
- ✅ Offer links expire after 30 days
- ✅ Firestore security rules (rules must be configured)

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Can't access admin panel | Not admin user | Set `isAdmin: true` in custom claims |
| Email not sending | Email not configured | Add email service to `.env.local` |
| Form won't submit | Validation error | Check all required fields, read console |
| Approval succeeds but no email | Email service down | Check API keys and credentials |
| Offer link doesn't work | Wrong Employee ID | Copy exact ID from email or logs |
| Can't see inquiries | Security rules | Configure Firestore rules for admins |

---

## 📊 Status Values

```
status can be:
├── "pending" - newly submitted, awaiting admin review
├── "under-review" - admin is reviewing
├── "approved" - approved, offer sent to applicant
└── "rejected" - rejected, rejection email sent
```

---

## 🔄 API Response Examples

### Create Inquiry
```json
{
  "success": true,
  "inquiryId": "kJ9xL2mN8pQ5vR3s"
}
```

### Approve Inquiry
```json
{
  "success": true,
  "inquiryId": "kJ9xL2mN8pQ5vR3s",
  "employeeId": "EMP-1704067845123",
  "emailSent": true
}
```

### Accept Offer
```json
{
  "success": true,
  "employeeId": "EMP-1704067845123",
  "userId": "user-uid-here",
  "message": "Offer accepted successfully"
}
```

---

## 🚦 Employee ID Format

```
EMP-{timestamp}
Example: EMP-1704067845123

Generated when:
- Admin approves inquiry
- Automatically sent in offer email
- Applicant uses in acceptance link
```

---

## 📱 Responsive Design

All pages are mobile-responsive:
- ✅ Admin dashboard works on mobile
- ✅ Offer acceptance page mobile-friendly
- ✅ Pro-signup form optimized for all devices

---

## 🔧 Configuration Checklist

- [ ] Nodemailer installed (`npm install nodemailer`)
- [ ] Admin user has `isAdmin: true` custom claim
- [ ] Email service configured (Resend/SendGrid/SMTP)
- [ ] `NEXT_PUBLIC_SENDER_EMAIL` set in `.env.local`
- [ ] `NEXT_PUBLIC_APP_URL` set for offer links
- [ ] Firestore security rules configured for admin access
- [ ] Inquiry form steps 6-7 visible in form
- [ ] API endpoints accessible
- [ ] Email templates display correctly

---

## 📞 Contact

For questions about:
- **Installation:** See EMPLOYEE_INQUIRY_SYSTEM_COMPLETE.md
- **Testing:** See EMPLOYEE_INQUIRY_TESTING_GUIDE.md
- **Admin Setup:** See ADMIN_SETUP_EMPLOYEE_INQUIRY.md
- **Email Config:** See email service section in COMPLETE doc

---

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ Complete & Ready for Testing
