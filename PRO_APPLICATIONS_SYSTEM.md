# Pro Applications Management System

## Overview

This document outlines the complete Pro Applications management system for Washlee, which allows admins to review, verify, and approve service provider applications before they can access the Pro Dashboard and start receiving jobs.

## System Architecture

### User Flow

```
1. Pro Signup Form (app/auth/pro-signup-form/page.tsx)
   ↓
2. Application Submitted to Firestore
   ↓
3. Admin Reviews in /admin/pro-applications
   ↓
4. Admin Completes Verification Checklist
   ↓
5. Admin Generates Employee ID
   ↓
6. Admin Approves Application
   ↓
7. User Marked as isEmployee: true in Firebase
   ↓
8. User Can Access Pro Dashboard (/dashboard/pro)
```

### Database Collections

#### `inquiries` Collection
Stores pro application submissions with all verification data.

**Schema:**
```typescript
{
  id: string                          // Document ID (auto-generated)
  userId: string                      // Firebase UID
  firstName: string
  lastName: string
  email: string
  phone: string
  state: string                       // Australian state
  
  // Work Verification
  workVerification: {
    hasWorkRight: boolean             // Work authorization
    hasValidLicense: boolean          // Driver's license or ID
    hasTransport: boolean             // Has vehicle/transport
    hasEquipment: boolean             // Has laundry equipment
    ageVerified: boolean              // 18+ years old
  }
  
  // Assessment & Availability
  skillsAssessment: string            // Text response (min 50 chars)
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  comments: string                    // Additional comments
  
  // Status Tracking
  status: 'pending' | 'under-review' | 'approved' | 'rejected'
  submittedAt: Timestamp
  reviewedAt: Timestamp               // When admin reviewed
  reviewedBy: string                  // Admin UID
  rejectionReason?: string
  
  // Admin Verification
  verificationChecklist?: {
    idVerified: boolean               // ID check complete
    contactVerified: boolean          // Contact info verified
    workRightsVerified: boolean       // Work authorization checked
    backgroundCheckPassed: boolean    // Background check passed
    documentsReviewed: boolean        // All docs reviewed
  }
  
  // Employee Assignment
  employeeId?: string                 // Assigned upon approval
  approvalDate?: Timestamp
}
```

#### `users` Collection
Updated when application is approved.

**Modified Fields on Approval:**
```typescript
{
  isEmployee: boolean                 // Set to true
  employeeId: string                  // Generated code
  employeeStatus: 'active' | 'inactive' | 'suspended'
  approvalDate: Timestamp
  approvedBy: string                  // Admin UID
  verificationChecklist: Object       // Admin verification data
}
```

#### `employeeCodes` Collection (New)
Stores pre-generated employee/payslip codes for batch management.

**Schema:**
```typescript
{
  id: string                          // Employee code (e.g., "EMP-1709567890123-A7K9Q")
  format: 'standard' | 'payslip'     // Code format
  createdAt: Timestamp
  used: boolean                       // Whether assigned to employee
  assignedTo?: string                 // Employee UID when used
  assignedAt?: Timestamp
}
```

## Admin Pages

### 1. Pro Applications Dashboard
**Path:** `/admin/pro-applications`

**Features:**
- List all pro applications with status filtering
- View application details in expanded view
- Contact information display (email, phone, state)
- Work verification status checklist
- Skills assessment text review
- Availability schedule view

**Status Tabs:**
- All (total count)
- Pending (new submissions)
- Under Review (being processed)
- Approved (assigned employee ID)
- Rejected (with reason)

**Verification Checklist:**
When reviewing an application, admins complete:
- ✓ ID Verification Complete
- ✓ Contact Information Verified
- ✓ Work Rights Verified
- ✓ Background Check Passed
- ✓ All Documents Reviewed

Once all items are checked:
- Generate Employee ID button becomes active
- Approve Application button becomes active
- Rejection remains available

**Employee ID Generation:**
- Admins can generate unique ID before approval
- Format options:
  - **Standard:** `EMP-{TIMESTAMP}-{RANDOM}` (e.g., EMP-1709567890123-A7K9Q)
  - **Payslip:** `PS-{YYYYMMDD}-{RANDOM}` (e.g., PS-20240304-X9K2L)
- Copy button for manual distribution
- Shows in confirmation modal

**Approval Action:**
- Requires all checklist items checked
- Sends approval email to applicant
- Updates user record: `isEmployee = true`
- Assigns `employeeId`
- Shows success message with Employee ID

**Rejection Action:**
- Opens modal for rejection reason
- Saves reason to database
- Sends rejection email with feedback

### 2. Employee Code Generator
**Path:** `/admin/employee-codes`

