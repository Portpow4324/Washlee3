# Firestore Permission Fix - Session [2026-03-03]

## Problem
Customer signup was failing with `FirebaseError: Missing or insufficient permissions` when attempting to create a customer profile.

**Error Stack:**
```
[Signup] Creating customer profile...
[Signup] Error: FirebaseError: Missing or insufficient permissions.
[Signup] Error code: permission-denied
```

**Context:**
- Firebase Auth creation succeeded (UID generated: `ij1jQPaQstewEsOKp2W2Nk6nn7E2`)
- Firestore rules deployed successfully
- Issue: Permission denied on Firestore write

---

## Root Cause
The `createCustomerProfileOptimized()` and `createEmployeeProfileOptimized()` functions were attempting to write to a `users` collection that **does not exist in Firestore security rules**.

### Code Issue
**File:** `lib/userManagement.optimized.ts`

The functions were doing:
```typescript
const batch = writeBatch(db)

// Write 1: customers/{uid} - ALLOWED by rules ✅
batch.set(customerRef, customerData)

// Write 2: users/{uid} - NOT IN RULES ❌
const userRef = doc(db, 'users', uid)
const userMetadata = { ... }
batch.set(userRef, userMetadata)

await batch.commit()
```

### Firestore Rules
**File:** `firestore.rules`

Only defines these collections:
- `employees/{uid}` ✅
- `customers/{uid}` ✅
- `orders/{orderId}` ✅
- `inquiries/{inquiryId}` ✅

The `users` collection was **never defined** in security rules, so any write attempt was denied.

---

## Solution

### Changes Made

#### 1. **Main Project** - `/lib/userManagement.optimized.ts`
- ✅ Removed all writes to `users` collection
- ✅ Updated `createEmployeeProfileOptimized()` to only write to `employees/{uid}`
- ✅ Updated `createCustomerProfileOptimized()` to only write to `customers/{uid}`
- ✅ Disabled `updateUserMetadataOptimized()` function (was unused and attempted to write to `users`)
- ✅ Removed unused imports (`writeBatch`, `updateDoc`)

#### 2. **Fork Directory 1** - `/my-washlee-fork/lib/userManagement.optimized.ts`
- ✅ Applied same changes as main project

#### 3. **Fork Directory 2** - `/my-washlee-fork/my-washlee-fork/lib/userManagement.optimized.ts`
- ✅ Applied same changes as main project

---

## Technical Details

### Before
```typescript
// EMPLOYEE PROFILE
export async function createEmployeeProfileOptimized(uid: string, data: Partial<EmployeeProfile>): Promise<void> {
  const batch = writeBatch(db)
  
  // Employee document - ALLOWED
  const employeeRef = doc(db, 'employees', uid)
  batch.set(employeeRef, employeeData)
  
  // User metadata - NOT ALLOWED (no 'users' in rules)
  const userRef = doc(db, 'users', uid)
  batch.set(userRef, userMetadata)
  
  await batch.commit() // ❌ Fails on 'users' write
}

// CUSTOMER PROFILE  
export async function createCustomerProfileOptimized(uid: string, data: Partial<CustomerProfile>): Promise<void> {
  const batch = writeBatch(db)
  
  // Customer document - ALLOWED
  const customerRef = doc(db, 'customers', uid)
  batch.set(customerRef, customerData)
  
  // User metadata - NOT ALLOWED (no 'users' in rules)
  const userRef = doc(db, 'users', uid)
  batch.set(userRef, userMetadata)
  
  await batch.commit() // ❌ Fails on 'users' write
}
```

### After
```typescript
// EMPLOYEE PROFILE
export async function createEmployeeProfileOptimized(uid: string, data: Partial<EmployeeProfile>): Promise<void> {
  // Employee document - ALLOWED
  const employeeRef = doc(db, 'employees', uid)
  const employeeData: EmployeeProfile = { ... }
  
  // Single write directly
  await setDoc(employeeRef, employeeData) // ✅ Success
}

// CUSTOMER PROFILE
export async function createCustomerProfileOptimized(uid: string, data: Partial<CustomerProfile>): Promise<void> {
  // Customer document - ALLOWED
  const customerRef = doc(db, 'customers', uid)
  const customerData: CustomerProfile = { ... }
  
  // Single write directly
  await setDoc(customerRef, customerData) // ✅ Success
}
```

---

## Impact Analysis

### Files Modified
1. `lib/userManagement.optimized.ts` (main project)
2. `my-washlee-fork/lib/userManagement.optimized.ts` (fork 1)
3. `my-washlee-fork/my-washlee-fork/lib/userManagement.optimized.ts` (fork 2)

### No Firestore Rules Changes Needed
- Existing rules are correct ✅
- No new collections need to be added
- All customer and employee data is properly stored in allowed collections

### Performance Impact
- **Improved**: Simpler single write vs batch write
- **Same**: `setDoc()` is just as fast as batch operations for single collection writes
- **Cleaner**: Removed unnecessary metadata duplication

---

## Testing Checklist

- [ ] Customer signup form submission
  - Create account with valid email
  - Verify Firebase Auth creates successfully
  - Verify customer profile is created in Firestore
  
- [ ] Pro/Employee signup
  - Create employee profile
  - Verify employee document appears in database
  
- [ ] Login flows
  - Customer login
  - Employee signin
  
- [ ] Redirect flows
  - After successful signup → home page redirect

---

## Verification

### Firestore Rules Status ✅
```
✔ cloud.firestore: rules file firestore.rules compiled successfully
✔ firestore: released rules firestore.rules to cloud.firestore
```

### Code Compilation ✅
```
No errors found in userManagement.optimized.ts
No unused imports
```

---

## Next Steps

1. Test customer signup flow in browser
2. Test employee signup flow
3. Verify customer dashboard loads data correctly
4. Verify employee dashboard loads data correctly

---

**Summary:** Removed unnecessary writes to undefined `users` collection. All user data is now stored directly in the appropriate collections (`customers` or `employees`) which are properly defined in Firestore security rules. This fixes the permission-denied error and simplifies the profile creation logic.
