# How to Add Phone Verification to Supabase

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to: https://app.supabase.com
- Select your project: **Washlee3**
- You should see your database

### 2. Navigate to SQL Editor
- Click: **SQL Editor** (left sidebar)
- Click: **New Query** (top right button)

### 3. Copy the SQL
- Open this file: `SUPABASE_PHONE_MIGRATION.sql` (in your workspace root)
- Copy **all the SQL** (lines 7-33, the actual migration code)

**The SQL to paste:**
```sql
-- Add phone column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

-- Add phone_verified column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Add phone_verified_at column (timestamp of when verified)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

-- Add unique constraint on phone (prevents duplicates, allows multiple NULLs)
ALTER TABLE users
ADD CONSTRAINT unique_phone UNIQUE (phone) WHERE phone IS NOT NULL;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('phone', 'phone_verified', 'phone_verified_at')
ORDER BY ordinal_position;
```

### 4. Paste into Supabase
- In the SQL Editor query box, paste the SQL
- You should see the SQL highlighted in the editor

### 5. Run the Migration
- Click: **Run** button (or press `Cmd+Enter`)
- Wait for completion (should be instant)

### 6. Verify Success
- You should see a result like:
```
column_name       | data_type                     | is_nullable
phone             | character varying             | YES
phone_verified    | boolean                       | NO
phone_verified_at | timestamp with time zone      | YES
```

If you see this output, ✅ **Success!** The columns are added.

---

## What Each Column Does

### `phone` (VARCHAR 20)
- Stores the Australian phone number
- Example: `0412345678` or `02 1234 5678`
- **Nullable**: Users can sign up without phone initially
- **Unique**: Only one user can have each phone number

### `phone_verified` (BOOLEAN)
- Tracks if phone is verified: `true` or `false`
- Default: `false` (unverified on signup)
- When verified: Set to `true`

### `phone_verified_at` (TIMESTAMP)
- Records exact time phone was verified
- Example: `2026-03-26 14:30:45.123+00`
- Useful for: Audit trails, knowing when verification happened
- **Nullable**: NULL until phone is verified

---

## After Migration: Test with SQL

### View all users with phone info
```sql
SELECT email, phone, phone_verified, phone_verified_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

### Create test users for testing
```sql
-- Test user with no phone
INSERT INTO users (email, user_type, phone, phone_verified)
VALUES ('test1@example.com', 'customer', NULL, FALSE);

-- Test user with unverified phone
INSERT INTO users (email, user_type, phone, phone_verified)
VALUES ('test2@example.com', 'customer', '0412345678', FALSE);

-- Test user with verified phone
INSERT INTO users (email, user_type, phone, phone_verified, phone_verified_at)
VALUES ('test3@example.com', 'customer', '0487654321', TRUE, NOW());
```

### Check unique constraint works
```sql
-- This will SUCCEED (different phones)
INSERT INTO users (email, user_type, phone)
VALUES ('test4@example.com', 'customer', '0298765432');

-- This will FAIL (duplicate phone)
INSERT INTO users (email, user_type, phone)
VALUES ('test5@example.com', 'customer', '0412345678');
-- Error: duplicate key value violates unique constraint "unique_phone"

-- This will SUCCEED (NULL phones allowed)
INSERT INTO users (email, user_type, phone)
VALUES ('test6@example.com', 'customer', NULL);
```

---

## Troubleshooting

### Error: "column already exists"
- ✅ This is OK! It means `IF NOT EXISTS` is working
- The columns were already there
- No action needed, migration still works

### Error: "constraint already exists"
- ✅ This is OK! Same as above
- The constraint was already there
- No action needed

### Error: "relation 'users' does not exist"
- ❌ Problem: Table name is wrong
- Check: Your table might be named differently
- Solution: Ask in chat, I'll help fix it

### No output after running
- ✅ This is OK! Sometimes queries that modify schema don't show output
- Check the **Results** tab anyway
- Or run the verification query separately to confirm

---

## Optional: Add Phone Columns to Other Tables

If you want to also track phone in `customers` or `employees` tables:

### For customers table:
```sql
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

### For employees table:
```sql
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

---

## Next Steps After Migration

1. ✅ Run the SQL in Supabase (this guide)
2. Run the test script: `test-phone-verification.sql`
3. Start dev server: `npm run dev`
4. Test all 9 scenarios locally
5. Commit changes to git

---

## Summary

**What you need to do:**
1. Copy SQL from `SUPABASE_PHONE_MIGRATION.sql`
2. Paste into Supabase SQL Editor
3. Click Run
4. Verify output shows 3 new columns
5. Done! ✅

**Time to complete:** 2 minutes
**Impact:** No breaking changes
**Reversible:** Yes (can drop columns if needed)
