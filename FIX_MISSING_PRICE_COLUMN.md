# ⚠️ DATABASE COLUMN MISSING FIX

**Issue:** Dashboard showing error: "column orders.price does not exist"

**Root Cause:** The orders table in Supabase is missing the `price` column and other required fields

**Solution:** Run the migration SQL to add missing columns

---

## Quick Fix - Run This SQL

Go to **Supabase SQL Editor** and run:

```sql
-- Add missing price column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;

-- Add other potentially missing columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS scheduled_pickup_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pro_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_pro_id ON orders(pro_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
```

**Time:** < 1 minute  
**Risk:** None (just adds missing columns)

---

## Steps

1. Open https://app.supabase.com
2. Select Washlee project
3. Click **SQL Editor**
4. Click **New Query**
5. Copy the SQL above
6. Paste it
7. Click **Run** ▶️
8. Wait for success message
9. Refresh browser
10. Dashboard should now work!

---

## Code Changes Made

The dashboard has been updated to gracefully handle missing columns:

1. **Try-catch logic** - Attempts to fetch with all columns, falls back to basic if some don't exist
2. **Optional fields** - All database fields are now optional in the interface
3. **Better error handling** - Detects "column does not exist" errors and provides fallback

---

## Verification

After running the SQL, verify columns exist:

```sql
-- Check columns were created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';
```

You should see:
- ✅ price (numeric)
- ✅ delivery_address (text)
- ✅ pickup_address (text)
- ✅ scheduled_pickup_date (timestamp)
- ✅ pro_id (uuid)

---

## File Modified

- `app/dashboard/page.tsx` - Updated with fallback logic and optional fields

---

## Why This Happened

The database schema in Supabase doesn't match the expected schema from the codebase. This migration ensures they match by adding the missing columns that the code expects.

---

**After running the SQL, the dashboard will work correctly!** ✅

