# Complete Supabase Data Import Guide - ALL FILES READY ✅

## Overview
All 11 CSV files are now cleaned and ready for import in `/CSV_CLEAN/` directory:

| File | Records | Status |
|------|---------|--------|
| ✅ 01_users.csv | 13 | Clean |
| ✅ 02_customers.csv | 12 | Clean |
| ✅ 03_employees.csv | 5 | Clean |
| ✅ 04_wash_clubs.csv | 1 | Clean |
| ✅ 05_wash_club_verification.csv | 1 | Clean |
| ✅ 06_wash_club_transactions.csv | 1 | Clean |
| ✅ 07_orders.csv | 10 | Clean |
| ✅ 08_reviews.csv | 3 | Clean |
| ✅ 09_inquiries.csv | 2 | Clean |
| ✅ 10_transactions.csv | 7 | Clean |
| ✅ 11_verification_codes.csv | 1 | Clean |
| **TOTAL** | **56** | **Ready** |

---

## Step 1: Create Database Schema

1. Open **Supabase Dashboard** → **SQL Editor**
2. Create a new query
3. Copy the entire content from `SUPABASE_MIGRATION_SCHEMA_IMPORT.sql`
4. Run the query

This creates all tables with proper structure and indexes.

---

## Step 2: Import CSV Files in Correct Order

### Import Order (CRITICAL - respects foreign key constraints):

#### Phase 1: Core User Tables (No dependencies)
```
1. 01_users.csv           → users table (13 rows)
2. 02_customers.csv       → customers table (12 rows)
3. 03_employees.csv       → employees table (5 rows)
```

#### Phase 2: Wash Club Tables (Depend on users)
```
4. 04_wash_clubs.csv      → wash_clubs table (1 row)
5. 05_wash_club_verification.csv → wash_club_verification table (1 row)
6. 06_wash_club_transactions.csv → wash_club_transactions table (1 row)
```

#### Phase 3: Orders & Related Data (Depend on users)
```
7. 07_orders.csv          → orders table (10 rows)
8. 08_reviews.csv         → reviews table (3 rows)
9. 10_transactions.csv    → transactions table (7 rows)
```

#### Phase 4: Other Data (Minimal dependencies)
```
10. 09_inquiries.csv      → inquiries table (2 rows)
11. 11_verification_codes.csv → verification_codes table (1 row)
```

---

## How to Import Each File

### Method A: Supabase Dashboard (Recommended)

For each CSV in the order above:

1. Go to **Supabase Dashboard** → **Tables**
2. Click the table name (e.g., `users`)
3. Click **"Insert data"** or **"Import data"** button (location varies)
4. Select **"Import from CSV"**
5. Upload the corresponding CSV file
6. Click **"Import"**
7. Verify: Should show success message with row count

### Method B: SQL Editor (If Dashboard Import Fails)

For each file, open SQL Editor and run:

```sql
-- For 01_users.csv
COPY public.users(id, email, name, phone, user_type, is_admin, is_employee, is_loyalty_member, profile_picture_url, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 01_users.csv starting from line 2]
\.

-- For 02_customers.csv
COPY public.customers(id, subscription_active, subscription_plan, subscription_status, payment_status, delivery_address, preferences, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 02_customers.csv starting from line 2]
\.

-- For 03_employees.csv
COPY public.employees(id, rating, total_reviews, completed_orders, earnings, availability_status, service_areas, bank_account, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 03_employees.csv starting from line 2]
\.

-- For 04_wash_clubs.csv
COPY public.wash_clubs(id, user_id, card_number, tier, credits_balance, earned_credits, redeemed_credits, total_spend, status, email_verified, terms_accepted, terms_accepted_at, join_date, last_updated)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 04_wash_clubs.csv starting from line 2]
\.

-- For 05_wash_club_verification.csv
COPY public.wash_club_verification(id, user_id, verification_code, code_verified, email_verified, email_verified_at, code_expires_at, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 05_wash_club_verification.csv starting from line 2]
\.

-- For 06_wash_club_transactions.csv
COPY public.wash_club_transactions(id, user_id, transaction_type, amount, previous_balance, new_balance, order_id, notes, created_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 06_wash_club_transactions.csv starting from line 2]
\.

-- For 07_orders.csv
COPY public.orders(id, user_id, status, items, total_price, delivery_address, pickup_address, scheduled_pickup_date, scheduled_delivery_date, actual_pickup_date, actual_delivery_date, pro_id, tracking_code, notes, wash_club_credits_applied, tier_discount, credits_earned, tier_at_order_time, reviewed, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 07_orders.csv starting from line 2]
\.

-- For 08_reviews.csv
COPY public.reviews(id, order_id, customer_id, pro_id, rating, title, comment, categories, status, moderation_notes, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 08_reviews.csv starting from line 2]
\.

-- For 09_inquiries.csv
COPY public.inquiries(id, name, email, phone, inquiry_type, message, status, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 09_inquiries.csv starting from line 2]
\.

-- For 10_transactions.csv
COPY public.transactions(id, user_id, order_id, type, amount, currency, status, payment_method, stripe_transaction_id, description, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 10_transactions.csv starting from line 2]
\.

-- For 11_verification_codes.csv
COPY public.verification_codes(id, user_id, code, type, verified, expires_at, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste contents of 11_verification_codes.csv starting from line 2]
\.
```

