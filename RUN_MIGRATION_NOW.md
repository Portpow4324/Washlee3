# Run This Migration Now!

## Error Fix: Create refund_requests Table

**Error**: `Could not find the table 'public.refund_requests' in the schema cache`

**Cause**: The migration file exists but hasn't been executed in Supabase

**Solution**: Run the migration in Supabase SQL Editor

---

## Quick Steps

### 1. Open Supabase
- Go to https://app.supabase.com
- Select your project
- Click **SQL Editor** (left sidebar)

### 2. Create New Query
- Click **New Query**
- Or click the **+** button

### 3. Copy & Paste Migration
Copy the entire contents of:
```
migrations/create_refund_requests_table.sql
```

And paste into the SQL Editor

### 4. Execute
- Click **Run** button
- Or press **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows)

### 5. Verify Success
You should see green checkmark: ✅ Success

---

## Verify Table Was Created

Run this query in SQL Editor to confirm:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'refund_requests';
```

You should see: `refund_requests` in the results

---

## Then Test Immediately

After running migration:

1. Go to `/dashboard/orders` in your app
2. Find a cancelled order (or create one by cancelling)
3. Click **Request Refund**
4. You should see it work now! 🎉

---

## Need Help?

If migration fails, check:
- Are `orders` and `users` tables present?
- Do table names match exactly?
- Is your Supabase project active?

Try running line-by-line in SQL Editor if it fails.

---

**That's it! Just copy, paste, and run.** ⚡
