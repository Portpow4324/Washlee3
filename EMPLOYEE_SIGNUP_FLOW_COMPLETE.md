# Employee Pro Signup Flow: Complete Data Journey (Steps 0-7)

## Overview
This document traces how employee data flows through the signup process and where it's stored.

---

## STEP 0: Tell us about yourself
**Location**: `/auth/pro-signup-form?step=0`

### User Input
- First Name
- Last Name  
- Email
- Phone (Australian format)
- State (dropdown)
- Work Address
- Password (with validation rules)
- Terms acceptance

### Data Storage
- **Stored**: In-memory in React state (`formData`)
- **Not saved to backend yet** - just collected locally

### Next Action
- Triggers `sendEmailVerification()` → `/api/verification/send-code`
- Triggers `sendPhoneVerification()` → `/api/verification/send-code`

---

## STEP 1: Verify Your Email
**Location**: `/auth/pro-signup-form?step=1`

### Verification Flow
1. **Code Generation**: 6-digit random code generated server-side
2. **Code Storage**: Stored in-memory in `lib/serverVerification.ts`
   - Key format: `email:phone` (e.g., `lukaverde045@gmail.com:61412458144`)
   - Expires in 15 minutes

3. **Email Sending**:
   - Endpoint: `POST /api/verification/send-code`
   - Service: **SendGrid** (configured in `.env.local`)
   - Status: ✅ **WORKING** - Returns 202 (Accepted)
   - Message sent to: User's email address

4. **Code Verification**:
   - Endpoint: `POST /api/verification/verify-code`
   - User enters 6-digit code
   - Code verified against in-memory storage
   - Sets `formData.emailConfirmed = true`

### Data Saved
- ✅ Email address (in memory)
- ✅ Email verification status

---

## STEP 2: Verify Your Phone
**Location**: `/auth/pro-signup-form?step=2`

### Verification Flow
1. **Code Generation**: 6-digit random code generated server-side
2. **Code Storage**: Stored in-memory (same as email)
   - Key: `email:phone`

3. **SMS/Phone Sending**:
   - Endpoint: `POST /api/sms/send`
   - Status: ✅ **ENABLED** - In dev mode, logs to console
   - In production: Would integrate with SMS provider (Twilio, etc.)

4. **Code Verification**:
   - Endpoint: `POST /api/verification/verify-code`
   - User enters code
   - Sets `formData.phoneVerified = true`

### Data Saved
- ✅ Phone number (in memory)
- ✅ Phone verification status

---

## STEP 3: ID Verification
**Location**: `/auth/pro-signup-form?step=3`

### User Input
- Upload ID document (image/PDF)

### Processing
- File converted to Base64
- Stored in `formData.idFile` (in memory)
- **Not uploaded yet** - only base64 in form data

### Data Saved
- ✅ ID file (base64 encoded, in memory)
- ✅ ID verification status flag

---

## STEP 4: Washlee Pro Introduction
**Location**: `/auth/pro-signup-form?step=4`

### Purpose
- Info page about Washlee Pro benefits
- Auto-advances to next step

### Data Saved
- None (informational only)

---

## STEP 5: Your Availability & Contact Info
**Location**: `/auth/pro-signup-form?step=5`

### User Input
- Availability checkboxes (Mon-Sun)
- Comments/Additional info

### Data Saved (in memory)
- ✅ `formData.availability` - Object with day booleans
- ✅ `formData.comments` - Free text

---

## STEP 6: Australian Workplace Verification
**Location**: `/auth/pro-signup-form?step=6`

### Verification Questions (Yes/No)
1. Do you have the right to work in Australia?
2. Do you have a valid driver's license?
3. Do you have your own transport?
4. Do you have your own cleaning equipment?
5. Are you 18+ years old?

### Data Saved (in memory)
- ✅ `formData.workVerification`:
  ```javascript
  {
    hasWorkRight: boolean | null,
    hasValidLicense: boolean | null,
    hasTransport: boolean | null,
    hasEquipment: boolean | null,
    ageVerified: boolean | null
  }
  ```

---

## STEP 7: Skills & Experience Assessment
**Location**: `/auth/pro-signup-form?step=7`

### User Input
- Skills assessment text (minimum 50 characters)
- Experience description

