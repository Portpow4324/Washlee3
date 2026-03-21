# 🚀 Supabase Backend - Quick Reference

## Setup (First Time)

```sql
-- 1. Go to Supabase Dashboard → SQL Editor → New Query
-- 2. Copy and paste entire SUPABASE_SETUP.sql
-- 3. Click Run
-- 4. Verify tables in Table Editor
```

## Environment Variables Required

```env
# Supabase (in .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Email (already configured)
SENDGRID_API_KEY=SG.JlFAT7z...
SENDGRID_FROM_EMAIL=lukaverde045@gmail.com

# Stripe (already configured)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Most Used Functions

### Get All Customers
```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const { data: customers, error } = await supabaseAdmin
  .from('customers')
  .select('*')
  .order('created_at', { ascending: false })
```

### Create Order
```typescript
const { data: order, error } = await supabaseAdmin
  .from('orders')
  .insert({
    customer_id: userId,
    weight: 5.5,
    service_type: 'standard',
    price: 25.00,
    status: 'pending'
  })
  .select()
  .single()
```

### Send Admin Notification
```typescript
const { error } = await supabaseAdmin
  .from('admin_notifications')
  .insert({
    recipient_id: adminUserId,
    title: 'New Order',
    message: 'Order #123 received',
    type: 'order',
    related_id: orderId
  })
```

### Get Admin Status
```typescript
import { supabaseAdmin, isUserAdmin } from '@/lib/supabaseAdmin'

const isAdmin = await isUserAdmin(userId)
```

### Update Customer
```typescript
const { error } = await supabaseAdmin
  .from('customers')
  .update({
    first_name: 'John',
    phone: '+61412345678'
  })
  .eq('id', userId)
```

## Table Reference

| Table | Purpose | Main Columns |
|-------|---------|--------------|
| `customers` | Customer profiles | id, email, first_name, last_name, phone, state, role |
| `employees` | Pro/employee profiles | id, email, name, employee_id, account_status |
| `orders` | Orders | id, customer_id, weight, service_type, price, status |
| `wholesale_inquiries` | Business inquiries | id, company, contact_name, estimated_weight, status |
| `admin_notifications` | Admin alerts | id, recipient_id, title, message, type, read |
| `email_logs` | Email audit trail | id, recipient_email, subject, status, sent_at |
| `stripe_events` | Webhook events | id, stripe_event_id, event_type, data, processed |

## Common Queries

### Find pending orders
```typescript
const { data } = await supabaseAdmin
  .from('orders')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
```

### Find admin notifications
```typescript
const { data } = await supabaseAdmin
  .from('admin_notifications')
  .select('*')
  .eq('recipient_id', adminId)
  .eq('read', false)
  .order('created_at', { ascending: false })
```

### Count active customers
```typescript
const { count } = await supabaseAdmin
  .from('customers')
  .select('*', { count: 'exact' })
  .eq('account_status', 'active')
```

### Find orders for a customer
```typescript
const { data } = await supabaseAdmin
  .from('orders')
  .select('*')
  .eq('customer_id', customerId)
  .order('created_at', { ascending: false })
```

## API Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate
    if (!body.requiredField) {
      return NextResponse.json(
        { success: false, error: 'Missing required field' },
        { status: 400 }
      )
    }
    
    // Get auth user (if needed)
    const authHeader = request.headers.get('authorization')
    // ... verify token ...
    
    // Database operation
    const { data, error } = await supabaseAdmin
      .from('table_name')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[API]', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

## RLS Policy Examples

### Admin-only read
```sql
CREATE POLICY "Admins can view all data"
  ON table_name FOR SELECT
  USING (
    SELECT role = 'admin' FROM customers WHERE id = auth.uid()
  );
```

### Own data only
```sql
CREATE POLICY "Users view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

### Authenticated users
```sql
CREATE POLICY "Authenticated users can insert"
  ON table_name FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

## Debugging

### Check if table exists
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'customers';
```

### View RLS policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'customers';
```

### Check user role
```sql
SELECT id, email, role FROM customers WHERE id = 'user-uuid';
```

### Find failed emails
```sql
SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC;
```

### Check unprocessed webhooks
```sql
SELECT * FROM stripe_events WHERE processed = false ORDER BY created_at DESC;
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Table 'X' does not exist" | SQL setup not run | Run `SUPABASE_SETUP.sql` |
| "Permission denied" | RLS policy blocking | Check policy or use service role |
| "Invalid credentials" | Wrong API key | Verify `SUPABASE_SERVICE_ROLE_KEY` |
| "Email not sending" | SendGrid config | Check `SENDGRID_API_KEY` in env |
| "Webhook not processing" | Event already processed | Check `stripe_events` table |

## Admin Operations

```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Make user admin
await supabaseAdmin
  .from('customers')
  .update({ role: 'admin' })
  .eq('id', userId)

// Remove admin
await supabaseAdmin
  .from('customers')
  .update({ role: 'user' })
  .eq('id', userId)

// Delete customer
await supabaseAdmin.from('customers').delete().eq('id', userId)
await supabaseAdmin.auth.admin.deleteUser(userId)

// Get all admins
const { data: admins } = await supabaseAdmin
  .from('customers')
  .select('*')
  .eq('role', 'admin')
```

## Real-Time Subscriptions

```typescript
supabaseAdmin
  .from('admin_notifications')
  .on('*', payload => {
    console.log('New notification:', payload.new)
  })
  .subscribe()
```

## Helpful Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **SQL Reference:** https://www.postgresql.org/docs/
- **Supabase Docs:** https://supabase.com/docs
- **SendGrid:** https://sendgrid.com/
- **Stripe Docs:** https://stripe.com/docs

---

**Last Updated:** March 19, 2026
**All Systems:** ✅ Ready to Deploy
