# Refund Email System - Verification Checklist

## 📋 Complete Step-by-Step Verification

Use this checklist to verify that the refund email system is working end-to-end.

---

## Phase 1: Pre-Flight Check ✈️

### Environment Variables
- [ ] `.env.local` contains `RESEND_API_KEY`
  ```bash
  grep "RESEND_API_KEY" .env.local
  # Should output: RESEND_API_KEY=re_aURFkKT6_MSEKNsRyhajbjABwwe3YcAAo
  ```

- [ ] `.env.local` contains `RESEND_FROM_EMAIL`
  ```bash
  grep "RESEND_FROM_EMAIL" .env.local
  # Should output: RESEND_FROM_EMAIL=onboarding@resend.dev
  ```

- [ ] `.env.local` contains `ADMIN_EMAIL`
  ```bash
  grep "ADMIN_EMAIL" .env.local
  # Should output: ADMIN_EMAIL=lukaverde045@gmail.com
  ```

### Code Files
- [ ] API route exists: `app/api/refunds/route.ts`
  ```bash
  ls -la app/api/refunds/route.ts
  ```

- [ ] Email template exists: `lib/emailMarketing.ts` (contains `sendRefundRequestEmail`)
  ```bash
  grep -n "export async function sendRefundRequestEmail" lib/emailMarketing.ts
  # Should show line number (e.g., 266)
  ```

- [ ] Email service exists: `lib/resend-email.ts`
  ```bash
  ls -la lib/resend-email.ts
  ```

- [ ] Migration file exists: `REFUND_SYSTEM_MIGRATION.sql`
  ```bash
  ls -la REFUND_SYSTEM_MIGRATION.sql
  ```

### App Running
- [ ] Development server is running
  ```bash
  # In terminal: npm run dev
  # Should show: ▲ Next.js 14.x
  ```

---

## Phase 2: Database Setup 🗄️

### Create Table
- [ ] Run migration in Supabase SQL Editor
  - Go to: https://supabase.com/dashboard → Your Project → SQL Editor
  - Copy entire contents of: `REFUND_SYSTEM_MIGRATION.sql`
  - Paste and click "Run"
  - Wait for success message

- [ ] Verify table was created
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'refund_requests';
  
  -- Should return: refund_requests
  ```

- [ ] Verify table structure
  ```sql
  SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'refund_requests' 
  ORDER BY ordinal_position;
  
  -- Should show: id, order_id, user_id, amount, status, payment_method, etc.
  ```

### Verify Indexes
- [ ] Confirm indexes exist
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE tablename = 'refund_requests';
  
  -- Should show:
  -- idx_refund_requests_order_id
  -- idx_refund_requests_user_id
  -- idx_refund_requests_status
  -- idx_refund_requests_created_at
  ```

### Verify RLS
- [ ] Check RLS is enabled
  ```sql
  SELECT relrowsecurity FROM pg_class 
  WHERE relname = 'refund_requests';
  
  -- Should return: true
  ```

- [ ] Verify policies exist
  ```sql
  SELECT policyname FROM pg_policies 
  WHERE tablename = 'refund_requests';
  
  -- Should show 3 policies
  ```

---

## Phase 3: Test Data Preparation 📊

### Get Real Data
- [ ] Query existing orders and users
  ```sql
  SELECT 
    o.id as order_id,
    o.user_id,
    o.total_price as amount,
    u.email,
    u.first_name || ' ' || u.last_name as customer_name
  FROM orders o
  JOIN users u ON o.user_id = u.id
  LIMIT 5;
  ```

- [ ] Record the values:
  ```
  Order UUID: ________________________________
  User UUID:  ________________________________
  Amount:     ________________________________
  Email:      ________________________________
  Name:       ________________________________
  ```

- [ ] Verify data validity
  ```sql
  -- Verify order exists
  SELECT id FROM orders WHERE id = '<your_order_uuid>';
  -- Should return 1 row
  
  -- Verify user exists
  SELECT id FROM users WHERE id = '<your_user_uuid>';
  -- Should return 1 row
  ```

---

## Phase 4: API Testing 🧪

### Test 1: Create Refund Request
- [ ] Run test script
  ```bash
  ./test_refund_email.sh <order_uuid> <user_uuid> <amount> <email> <name>
  
  # Example:
  ./test_refund_email.sh \
    a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
    f1a2b3c4-d5e6-f789-0abc-def123456789 \
    45.50 \
    john@example.com \
    "John Smith"
  ```

- [ ] Response includes success flag
  ```json
  {
    "success": true,
    ...
  }
  ```

- [ ] Response includes refundId
  ```json
  {
    "refundId": "550e8400-e29b-41d4-a716-446655440099",
    ...
  }
  ```

- [ ] Response includes status "pending"
  ```json
  {
    "status": "pending",
    ...
  }
  ```

### Test 2: Database Verification
- [ ] Refund was stored in database
  ```sql
  SELECT * FROM refund_requests 
  ORDER BY created_at DESC LIMIT 1;
  
  -- Should show your test refund
  ```

- [ ] All fields are populated
  ```sql
  SELECT id, order_id, user_id, amount, status, created_at 
  FROM refund_requests 
  WHERE id = '<refund_uuid>';
  ```

