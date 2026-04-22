# Fix for Foreign Key Constraint on pro_jobs.pro_id

## Problem
The `pro_jobs` table has a foreign key constraint on `pro_id` that references a non-existent `employees` table.

```
ALTER TABLE pro_jobs DROP CONSTRAINT IF EXISTS pro_jobs_pro_id_fkey;
```

## Steps to fix:

1. Go to Supabase Dashboard
2. Open the SQL Editor
3. Copy and paste this SQL:
```sql
ALTER TABLE pro_jobs DROP CONSTRAINT IF EXISTS pro_jobs_pro_id_fkey;
```
4. Click "Run"

After this, employee job acceptance will work properly.
