# Employee Job Denial System - Complete Implementation

## Overview
Employees can now decline/deny jobs. When a job is denied:
1. ✅ Job is removed from that employee's list
2. ✅ Employee is added to a "denied_by" list 
3. ✅ Job remains available for other employees
4. ✅ Denied employees won't see the same job again

## Components Changed

### 1. New API Endpoint: `/api/employee/deny-job/route.ts`
**Purpose:** Handle job denial/decline action

**Request:**
```json
{
  "jobId": "order-id",
  "employeeId": "employee-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job denied successfully",
  "data": {
    "jobId": "order-id",
    "deniedBy": ["employee-id"]
  }
}
```

**What it does:**
- Fetches the order/job
- Reads current `denied_by` JSON array
- Adds employee ID to the array
- Updates the order with new denied list
- Returns success status

### 2. Updated API: `/api/employee/available-jobs/route.ts`
**Changes:**
- GET endpoint now filters out jobs that employee has denied
- Checks `orders.denied_by` column
- Parses JSON array to check if employee is in the list
- Only returns jobs the employee hasn't already declined

**Logic:**
```typescript
// For each job, fetch the order's denied_by list
// If employee ID is in denied_by, skip the job
// Otherwise, include the job
```

### 3. Updated Frontend: `/app/employee/jobs/page.tsx`
**UI Changes:**
- Added red "Deny" button next to "Accept Job" button
- Deny button only shows for unaccepted jobs
- Button layout: `[View Details] [Deny] [Accept Job]`

**New Function: `handleDenyJob(jobId)`**
- Calls `/api/employee/deny-job` endpoint
- Removes job from local state on success
- Clears order details from cache
- Shows error alert if denial fails

## Database Schema Change

**Column to Add:**
```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS denied_by TEXT DEFAULT '[]';
```

**Column Details:**
- Type: TEXT (stores JSON array)
- Default: '[]' (empty array)
- Format: `["employee-id-1", "employee-id-2"]`
- Example: `'["a0392f42-e63a-4f46-b022-16730081c346", "ae4b5696-e9d5-47d4-9351-94e3ee9bd598"]'`

## User Flow

### Before Denial System:
1. Job shows to Employee A
2. Employee A clicks Deny
3. ❌ Job still shows to Employee A

### After Denial System:
1. Job shows to Employee A and B
2. Employee A clicks Deny
3. ✅ Job removed from Employee A's list
4. ✅ Job still shows to Employee B
5. ✅ Employee A won't see this job again
6. ✅ Job available for Employee B until they accept or deny

## Implementation Checklist

- [x] Created `/api/employee/deny-job/route.ts` API endpoint
- [x] Updated `/api/employee/available-jobs/route.ts` to filter denied jobs
- [x] Added `handleDenyJob()` function to employee jobs page
- [x] Added "Deny" button to UI (red button)
- [x] Button only shows when job not yet accepted
- [ ] **TODO: Run migration SQL to add `denied_by` column** 

## Testing Steps

1. **Login as Employee A**
   - View available jobs
   - Should see job list

2. **Click Deny on a job**
   - Job should disappear from list
   - Order details should be cleared
   - Success message or silent removal

3. **Refresh page / Fetch jobs again**
   - Same job should NOT appear for Employee A
   - Should appear for other employees

4. **Login as Employee B**
   - Same job should still be available
   - Employee B can accept or deny independently

## Database Queries

**Check if column exists:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name='orders' AND column_name='denied_by';
```

**View denied jobs for an employee:**
```sql
SELECT id, denied_by FROM orders 
WHERE denied_by::text LIKE '%employee-id%';
```

**Find jobs NOT denied by an employee:**
```sql
SELECT * FROM orders 
WHERE denied_by IS NULL 
   OR denied_by::text NOT LIKE '%employee-id%'
   AND pro_id IS NULL;
```

## Notes
- Denials are permanent (employee won't see job again)
- Denials persist across sessions
- Multiple employees can deny same job
- Job remains available until accepted by someone
- Denials don't affect accepted jobs (deny button hidden when accepted)
