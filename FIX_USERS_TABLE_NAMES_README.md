# Fix Users Table Names - Migration Guide

## Problem
The `users` table was missing `first_name` and `last_name` fields, causing the profile header to display email prefixes instead of actual user names.

## Solution
Run the migration SQL script to:
1. Add `first_name` and `last_name` columns to the users table (if missing)
2. Populate these fields from existing customer/employee records
3. Set sensible defaults (email prefix) for any remaining NULL values

## How to Apply

### Option 1: Using Supabase Dashboard (Easiest)
1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Click "New Query"
5. Copy the entire contents of `FIX_USERS_TABLE_NAMES.sql`
6. Paste it into the query editor
7. Click "Run" button
8. Check the results at the bottom

### Option 2: Using psql (Command Line)
```bash
psql postgresql://user:password@host:5432/postgres < FIX_USERS_TABLE_NAMES.sql
```

Replace with your actual Supabase connection string from Settings > Database > Connection String

### Option 3: Using Supabase CLI
```bash
supabase db push
```
(If you've added the file to your migrations folder)

## What the Script Does

### Step 1: Add Columns
Adds `first_name` and `last_name` TEXT columns if they don't already exist.

### Step 2: Populate from Customers
For users with `user_type = 'customer'`, fills in first_name and last_name from the customers table.

### Step 3: Populate from Employees
For users with `user_type = 'pro'` or `is_employee = true`, fills in first_name and last_name from the employees table.

### Step 4: Set Defaults
For any remaining NULL names, sets:
- `first_name`: Email prefix (everything before @)
- `last_name`: Empty string

### Step 5-6: Verification
Shows sample users and statistics so you can verify the migration worked.

## Expected Output

After running, you should see:
- All users having non-NULL first_name values
- Most users (except edge cases) having meaningful last_name values
- Sample of users showing the populated names

Example:
```
 id                 | email           | first_name | last_name | user_type
--------------------|-----------------|-----------|-----------|----------
 ae4b5696-e9d5-... | user@email.com | Luke      | Verde     | customer
 bf5c6797-f0e6-... | pro@email.com  | John      | Smith     | pro
```

## After Migration

1. **Rebuild your app** to clear any caches:
   ```bash
   npm run build
   ```

2. **Restart your dev server**:
   ```bash
   npm run dev
   ```

3. **Log out and log back in** to see the updated names in the header

4. **New signups** will automatically get first_name and last_name from the updated signup endpoint

## Rollback

If needed, you can set names to NULL again:
```sql
UPDATE public.users
SET first_name = NULL, last_name = NULL
WHERE true;
```

But this shouldn't be necessary - the migration is safe and won't lose any data.

## Related Changes

This migration pairs with:
- `app/api/auth/signup/route.ts` - Now stores first_name and last_name in users table on signup
- `lib/AuthContext.tsx` - Now fetches and displays first_name and last_name reliably
- `components/Header.tsx` - Now displays actual names instead of email prefixes

## Questions?

If you run into issues:
1. Check that your Supabase credentials are correct
2. Verify RLS policies aren't blocking the UPDATE (they shouldn't - this uses admin access)
3. Check that the users, customers, and employees tables exist
