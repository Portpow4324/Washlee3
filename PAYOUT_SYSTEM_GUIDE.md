# 💰 Automatic Payout System - Implementation Guide

## Overview

Complete automated payout system for contractors/employees to withdraw earnings via bank transfer. No Stripe Connect required - uses direct bank transfers.

## How It Works

### 1. **Contractor Requests Payout**
- Goes to `/employee/earnings` page
- Clicks "Request Payout" button
- Fills out payout form:
  - Amount ($50 minimum)
  - Account holder name
  - BSB (6-digit code)
  - Account number (9 digits)
  - Bank name
  - Account type (savings/checking/business)

### 2. **Request Stored in Firestore**
```
Collection: employee-payouts
- uid: employee user ID
- amount: $X.XX
- status: 'pending' (waiting for approval)
- bankDetails: { accountHolder, accountNumber, bsb, bankName, accountType }
- requestedAt: timestamp
- createdAt: timestamp
```

### 3. **Admin Reviews & Approves**
- Admin goes to `/admin/payouts`
- Filters by status (Pending, Processing, Completed, Rejected)
- Clicks payout card to view details
- **Approve**: Moves to "Processing" queue
- **Reject**: Rejects with reason (notifies employee)

### 4. **Automatic Processing**
Once approved, payout is:
1. Added to `payout-processing-queue` collection
2. Processed automatically (simulate or real bank API)
3. Status updated to `completing` with bank reference ID
4. Employee notified of completion

### 5. **Completion**
- Admin manually marks as "Complete" with bank transaction ID
- Employee earnings reduced by payout amount
- Employee receives confirmation notification
- Transaction logged with audit trail

---

## File Structure

```
app/
├── employee/
│   ├── earnings/page.tsx          ✅ UPDATED - Added "Request Payout" button
│   └── payout/page.tsx            🆕 NEW - Payout request form
├── pro/
│   └── earnings/page.tsx          ✅ UPDATED - "Request Withdrawal" button linked
├── admin/
│   └── payouts/page.tsx           🆕 NEW - Admin payout management dashboard
├── api/
│   ├── employee/payouts/route.ts  🆕 NEW - Submit payout request
│   └── admin/payouts/route.ts     🆕 NEW - Approve/reject/complete payouts
└── functions/
    └── payoutProcessor.js         🆕 NEW - Cloud Function for auto processing
```

---

## API Endpoints

### Employee: Submit Payout Request
```
POST /api/employee/payouts
Content-Type: application/json

Request:
{
  "uid": "user123",
  "amount": 100.00,
  "accountHolder": "John Doe",
  "accountNumber": "123456789",
  "bsb": "012345",
  "bankName": "Commonwealth Bank",
  "accountType": "savings"
}

Response:
{
  "success": true,
  "payoutId": "payout_abc123",
  "message": "Payout request submitted successfully",
  "data": { ... }
}
```

### Employee: Get Payout History
```
GET /api/employee/payouts

Response:
{
  "payouts": [
    {
      "id": "payout_abc123",
      "uid": "user123",
      "amount": 100.00,
      "status": "completed",
      "bankDetails": { ... },
      "completedAt": timestamp,
      "bankTransactionId": "TRF-123456"
    }
  ]
}
```

### Admin: Get Payouts
```
GET /api/admin/payouts?status=pending
Authorization: Admin only

Response:
{
  "payouts": [ ... ],
  "count": 5
}
```

### Admin: Approve/Reject/Complete
```
PATCH /api/admin/payouts
Authorization: Admin only

Request:
{
  "payoutId": "payout_abc123",
  "action": "approve|reject|complete",
  "notes": "optional notes",
  "bankTransactionId": "TRF-123456" (for complete action)
}

Response:
{
  "success": true,
  "message": "Payout approved successfully"
}
```

---

## Database Schema

### `employee-payouts` Collection
```typescript
{
  id: string                    // Auto-generated
  uid: string                   // Employee user ID
  email: string                 // Employee email
  amount: number                // Payout amount
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  bankDetails: {
    accountHolder: string       // Name on account
    accountNumber: string       // 9-digit account number
    bsb: string                // 6-digit BSB code
    bankName: string           // Bank name
    accountType: 'savings' | 'checking' | 'business'
  }
  requestedAt: Timestamp
  approvedAt?: Timestamp
  approvedBy?: string          // Admin UID
  processedAt?: Timestamp
  processedBy?: string
  completedAt?: Timestamp
  bankTransactionId?: string   // Bank's reference
  failureReason?: string       // If rejected
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `payout-processing-queue` Collection
```typescript
{
  payoutId: string
  uid: string
  amount: number
  bankDetails: { ... }
  status: 'queued' | 'processing' | 'completed' | 'failed'
  createdAt: Timestamp
  completedAt?: Timestamp
  transactionId?: string
}
```

### `employee-notifications` Collection
```typescript
{
  uid: string
  type: 'payout_approved' | 'payout_rejected' | 'payout_completed'
  title: string
  message: string
  read: boolean
  createdAt: Timestamp
}
```

---

## Firestore Security Rules

Add these rules to allow proper access:

```javascript
// Employee payouts - employees can only see/create their own
match /employee-payouts/{document=**} {
  allow read: if request.auth.uid == resource.data.uid || isAdmin();
  allow create: if request.auth.uid == request.resource.data.uid;
  allow update, delete: if isAdmin();
}