---

## Step 3: Verify All Data Imported Successfully

Run these verification queries in SQL Editor:

```sql
-- Summary count
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

-- Expected output:
-- users: 13
-- customers: 12
-- employees: 5
-- orders: 10
-- reviews: 3
-- transactions: 7
-- wash_clubs: 1
-- wash_club_verification: 1
-- wash_club_transactions: 1
-- inquiries: 2
-- verification_codes: 1
-- TOTAL: 56
```

### Verify Foreign Key Integrity

```sql
-- Check that all orders reference valid users
SELECT COUNT(*) as orders_with_valid_user_id
FROM public.orders o
WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id = o.user_id);

-- Check that all reviews reference valid data
SELECT COUNT(*) as reviews_with_valid_ids
FROM public.reviews r
WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id = r.customer_id)
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = r.pro_id)
  AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = r.order_id);

-- Check that all transactions reference valid data
SELECT COUNT(*) as transactions_with_valid_ids
FROM public.transactions t
WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id = t.user_id)
  AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = t.order_id);
```

---

## Data Summary

### Users (13 total)
- **Admins** (3): lukaverde22, test999, lukaverde0476653333
- **Customers** (6): IDs 0001-0006 (with subscription status)
- **Pros** (4): IDs 0014-0017 (service providers)

### Customers (12 total)
- 9 inactive customers (pending payment status)
- 3 active customers with paid subscriptions

### Employees/Pros (5 total)
- All with 0 ratings, reviews, completed orders (new pros)
- 4 with pending status, 1 with active status

### Orders (10 total)
- All status: 'pending'
- Total value: $358 AUD
- Customers: IDs 0001 (5), 0003 (1), 0004 (3)

### Wash Club (1 total)
- User: 0015 (pro)
- Tier: 1
- Credits: 25 (earned signup bonus)

### Reviews (3 total)
- All 5-star ratings, approved
- By pros: 0014, 0015, 0016

### Transactions (7 total)
- Type: payment
- All pending status
- Total: $212 AUD

### Inquiries (2 total)
- Both: Employee Applications
- Status: 1 approved, 1 pending

### Verification Codes (1 total)
- Type: phone
- Status: verified

---

## Troubleshooting

### "No rows returned" during import
- **Cause**: Schema not created yet
- **Solution**: Run `SUPABASE_MIGRATION_SCHEMA_IMPORT.sql` first (Step 1)

### Foreign Key Constraint Violation
- **Cause**: Importing tables out of order
- **Solution**: Follow the import order above (users BEFORE orders, etc.)

### Duplicate Key Error
- **Cause**: Re-importing without truncating tables
- **Solution**: Delete existing data first with `TRUNCATE public.table_name CASCADE;`

### Invalid UUID Format
- **Cause**: Malformed UUIDs in CSV
- **Solution**: All UUIDs in these clean CSVs are properly formatted

### Phone Number Duplicate Error
- **Cause**: Multiple users with same phone
- **Solution**: Already fixed in clean CSVs - each user has unique phone

---

## Next Steps After Successful Import

1. **Test queries** from your Next.js app using Supabase client
2. **Create auth.users entries** (optional):
   - Via Supabase Auth API for production
   - Link to existing users by UUID

3. **Update AuthContext.tsx**:
   - Switch from Firebase to Supabase client
   - Query users from PostgreSQL instead of Firestore

4. **Run integration tests**:
   - Test customer dashboard queries
   - Test pro dashboard queries
   - Test order creation/updates

---

## File Locations

```
/Users/lukaverde/Desktop/Website.BUsiness/
├── SUPABASE_MIGRATION_SCHEMA_IMPORT.sql       ← Run first
├── CSV_CLEAN/                                  ← All clean CSVs here
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
└── CSV_IMPORTS/                               (legacy - can be deleted)
```

---

## Import Checklist

- [ ] Step 1: Run `SUPABASE_MIGRATION_SCHEMA_IMPORT.sql` in SQL Editor
- [ ] Step 2a: Import `01_users.csv` to users table
- [ ] Step 2b: Import `02_customers.csv` to customers table
- [ ] Step 2c: Import `03_employees.csv` to employees table
- [ ] Step 2d: Import `04_wash_clubs.csv` to wash_clubs table
- [ ] Step 2e: Import `05_wash_club_verification.csv` to wash_club_verification table
- [ ] Step 2f: Import `06_wash_club_transactions.csv` to wash_club_transactions table
- [ ] Step 2g: Import `07_orders.csv` to orders table
- [ ] Step 2h: Import `08_reviews.csv` to reviews table
- [ ] Step 2i: Import `09_inquiries.csv` to inquiries table
- [ ] Step 2j: Import `10_transactions.csv` to transactions table
- [ ] Step 2k: Import `11_verification_codes.csv` to verification_codes table
- [ ] Step 3: Run verification queries
- [ ] ✅ All 56 rows imported successfully!

---

**Date**: 17 March 2026  
**Status**: ALL FILES READY FOR IMPORT ✅  
**Total Records**: 56  
**Total Files**: 11
