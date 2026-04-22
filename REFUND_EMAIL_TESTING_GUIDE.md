# Refund Email Testing & Verification Guide

## Overview
The refund system sends **TWO emails**:
1. **Customer Email** - Confirmation that refund request was received
2. **Admin Email** - Notification of new refund request

## Email Service Configuration

### Current Setup ✅
- **Primary Service**: SendGrid (`SENDGRID_API_KEY` configured - WORKING)
- **Backup Service**: Resend (`RESEND_API_KEY` configured)
- **Customer Email**: Sent to user's email address
- **Admin Email**: Sent to `ADMIN_EMAIL=lukaverde045@gmail.com`

### Environment Variables Configured
```
RESEND_API_KEY=re_aURFkKT6_MSEKNsRyhajbjABwwe3YcAAo
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=lukaverde045@gmail.com
```

## Step 1: Create refund_requests Table

Run this in **Supabase SQL Editor** (https://supabase.com/dashboard):

```sql
-- Execute the entire migration file
-- Copy from: REFUND_SYSTEM_MIGRATION.sql
```

Or execute directly:
```sql
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

CREATE INDEX IF NOT EXISTS idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at);

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own refund requests" ON refund_requests;
DROP POLICY IF EXISTS "System can manage refund requests" ON refund_requests;
DROP POLICY IF EXISTS "System can update refund requests" ON refund_requests;

CREATE POLICY "Users can view their own refund requests"
  ON refund_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage refund requests"
  ON refund_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update refund requests"
  ON refund_requests FOR UPDATE USING (true);
```

## Step 2: Get Real Test Data

Run this in **Supabase SQL Editor**:

```sql
SELECT 
  o.id as order_id,
  o.user_id,
  o.total_price as amount,
  u.email,
  COALESCE(u.first_name, 'Customer') || ' ' || COALESCE(u.last_name, '') as customer_name
FROM orders o
JOIN users u ON o.user_id = u.id
LIMIT 5;
```

**Copy the results** - you'll use these in testing.

## Step 3: Test Refund API with Email Sending

### Test Request (using real data from Step 2):

```bash
curl -X POST http://localhost:3000/api/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<ACTUAL_ORDER_UUID>",
    "userId": "<ACTUAL_USER_UUID>",
    "amount": <ACTUAL_AMOUNT>,
    "email": "<ACTUAL_USER_EMAIL>",
    "customerName": "<ACTUAL_CUSTOMER_NAME>",
    "notes": "Testing email delivery",
    "paymentMethod": "credit_card"
  }'
```

**Example** (replace with your actual UUIDs):
```bash
curl -X POST http://localhost:3000/api/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userId": "f1a2b3c4-d5e6-f789-0abc-def123456789",
    "amount": 45.50,
    "email": "john@example.com",
    "customerName": "John Smith",
    "notes": "Product damaged",
    "paymentMethod": "credit_card"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "refundId": "550e8400-e29b-41d4-a716-446655440099",
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 45.50,
  "status": "pending",
  "message": "Refund request created successfully. ID: 550e8400-e29b-41d4-a716-446655440099"
}
```

## Step 4: Verify Emails Were Sent

### Check 1: Server Console Logs
Look for these log messages in your terminal running `npm run dev`:

```
[RefundAPI] ✓ Refund confirmation email sent to: john@example.com
[RefundAPI] ✓ Admin notification sent
```

### Check 2: Resend Dashboard
Go to https://resend.com/emails

**Look for:**
- ✅ Email to customer (john@example.com)
- ✅ Email to admin (lukaverde045@gmail.com)
- Status should show "Delivered" (green check)

### Check 3: Gmail Inbox
Check your inbox at **lukaverde045@gmail.com**:

**You should receive TWO emails:**

1. **Customer Email** (from: onboarding@resend.dev)
   - Subject: Refund Request Received
   - Contains: Ticket ID, Order ID, Refund Amount, Next Steps
   - Recipient: Customer email address

2. **Admin Email** (from: onboarding@resend.dev)
   - Subject: New Refund Request: ID #[refund-uuid]
   - Contains: Customer info, Order details, Amount
   - Recipient: lukaverde045@gmail.com

**If emails don't appear:**
- Check **Spam** folder (common with testing emails)
- Check **Promotions** tab (Gmail may categorize as marketing)
- Wait 30 seconds (may take time to deliver)

## Email Templates

### Customer Email Template
**File**: `/lib/emailMarketing.ts` (lines 266-350)

**Content:**
- Header: "Refund Request Received"
- Ticket ID display
- Order details (ID, amount, date, reason)
- Status information
- Next steps (2-24 hours)
- Support instructions

### Admin Email Template
**File**: `/app/api/refunds/route.ts` (lines 94-125)

**Content:**
- Notification of new refund
- Customer name and email
- Order ID
- Refund amount
- Payment method
- Notes/reason
- Admin panel link

## Troubleshooting

### Issue: "Email API key not configured"
**Solution**: Add to `.env.local`:
```
RESEND_API_KEY=re_aURFkKT6_MSEKNsRyhajbjABwwe3YcAAo
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=lukaverde045@gmail.com
```

### Issue: Emails not received
**Check:**
1. ✅ Resend API key is set in `.env.local`
2. ✅ Table `refund_requests` exists in Supabase
3. ✅ Order and user IDs are real (exist in database)
4. ✅ Email address is valid
5. ✅ Check **Spam/Promotions** folders
6. ✅ Resend dashboard shows "Delivered" status

### Issue: "Failed to create refund request"
**Check:**
1. Order UUID must exist in `orders` table
2. User UUID must exist in `users` table
3. Amount must be a valid number (e.g., 45.50)
4. Email must be valid format

### Issue: Foreign key constraint error
**Fix**: Ensure order and user IDs are real, existing records:
```sql
-- Verify order exists
SELECT id FROM orders WHERE id = '<your-order-uuid>';

-- Verify user exists
SELECT id FROM users WHERE id = '<your-user-uuid>';
```

## API Endpoints

### Create Refund Request
```
POST /api/refunds
Content-Type: application/json

{
  "orderId": "uuid",           // REQUIRED - must exist
  "userId": "uuid",            // REQUIRED - must exist
  "amount": 45.50,             // REQUIRED - number
  "email": "user@example.com", // REQUIRED
  "customerName": "John Doe",  // REQUIRED
  "notes": "optional reason",
  "paymentMethod": "credit_card",
  "transactionId": "txn_123"
}

Response:
{
  "success": true,
  "refundId": "uuid",
  "orderId": "uuid",
  "amount": 45.50,
  "status": "pending",
  "message": "Refund request created successfully"
}
```

### Get Refund Status
```
GET /api/refunds?orderId=<uuid>
GET /api/refunds?userId=<uuid>
GET /api/refunds?refundId=<uuid>
GET /api/refunds?status=pending

Response:
{
  "success": true,
  "refunds": [...],
  "count": 1
}
```

## Email Service Priority

**SendGrid** (Primary):
- Properly configured and working
- Reliable delivery
- Valid API key active
- Status visible in SendGrid dashboard

**Resend** (Backup):
- Fast delivery (~2 seconds)
- Alternative fallback service
- Configured with valid API key
- Status visible in Resend dashboard if needed

## Monitoring & Debugging

### Enable Additional Logging
Add to `/app/api/refunds/route.ts`:
```typescript
console.log('[RefundAPI] Request body:', body)
console.log('[RefundAPI] Email payload:', emailPayload)
```

### Check Database
```sql
-- View all refund requests
SELECT * FROM refund_requests ORDER BY created_at DESC;

-- View specific refund
SELECT * FROM refund_requests WHERE id = '<refund-uuid>';

-- Count pending refunds
SELECT COUNT(*) FROM refund_requests WHERE status = 'pending';
```

## Next Steps

After verifying emails are sending:

1. ✅ **Test customer email** - Verify customer receives email
2. ✅ **Test admin email** - Verify admin receives notification
3. ✅ **Test with multiple orders** - Verify system handles scale
4. 🔄 **Add to customer dashboard** - Create UI form to initiate refunds
5. 🔄 **Add admin panel** - Create interface to manage pending refunds
6. 🔄 **Add email templates** - Customize for your brand

## Resources

- **Resend Dashboard**: https://resend.com/emails
- **Gmail**: https://mail.google.com
- **Supabase SQL Editor**: https://supabase.com/dashboard
- **API Documentation**: `/app/api/refunds/route.ts`
- **Email Templates**: `/lib/emailMarketing.ts`

---

**Last Updated**: April 19, 2026
**Status**: ✅ Ready for testing
