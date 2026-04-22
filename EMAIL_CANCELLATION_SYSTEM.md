# 📧 Order Cancellation Email System - Setup & Testing Guide

## Overview
The cancellation system now sends professional emails to:
- **Customer** - Confirmation of cancellation with reason and refund status
- **Admin** (lukaverde045@gmail.com) - Detailed cancellation notice with action items
- **Support** (support@washlee.com.au) - Same detailed notice for tracking

---

## Email Configuration

### Current Setup
- **SMTP Host**: smtp.gmail.com
- **Email Service**: Gmail with App Password authentication
- **Sender Email**: lukaverde045@gmail.com
- **Admin Email**: lukaverde045@gmail.com
- **Support Email**: support@washlee.com.au

### Configuration File
All email settings in `.env.local`:
```env
GMAIL_USER=lukaverde045@gmail.com
GMAIL_APP_PASSWORD=qkvm umzs xals ogrf
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=lukaverde045@gmail.com
SMTP_PASSWORD=qkvm umzs xals ogrf
ADMIN_EMAIL=lukaverde045@gmail.com
RESEND_API_KEY=re_aURFkKT6_MSEKNsRyhajbjABwwe3YcAAo
```

---

## 📨 Email Flow

### When Customer Cancels Order:

1. **Customer receives:**
   - ✅ Order confirmation number
   - ✅ Cancellation reason they selected
   - ✅ Any notes they added
   - ✅ Order amount to be refunded
   - ✅ Refund status: Pending
   - ✅ Timeline: 24-hour refund processing
   - ✅ Support contact information

2. **Admin receives:**
   - ✅ Order ID and customer email
   - ✅ Cancellation reason
   - ✅ Customer notes (if any)
   - ✅ Full order details (addresses, pickup date, amount)
   - ✅ **ACTION REQUIRED**: Process refund of $X
   - ✅ 🚨 **Special flag** if damage claim (URGENT notification)

3. **Support receives:**
   - ✅ Same detailed notification as Admin
   - ✅ For tracking and follow-up

---

## 🧪 Testing Email System

### Quick Test
Visit this URL in your browser:
```
http://localhost:3000/api/test/email-cancellation
```

You should see a response like:
```json
{
  "success": true,
  "message": "Test email sent successfully! Check your email.",
  "recipient": "lukaverde045@gmail.com",
  "timestamp": "2026-04-09T15:37:00.000Z"
}
```

Then check your email (including spam folder) for the test email from Washlee.

### Full Flow Test
1. Go to Dashboard → My Orders
2. Click "Cancel Order" on any active order
3. Select a cancellation reason (try "Damage to items" for special flag)
4. Add optional notes
5. Click "Cancel Order"
6. You should see professional green success toast notification
7. Check your emails:
   - **Customer confirmation** (to lukaverde045@gmail.com)
   - **Admin notification** (to lukaverde045@gmail.com)
   - **Support notification** (to support@washlee.com.au)

---

## 🔍 Server Logs

When cancellation is triggered, check server console for:
```
[Cancel API] Processing cancellation: { orderId: '...', userId: '...', reason: '...' }
[Cancel API] Attempting to send emails...
[Cancel API] Customer email: lukaverde045@gmail.com
[Cancel API] Admin emails: lukaverde045@gmail.com support@washlee.com.au
[Cancel API] Customer email result: true
[Cancel API] Admin email to lukaverde045@gmail.com - Result: true
[Cancel API] Support email to support@washlee.com.au - Result: true
```

---

## 📧 Email Content Examples

### Customer Email
- Subject: `Order Cancelled - #97cd41e2`
- Body includes: Reason, notes, amount, pending refund status, support contact

### Admin Email
- Subject: `[CANCELLATION] Order #97cd41e2 - Refund Required - [Reason]`
- Body includes:
  - Order details with addresses
  - Customer contact info
  - Full cancellation notes
  - **ACTION REQUIRED**: Process refund
  - 🚨 If damage claim: URGENT flag with compensation note

---

## ⚙️ Technical Details

### Cancellation Process
1. **Modal Form** (`CancellationModal.tsx`):
   - 6 cancellation reasons
   - Optional notes field
   - Confirmation dialog with refund warning

2. **API Handler** (`/api/orders/cancel`):
   - Validates order ownership
   - Updates order status → 'cancelled'
   - Cancels associated pro_jobs
   - Creates cancellation record (if table exists)
   - Sends 3 emails (customer + admin + support)
   - Returns success toast notification

3. **Email Service** (`lib/email-service.ts`):
   - Uses SMTP (Gmail configured)
   - HTML email templates with styling
   - Professional formatting with Washlee branding
   - Fallback logging if email fails

### Cancellation Reasons
- ✅ Change of mind
- ✅ Found alternative service
- ✅ Scheduling conflict
- ✅ **Damage to items** (🚨 triggers URGENT flag)
- ✅ Quality or service issues
- ✅ Other (custom reason)

---

## 🚨 Special Cases

### Damage Claims
When customer selects "Damage to items":
- Admin receives **URGENT** notification in red
- Special action item about damage investigation
- Compensation policy reference
- Customer notes highlighted for evidence

### Non-Existent Tables
If `order_cancellations` table doesn't exist:
- Order still cancels successfully
- Email still sends
- Error is logged but doesn't block process
- Run SQL migration when ready to track cancellations

---

## 📋 Database Migration (Optional)

To store cancellation records, run:
```sql
-- Copy from CANCELLATIONS_REFUNDS_MIGRATION.sql
-- Into Supabase SQL Editor
-- Provides order_cancellations and order_refunds tables
```

---

## ✅ Verification Checklist

- [ ] Email test endpoint returns success (http://localhost:3000/api/test/email-cancellation)
- [ ] Test email appears in inbox or spam folder
- [ ] SMTP configuration in .env.local is correct
- [ ] Customer receives cancellation confirmation
- [ ] Admin (lukaverde045@gmail.com) receives refund action notice
- [ ] Support (support@washlee.com.au) receives same notice
- [ ] Green success toast appears on frontend
- [ ] Order status changes to 'cancelled' in dashboard
- [ ] Pro can't see cancelled order in available jobs

---

## 🐛 Troubleshooting

### Emails Not Arriving
1. Check spam/junk folder first
2. Visit email test endpoint: `/api/test/email-cancellation`
3. Check server console logs for email send results
4. Verify SMTP credentials in .env.local

### Gmail Authentication Issues
Gmail requires "App Passwords" (not regular password):
1. Go to: https://myaccount.google.com/apppasswords
2. Generate new app password for Mail/Windows
3. Update SMTP_PASSWORD and GMAIL_APP_PASSWORD in .env.local
4. Restart dev server

### Support Email Not Receiving
- Verify support@washlee.com.au email exists
- Check if it's being delivered to spam
- Consider updating to actual support email address

---

## 📞 Support Contacts in Emails
- **Customer support**: support@washlee.com.au
- **Admin/Owner**: lukaverde045@gmail.com (can be updated in .env.local)

---

**Last Updated**: April 9, 2026
**Status**: ✅ Production Ready