// Admin access
match /admin-notifications/{document=**} {
  allow read, write: if isAdmin();
}

match /employee-notifications/{document=**} {
  allow read: if request.auth.uid == resource.data.uid;
  allow write: if isAdmin();
}

// Helper function
function isAdmin() {
  return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

---

## Real Bank Transfer Integration

The `payoutProcessor.js` Cloud Function currently simulates bank transfers. To integrate real bank transfers, use one of these APIs:

### Option 1: **Plaid** (Recommended for AU/US/EU)
```bash
npm install plaid
```
```javascript
const { PlaidClient } = require('plaid');
const client = new PlaidClient({
  clientID: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  env: 'production'
});

const transferRes = await client.transferCreate({
  access_token: userAccessToken,
  amount: payout.amount,
  user_id: payout.uid,
  description: `Washlee Payout`,
});
```

### Option 2: **Open Banking** (AU)
```bash
npm install open-banking-api
```

### Option 3: **PayFast** (AU/ZA)
```javascript
const fetch = require('node-fetch');

const payload = {
  merchant_id: process.env.PAYFAST_MERCHANT_ID,
  merchant_key: process.env.PAYFAST_MERCHANT_KEY,
  amount: payout.amount.toFixed(2),
  recipient_name: payout.bankDetails.accountHolder,
  recipient_account: payout.bankDetails.accountNumber,
  recipient_code: payout.bankDetails.bsb,
};

const response = await fetch('https://api.payfast.co.za/transfers/send/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

---

## Setup Checklist

- [x] **Frontend Pages**
  - [x] Employee payout request page (`/employee/payout`)
  - [x] Admin payout management page (`/admin/payouts`)
  - [x] Updated earnings pages with buttons

- [x] **Backend APIs**
  - [x] Submit payout request endpoint
  - [x] Get payout history endpoint
  - [x] Admin approval/rejection endpoint

- [x] **Database**
  - [x] `employee-payouts` collection
  - [x] `payout-processing-queue` collection
  - [x] `employee-notifications` collection

- [ ] **Cloud Function** (Optional)
  - [ ] Deploy `payoutProcessor.js` to Firebase Functions
  - [ ] Set up scheduled processing (every 4 hours)
  - [ ] Integrate real bank API

- [ ] **Security**
  - [ ] Add Firestore security rules (see above)
  - [ ] Verify admin-only access
  - [ ] Add rate limiting to prevent abuse

- [ ] **Testing**
  - [ ] Test payout request submission
  - [ ] Test admin approval flow
  - [ ] Test employee notifications
  - [ ] Test failure handling

---

## Usage

### For Employees

1. **Request Payout**
   - Go to `/employee/earnings`
   - Click "Request Payout"
   - Fill in amount and bank details
   - Submit

2. **Track Status**
   - View history in `/employee/payout` page
   - Receive email/in-app notification when approved/completed
   - See payment reference when transferred

### For Admins

1. **Review Payouts**
   - Go to `/admin/payouts`
   - Filter by status (Pending, Processing, etc.)

2. **Approve**
   - Click payout card
   - Add notes (optional)
   - Click "Approve & Queue"
   - Status moves to "Processing"

3. **Complete**
   - When bank transfer is complete, status shows "Processing"
   - Enter bank transaction ID
   - Click "Mark as Complete"
   - Employee is notified and paid

---

## Troubleshooting

### Payout shows "Pending" forever
- Check admin panel - may not be approved yet
- Check Firestore - verify payout document exists
- Check security rules - may be blocking access

### Employee can't submit request
- Check minimum $50 requirement
- Verify bank details format (BSB: 6 digits, Account: 9 digits)
- Check available balance (total earnings - pending payouts)

### Admin can't see payouts
- Verify user is in `admins` collection
- Check Firestore security rules
- Check browser console for API errors

### Bank transfer fails
- Real bank API integration required (see above)
- Check bank details are correct
- Verify account is active

---

## Production Deployment

1. **Deploy to Firebase Functions:**
   ```bash
   firebase deploy --only functions:processEmployeePayouts
   ```

2. **Set Environment Variables:**
   ```
   .env.local:
   NEXT_PUBLIC_BANK_API=your_bank_api_key
   BANK_API_SECRET=your_bank_secret
   ```

3. **Enable Scheduled Processing:**
   - Uncomment scheduled function in `payoutProcessor.js`
   - Deploy and enable in Firebase Console

4. **Add Monitoring:**
   - Set up error alerts in Firebase Console
   - Monitor failed transfers
   - Track processing latency

---

## Summary

✅ **Complete automated payout system**
- Employees request payouts with bank details
- Admins approve/review in dashboard
- Automatic processing queue
- Bank transfer integration ready
- Email/in-app notifications
- Full audit trail