### Data Saved (in memory)
- ✅ `formData.skillsAssessment` - String

---

## FINAL SUBMISSION: Send to Backend
**Location**: After step 7, when user clicks "Submit"

### Complete Payload Sent
```javascript
{
  userId: authUser.id,
  firstName,
  lastName,
  email,
  phone,
  state,
  idVerification: {
    fileName,
    fileType,
    base64 // ← ID file converted to base64
  },
  workVerification: {
    hasWorkRight,
    hasValidLicense,
    hasTransport,
    hasEquipment,
    ageVerified
  },
  skillsAssessment,
  availability: { mon: bool, tue: bool, ... },
  comments,
  createdAt: ISO timestamp,
  status: 'pending'
}
```

### Endpoint
`POST /api/inquiries/create`

### Data Saved to Supabase
**Table**: `pro_inquiries`

| Column | Source | Type |
|--------|--------|------|
| `user_id` | authUser.id | UUID |
| `first_name` | formData.firstName | String |
| `last_name` | formData.lastName | String |
| `email` | formData.email | String |
| `phone` | formData.phone | String |
| `state` | formData.state | String |
| `id_verification` | formData.idFile (base64) | JSONB |
| `work_verification` | formData.workVerification | JSONB |
| `skills_assessment` | formData.skillsAssessment | String |
| `availability` | formData.availability | JSONB |
| `comments` | formData.comments | String |
| `status` | 'pending' | String |
| `created_at` | Timestamp | Timestamp |
| `id` | Auto-generated | UUID |

---

## ADMIN PANEL ACCESS
**Location**: `/admin/inquiries`

### Endpoint
`GET /api/inquiries/list?type=pro`

### Data Retrieved
All employee inquiries from `pro_inquiries` table, displayed in admin panel with:
- ✅ Employee name and contact info
- ✅ Work verification answers
- ✅ Skills assessment
- ✅ Availability
- ✅ ID verification file (base64)
- ✅ Application status

### Admin Actions
- View inquiry details
- Approve/Reject application
- View all employee information and answers

---

## EMAIL CONFIRMATIONS SENT

### 1. Employee Confirmation Email
**Endpoint**: `POST /api/email/send-employee-confirmation`
**Content**: Confirms receipt of application, provides reference ID

### 2. Admin/Employer Notification
**Endpoint**: `POST /api/email/send-employer-notification`
**Content**: Complete application details sent to admin email

---

## CURRENT STATUS ✅

| Component | Status | Details |
|-----------|--------|---------|
| Email Verification | ✅ WORKING | SendGrid sending 6-digit codes |
| Phone Verification | ✅ WORKING | Code generation and verification |
| Form Data Collection | ✅ WORKING | All steps collect data properly |
| Inquiry Submission | ✅ IMPLEMENTED | Now saves to Supabase `pro_inquiries` |
| Admin Panel Access | ✅ WORKING | Can retrieve inquiries from Supabase |
| Email Confirmations | ✅ READY | SendGrid configured for admin notifications |

---

## DATA FLOW DIAGRAM

```
Step 0: Collect Basic Info (memory)
    ↓
Step 1: Verify Email (code to memory, SendGrid sends)
    ↓
Step 2: Verify Phone (code to memory, SMS logged)
    ↓
Step 3: Upload ID (base64 to memory)
    ↓
Step 4: Info (no data)
    ↓
Step 5: Availability (memory)
    ↓
Step 6: Work Verification (memory)
    ↓
Step 7: Skills Assessment (memory)
    ↓
Submit → POST /api/inquiries/create
    ↓
Saved to Supabase pro_inquiries table
    ↓
Admin retrieves via GET /api/inquiries/list
    ↓
Admin Panel displays all employee data with ID
```

---

## NEXT STEPS

1. ✅ **Email Sending**: Working via SendGrid
2. ✅ **Code Verification**: Working with in-memory storage  
3. ✅ **Inquiry Storage**: Implemented to save to Supabase
4. ⏳ **SMS Integration**: Currently logs to console in dev, needs Twilio/provider in prod
5. ⏳ **ID File Storage**: Converts to base64, could add Firebase Storage upload
6. ✅ **Admin Notifications**: Ready to send via SendGrid