**Purpose:** Bulk generate employee/payslip codes for batch onboarding

**Features:**
- Select code format (Standard or Payslip)
- Set quantity (1-100 codes)
- Slider for easy selection
- Real-time preview of code format
- Generate and display codes
- Copy individual codes
- Copy all codes
- Download as CSV

**Code Formats:**

| Format | Example | Use Case |
|--------|---------|----------|
| Standard | EMP-1709567890123-A7K9Q | General employee identification |
| Payslip | PS-20240304-X9K2L | Payroll/HR system tracking |

**Workflow:**
1. Admin selects format and quantity
2. Clicks "Generate Codes"
3. System stores codes in `employeeCodes` collection
4. Admin copies codes or downloads CSV
5. Codes distributed to HR/employees
6. Codes used during approval process

**API Integration:**
- `POST /api/employee-codes` - Generate new codes
- `GET /api/employee-codes` - Retrieve unused codes

### 3. Admin Dashboard Integration
**Path:** `/admin`

Updated dashboard now shows:
- **Pro Applications Card**
  - Link to `/admin/pro-applications`
  - Displays pending application count
  - Quick filter for pending status
- **Employee Code Management**
  - Can generate bulk codes from here
  - Shows recent code generations

## API Endpoints

### 1. Inquiries - Create
**POST** `/api/inquiries/create`

**Request:**
```json
{
  "userId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "state": "string",
  "workVerification": {
    "hasWorkRight": boolean,
    "hasValidLicense": boolean,
    "hasTransport": boolean,
    "hasEquipment": boolean,
    "ageVerified": boolean
  },
  "skillsAssessment": "string",
  "availability": { /* day: boolean */ },
  "comments": "string"
}
```

**Response:**
```json
{
  "success": true,
  "inquiryId": "string",
  "message": "Inquiry created successfully"
}
```

### 2. Inquiries - Approve
**POST** `/api/inquiries/approve`

**Request:**
```json
{
  "inquiryId": "string",
  "adminId": "string",
  "adminName": "string",
  "employeeId": "string",        // Optional - custom or pre-generated code
  "verificationChecklist": {
    "idVerified": boolean,
    "contactVerified": boolean,
    "workRightsVerified": boolean,
    "backgroundCheckPassed": boolean,
    "documentsReviewed": boolean
  }
}
```

**Response:**
```json
{
  "success": true,
  "inquiryId": "string",
  "employeeId": "string",         // Generated or provided
  "emailSent": boolean
}
```

**Actions:**
1. Updates inquiry status to "approved"
2. Sets `reviewedAt` timestamp
3. Updates user record with `isEmployee: true` and `employeeId`
4. Sends approval email with dashboard link
5. Returns generated/provided employee ID

### 3. Inquiries - Reject
**POST** `/api/inquiries/reject`

**Request:**
```json
{
  "inquiryId": "string",
  "adminId": "string",
  "adminName": "string",
  "rejectionReason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "inquiryId": "string",
  "message": "Inquiry rejected"
}
```

### 4. Inquiries - List
**GET** `/api/inquiries/list`

**Query Parameters:**
- `status` (optional): 'pending' | 'under-review' | 'approved' | 'rejected'

**Response:**
```json
{
  "success": true,
  "inquiries": [ /* ProApplication[] */ ]
}
```

### 5. Employee Codes - Generate
**POST** `/api/employee-codes`

**Request:**
```json
{
  "count": number,                // 1-100
  "format": "standard" | "payslip"
}
```

**Response:**
```json
{
  "success": true,
  "codes": ["EMP-...", "EMP-..."],
  "count": number,
  "format": "string"
}
```

### 6. Employee Codes - List
**GET** `/api/employee-codes`

**Query Parameters:**
- `limit` (default: 10): Number of unused codes to retrieve
- `format` (default: 'standard'): 'standard' | 'payslip'

**Response:**
```json
{
  "success": true,
  "codes": [ 
    {
      "code": "string",
      "format": "string",
      "createdAt": "Timestamp",
      "used": boolean
    }
  ],
  "count": number
}
```

## Pro Dashboard Access Control

### Current Implementation
**Path:** `/dashboard/pro`

**Access Requirements:**
```typescript
if (!userData?.isEmployee) {
  // Show pending approval message
  // Redirect to pro signup form
}
```

**Features for Approved Employees:**
- View available jobs
- Accept jobs
- Track earnings
- View completed jobs
- Update profile
- Download payslips (with employee ID)

**Non-Approved Users See:**
- Pending approval message
- Explanation of review process
- Timeline of typical approval
- Action button to return home

## Email Notifications

