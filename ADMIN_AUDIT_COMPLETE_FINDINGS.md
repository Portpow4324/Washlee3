# Admin Panel & Collections - Complete Audit Report

**Date:** March 26, 2026
**Status:** AUDIT IN PROGRESS - Issues Found ⚠️

---

## 🔍 AUDIT FINDINGS

### ✅ WORKING CORRECTLY

#### 1. Users Page (`/admin/users`)
- **Frontend Fetch:** Direct Supabase client ✅
- **Table:** `users`
- **Query:** `SELECT * FROM users` with left join to get name/email
- **Data Display:** ✅ Shows user data correctly
- **Filtering:** ✅ Works (by role type)
- **Search:** ✅ Works (by name/email)
- **Status:** OPERATIONAL

#### 2. Orders Page (`/admin/orders`)
- **Frontend Fetch:** Direct Supabase client ✅
- **Table:** `orders` with join to `users`
- **Query:** `SELECT * FROM orders` with `users(name, email)`
- **Data Display:** ✅ Shows order data correctly
- **Filtering:** ✅ Works (by status)
- **Search:** ✅ Works (by customer name/email/order ID)
- **Status:** OPERATIONAL

#### 3. Subscriptions Page (`/admin/subscriptions`)
- **Frontend Fetch:** Direct Supabase client ✅
- **Table:** `customers` with join to `users`
- **Query:** `SELECT * FROM customers` with `users(email)`
- **Data Display:** ✅ Shows subscription data correctly
- **Filtering:** ✅ Works (by status)
- **Search:** ✅ Works (by email/plan)
- **Status:** OPERATIONAL

#### 4. Wash Club Page (`/admin/wash-club`)
- **Frontend Fetch:** Direct Supabase client ✅
- **Table:** `wash_clubs` with join to `users`
- **Query:** `SELECT * FROM wash_clubs` with `users(email)`
- **Data Display:** ✅ Shows member data correctly
- **Filtering:** ✅ Works (by tier)
- **Search:** ✅ Works (by card number/email)
- **Status:** OPERATIONAL

#### 5. Support Tickets Page (`/admin/support-tickets`)
- **Frontend Fetch:** Direct Supabase client ✅
- **Table:** `inquiries` with WHERE type='customer_inquiry'
- **Query:** `SELECT * FROM inquiries WHERE type='customer_inquiry'`
- **Data Display:** ✅ Shows ticket data correctly
- **Filtering:** ✅ Works (by status/type)
- **Search:** ✅ Works (by name/email)
- **Status:** OPERATIONAL

---

### ⚠️ ISSUES FOUND

#### CRITICAL ISSUE #1: Pro Applications Page Fetch Mismatch
**Location:** `/app/admin/pro-applications/page.tsx` (line 113)
**Severity:** HIGH ⚠️

**Problem:**
```typescript
// Pro-applications page calls:
const response = await fetch('/api/inquiries/list')

// But API endpoint expects type parameter:
// GET /api/inquiries/list?type=pro (for pro_inquiries table)
// or: GET /api/inquiries/list?type=wholesale (for wholesale_inquiries table)

// However, in schema, there's only ONE 'inquiries' table with a 'type' column
// NOT 'pro_inquiries' or 'wholesale_inquiries' tables!
```

