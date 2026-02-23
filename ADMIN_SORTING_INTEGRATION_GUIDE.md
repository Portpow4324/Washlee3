# Admin Sorting & User Sync Integration Guide

## Overview

The `/secret-admin` page now includes a **User Sorting & Sync** section that displays users from the backend admin endpoints, allowing you to:

- ✅ View **Pending Payments** - Users awaiting payment confirmation
- ✅ View **Active Subscriptions** - Users with active plans
- ✅ View **Wash Club Members** - Loyalty program participants
- ✅ View **Employees** - Pro account holders
- ✅ View **Customers Only** - Non-employee users
- ✅ **Confirm** or **Reject** pending payments with one click
- ✅ **Sync** data with manual refresh button

---

## Setup Instructions

### 1. Backend Server Running

Make sure the Express backend is running on port 3001:

```bash
cd backend
npm install
npm run dev
```

Expected output:
```
Server running on port 3001
Connected to Firebase
```

### 2. Environment Configuration

The frontend is already configured to connect to the backend. Check `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Firebase Custom Claims (Optional)

To restrict admin access to specific users, set Firebase custom claims:

```javascript
// In Firebase Console or via Admin SDK
auth.setCustomUserClaims(uid, { admin: true })
```

Users without admin claims will see "Access Denied" on the `/secret-admin` page.

---

## Features

### User Sorting Categories

The "User Sorting & Sync" section provides 5 sorting views:

#### 1. **⏳ Pending Payments**
- Shows users with pending payment confirmation
- Displays: Email, User ID, Created Date, Plan, Payment Status
- **Actions**: Confirm or Reject payment

#### 2. **✓ Active Subscriptions**
- Shows users with active subscription plans
- Displays: Email, User ID, Created Date, Plan, Active Status

#### 3. **🧺 Wash Club**
- Shows loyalty program members
- Displays: Email, User ID, Created Date

#### 4. **👔 Employees**
- Shows pro account holders (employees/service providers)
- Displays: Email, User ID, Created Date

#### 5. **👥 Customers Only**
- Shows non-employee user accounts
- Displays: Email, User ID, Created Date

### Manual Sync

Click the **"Sync Now"** button to refresh data from the backend:
- Updates all user lists from the current view
- Shows loading state with animated spinner
- Displays last sync timestamp

### Payment Management

For **Pending Payments** view, you can:
1. **Confirm** - Approves payment and marks subscription as active
2. **Reject** - Rejects payment and marks subscription as rejected

---

## API Endpoints Used

The admin sorting section calls these backend endpoints:

```
GET /admin/users/pending-payments
GET /admin/users/subscriptions
GET /admin/users/wash-club
GET /admin/users/employees
GET /admin/users/customers-only

POST /admin/users/{uid}/confirm-payment
POST /admin/users/{uid}/reject-payment
```

All endpoints require:
- Firebase ID token in `Authorization: Bearer <token>` header
- Admin custom claim validation

---

## Code Files

### New Files Created

1. **`lib/adminSortingService.ts`** (174 lines)
   - Service functions for all admin sorting endpoints
   - Authentication header management
   - Error handling

### Modified Files

1. **`app/secret-admin/page.tsx`**
   - Added imports for admin sorting service
   - Added state variables for sorting data, loading, and errors
   - Added functions: `loadSortingData()`, `handleSortingViewChange()`, `handleConfirmPayment()`, `handleRejectPayment()`
   - Added "User Sorting & Sync" section with tabs and data table

2. **`.env.local`**
   - Updated `NEXT_PUBLIC_API_URL` to point to backend (http://localhost:3001)

---

## Usage Example

### Confirming a Pending Payment

1. Login to `/secret-admin` with admin password
2. Scroll to "User Sorting & Sync" section
3. Click "⏳ Pending Payments" tab
4. Find the user in the table
5. Click **"Confirm"** button
6. Wait for success message
7. User's subscription becomes active

### Viewing Wash Club Members

1. Click "🧺 Wash Club" tab
2. See all loyalty program members
3. View email, user ID, and join date
4. Click "Sync Now" to refresh from backend

---

## Troubleshooting

### Error: "Failed to fetch pending payment users"

**Causes:**
- Backend server not running on port 3001
- Firebase token expired
- User doesn't have admin custom claim

**Solution:**
```bash
# Terminal 1: Run backend
cd backend && npm run dev

# Terminal 2: Run frontend
npm run dev
```

### Error: "Not authenticated"

**Causes:**
- Not logged in to Firebase
- Firebase session expired

**Solution:**
- Login to your account first
- Then access `/secret-admin`

### Data not updating?

**Solution:**
- Click "Sync Now" button to manually refresh
- Check browser console for errors (F12)
- Verify backend is running: `http://localhost:3001/health`

---

## Architecture

```
┌─────────────────────┐
│  Browser Frontend   │
│  /secret-admin      │
└──────────┬──────────┘
           │ 1. User clicks "Pending Payments"
           ↓
┌──────────────────────────────────────────┐
│  lib/adminSortingService.ts              │
│  getPendingPaymentUsers()                │
└──────────┬───────────────────────────────┘
           │ 2. Fetch with Firebase token
           ↓
┌──────────────────────────────────────────┐
│  Backend Express Server (port 3001)      │
│  GET /admin/users/pending-payments       │
└──────────┬───────────────────────────────┘
           │ 3. Verify token + admin claim
           │ 4. Query Firestore
           ↓
┌──────────────────────────────────────────┐
│  Firestore Database                      │
│  users collection                        │
└──────────────────────────────────────────┘
           ↑ 5. Return users array
           │
┌──────────┴───────────────────────────────┐
│  Frontend: Display table + timestamps    │
└──────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Backend created and running
2. ✅ Frontend admin page integrated
3. ⏳ Configure Firebase custom claims for your admin user
4. ⏳ Test with real data
5. ⏳ Deploy to production

---

## Support

For issues or questions:
1. Check the console (F12 → Console tab)
2. Review backend logs: `npm run dev` output
3. Verify `.env.local` configuration
4. Ensure backend is running on port 3001
