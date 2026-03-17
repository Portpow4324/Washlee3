# Supabase Phase 2: Database Schema Setup

## Overview
This guide walks you through creating the PostgreSQL database schema in Supabase. This replaces Firebase Firestore with a relational database.

**Time Required**: 10-15 minutes
**Complexity**: Low (copy-paste SQL)
**Prerequisites**: Supabase project created ✅

---

## Step-by-Step Instructions

### 1. Go to Supabase SQL Editor

1. Open: https://app.supabase.com
2. Login with your Supabase account
3. Select your **Washlee project** (the one you created)
4. In the left sidebar, click **SQL Editor**

### 2. Create New Query

1. Click the **+ New query** button (top right of SQL Editor)
2. A new blank SQL editor will open

### 3. Copy the Schema SQL

The complete schema is in: `SUPABASE_MIGRATION_SCHEMA.sql`

**What this schema creates:**
- ✅ 11 PostgreSQL tables (users, customers, employees, wash_clubs, orders, reviews, inquiries, transactions, verification_codes, etc.)
- ✅ 30+ indexes for optimal query performance
- ✅ Row Level Security (RLS) policies for data privacy
- ✅ Utility functions (card number generation, timestamp updates)
- ✅ Triggers for automatic timestamp management

**Key tables:**
```
users                    → All users (customers, pros, admins)
customers               → Customer-specific data
employees               → Pro/employee data
wash_clubs              → Loyalty program memberships
wash_club_verification  → Email verification codes
orders                  → Service orders
reviews                 → Customer reviews
transactions            → Payment/credit transactions
inquiries               → Pro applications & inquiries
verification_codes      → General verification codes
```

### 4. Paste SQL into Editor

1. Copy the entire contents of `SUPABASE_MIGRATION_SCHEMA.sql`
2. Paste into the SQL Editor in Supabase
3. You should see a large block of SQL code

### 5. Execute the Query

1. Click the **Run** button (bottom right, or Cmd+Enter)
2. Wait for execution to complete (10-30 seconds)
3. You'll see a success message:
   ```
   Success. No rows returned
   ```

### 6. Verify Schema Was Created

Once complete, verify all tables exist:

1. In the left sidebar, click **Tables**
2. You should see these tables listed:
   - `users`
   - `customers`
   - `employees`
   - `wash_clubs`
   - `wash_club_verification`
   - `wash_club_transactions`
   - `orders`
   - `reviews`
   - `inquiries`
   - `transactions`
   - `verification_codes`

**If you don't see all tables:**
- Check the SQL Editor output for errors
- Scroll down in the Tables list
- Try refreshing the page (F5)

### 7. Optional: Inspect Table Structure

1. Click on any table (e.g., `users`)
2. Click the **Structure** tab to see columns
3. This confirms the table was created correctly

---

## What Happens Next (Phase 3)

Once this schema is created, you'll:

1. **Update AuthContext.tsx** → Use Supabase Auth instead of Firebase
2. **Update 4 email routes** → Keep SendGrid, just change database layer
3. **Update 40 API routes** → Replace Firebase calls with Supabase queries
4. **Update 40+ frontend pages** → Use Supabase client instead of Firebase
5. **Test everything** → Verify the migration works

---

## Troubleshooting

### Error: "Column already exists"
This means the schema was already created. You can:
- Delete all tables and re-run (or continue to Phase 3)
- Run the schema again with `DROP TABLE IF EXISTS` (already included)

### Error: "Function already exists"
This is normal if running twice. The schema includes `IF NOT EXISTS` and `CREATE OR REPLACE` to handle this.

### Tables not showing in sidebar
Click the refresh icon or reload the page in your browser.

### Queries running slowly
This is normal for the first run. Indexes are being created.

---

## Confirmation Checklist

✅ Can you see SQL Editor?
✅ Did you paste the entire schema?
✅ Did you click Run?
✅ Do you see "Success" message?
✅ Can you see all 11 tables in the Tables list?

If all above are ✅, **Phase 2 is complete!**

**Next: Read SUPABASE_PHASE_3_AUTHCONTEXT.md**

---

## Reference: SQL Statistics

```
Lines of SQL:      348
Tables created:    11
Indexes created:   30+
RLS policies:      7
Functions:         2
Triggers:          8
Estimated time:    30 seconds
```

---

## Full Table Reference

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | All users | id, email, name, user_type |
| `customers` | Customer details | id, subscription_plan, delivery_address |
| `employees` | Pro/employee data | id, rating, earnings |
| `wash_clubs` | Loyalty memberships | id, card_number, tier, credits_balance |
| `wash_club_verification` | Email verification | user_id, code, expires_at |
| `wash_club_transactions` | Credit audit trail | user_id, type, amount |
| `orders` | Service orders | id, user_id, pro_id, status |
| `reviews` | Customer reviews | order_id, customer_id, pro_id, rating |
| `inquiries` | Pro applications | type, user_id, status |
| `transactions` | Payments | user_id, order_id, amount, status |
| `verification_codes` | Email/phone codes | user_id, type, code |

