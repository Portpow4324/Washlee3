# Order Flow Diagram

## Complete Journey: Order → Pro Job → Employee Acceptance

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1️⃣  CUSTOMER CREATES ORDER                                     │
│  ├─ Order ID: 3557a628-8322-4ebe-ada8-797bbb478939             │
│  ├─ Price: $133.50                                              │
│  ├─ Weight: 10kg                                                │
│  ├─ Service: Express ($12.50/kg)                               │
│  └─ Protection: Premium-plus (+$8.50)                          │
│                                                                 │
│  Database: orders table                                         │
│  ✅ Status: confirmed                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  2️⃣  PRO JOB CREATED AUTOMATICALLY (or manually)               │
│  ├─ Job ID: auto-generated UUID                               │
│  ├─ Order ID: 3557a628-... (linked)                           │
│  └─ Pro ID: null (awaiting assignment)                        │
│                                                                 │
│  Database: pro_jobs table                                      │
│  ✅ Status: available                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  3️⃣  EMPLOYEE VIEWS JOBS ON DASHBOARD                          │
│  ├─ Page: /employee/jobs                                       │
│  ├─ Fetches: pro_jobs with status='available'                 │
│  └─ For each job:                                              │
│     └─ Calls /api/orders/details?orderId=...                  │
│        Returns: { totalPrice: 133.50, weight: 10, ... }       │
│                                                                 │
│  UI Shows:                                                      │
│  ✅ Order ID: 3557a628                                          │
│  ✅ Price: $133.50                                              │
│  ✅ Weight: 10kg                                                │
│  ✅ Status: available                                           │
│  ✅ Button: "Accept Job"                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  4️⃣  EMPLOYEE CLICKS "ACCEPT JOB"                              │
│  ├─ POST /api/employee/available-jobs                          │
│  ├─ Body: {                                                     │
│  │   jobId: "job-uuid",                                        │
│  │   employeeId: "employee-uuid",                              │
│  │   action: "accept"                                          │
│  │ }                                                            │
│  └─ Tries to set:                                              │
│     ├─ pro_id = employeeId (⚠️ FK constraint may block)       │
│     ├─ status = "accepted"                                     │
│     └─ accepted_at = now()                                     │
│                                                                 │
│  Database: pro_jobs table UPDATE                               │
│  ✅ Status: accepted                                            │
│  ✅ accepted_at: 2026-04-10T12:30:47.012Z                     │
│  ⚠️  pro_id: null (waiting for FK fix)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  5️⃣  JOB LIFECYCLE CONTINUES                                   │
│  ├─ Job now shows in "My Jobs" tab                            │
│  ├─ Employee can view full order details                      │
│  ├─ Pickup and delivery workflow begins                       │
│  └─ Real-time status updates to customer                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Current Status

### ✅ Working
- Order creation and storage
- Pro job creation
- API fetching order details with correct weight
- Job status updates to "accepted"
- accepted_at timestamp recording
- Employee job discovery and listing

### ⚠️ Pending (FK Constraint)
- Pro ID assignment (pro_jobs.pro_id = employee)
- Requires: Run SQL fix in Supabase

### Fix Required
```sql
ALTER TABLE pro_jobs DROP CONSTRAINT IF EXISTS pro_jobs_pro_id_fkey;
```

Or create the employees table (see ORDER_FLOW_TEST_COMPLETE.md for details)
