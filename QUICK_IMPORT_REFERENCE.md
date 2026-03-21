# Quick Import Reference Card

## TL;DR - 3 Steps to Import All Data

### Step 1️⃣: Create Schema (5 minutes)
```
Supabase Dashboard → SQL Editor → New Query
Copy/paste: SUPABASE_MIGRATION_SCHEMA_IMPORT.sql
Click "Run"
```

### Step 2️⃣: Import 11 CSVs (10 minutes)
Import files in this order from `CSV_CLEAN/`:
```
✓ 01_users.csv (13 rows)
✓ 02_customers.csv (12 rows)
✓ 03_employees.csv (5 rows)
✓ 04_wash_clubs.csv (1 row)
✓ 05_wash_club_verification.csv (1 row)
✓ 06_wash_club_transactions.csv (1 row)
✓ 07_orders.csv (10 rows)
✓ 08_reviews.csv (3 rows)
✓ 09_inquiries.csv (2 rows)
✓ 10_transactions.csv (7 rows)
✓ 11_verification_codes.csv (1 row)
TOTAL: 56 rows
```

For each CSV:
1. Dashboard → Tables → [table name]
2. Click "Insert data" or "Import data"
3. Choose CSV file from `CSV_CLEAN/`
4. Click "Import"
5. Wait for success

### Step 3️⃣: Verify (2 minutes)
```sql
-- Paste into SQL Editor:
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL SELECT 'employees', COUNT(*) FROM public.employees
UNION ALL SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL SELECT 'transactions', COUNT(*) FROM public.transactions
UNION ALL SELECT 'wash_clubs', COUNT(*) FROM public.wash_clubs
UNION ALL SELECT 'wash_club_verification', COUNT(*) FROM public.wash_club_verification
UNION ALL SELECT 'wash_club_transactions', COUNT(*) FROM public.wash_club_transactions
UNION ALL SELECT 'inquiries', COUNT(*) FROM public.inquiries
UNION ALL SELECT 'verification_codes', COUNT(*) FROM public.verification_codes;

-- Should show 56 total rows
```

---

## Expected Results After Import

| Table | Records | Status |
|-------|---------|--------|
| users | 13 | ✅ |
| customers | 12 | ✅ |
| employees | 5 | ✅ |
| orders | 10 | ✅ |
| reviews | 3 | ✅ |
| transactions | 7 | ✅ |
| wash_clubs | 1 | ✅ |
| wash_club_verification | 1 | ✅ |
| wash_club_transactions | 1 | ✅ |
| inquiries | 2 | ✅ |
| verification_codes | 1 | ✅ |
| **TOTAL** | **56** | **✅** |

---

## Files You Need

```
/Users/lukaverde/Desktop/Website.BUsiness/
├── SUPABASE_MIGRATION_SCHEMA_IMPORT.sql  ← Run in SQL Editor
├── CSV_CLEAN/                            ← Import from here
│   ├── 01_users.csv
│   ├── 02_customers.csv
│   ├── 03_employees.csv
│   ├── 04_wash_clubs.csv
│   ├── 05_wash_club_verification.csv
│   ├── 06_wash_club_transactions.csv
│   ├── 07_orders.csv
│   ├── 08_reviews.csv
│   ├── 09_inquiries.csv
│   ├── 10_transactions.csv
│   └── 11_verification_codes.csv
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "No rows returned" | Run schema script first (Step 1) |
| FK constraint error | Import in correct order (users first) |
| Duplicate key error | Delete table data: `TRUNCATE table_name CASCADE;` |
| Import shows 0 rows | Check CSV file isn't empty (should have header + data) |

---

## Import Order (CRITICAL)

**Must follow this order for FK constraints:**

1. ✓ users (13)
2. ✓ customers (12) - references users
3. ✓ employees (5) - references users
4. ✓ wash_clubs (1) - references users
5. ✓ wash_club_verification (1) - references users
6. ✓ wash_club_transactions (1) - references users & orders
7. ✓ orders (10) - references users
8. ✓ reviews (3) - references orders & users
9. ✓ transactions (7) - references users & orders
10. ✓ inquiries (2) - no FK dependencies
11. ✓ verification_codes (1) - references users

---

## After Import

```
1. Query your database from Next.js app
2. Create auth.users in Supabase (optional)
3. Update AuthContext.tsx to use Supabase
4. Test dashboard queries
5. Test order flows
```

---

**Time to completion: ~20 minutes total**  
**All files ready: ✅**  
**Ready to import: ✅**