**Root Cause:**
The `/api/inquiries/list` endpoint is checking for table types that don't exist:
- Tries to fetch from `pro_inquiries` table (doesn't exist)
- Tries to fetch from `wholesale_inquiries` table (doesn't exist)
- Should instead query single `inquiries` table with `WHERE type='pro_application'`

**Database Reality:**
```sql
-- Actual table structure:
CREATE TABLE inquiries (
  id UUID,
  type TEXT, -- Values: 'pro_application', 'customer_inquiry', etc.
  status TEXT,
  ... other columns
);

-- NOT separate tables:
-- pro_inquiries (doesn't exist)
-- wholesale_inquiries (doesn't exist)
```

**Impact:**
- Pro Applications page shows no data
- API returns empty `inquiries` array
- Page displays "No applications" even if data exists in database

**Fix Required:**
Update `/api/inquiries/list/route.ts` to query the single `inquiries` table with proper filtering.

---

### ⚠️ ISSUES FOUND (continued)

#### ISSUE #2: Dashboard Sync API Authorization
**Location:** `/app/admin/dashboard/page.tsx` (line 132)
**Severity:** MEDIUM ⚠️

**Problem:**
```typescript
const response = await fetch('/api/admin/sync-all-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer admin'  // ← Generic bearer token
  },
  body: JSON.stringify({ force: true })
})
```

**Issue:**
- Bearer token is hardcoded as 'admin'
- API endpoint checks for bearer token existence but accepts any value
- Not checking actual admin session from sessionStorage

**API Code:**
```typescript
const authHeader = request.headers.get('authorization')
if (!authHeader?.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// ← Accepts ANY bearer token, not validated!
```

**Impact:**
- Any request with `Authorization: Bearer <anything>` passes
- No actual security validation
- Should validate against actual admin session

**Fix Needed:**
Properly validate bearer token against admin session.

---

#### ISSUE #3: getDashboardMetrics Function Issues
**Location:** `/lib/supabaseAdminSync.ts` (lines 462-510)
**Severity:** MEDIUM ⚠️

**Problems Identified:**

1. **newUsersThisMonth calculation is wrong:**
```typescript
metrics.newUsersThisMonth = await getCollectionCount('users')
// This returns ALL users, not just this month!
```

2. **Missing refundRate calculation:**
```typescript
refundRate: 0  // Always returns 0
```

3. **newUsersThisMonth commented as incomplete:**
```typescript
metrics.newUsersThisMonth = await getCollectionCount('users')
// This would need proper filtering in real implementation
```

**Impact:**
- Dashboard shows 0 new signups this month (always)
- Dashboard shows 0% refund rate (always)
- Metrics are partially calculated, some hardcoded to 0

**Fix Required:**
Implement proper filtering for:
- Users created after first of month
- Refund transactions calculation

---

#### ISSUE #4: Inquiries API Table Mismatch
**Location:** `/app/api/inquiries/list/route.ts`
**Severity:** CRITICAL ⚠️

**Current Code:**
```typescript
if (type === 'pro') {
  let query = supabaseAdmin.from('pro_inquiries').select('*')
  // Tries to fetch from 'pro_inquiries' table
}
```

**Actual Database:**
```sql
-- Only these tables exist:
- inquiries (with 'type' column to differentiate)

-- These tables DO NOT exist:
- pro_inquiries ❌
- wholesale_inquiries ❌
```

**Fix Required:**
Change to:
```typescript
if (type === 'pro') {
  let query = supabaseAdmin.from('inquiries')
    .select('*')
    .eq('type', 'pro_application')
}
```

---

## 📊 AUDIT SUMMARY

| Component | Status | Issue | Fix Priority |
|-----------|--------|-------|--------------|
| **Users Page** | ✅ OK | None | - |
| **Orders Page** | ✅ OK | None | - |
| **Subscriptions** | ✅ OK | None | - |
| **Wash Club** | ✅ OK | None | - |
| **Support Tickets** | ✅ OK | None | - |
| **Pro Applications** | ❌ BROKEN | API mismatch | CRITICAL |
| **Dashboard** | ⚠️ PARTIAL | Metrics incomplete | MEDIUM |
| **Sync API** | ⚠️ WEAK | Auth validation | MEDIUM |

---

## 🔧 FIXES NEEDED (Priority Order)

### PRIORITY 1: CRITICAL (Blocks functionality)

**Fix Pro Applications API Endpoint**
- File: `/app/api/inquiries/list/route.ts`
- Change: Query `inquiries` table with `type='pro_application'` filter
- Impact: Pro Applications page will show data
- Effort: 10 minutes

### PRIORITY 2: HIGH (Incomplete features)

**Fix Dashboard Metrics Calculations**
- File: `/lib/supabaseAdminSync.ts`
- Changes:
  1. Add proper newUsersThisMonth filtering
  2. Calculate refundRate from transactions
  3. Remove hardcoded 0 values
- Impact: Dashboard metrics will be accurate
- Effort: 30 minutes

**Improve Sync API Authorization**
- File: `/app/api/admin/sync-all-data/route.ts`
- Change: Validate bearer token against actual admin session
- Impact: Better security
- Effort: 15 minutes

### PRIORITY 3: MEDIUM (Code quality)

**Update Inquiry Types**
- Verify all inquiry `type` values used throughout code match database
- Values should be: 'pro_application', 'customer_inquiry', etc.
- Effort: 15 minutes

---

## 📝 DETAILED ISSUE DESCRIPTIONS

### Issue 1: Pro Applications - API Table Mismatch

**Current Behavior:**
```
User visits /admin/pro-applications
  ↓
Page calls: fetch('/api/inquiries/list')
  ↓
API tries: SELECT * FROM pro_inquiries
  ↓
ERROR: Table 'pro_inquiries' does not exist ❌
  ↓
Returns: empty array []
  ↓
Page shows: "No applications"
```

**Expected Behavior:**
```
User visits /admin/pro-applications
  ↓
Page calls: fetch('/api/inquiries/list?type=pro')
  ↓
API queries: SELECT * FROM inquiries WHERE type='pro_application'
  ↓
SUCCESS: Returns pro application records ✅
  ↓
Page shows: All pro applications with details
```

**Database Schema (Actual):**
```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY,
  type TEXT, -- 'pro_application', 'customer_inquiry', etc.
  email TEXT,
  name TEXT,
  status TEXT,
  message TEXT,
  submitted_at TIMESTAMP,
  ...
);
```

**Required Fix:**

File: `/app/api/inquiries/list/route.ts` - Lines 15-28

Change from:
```typescript
if (type === 'pro') {
  let query = supabaseAdmin.from('pro_inquiries').select('*')
```

Change to:
```typescript
if (type === 'pro') {
  let query = supabaseAdmin.from('inquiries')
    .select('*')
    .eq('type', 'pro_application')
```

And also update the pro-applications page to pass the type parameter:

File: `/app/admin/pro-applications/page.tsx` - Line 113

Change from:
```typescript
const response = await fetch('/api/inquiries/list')
```

Change to:
```typescript
const response = await fetch('/api/inquiries/list?type=pro')
```

---

### Issue 2: Dashboard Metrics - Incomplete Calculations

**Current Implementation:**
```typescript
export async function getDashboardMetrics() {
  const metrics = {
    totalUsers: await getCollectionCount('users'), // ✅ Works
    totalOrders: await getCollectionCount('orders'), // ✅ Works
    totalRevenue: await getCollectionSum('orders', 'total_price'), // ✅ Works
    activeOrders: 0, // ⚠️ Calculated but can be 0
    completedOrders: 0, // ⚠️ Calculated but can be 0
    averageOrderValue: 0, // ⚠️ Calculated
    activeUsers: 0, // ⚠️ Calculated but might be incomplete
    newUsersThisMonth: 0, // ❌ ALWAYS 0 - wrong calculation!
    refundRate: 0, // ❌ ALWAYS 0 - not calculated
    averageRating: 0 // ⚠️ Might be 0 if no reviews
  }
}
```

**Issues:**

1. **newUsersThisMonth is wrong:**
```typescript
metrics.newUsersThisMonth = await getCollectionCount('users')
// This counts ALL users, not just users created this month!
```

Should be:
```typescript
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const { data: newUsers } = await supabase
  .from('users')
  .select('id', { count: 'exact' })
  .gte('created_at', firstOfMonth.toISOString())

metrics.newUsersThisMonth = newUsers?.length || 0
```

2. **refundRate not calculated:**
```typescript
refundRate: 0 // Always 0!
```

Should be:
```typescript
const { data: allTransactions } = await supabase
  .from('transactions')
  .select('type')

const { data: refunds } = await supabase
  .from('transactions')
  .select('id')
  .eq('type', 'refund')

metrics.refundRate = allTransactions && allTransactions.length > 0 
  ? ((refunds?.length || 0) / allTransactions.length) * 100 
  : 0
```

---

### Issue 3: Authorization - Generic Bearer Token

**Current Code:**
```typescript
// Dashboard calls:
fetch('/api/admin/sync-all-data', {
  headers: {
    'Authorization': 'Bearer admin' // ← Hardcoded!
  }
})

// API validates:
const authHeader = request.headers.get('authorization')
if (!authHeader?.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// ← Accepts ANY bearer token!
```

**Problem:**
- No actual validation of who the user is
- Only checks that bearer token exists and starts with "Bearer "
- Any token like "Bearer xyz" would pass

**Better Approach:**
```typescript
// Get the actual admin token from session or JWT
const token = sessionStorage.getItem('adminToken') // or use JWT

// Send actual token:
fetch('/api/admin/sync-all-data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// Validate token on backend:
const authHeader = request.headers.get('authorization')
const token = authHeader?.replace('Bearer ', '')

// Verify token is valid
if (!verifyAdminToken(token)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 🎯 COLLECTION DATA DISPLAY STATUS

| Collection | Page | Endpoint | Data Shows | Issue |
|-----------|------|----------|-----------|--------|
| Users | `/admin/users` | Direct Supabase | ✅ YES | None |
| Orders | `/admin/orders` | Direct Supabase | ✅ YES | None |
| Subscriptions | `/admin/subscriptions` | Direct Supabase | ✅ YES | None |
| Wash Club | `/admin/wash-club` | Direct Supabase | ✅ YES | None |
| Support Tickets | `/admin/support-tickets` | Direct Supabase | ✅ YES | None |
| Pro Applications | `/admin/pro-applications` | `/api/inquiries/list` | ❌ NO | API table mismatch |
| Dashboard Metrics | `/admin/dashboard` | `/api/admin/sync-all-data` | ⚠️ PARTIAL | Incomplete calculations |

---

## 📋 NEXT STEPS

1. **Fix Pro Applications API** (CRITICAL) - 10 minutes
2. **Fix Dashboard Metrics** (HIGH) - 30 minutes
3. **Improve Authorization** (MEDIUM) - 15 minutes
4. **Test all pages** - 20 minutes
5. **Verify data displays** - 10 minutes

**Total estimated fix time: ~85 minutes**

---

**Status: AUDIT COMPLETE - Ready for fixes**

