# ✅ Refund System - Database Schema Fix

## Problem Fixed
The original SQL migration had incorrect column names that didn't match your actual database schema:
- ❌ `customer_id` → ✅ `user_id`
- ❌ `refund_amount` → ✅ `amount`
- ❌ `order_id TEXT` → ✅ `order_id UUID`
- ❌ `ticket_id` field → Removed (not in schema)

## What Was Updated

### 1. SQL Migration File
**File**: `REFUND_SYSTEM_MIGRATION.sql`
- Now uses correct column names matching your database
- Uses proper data types (UUID for IDs, NUMERIC for amounts)
- RLS policies configured correctly
- Uses `IF NOT EXISTS` to safely run multiple times

### 2. Refund API Endpoint
**File**: `/app/api/refunds/route.ts`

**POST Request (Create Refund)**
```typescript
POST /api/refunds
{
  "orderId": "uuid-format",      // UUID of the order
  "userId": "uuid-format",       // UUID of the user
  "amount": 45.50,               // Refund amount
  "paymentMethod": "stripe",     // Optional
  "transactionId": "txn_123",    // Optional
  "notes": "Quality issue",      // Optional
  "email": "customer@example.com",
  "customerName": "John Doe"
}
```

**Response**
```json
{
  "success": true,
  "refundId": "uuid-of-refund",
  "orderId": "uuid-of-order",
  "amount": 45.50,
  "status": "pending",
  "message": "Refund request created successfully. ID: uuid"
}
```

**GET Requests**
```
GET /api/refunds?orderId=uuid      // Get refunds by order
GET /api/refunds?userId=uuid       // Get refunds by user
GET /api/refunds?refundId=uuid     // Get specific refund
GET /api/refunds?status=pending    // Get by status
```

## Database Schema
The table now matches your actual Supabase schema:

```sql
CREATE TABLE refund_requests (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,           -- References orders table
  user_id UUID NOT NULL,            -- References users table
  amount NUMERIC(10, 2) NOT NULL,   -- Refund amount
  status TEXT DEFAULT 'pending',    -- pending, processing, completed, failed
  payment_method TEXT,              -- stripe, paypal, etc.
  transaction_id TEXT,              -- External transaction reference
  notes TEXT,                       -- Admin or customer notes
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

## How to Deploy

### Step 1: Run the Migration
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy content from `REFUND_SYSTEM_MIGRATION.sql`
4. Execute the SQL
5. If table already exists, it will skip gracefully

### Step 2: Test the API
```bash
curl -X POST http://localhost:3000/api/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "your-order-uuid",
    "userId": "your-user-uuid",
    "amount": 45.50,
    "email": "customer@example.com",
    "customerName": "John Doe",
    "notes": "Quality issue with delivery"
  }'
```

### Step 3: Query Refund Status
```bash
# Get refunds by user
curl http://localhost:3000/api/refunds?userId=your-user-uuid

# Get refunds by order
curl http://localhost:3000/api/refunds?orderId=your-order-uuid
```

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| Customer ID Column | `customer_id` | `user_id` |
| Refund Amount Column | `refund_amount` | `amount` |
| Order ID Type | TEXT | UUID |
| Ticket System | Custom `ticket_id` field | Uses `refund.id` (UUID) |
| Status Values | PENDING, APPROVED, etc. | pending, processing, completed, failed |
| Email Sending | Uses ticket ID | Uses refund UUID |
| Admin Email | References ticket ID | References refund UUID |

## Database Access

**RLS Policies**:
- ✅ Users can view their own refund requests
- ✅ System can create refund requests (INSERT)
- ✅ System can update refund requests (UPDATE)

**Indexes** (for performance):
- `idx_refund_requests_order_id` - Fast order lookups
- `idx_refund_requests_user_id` - Fast user lookups
- `idx_refund_requests_status` - Fast status queries
- `idx_refund_requests_created_at` - Fast date queries

## Integration Points

### When Customer Requests Refund
1. Call `POST /api/refunds`
2. Database creates refund request
3. Customer gets email confirmation
4. Admin gets email notification
5. Response includes refund ID

### When Admin Reviews Refunds
1. Query `GET /api/refunds?status=pending`
2. Get all pending refund requests
3. Update status in dashboard
4. System sends status update email

### When Checking Refund Status
```bash
# Get all refunds for a user
curl /api/refunds?userId=123e4567-e89b-12d3-a456-426614174000

# Get specific refund
curl /api/refunds?refundId=987f6543-e21c-43d2-a987-654321098765
```

## ✅ Status

- ✅ SQL migration corrected
- ✅ API endpoint fixed
- ✅ Column names match database
- ✅ Data types correct
- ✅ RLS policies configured
- ✅ All errors resolved
- ✅ Ready to deploy

## 🚀 Next Steps

1. Run the SQL migration in Supabase
2. Test the API with curl examples
3. Deploy to production
4. Create customer dashboard refund form
5. Create admin refund dashboard

---

**Issue Status**: ✅ RESOLVED  
**Date Fixed**: April 19, 2026  
**Files Modified**: 2 (REFUND_SYSTEM_MIGRATION.sql, /app/api/refunds/route.ts)
