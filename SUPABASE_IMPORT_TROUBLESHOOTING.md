# ⚠️ Import Failed - Users Table Not Imported

## The Error
```
ERROR:  23503: insert or update on table "wash_club_verification" 
violates foreign key constraint "wash_club_verification_user_id_fkey"
DETAIL:  Key (user_id)=(550e8400-e29b-41d4-a716-446655440017) is not present in table "users".
```

## Why It Failed
You tried to import `wash_club_verification.csv` **BEFORE** importing `01_users.csv`.

User `0017` **DOES EXIST** in `01_users.csv` - we just verified it. But it's not in Supabase's users table yet.

## Solution - Import in Correct Order

**You MUST import files in this order:**

1. **FIRST:** Import `01_users.csv` to the `users` table
2. **THEN:** Import `02_customers.csv`
3. **THEN:** Import `03_employees.csv`
4. **THEN:** Import everything else

**If you already tried importing wash_club_verification or other tables:**
- Go to Supabase SQL Editor
- Run: `TRUNCATE public.wash_club_verification CASCADE;` (or delete those tables)
- Start over with users first

## Step-by-Step

### Step 1: Verify Schema Exists
Go to Supabase → SQL Editor, run:
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```
**Expected:** Should return `11`

If less than 11: Run `SUPABASE_MIGRATION_SCHEMA_IMPORT.sql` first

### Step 2: Check if Users Already Imported
```sql
SELECT COUNT(*) FROM public.users;
```
**Expected:** Should return `13` after import

If it returns `0`: Users not imported yet - do it now!

### Step 3: Import Users First
1. Supabase Dashboard → Table Editor
2. Click `users` table
3. Click **Import data** button (⬆️ icon, top right)
4. Select: `CSV_CLEAN/01_users.csv`
5. Click Import
6. Wait for success ✅

### Step 4: Verify Users Imported
```sql
SELECT COUNT(*) FROM public.users;
```
**Should return:** `13`

### Step 5: Now Import Other Tables
Only after users are imported, do:
1. `02_customers.csv` → customers table
2. `03_employees.csv` → employees table
3. `04_wash_clubs.csv` → wash_clubs table
4. `05_wash_club_verification.csv` → wash_club_verification table
5. `06_wash_club_transactions.csv` → wash_club_transactions table
6. `07_orders.csv` → orders table
7. `08_reviews.csv` → reviews table
8. `09_inquiries.csv` → inquiries table
9. `10_transactions.csv` → transactions table
10. `11_verification_codes.csv` → verification_codes table

---

**KEY POINT:** The CSV files are 100% correct. The error is because you imported dependent tables **before** importing the base users table.