### Test 3: API Query
- [ ] Query by refund ID
  ```bash
  curl http://localhost:3000/api/refunds?refundId=<refund_uuid>
  
  # Should return the refund
  ```

- [ ] Query by user ID
  ```bash
  curl http://localhost:3000/api/refunds?userId=<user_uuid>
  
  # Should return refund(s)
  ```

- [ ] Query by order ID
  ```bash
  curl http://localhost:3000/api/refunds?orderId=<order_uuid>
  
  # Should return refund(s)
  ```

- [ ] Query by status
  ```bash
  curl http://localhost:3000/api/refunds?status=pending
  
  # Should return refund(s)
  ```

---

## Phase 5: Email Verification 📧

### Check Server Logs
- [ ] Look in terminal running `npm run dev`
- [ ] Find these messages:
  ```
  [RefundAPI] ✓ Refund confirmation email sent to: john@example.com
  [RefundAPI] ✓ Admin notification sent
  ```

- [ ] No error messages about email:
  ```
  ❌ Should NOT see:
  [RefundAPI] Warning: Failed to send confirmation email
  [RefundAPI] Warning: Failed to send admin notification
  [Resend] Error sending email
  ```

### Check Resend Dashboard
- [ ] Go to: https://resend.com/emails
- [ ] Login with your Resend account
- [ ] Find emails sent
  - [ ] Email to customer (john@example.com)
    - Subject: "Refund Request Received"
    - Status: "Delivered" (green checkmark)
  
  - [ ] Email to admin (lukaverde045@gmail.com)
    - Subject: "New Refund Request: ID #..."
    - Status: "Delivered" (green checkmark)

- [ ] Click on customer email to verify content
  - [ ] Contains greeting with name
  - [ ] Shows ticket ID
  - [ ] Shows order details
  - [ ] Shows refund amount
  - [ ] Shows processing timeline

- [ ] Click on admin email to verify content
  - [ ] Contains customer name and email
  - [ ] Shows order ID
  - [ ] Shows refund amount
  - [ ] Shows reason/notes
  - [ ] Contains admin panel link

### Check Gmail Inbox
- [ ] Go to: https://mail.google.com
- [ ] Login to: lukaverde045@gmail.com
- [ ] Find 2 emails with refund in subject

#### Email 1: Customer Email
- [ ] Subject: "Refund Request Received"
- [ ] From: onboarding@resend.dev
- [ ] Open and verify:
  - [ ] Greeting: "Hi John Smith"
  - [ ] Contains refund confirmation message
  - [ ] Shows Ticket ID: #[8-char code]
  - [ ] Shows Order ID: #[order-uuid]
  - [ ] Shows Refund Amount: $45.50
  - [ ] Shows processing timeline (2 hours to 24 hours)
  - [ ] Instructions to reply for support
  - [ ] Footer with copyright

#### Email 2: Admin Email
- [ ] Subject: "New Refund Request: ID #..."
- [ ] From: onboarding@resend.dev
- [ ] Open and verify:
  - [ ] Header: "New Refund Request"
  - [ ] Customer: John Smith (john@example.com)
  - [ ] Order ID: [order-uuid]
  - [ ] Refund Amount: $45.50
  - [ ] Payment Method shown
  - [ ] Notes/Reason displayed
  - [ ] Admin panel link present
  - [ ] Status: pending

### If Emails Not Found
- [ ] Check Spam folder
  - [ ] In Gmail, click "Spam"
  - [ ] Look for emails from onboarding@resend.dev
  - [ ] If found, mark as "Not spam"

- [ ] Check Promotions folder
  - [ ] In Gmail, click "Promotions" tab
  - [ ] Look for refund-related emails

- [ ] Wait longer
  - [ ] Resend emails can take 10-30 seconds
  - [ ] Refresh inbox after 30 seconds

- [ ] Check Resend error logs
  - [ ] In Resend dashboard, look for failed deliveries
  - [ ] Check error details if any

---

## Phase 6: Email Content Verification ✅

### Customer Email Content Check
- [ ] ✅ Proper greeting with customer name
- [ ] ✅ Confirmation of refund request
- [ ] ✅ Ticket ID displayed prominently
- [ ] ✅ Order ID shown
- [ ] ✅ Refund amount shown ($45.50)
- [ ] ✅ Order date shown
- [ ] ✅ Reason/Notes displayed
- [ ] ✅ Processing timeline (2 hours - 24 hours)
- [ ] ✅ Instructions about refund timing (3-5 business days)
- [ ] ✅ Support instructions
- [ ] ✅ Professional HTML layout
- [ ] ✅ Washlee branding
- [ ] ✅ Footer with copyright

### Admin Email Content Check
- [ ] ✅ Clear subject line with refund ID
- [ ] ✅ Customer name clearly shown
- [ ] ✅ Customer email clearly shown
- [ ] ✅ Order ID displayed
- [ ] ✅ Refund amount shown
- [ ] ✅ Payment method shown (if provided)
- [ ] ✅ Notes/reason shown
- [ ] ✅ Status: pending
- [ ] ✅ Link to admin panel
- [ ] ✅ Admin can take action

