# ⚠️ BUSINESS ACCOUNT IMPLEMENTATION - TODO REMINDERS

## Overview
The wholesale page now has a **barrier effect** that shows all information but prevents interaction unless the user has a business account. Below are the required implementation tasks to make this work.

---

## 🔴 HIGH PRIORITY - Required Tasks

### 1. **Create Business Account Signup Flow**
- **Location:** `/app/auth/signup/page.tsx` (add business option)
- **Task:** Add a signup option for `type=business` 
- **Fields needed:**
  - Company Name
  - ABN (Australian Business Number)
  - Business Type (e.g., Hotel, Restaurant, Corporate, Gym, Other)
  - Business Address
  - Contact Person Name
- **Reference:** Currently links to `/auth/signup?type=business` but page doesn't handle this yet

### 2. **Update Firebase Users Collection - Add businessAccountType Field**
- **Collection:** `users`
- **Field to add:** `businessAccountType: string | null`
- **Possible values:**
  - `null` (personal account - default)
  - `"hotel"`, `"restaurant"`, `"corporate"`, `"gym"`, `"other"` (business types)
- **Location to update:** `/lib/firebase.ts` or user creation logic

### 3. **Update TypeScript UserData Interface**
- **File:** `/lib/AuthContext.tsx` or wherever `UserData` is defined
- **Add field:** `businessAccountType?: string | null`
- **Also add:**
  - `companyName?: string`
  - `abn?: string`
  - `businessType?: string`

### 4. **Create Firestore Collection: businessAccounts**
- **Collection name:** `businessAccounts`
- **Document structure:**
  ```
  {
    uid: string (user ID - link to users collection)
    companyName: string
    abn: string (Australian Business Number)
    businessType: string (hotel, restaurant, corporate, gym, other)
    businessAddress: string
    verificationStatus: string (pending, approved, rejected)
    createdAt: timestamp
    updatedAt: timestamp
    approvedAt?: timestamp (when admin approves)
    approvedBy?: string (admin user ID)
  }
  ```

### 5. **Create Business Verification Flow** (Admin Task)
- **Location:** Admin Dashboard (`/app/admin/*`)
- **Task:** Add section to verify/approve business applications
- **Actions:** Approve, Reject, Request More Info
- **What it does:** Sets `verificationStatus` to "approved" and can update user's `businessAccountType`

---

## 🟡 MEDIUM PRIORITY - Dashboard & UX

### 6. **Create Business Dashboard**
- **Location:** `/app/dashboard/business` (new route)
- **Purpose:** Business-specific settings and analytics
- **Sections:**
  - Business Profile (editable company info)
  - Order History (wholesale orders)
  - Invoices & Billing
  - Team Management (if multiple users per business)
  - Usage Analytics

### 7. **Update Main Dashboard Navigation**
- **File:** `/app/dashboard/page.tsx` or Header
- **Task:** Show "Business" tab/link for users with business accounts
- **Link to:** `/dashboard/business`

### 8. **Update Wholesale Page**
- **File:** `/app/wholesale/page.tsx` (Already updated with barrier)
- **Currently:** Shows lock screen if no business account
- **Verification check:** Change this line to check actual `businessAccountType` from Firestore:
  ```tsx
  const hasBusinessAccount = userData?.businessAccountType !== undefined && userData?.businessAccountType !== null
  ```

---

## 🟢 LOW PRIORITY - Enhancements

### 9. **Add Business Type Icons/Badges**
- Update wholesale page to show company type (🏨 Hotel, 🍽️ Restaurant, etc.)

### 10. **Create Business Onboarding Flow**
- Guide new business users through setup
- Collect ABN, verify business details
- Set up billing information

### 11. **Add Email Verification**
- Send verification email to business contact
- ABN validation against Australian Business Register

---

## 📋 Implementation Checklist

- [ ] Create business signup option in auth
- [ ] Add `businessAccountType` to Firebase users collection
- [ ] Update `UserData` TypeScript interface
- [ ] Create `businessAccounts` Firestore collection
- [ ] Update Firebase collection rules for security
- [ ] Create admin verification dashboard
- [ ] Build business profile dashboard
- [ ] Add business tab to main dashboard
- [ ] Test wholesale page barrier with test account
- [ ] Add business onboarding flow
- [ ] Setup email verification
- [ ] Update terms of service for wholesale

---

## 🔗 Current Implementation Status

**Wholesale Page Barrier:**
- ✅ Implemented visual barrier (opacity + modal overlay)
- ✅ Information visible but inputs disabled
- ✅ "Create Business Account" button ready
- ✅ Links to `/auth/signup?type=business` (not yet implemented)
- ⚠️ Type warning: `businessAccountType` field doesn't exist yet
- ⏳ Needs: Actual auth flow + Firestore integration

**Related Files:**
- `/app/wholesale/page.tsx` - Barrier effect active (line 20-22)
- `/app/auth/signup/page.tsx` - Needs `?type=business` handler
- `/lib/AuthContext.tsx` - Needs `businessAccountType` field in UserData
- `/app/admin/*` - New business verification section needed

---

## 🎯 Next Steps

1. **Start with:** Update UserData interface (quickest win)
2. **Then:** Add Firebase collection + fields
3. **Then:** Create signup option for businesses
4. **Finally:** Set up admin verification flow

---

## 📞 Questions

- What's the approval process for businesses? (Manual admin review? Instant? ABN verification API?)
- Do we need multiple users per business account? (Team feature)
- Should businesses have different pricing tiers? (Premium businesses, regular, etc.)
- Payment method: Credit card per business or account-based billing?