### Application Submitted Email
Sent to applicant when application created.

### Approval Email
Sent to applicant when approved.

**Content:**
- Welcome message
- Employee ID (for payroll)
- Dashboard link
- Quick start guide
- Support contact

### Rejection Email
Sent to applicant when rejected.

**Content:**
- Rejection reason
- Feedback (if provided)
- Reapplication instructions
- Support contact

## Admin Workflow - Step by Step

### Approving an Application

1. **Navigate to Pro Applications**
   - Go to `/admin/pro-applications`
   - View pending applications

2. **Select Application**
   - Click on application to expand
   - Review all details:
     - Personal information
     - Work verification checkboxes
     - Skills assessment text
     - Availability schedule
     - Comments

3. **Complete Verification Checklist**
   - Check off each verification item as reviewed:
     - ID documents verified
     - Contact info confirmed
     - Work rights confirmed
     - Background check results
     - All documentation reviewed

4. **Generate Employee ID**
   - Click "Generate Employee ID" button
   - Copy ID for records (if needed)
   - ID will be assigned upon approval

5. **Approve Application**
   - "Approve Application" button becomes active
   - Click to open confirmation modal
   - Confirm approval
   - System:
     - Sets status to "approved"
     - Marks user as `isEmployee: true`
     - Assigns `employeeId`
     - Sends approval email
     - Returns to list

### Bulk Generating Employee Codes

1. **Navigate to Code Generator**
   - Go to `/admin/employee-codes`

2. **Select Format**
   - Standard (EMP-...) for general use
   - Payslip (PS-...) for HR/payroll

3. **Set Quantity**
   - Use slider (1-100 codes)
   - Default: 10 codes

4. **Generate**
   - Click "Generate {X} Codes"
   - Codes displayed in grid

5. **Distribute**
   - Copy all codes (clipboard)
   - Or download as CSV
   - Share with HR/onboarding team

6. **Usage**
   - Codes stored in `employeeCodes` collection
   - Can be used during manual approvals
   - Track usage with "used" flag

## User Experience

### For Pro Applicants

1. **Submit Application**
   - Fill out pro signup form
   - Multi-step form with progress
   - Email/phone verification
   - ID verification
   - Work verification questions
   - Skills assessment
   - Availability selection

2. **Application Submitted**
   - Confirmation screen
   - Told to expect review email
   - Support contact info

3. **Waiting for Review**
   - Typical timeline: 2-5 business days
   - Can check email for updates

4. **Application Approved**
   - Receive approval email
   - Email contains Employee ID
   - Dashboard link provided
   - Can now accept jobs

5. **Access Pro Dashboard**
   - Employee ID shown in profile
   - Can view available jobs
   - Payslips show Employee ID

### For Admins

1. **Quick Overview**
   - Admin dashboard shows pending count
   - Click to go to Pro Applications

2. **Review Application**
   - Expand application details
   - See all verification items
   - Read skills assessment
   - Check availability

3. **Verify & Approve**
   - Check off verification items
   - Generate or select Employee ID
   - Click approve
   - Done - user gets approval email

## Security Considerations

### Access Control
- Only users with `isAdmin: true` can access admin pages
- Session-based owner access for initial setup
- All API endpoints verify admin status

### Data Protection
- Employee IDs are unique and non-guessable
- Firebase security rules restrict access
- Email notifications confirm approvals
- Audit trail in Firestore (reviewedBy, reviewedAt)

### Employee ID Security
- Generated with timestamp + random string
- Cannot be predicted
- Prevents unauthorized access
- Tracked in employeeCodes collection

## Testing Checklist

- [ ] Create test application through pro signup form
- [ ] Review application in admin panel
- [ ] Complete verification checklist
- [ ] Generate employee ID
- [ ] Approve application
- [ ] Verify user marked as isEmployee
- [ ] Test Pro Dashboard access with approved user
- [ ] Test Pro Dashboard blocking for non-approved user
- [ ] Generate bulk employee codes
- [ ] Download CSV export
- [ ] Verify rejection flow
- [ ] Check email notifications sent

## Future Enhancements

1. **Batch Operations**
   - Bulk approve/reject applications
   - Bulk generate and assign employee IDs

2. **Advanced Filtering**
   - Search by name/email
   - Filter by state
   - Sort by submission date

3. **Reporting**
   - Approval rate metrics
   - Time to approval reports
   - Employee retention analytics

4. **Integrations**
   - Payroll system integration
   - Background check API integration
   - SMS notifications for applicants

5. **Compliance**
   - Audit logging
   - Document storage
   - Compliance reporting

---

**System Created:** March 2024
**Last Updated:** March 4, 2024
