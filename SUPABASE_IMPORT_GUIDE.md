# Supabase Data Import Instructions

## Overview
Your clean CSV files are ready in `/CSV_CLEAN/` directory:
- ✅ `01_users.csv` (13 rows)
- ✅ `07_orders.csv` (10 rows)
- ✅ `08_reviews.csv` (3 rows)
- ✅ `10_transactions.csv` (7 rows)

## Step 1: Create Database Schema in Supabase

1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the entire content from `SUPABASE_MIGRATION_SCHEMA_IMPORT.sql`
4. Run the query to create all tables and indexes

**Why this version?**
- Removes `REFERENCES auth.users(id)` constraint that was causing errors
- Allows importing users without them existing in auth.users first
- Keeps all other FK constraints for data integrity

## Step 2: Import CSV Files in Order

### Method A: Using Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → Tables
2. For each table in this order:

#### 2a. Import Users Table
- Click `users` table
- Click "Import data" button
- Upload `CSV_CLEAN/01_users.csv`
- Click "Import"
- Should show: **13 rows imported** ✓

#### 2b. Import Orders Table
- Click `orders` table
- Click "Import data" button
- Upload `CSV_CLEAN/07_orders.csv`
- Click "Import"
- Should show: **10 rows imported** ✓

#### 2c. Import Reviews Table
- Click `reviews` table
- Click "Import data" button
- Upload `CSV_CLEAN/08_reviews.csv`
- Click "Import"
- Should show: **3 rows imported** ✓

#### 2d. Import Transactions Table
- Click `transactions` table
- Click "Import data" button
- Upload `CSV_CLEAN/10_transactions.csv`
- Click "Import"
- Should show: **7 rows imported** ✓

### Method B: Using SQL COPY Command
If dashboard import doesn't work, use SQL Editor:

```sql
-- Import Users
COPY public.users(id, email, name, phone, user_type, is_admin, is_employee, is_loyalty_member, profile_picture_url, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste CSV_CLEAN/01_users.csv content]
\.

-- Import Orders
COPY public.orders(id, user_id, status, items, total_price, delivery_address, pickup_address, scheduled_pickup_date, scheduled_delivery_date, actual_pickup_date, actual_delivery_date, pro_id, tracking_code, notes, wash_club_credits_applied, tier_discount, credits_earned, tier_at_order_time, reviewed, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste CSV_CLEAN/07_orders.csv content]
\.

-- Import Reviews
COPY public.reviews(id, order_id, customer_id, pro_id, rating, title, comment, categories, status, moderation_notes, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste CSV_CLEAN/08_reviews.csv content]
\.

-- Import Transactions
COPY public.transactions(id, user_id, order_id, type, amount, currency, status, payment_method, stripe_transaction_id, description, created_at, updated_at)
FROM STDIN WITH (FORMAT CSV, HEADER);
[paste CSV_CLEAN/10_transactions.csv content]
\.
```

## Step 3: Verify Data Imported Successfully

Run these queries in SQL Editor:

```sql
-- Check users
SELECT COUNT(*) as user_count, user_type FROM public.users GROUP BY user_type;
-- Expected: 3 admin, 6 customer, 4 pro

-- Check orders
SELECT COUNT(*) as order_count FROM public.orders;
-- Expected: 10

-- Check reviews
SELECT COUNT(*) as review_count FROM public.reviews;
-- Expected: 3

-- Check transactions
SELECT COUNT(*) as transaction_count FROM public.transactions;
-- Expected: 7

-- Verify no FK constraint issues
SELECT * FROM public.orders LIMIT 5;
SELECT * FROM public.reviews LIMIT 5;
SELECT * FROM public.transactions LIMIT 5;
```

## Step 4: Post-Import Configuration (Optional)

Once data is imported successfully, you can:

1. **Create Supabase Auth users** (if needed later):
   - Use Supabase Auth API to create auth users
   - Link them to existing users by ID

2. **Enable Row Level Security**:
   - Schema already has RLS policies defined
   - Policies are created but need auth context to enforce

3. **Add Customers/Employees tables** (if you need them):
   - Schema is ready, just needs data import
   - Follow same process as above

## Troubleshooting

### Error: "no rows returned"
- **Solution**: Ensure schema is created first (Step 1)
- Check that CSV has data (not just headers)
- Verify column names match exactly

### Error: Foreign Key Constraint Violation
- **Cause**: Importing in wrong order or referenced IDs don't exist
- **Solution**: Verify you're importing in correct order: users → orders → reviews → transactions

### Error: Duplicate Key Value
- **Cause**: Phone numbers not unique or emails duplicated
- **Solution**: Already fixed in clean CSVs, but verify CSV_CLEAN files have unique phones

### Error: Invalid UUID Format
- **Cause**: Old Firebase IDs format
- **Solution**: Already fixed in clean CSVs - using proper UUID format

## File Locations

```
/Users/lukaverde/Desktop/Website.BUsiness/
├── SUPABASE_MIGRATION_SCHEMA_IMPORT.sql  ← Run this first (Step 1)
├── CSV_CLEAN/
│   ├── 01_users.csv                      ← Import 2nd (Step 2a)
│   ├── 07_orders.csv                     ← Import 3rd (Step 2b)
│   ├── 08_reviews.csv                    ← Import 4th (Step 2c)
│   └── 10_transactions.csv               ← Import 5th (Step 2d)
└── CSV_IMPORTS/                          (old files - you can keep or delete)
```

## Data Summary

**Users (13 total)**
- 3 Admins (lukaverde22, test999, lukaverde0476653333)
- 6 Customers (Luka Verde variants)
- 4 Pros (lukaverde62242, lukaverde3, etc.)

**Orders (10 total)**
- All status: 'pending'
- Total value: $358 AUD
- Distributed across customers: 0001 (5), 0003 (1), 0004 (3)

**Reviews (3 total)**
- All status: 'approved'
- Ratings: All 5-star
- By pros: 0014, 0015, 0016

**Transactions (7 total)**
- All status: 'pending'
- Type: 'payment'
- Total amount: $212 AUD

---

**Next Steps After Import:**
1. Query data from Next.js app using Supabase client
2. Create auth.users entries via Supabase Auth API if needed
3. Update AuthContext.tsx to use Supabase
4. Test login and data access flows

Date: 17 March 2026