---

## Phase 7: Integration Testing 🔗

### Test Multiple Refunds
- [ ] Create another test refund (different order/user)
  ```bash
  ./test_refund_email.sh <order2_uuid> <user2_uuid> 29.99 other@example.com "Jane Doe"
  ```

- [ ] Verify both refunds exist in database
  ```sql
  SELECT id, user_id, amount, status FROM refund_requests 
  ORDER BY created_at DESC LIMIT 2;
  ```

- [ ] Both emails received
  - [ ] 2 customer emails (one to each customer)
  - [ ] 2 admin emails (both to lukaverde045@gmail.com)

- [ ] Query returns correct results
  ```bash
  curl http://localhost:3000/api/refunds?status=pending
  # Should return 2 refunds
  ```

### Test Error Handling
- [ ] Send request with missing required fields
  ```bash
  curl -X POST http://localhost:3000/api/refunds \
    -H "Content-Type: application/json" \
    -d '{"orderId": "test"}'
  ```
  - [ ] Returns error: "Missing required fields"
  - [ ] Status code: 400

- [ ] Send request with invalid UUID
  ```bash
  curl -X POST http://localhost:3000/api/refunds \
    -H "Content-Type: application/json" \
    -d '{"orderId": "not-a-uuid", "userId": "also-not", "amount": 50, "email": "test@example.com", "customerName": "Test"}'
  ```
  - [ ] Returns error about UUID format
  - [ ] Status code: 500 (database error)
  - [ ] NO email sent (important!)

- [ ] Send request with non-existent order
  ```bash
  curl -X POST http://localhost:3000/api/refunds \
    -H "Content-Type: application/json" \
    -d '{"orderId": "12345678-1234-1234-1234-123456789012", "userId": "87654321-4321-4321-4321-210987654321", "amount": 50, "email": "test@example.com", "customerName": "Test"}'
  ```
  - [ ] Returns foreign key error
  - [ ] Status code: 500
  - [ ] NO email sent (important!)

---

## Phase 8: Production Readiness ✨

### Code Quality
- [ ] No TypeScript errors in refund API
  ```bash
  npm run build 2>&1 | grep -i "error"
  # Should return nothing (no errors)
  ```

- [ ] No console.warn in production code
- [ ] No console.log (except for logging)
- [ ] Proper error handling implemented
- [ ] Comments explain complex logic

### Security
- [ ] Input validation present
- [ ] UUID validation in place
- [ ] RLS policies enabled on table
- [ ] Service role used for inserts
- [ ] Foreign key constraints in place
- [ ] No SQL injection vulnerabilities

### Performance
- [ ] Indexes created on common queries (order_id, user_id, status)
- [ ] Email sending is non-blocking (async)
- [ ] Database queries are optimized
- [ ] No N+1 queries

### Monitoring
- [ ] Console logs for debugging
- [ ] Error messages are helpful
- [ ] Success messages confirm action
- [ ] Resend dashboard for email status

---

## Phase 9: Documentation ✅

- [ ] `REFUND_EMAIL_QUICK_REFERENCE.md` - Quick reference card
- [ ] `REFUND_EMAIL_TESTING_GUIDE.md` - Complete testing guide
- [ ] `REFUND_EMAIL_SYSTEM_STATUS.md` - System status report
- [ ] `REFUND_SYSTEM_MIGRATION.sql` - Database migration
- [ ] `test_refund_email.sh` - Test script
- [ ] Code comments in `app/api/refunds/route.ts`
- [ ] Code comments in `lib/emailMarketing.ts`

---

## Final Verification Summary

### All Systems Go ✅
- [ ] All Pre-Flight checks passed
- [ ] Database table created successfully
- [ ] Test data obtained from real database
- [ ] API accepts refund requests
- [ ] Customer email sent and received
- [ ] Admin email sent and received
- [ ] Email content verified
- [ ] Multiple refunds tested
- [ ] Error handling validated
- [ ] Code quality verified
- [ ] Security measures in place
- [ ] Documentation complete

### Status: **🚀 READY FOR PRODUCTION**

---

## What's Next?

1. **Add Customer Dashboard**
   - Form to create refund request
   - Display refund status
   - View refund history

2. **Add Admin Dashboard**
   - List pending refunds
   - Approve/reject functionality
   - Send additional emails

3. **Add More Emails**
   - Refund approved email
   - Refund rejected email
   - Refund completed email

4. **Integrate Payments**
   - Connect to Stripe/PayPal
   - Automatic processing
   - Payment confirmation

5. **Monitor & Analyze**
   - Track refund statistics
   - Monitor email delivery
   - Analyze customer reasons

---

## Support & Troubleshooting

| Issue | Check |
|-------|-------|
| Table not found | Run migration in Supabase |
| Email not sent | Check logs and Resend dashboard |
| Foreign key error | Verify order/user IDs exist |
| Invalid UUID | Use proper UUID format |
| Missing emails | Check Spam/Promotions folder |

---

**Checklist Version**: 1.0  
**Last Updated**: April 19, 2026  
**Status**: ✅ Complete and Ready to Use
