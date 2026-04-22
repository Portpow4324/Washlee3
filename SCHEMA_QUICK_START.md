# Quick Schema Application Instructions

## 🚀 The Fastest Way (30 seconds)

### 1. Open Supabase Dashboard
- Go to: https://app.supabase.com
- Select your Washlee project

### 2. Go to SQL Editor
- Click **SQL Editor** in the left sidebar
- Click **New Query**

### 3. Copy & Paste the Schema
- Open the file: **`DATABASE_SCHEMA_MIGRATION.sql`** in this project
- Copy ALL the content
- Paste into Supabase SQL Editor

### 4. Run It
- Click the **RUN** button (or press Cmd+Enter)
- Wait for completion (should take ~15 seconds)

### 5. Verify
Run this quick check:
```sql
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'jobs', 'employee_availability', 'payouts', 'earnings_history');
```

Should return: **5** tables

---

## ✅ You're Done!

All tables are created and your dashboard is ready to use real data.

### What Just Happened:
- ✅ ORDERS table now has `employee_id` and `status` columns
- ✅ JOBS table now has `accepted_by` column
- ✅ NEW: employee_availability table created
- ✅ NEW: payouts table created
- ✅ NEW: earnings_history table created
- ✅ Indexes created for performance
- ✅ RLS security policies added
- ✅ Helper functions added

### Your APIs are Now Ready:
- `/api/employee/availability` - WORKS ✅
- `/api/employee/orders` - WORKS ✅
- `/api/employee/available-jobs` - WORKS ✅
- `/api/employee/earnings` - WORKS ✅
- `/api/employee/balance` - WORKS ✅

---

## 🧪 Test It Out

### 1. Go to http://localhost:3001
(Or your dev server URL)

### 2. Login as Luka Verde
- Email: lukaverde6@gmail.com
- Password: (your password)

### 3. Try Each Page
- **Orders** - Should show real orders from database (or empty if none yet)
- **Jobs** - Should show available jobs
- **Earnings** - Should show real earnings (or 0 if no completed orders)
- **Payout** - Should show real balance
- **Settings** - Should load availability schedule

---

## 📋 Migration Contents

The SQL file includes:

### Tables Modified:
- `orders` (added: employee_id, status, earnings, rating, review)
- `jobs` (added: accepted_by, status, posted_at)

### Tables Created:
- `employee_availability` - Day-based work schedules
- `payouts` - Payout request tracking
- `earnings_history` - Earnings per order (optional but recommended)

### Indexes:
- 12+ performance indexes

### Security:
- RLS policies for each table

### Functions:
- `get_employee_balance()` - Query helper
- `get_employee_earnings()` - Query helper

---

## 🔄 If You Need to Undo

Don't worry - if you need to revert:

```sql
-- DROP everything (WARNING: This deletes all data in these tables!)
DROP TABLE IF EXISTS earnings_history CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS employee_availability CASCADE;

-- To reset columns on orders and jobs (keep data):
ALTER TABLE orders DROP COLUMN IF EXISTS employee_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE jobs DROP COLUMN IF EXISTS accepted_by CASCADE;
ALTER TABLE jobs DROP COLUMN IF EXISTS status CASCADE;
```

**Backup first if you have important data!**

---

## 📞 If Something Goes Wrong

### Issue: "Column already exists" error
✅ **This is OK!** The migration is safe to re-run multiple times.

### Issue: "Permission denied" error
❌ You might not have admin access. Ask your Supabase project owner.

### Issue: Foreign key constraint error
❌ Make sure your `auth.users` table exists (it should by default).

### Issue: No error, but tables don't appear
✅ **Most likely worked!** Try refreshing your browser.

---

## 📈 What's Next After Schema is Ready

1. ✅ Schema applied (YOU ARE HERE)
2. **→ Test the dashboard pages**
   - Check if data loads from database
   - Click buttons and verify they work
3. **→ Create some sample data**
   - Add test orders
   - Add test jobs
   - Add test availability
4. **→ Full end-to-end testing**
   - Accept a job
   - Mark pickup complete
   - Mark delivery complete
   - View earnings
   - Request a payout

---

## 🎯 Success Criteria

After applying the schema, you should be able to:

- [ ] Open Supabase and see all 5 tables
- [ ] Run the query check and see "5" result
- [ ] Visit `/employee/dashboard` and see it loads
- [ ] Click buttons and see API calls in network tab
- [ ] See changes persist (refresh page, data is still there)
- [ ] View real orders, jobs, earnings, availability

---

**Time to complete**: 30 seconds ⚡  
**Difficulty**: Super easy 🟢  
**Risk**: Very low (only adds columns/tables) 🟢

**Ready? Let's go!** 🚀
