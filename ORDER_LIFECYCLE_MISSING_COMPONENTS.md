# Order Lifecycle - Still Missing Components

## What's Now Working ✅

After recent fixes, these parts of the order flow work correctly:

1. **Order Creation** - Order saved to database with correct price
2. **Payment Processing** - Stripe webhook updates order status and amount
3. **Success Page** - Displays correct order details and price
4. **Order Retrieval** - Orders appear in database and dashboard

---

## What's Still Missing ❌

### 1. Order Activity Tracking

**Missing:** `order_activity` table and activity logging

**Purpose:** Track all events for an order (created, payment received, assigned to pro, in transit, delivered, etc.)

**How it should work:**
```
Order Created → Activity: "Order placed"
Payment Processed → Activity: "Payment of $75 received"
Pro Assigned → Activity: "Assigned to Pro John"
In Transit → Activity: "Pro picked up items"
Delivered → Activity: "Items delivered"
```

**What needs to be done:**
1. Create `order_activity` table in Supabase:
```sql
CREATE TABLE order_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  event_type VARCHAR(50),
  description TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. Add logging to webhook when payment received:
```typescript
// In /app/api/webhooks/stripe/route.ts
await supabase.from('order_activity').insert({
  order_id: orderId,
  event_type: 'payment_received',
  description: `Payment of $${amountPaid} received via Stripe`,
  created_by: 'system',
})
```

3. Add activity endpoint to API:
```typescript
// GET /api/orders/[orderId]/activity
// Returns all activities for an order
```

---

### 2. Pro Job Assignment

**Missing:** `pro_jobs` table to track which jobs are available to which professionals

**Purpose:** Employees/Pros see available jobs and can claim them

**Current Issue:** Employees see ALL orders in the dashboard, not just available jobs for them

**What needs to be done:**

1. Create `pro_jobs` table:
```sql
CREATE TABLE pro_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  pro_id UUID REFERENCES employees(id),
  status VARCHAR(50), -- available, assigned, in-progress, completed
  assigned_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. When order is confirmed (webhook), create pro_jobs record:
```typescript
// In webhook when payment received
const { error: jobError } = await supabase
  .from('pro_jobs')
  .insert({
    order_id: orderId,
    status: 'available',  // Not assigned to anyone yet
    created_at: new Date().toISOString(),
  })
```

3. Update employee dashboard to show available jobs:
```typescript
// Instead of showing all orders
const { data: availableJobs } = await supabase
  .from('pro_jobs')
  .select('orders(*)')  // Join with orders
  .eq('status', 'available')
  .is('pro_id', null)  // Not assigned to anyone
  .order('created_at', { ascending: true })
```

4. Add "claim job" functionality:
```typescript
// When pro clicks "Accept Job"
await supabase
  .from('pro_jobs')
  .update({
    pro_id: currentProId,
    status: 'assigned',
    assigned_at: new Date(),
  })
  .eq('id', jobId)
```

---

### 3. Order Tracking Real-Time Updates

**Missing:** Real-time updates as order progresses through stages

**Current Issue:** Order status page shows static data

**What needs to be done:**

1. Add status steps tracking:
```typescript
// Define order status stages
const orderStages = [
  { status: 'pending', label: 'Order Confirmed' },
  { status: 'assigned', label: 'Pro Assigned' },
  { status: 'picked_up', label: 'Items Picked Up' },
  { status: 'in_progress', label: 'Being Washed' },
  { status: 'ready', label: 'Ready for Delivery' },
  { status: 'delivered', label: 'Delivered' },
]
```

2. Update order status when pro claims job:
```typescript
// When pro claims job, update order status
await supabase
  .from('orders')
  .update({ status: 'assigned' })
  .eq('id', orderId)
```

3. Add real-time listeners:
```typescript
// In tracking page
supabase
  .from('orders')
  .on('*', payload => {
    if (payload.new.id === orderId) {
      setOrderStatus(payload.new.status)
    }
  })
  .subscribe()
```

---

### 4. Customer Address Persistence

**Current Status:** Address sync is attempted but may fail silently if table doesn't exist

**Confirmed Working:** Order contains pickup and delivery addresses in `orders` table

**Potential Issue:** `customer_addresses` table may not exist for future reference

**What needs to be done:**

```sql
-- Create customer_addresses table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  label VARCHAR(100),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postcode VARCHAR(20),
  country VARCHAR(100),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Currently, the `addressSync.ts` handles missing table gracefully, so this is low priority.

---

### 5. Employee Notifications

**Missing:** Way to notify employees/pros about new available jobs

**What needs to be done:**

1. Create notification system:
```typescript
// When new job becomes available
await sendNotificationToAvailablePros(orderId)
```

2. Options:
   - Push notifications (Firebase Cloud Messaging)
   - Email notifications (SendGrid)
   - In-app notifications (database table + real-time updates)

---

## Priority Implementation Order

### Phase 1 (Critical - Blocking Features)
1. ✅ Order creation with correct price - DONE
2. ✅ Payment processing - DONE
3. ⏳ **Order Activity table** - Shows history to customers
4. ⏳ **Pro Jobs table** - Employees can see available work

### Phase 2 (Important - Core Features)
5. ⏳ Real-time order tracking
6. ⏳ Pro job claiming/assignment UI
7. ⏳ Order status updates when pro claims job

### Phase 3 (Nice to Have - UX Enhancement)
8. ⏳ Employee notifications
9. ⏳ Customer notifications
10. ⏳ Pro ratings/reviews system

---

## Current Workarounds

Until missing components are built:

1. **Employees seeing jobs:**
   - Currently: All orders show in employee dashboard
   - Workaround: Filter manually or add note in UI "Available for pickup"

2. **Order activity:**
   - Currently: Success page shows payment confirmation
   - Workaround: Use browser console to check webhook logs

3. **Real-time tracking:**
   - Currently: Static status page
   - Workaround: Refresh page to see updates

---

## Testing Without Missing Components

You can test the current fixes without building missing tables:

1. ✅ Create order → Check database for order with correct price
2. ✅ Pay with test card → Check webhook logs for payment update
3. ✅ Success page → Verify $75.00 displays correctly
4. ✅ Dashboard → Verify order appears with correct price

All of these work with current fixes.

---

## Next Steps

After verifying current fixes work:

1. Create `order_activity` table
2. Update webhook to log activity when payment received
3. Create `pro_jobs` table
4. Update webhook to create job when order confirmed
5. Update employee dashboard to show available jobs
6. Test end-to-end flow

---

**Last Updated:** April 7, 2026
**Status:** Ready for implementation
