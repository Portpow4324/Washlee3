# 🔧 Fix: Run Migration to Create refund_requests Table

## The Problem
```
Error: Could not find the table 'public.refund_requests'
```

The table doesn't exist yet - we need to create it using the migration file.

---

## The Solution (3 Simple Steps)

### Step 1️⃣: Copy the Migration SQL

Open this file in your editor:
```
migrations/create_refund_requests_table.sql
```

Select ALL the content (Cmd+A or Ctrl+A) and copy it (Cmd+C or Ctrl+C)

---

### Step 2️⃣: Go to Supabase SQL Editor

1. Open https://app.supabase.com
2. Select your **Washlee** project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** (or the + button)

**Screenshot locations:**
- SQL Editor: Left menu → SQL Editor
- New Query: Top right area

---

### Step 3️⃣: Paste & Execute

1. Paste the SQL into the query editor (Cmd+V or Ctrl+V)
2. Click **Run** button (or press Cmd+Enter / Ctrl+Enter)
3. Wait for success ✅

---

## What You Should See

### ✅ If Successful:
```
Query returned successfully with 0 rows affected
```

Green checkmark appears ✓

### ❌ If It Fails:
Check the error message. Common issues:
- `orders table not found` → Make sure orders table exists
- `users table not found` → Make sure users table exists
- Permission denied → Use service role/admin connection

---

## Verify It Worked

After running migration, paste this into a NEW query and run it:

```sql
SELECT * FROM refund_requests LIMIT 1;
```

Should show: Table exists (even if empty)

---

## Then Your App Works!

Once migration is done:

1. Refresh your browser (http://localhost:3000)
2. Go to `/dashboard/orders`
3. Find a cancelled order
4. Click **Request Refund**
5. It should work now! 🎉

---

## Complete Migration SQL

Here's the full migration to copy:

```sql
-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
CREATE INDEX idx_refund_requests_created_at ON refund_requests(created_at);

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refund requests"
  ON refund_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage refund requests"
  ON refund_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update refund requests"
  ON refund_requests FOR UPDATE
  USING (true);

CREATE OR REPLACE FUNCTION update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refund_requests_updated_at_trigger
BEFORE UPDATE ON refund_requests
FOR EACH ROW
EXECUTE FUNCTION update_refund_requests_updated_at();
```

---

**That's it!** Copy, paste, run. Your app will work immediately after. ⚡
