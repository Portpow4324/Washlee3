# Database Migration & Deployment Guide

**Status:** All code fixes complete ✅ | Database tables need to be created ⏳

---

## Quick Start: Apply Database Changes

### Step 1: Run SQL Migration in Supabase

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your Washlee project
   - Click **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **"New Query"** button
   - Copy the entire content from `CREATE_MISSING_TABLES.sql` in your project root
   - Paste it into the SQL editor

3. **Execute Migration**
   - Click the **▶️ Run** button
   - Wait for confirmation: "Executed successfully"
   - The following will be created:
     - ✅ `pro_jobs` table (for job assignment)
     - ✅ `pro_earnings` table (for earnings tracking)
     - ✅ Indexes on both tables for performance
     - ✅ Auto-update triggers for `updated_at` timestamp
     - ✅ `pro_earnings_summary` view (for quick stats)

4. **Verify Creation**
   - Click **Tables** in left sidebar
   - You should see `pro_jobs` and `pro_earnings` in the list

---

## What Changed in Code

### 1. Pro Jobs Page (`/app/pro/jobs/page.tsx`)

**Before:**
- Queried non-existent `jobs` table
- Expected fields: customer_name, rate, distance, rush
- Would always show empty with error message

**After:**
- ✅ Queries `pro_jobs` table (status = 'available')
- ✅ Fetches related order data from `orders` table
- ✅ Displays job with actual order details: price, addresses, weight, date
- ✅ Accept button updates `pro_jobs` table with pro_id and accepted_at timestamp

**How it works:**
1. Fetch available pro_jobs
2. Get order_id from each job
3. Fetch order details from orders table
4. Combine both datasets to display complete job info
5. When pro accepts, update pro_jobs with pro_id and status='accepted'

---

### 2. Pro Earnings Page (`/app/pro/earnings/page.tsx`)

**Before:**
- Queried non-existent `pro_earnings` table
- Would always show empty earnings list and $0 stats

**After:**
- ✅ Tries to fetch from `pro_earnings` table first (if it exists)
- ✅ Falls back to calculating from `orders` table if pro_earnings doesn't exist
- ✅ Assumes pro earns 80% of order price
- ✅ Shows total earnings, this month, and pending payouts
- ✅ Lists all earnings with date, order ID, amount, and status

**How it works:**
1. Try to query pro_earnings table
2. If table exists and has data, use it
3. If not, query orders table where pro_id = current user
4. Calculate 80% of order price as pro earning
5. Transform into earnings format and display
6. Once pro_earnings table is populated (via webhook), switch to using it

---

## Database Schema Details

### pro_jobs Table
```sql
id              UUID PRIMARY KEY
order_id        UUID FOREIGN KEY -> orders.id
pro_id          UUID FOREIGN KEY -> employees.id (null until accepted)
status          VARCHAR: 'available' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
posted_at       TIMESTAMP (when job was posted)
accepted_at     TIMESTAMP (when pro accepted)
completed_at    TIMESTAMP (when job finished)
created_at      TIMESTAMP
updated_at      TIMESTAMP (auto-updated on any change)
```

### pro_earnings Table
```sql
id              UUID PRIMARY KEY
pro_id          UUID FOREIGN KEY -> employees.id
order_id        UUID FOREIGN KEY -> orders.id (optional)
amount          DECIMAL: earnings amount in dollars
status          VARCHAR: 'pending' | 'paid' | 'withheld' | 'disputed'
payment_method  VARCHAR: 'bank_transfer', 'paypal', etc.
paid_at         TIMESTAMP (when payment was made)
created_at      TIMESTAMP
updated_at      TIMESTAMP
notes           TEXT (optional notes)
```

---

## Next Steps After Database Creation

### 1. Populate pro_earnings from existing orders (Optional)

If you have existing orders and want to backfill earnings data, run:

```sql
INSERT INTO pro_earnings (pro_id, order_id, amount, status, created_at)
SELECT 
  o.pro_id,
  o.id,
  o.price * 0.8 as amount,
  CASE WHEN o.status = 'completed' THEN 'pending' ELSE 'pending' END,
  o.created_at
FROM orders o
WHERE o.pro_id IS NOT NULL AND o.status IN ('completed', 'in_progress')
ON CONFLICT DO NOTHING;
```

### 2. Set up webhook to auto-populate pro_earnings (Recommended)

After payment is successful, insert into pro_earnings:

```typescript
// In /app/api/webhooks/stripe/route.ts (webhook handler)

// When order is completed, create earning record:
if (order_status === 'completed' && pro_id) {
  await supabase
    .from('pro_earnings')
    .insert([{
      pro_id,
      order_id: orderId,
      amount: orderPrice * 0.8,
      status: 'pending',
      created_at: new Date().toISOString(),
    }])
}
```

### 3. Set up auto-increment of pro_jobs from orders (Recommended)

Create a trigger that automatically creates pro_jobs when an order is created:

```sql
CREATE OR REPLACE FUNCTION create_pro_job_for_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pro_jobs (order_id, status, posted_at)
  VALUES (NEW.id, 'available', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_to_job_trigger
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION create_pro_job_for_order();
```

---

## Testing Checklist ✅

After creating the database tables:

- [ ] Pro login works
- [ ] "Available Jobs" shows orders from pro_jobs table
- [ ] Job details display correctly (address, weight, price, date)
- [ ] "Accept Job" button updates pro_jobs status
- [ ] Pro earnings page loads without errors
- [ ] Earnings calculations are correct (80% of order price)
- [ ] Stats show total, this month, pending correctly
- [ ] Earnings table displays all pro's earnings

---

## Troubleshooting

### Tables not appearing in Supabase
- Wait 30 seconds and refresh browser
- Click **"Tables"** in sidebar again
- Check SQL Editor console for any error messages

### Pro jobs page still shows empty
- Verify you have orders in the database
- Create a test order manually
- Check that orders table has data with pro_id set
- Run: `SELECT * FROM pro_jobs LIMIT 10;`

### Earnings showing $0
- Check if pro_earnings table exists: `SELECT * FROM pro_earnings LIMIT 10;`
- If empty, verify orders exist: `SELECT * FROM orders WHERE pro_id IS NOT NULL;`
- The fallback calculation should work even if table is empty

### Pro can't accept jobs
- Verify pro_jobs table exists
- Check user is logged in as pro (userData.user_type === 'pro')
- Verify pro_id is set correctly in update query
- Check Supabase console for any error messages

---

## Deployment Timeline

1. **Now (5 min)**: Run SQL migration in Supabase
2. **Test (15 min)**: Verify tables created, test pro features
3. **Deploy (5 min)**: Code changes already deployed to main branch
4. **Monitor (ongoing)**: Watch for any errors in Supabase logs

**Total time to full functionality: ~25 minutes**

---

## Files Modified in This Session

| File | Status | Changes |
|------|--------|---------|
| `/app/pro/jobs/page.tsx` | ✅ Fixed | Uses pro_jobs + orders join |
| `/app/pro/earnings/page.tsx` | ✅ Fixed | Falls back to order calculations |
| `CREATE_MISSING_TABLES.sql` | ✅ Created | SQL to create pro_jobs and pro_earnings |

**Code Status:** Ready to deploy ✅
**Database Status:** Waiting for SQL migration ⏳

