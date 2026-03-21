# Backend Migration: Firebase to Supabase Complete Guide

## Overview

This guide explains how all backend operations that were using Firebase Admin SDK have been migrated to Supabase.

### What Changed

| Operation | Firebase (Old) | Supabase (New) |
|-----------|---|---|
| User Profiles | Firestore `users` collection | `customers` and `employees` tables |
| Orders | Firestore `orders` collection | `orders` table |
| Admin Operations | Firebase Admin SDK | Supabase Service Role Key |
| Notifications | Firebase Cloud Messaging | `admin_notifications` table + Realtime |
| Emails | SendGrid via Cloud Functions | SendGrid via API routes |
| Webhooks | Cloud Functions | Next.js API routes |
| Queries | Firestore queries | SQL via Supabase |
| Authentication | Firebase Auth Custom Claims | Supabase auth + `role` column |

---

## Database Schema

### customers table
Replaces Firebase `users` collection for customer data.

```sql
id                    UUID (Primary Key, references auth.users)
email                 TEXT (UNIQUE)
first_name            TEXT
last_name             TEXT
phone                 TEXT
state                 TEXT
personal_use          TEXT
preference_marketing_texts  BOOLEAN
preference_account_texts    BOOLEAN
selected_plan         TEXT
account_status        TEXT ('active', 'inactive')
role                  TEXT ('user', 'admin')
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### employees table
Replaces Firebase employee records.

```sql
id                    UUID (Primary Key, references auth.users)
email                 TEXT (UNIQUE)
name                  TEXT
phone                 TEXT
employee_id           TEXT (UNIQUE)
account_status        TEXT
role                  TEXT ('employee', 'admin')
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### orders table
Replaces Firebase `orders` collection.

```sql
id                    UUID (Primary Key)
customer_id           UUID (references customers)
weight                NUMERIC
service_type          TEXT
price                 NUMERIC
status                TEXT
pickup_date           TIMESTAMP
delivery_date         TIMESTAMP
notes                 TEXT
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### wholesale_inquiries table
Stores business inquiry submissions.

```sql
id                    UUID (Primary Key)
company               TEXT
contact_name          TEXT
email                 TEXT
phone                 TEXT
estimated_weight      NUMERIC
order_type            TEXT
frequency             TEXT
notes                 TEXT
status                TEXT ('pending', 'approved', 'rejected')
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### admin_notifications table
Replaces Firebase Cloud Messaging for admin alerts.

```sql
id                    UUID (Primary Key)
recipient_id          UUID (references customers)
title                 TEXT
message               TEXT
type                  TEXT ('order', 'inquiry', 'payment', 'user', 'system')
related_id            TEXT
data                  JSONB (flexible metadata)
read                  BOOLEAN
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### email_logs table
Tracks all sent emails for auditing.

```sql
id                    UUID (Primary Key)
recipient_email       TEXT
subject               TEXT
template_type         TEXT
status                TEXT ('pending', 'sent', 'failed')
message_id            TEXT
error_message         TEXT
sent_at               TIMESTAMP
created_at            TIMESTAMP
```

### stripe_events table
Logs Stripe webhook events for retry logic.

```sql
id                    UUID (Primary Key)
stripe_event_id       TEXT (UNIQUE)
event_type            TEXT
customer_id           UUID
data                  JSONB
processed             BOOLEAN
processed_at          TIMESTAMP
created_at            TIMESTAMP
```

---

## Key Differences

### 1. Authentication & Authorization

**Firebase (Old):**
```typescript
import admin from 'firebase-admin'
const decodedToken = await admin.auth().verifyIdToken(token)
const isAdmin = decodedToken.admin === true  // Custom claim
```

**Supabase (New):**
```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin'
const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId)
const isAdmin = await isUserAdmin(userId)  // Check role column
```

### 2. Reading Data

**Firebase (Old):**
```typescript
const snapshot = await admin.firestore().collection('users').get()
const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

**Supabase (New):**
```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin'
const { data: users, error } = await supabaseAdmin.from('customers').select('*')
```

### 3. Writing Data

**Firebase (Old):**
```typescript
await admin.firestore().collection('users').doc(uid).set(userData)
```

**Supabase (New):**
```typescript
const { error } = await supabaseAdmin
  .from('customers')
  .insert({ id: uid, ...userData })
```

### 4. Updating Data

**Firebase (Old):**
```typescript
await admin.firestore().collection('users').doc(uid).update({ name: 'New Name' })
```

**Supabase (New):**
```typescript
const { error } = await supabaseAdmin
  .from('customers')
  .update({ first_name: 'New Name' })
  .eq('id', uid)
```

### 5. Queries with Conditions

**Firebase (Old):**
```typescript
const snapshot = await admin.firestore()
  .collection('users')
  .where('status', '==', 'active')
  .where('role', '==', 'admin')
  .get()
```

**Supabase (New):**
```typescript
const { data } = await supabaseAdmin
  .from('customers')
  .select('*')
  .eq('account_status', 'active')
  .eq('role', 'admin')
```

### 6. Complex Queries

**Firebase (Old):**
```typescript
const snapshot = await admin.firestore()
  .collection('orders')
  .where('customer_id', '==', uid)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get()
```

**Supabase (New):**
```typescript
const { data } = await supabaseAdmin
  .from('orders')
  .select('*')
  .eq('customer_id', uid)
  .order('created_at', { ascending: false })
  .limit(10)
```

---

## API Route Examples

### Create Order

```typescript
// POST /api/orders/create
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id: body.customerId,
      weight: body.weight,
      service_type: body.serviceType,
      price: body.price,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, order })
}
```

### Get Admin Data

```typescript
// GET /api/admin/analytics
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  // Get active customers count
  const { count: activeCustomers } = await supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('account_status', 'active')

  // Get pending orders
  const { data: pendingOrders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('status', 'pending')

  // Get recent inquiries
  const { data: recentInquiries } = await supabaseAdmin
    .from('wholesale_inquiries')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    success: true,
    analytics: { activeCustomers, pendingOrders, recentInquiries }
  })
}
```

### Send Admin Notification

```typescript
// Helper function
export async function notifyAdmin(notification: {
  recipientId: string
  title: string
  message: string
  type: string
  relatedId?: string
}) {
  const { error } = await supabaseAdmin
    .from('admin_notifications')
    .insert({
      recipient_id: notification.recipientId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      related_id: notification.relatedId,
      read: false,
      created_at: new Date().toISOString(),
    })

  if (error) throw error
}
```

### Process Stripe Webhook

```typescript
// POST /api/webhooks/stripe
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log the event
  const { error: logError } = await supabaseAdmin
    .from('stripe_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      customer_id: event.data.object.metadata?.customerId,
      data: event.data,
      processed: false,
      created_at: new Date().toISOString(),
    })

  // Handle based on type
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Update order status
      const { customerId, orderId } = event.data.object.metadata
      await supabaseAdmin
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)
      break
    // ... more cases
  }

  // Mark as processed
  await supabaseAdmin
    .from('stripe_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id)

  return NextResponse.json({ success: true })
}
```

---

## Admin Functions (lib/supabaseAdmin.ts)

All these helper functions are available:

```typescript
// User management
getAllCustomers()
getAllEmployees()
getCustomer(userId)
updateCustomer(userId, updates)
deleteCustomer(userId)
isUserAdmin(userId)
grantAdminRole(userId)
removeAdminRole(userId)

// Order management
createOrder(orderData)
getAllOrders(filters)
updateOrderStatus(orderId, status)

// Inquiry management
createWholesaleInquiry(inquiryData)
getAllWholesaleInquiries()
updateWholesaleInquiryStatus(inquiryId, status)

// Notifications
sendAdminNotification(notification)
getAdminNotifications(adminId, unreadOnly)
markNotificationAsRead(notificationId)
```

---

## Migration Checklist

Before going live with Supabase:

- [ ] Run `SUPABASE_SETUP.sql` to create all tables
- [ ] Verify `.env.local` has:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Test customer signup (creates profile in `customers` table)
- [ ] Test order creation (saves to `orders` table)
- [ ] Test wholesale inquiry submission
- [ ] Test admin dashboard (reads from tables)
- [ ] Test email notifications (logs to `email_logs`)
- [ ] Test Stripe webhooks (logs to `stripe_events`)
- [ ] Verify admin can view notifications in real-time
- [ ] Test mark notification as read
- [ ] Check Row Level Security policies are working
- [ ] Verify indexes exist for performance

---

## Troubleshooting

### "Table 'customers' does not exist"
Run the SQL setup script in Supabase:
1. Dashboard → SQL Editor → New Query
2. Copy `SUPABASE_SETUP.sql`
3. Click Run

### "Permission denied" error
- Check RLS policies are created
- Verify user role is set correctly
- Admin operations need service role key (SUPABASE_SERVICE_ROLE_KEY)

### "Invalid credentials"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- Check it's the full secret key, not the anon key
- Restart dev server after adding env var

### Emails not being sent
- Check SendGrid API key is in `.env.local`
- Verify `SENDGRID_FROM_EMAIL` is set
- Look for logs with `[EMAIL]` prefix in console

### Notifications not appearing
- Verify admin user has `role = 'admin'` in `customers` table
- Check notification was inserted in `admin_notifications` table
- Frontend needs to subscribe to realtime updates

---

## Performance Tips

1. **Use indexes**: All major queries have indexes created
2. **Pagination**: Use `.range()` for large datasets
3. **Realtime**: Enable for `admin_notifications` to get instant updates
4. **Caching**: Consider caching frequently accessed data
5. **Batch operations**: Use RLS to minimize queries

---

## Security

✅ **Row Level Security (RLS)** - All tables have RLS policies
✅ **Service Role Key** - Used only server-side (never in browser)
✅ **Auth Verification** - All API routes verify user identity
✅ **Email Validation** - Inbox validation on signup
✅ **Rate Limiting** - Supabase handles per API key

---

## Next Steps

1. Create all tables with SQL setup script
2. Update each API route to use Supabase Admin
3. Test each feature end-to-end
4. Monitor logs for errors
5. Deploy to production

See individual route files for specific implementations.
