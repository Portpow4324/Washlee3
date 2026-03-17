# 📧 Unified Email Service Setup Guide

## Overview
The Washlee project now uses a **single, unified email service** powered by **SendGrid** with your **Gmail address** as the sender. This consolidates all email functionality and eliminates the confusion from multiple email implementations.

---

## 🎯 What Changed

### Before (Consolidated)
- ❌ `lib/email.ts` - Gmail transporter (150 lines)
- ❌ `lib/emailService.ts` - Class-based email service (180 lines)
- ❌ `lib/email-service.ts` - Alternative email service (151 lines)
- ❌ `lib/sendgrid-email.ts` - SendGrid templates (315 lines)
- ❌ `lib/emailSequences.ts` - Email sequence definitions (369 lines)

### After (Unified)
- ✅ `lib/emailService.ts` - Single source of truth (~800 lines)
  - All 13 email templates built-in
  - All functions exposed
  - SendGrid integration ready
  - Gmail sender support

---

## ⚙️ Configuration

### Step 1: Set Up SendGrid Sender Identity

1. Go to https://app.sendgrid.com/
2. Click **Settings** → **Sender Authentication**
3. Click **Verify a Single Sender**
4. Enter your Gmail address (e.g., `your-email@gmail.com`)
5. Verify by clicking the link in the confirmation email from SendGrid

### Step 2: Update `.env.local`

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx_xxxxxxxxxxxxxxxx
GMAIL_ADDRESS=your-email@gmail.com

# Firebase Configuration (existing)
FIREBASE_PROJECT_ID=washlee-7d3c6
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://washlee.com.au
```

### Step 3: Get Your SendGrid API Key

1. Log into https://app.sendgrid.com/
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `Washlee Email Service`
5. Assign **Mail Send** permissions (full access)
6. Copy the key and paste into `.env.local`

---

## 📧 Email Templates Available

### Customer Emails
1. **`welcome`** - Welcome email with $10 discount code
2. **`order_confirmation`** - Order confirmed with pickup details
3. **`pickup_reminder`** - 24-hour reminder before pickup
4. **`order_shipped`** - Order picked up, being washed
5. **`delivery_notification`** - Order on the way to customer
6. **`rating_request`** - Request review after delivery

### Pro/Worker Emails
7. **`pro_order_assigned`** - New order assigned to pro
8. **`pro_application_approved`** - Pro application approved
9. **`pro_application_rejected`** - Pro application rejected

### Admin/Business Emails
10. **`wholesale_inquiry_received`** - Admin notification (NEW - NOW INTEGRATED)
11. **`wholesale_inquiry_confirmation`** - Customer confirmation (NEW - NOW INTEGRATED)
12. **`payment_failed`** - Payment failure notification
13. **`password_reset`** - Password reset link

---

## 🚀 Usage Examples

### Send Welcome Email
```typescript
import { sendWelcomeEmail } from '@/lib/emailService'

const result = await sendWelcomeEmail(
  'customer@example.com',
  'John',
  'https://washlee.com.au/booking'
)

if (result.success) {
  console.log('Welcome email sent:', result.messageId)
} else {
  console.error('Failed:', result.error)
}
```

### Send Order Confirmation
```typescript
import { sendOrderConfirmation } from '@/lib/emailService'

const result = await sendOrderConfirmation(
  'customer@example.com',
  'John Smith',
  'ORD-12345',
  '2026-03-15',
  '10:00 AM',
  '5',
  'Standard Wash + Fold',
  '15.00',
  'https://washlee.com.au/tracking/ORD-12345'
)
```

### Send Wholesale Inquiry Notifications
```typescript
import { 
  sendWholesaleInquiryAdminNotification, 
  sendWholesaleInquiryConfirmation 
} from '@/lib/emailService'

// Notify admin
await sendWholesaleInquiryAdminNotification(
  'wholesale@washlee.com.au',
  'ABC Laundry Services',
  'John Manager',
  'john@abclaundry.com.au',
  '0412345678',
  '200',
  'bulk_laundry',
  'weekly',
  'INQ-001',
  'We need consistent weekly service for hotel linens',
  'https://washlee.com.au/admin/wholesale/INQ-001'
)

// Confirm to customer
await sendWholesaleInquiryConfirmation(
  'john@abclaundry.com.au',
  'John Manager',
  'ABC Laundry Services',
  '200',
  'bulk_laundry',
  'weekly',
  'INQ-001'
)
```

---

## 📋 Where Email Sections Are Needed

### 1. **User Signup/Authentication** (`/app/auth/signup`)
- **ALREADY DONE**: Welcome email sent on signup
- **TODO**: Password reset email on forgot password

### 2. **Order Creation** (`/app/booking/page.tsx` → `/api/orders`)
- **TODO**: Send order confirmation after order created
- **TODO**: Send pickup reminder 24 hours before
- **TODO**: Send order shipped when picked up
- **TODO**: Send delivery notification when out for delivery
- **TODO**: Request rating after delivery

### 3. **Wholesale System** (`/app/api/wholesale/route.ts`)
- ✅ **DONE**: Send admin notification to `wholesale@washlee.com.au`
- ✅ **DONE**: Send customer confirmation

### 4. **Pro Application** (`/app/auth/pro-signup` or `/app/pro`)
- **TODO**: Send approval email with Pro ID
- **TODO**: Send rejection email with reason
- **TODO**: Send order assignment notifications to pros

### 5. **Payment System** (`/app/api/stripe`)
- **TODO**: Send payment failed notification
- **TODO**: Send payment success/receipt

### 6. **Account Management** (`/app/dashboard/security`)
- **TODO**: Send password reset email
- **TODO**: Send 2FA code email

---

## 🔧 Integration Checklist

### Phase 1: Core Order Emails (Priority)
- [ ] Implement order confirmation email in `/api/orders`
- [ ] Add pickup reminder scheduler
- [ ] Add order shipped email trigger
- [ ] Add delivery notification trigger
- [ ] Add rating request trigger
- **Time Estimate**: 4-6 hours

### Phase 2: Pro & Payment Emails
- [ ] Implement pro application approved/rejected
- [ ] Add order assignment to pro email
- [ ] Implement payment failure email
- **Time Estimate**: 2-3 hours

### Phase 3: Account Management
- [ ] Implement password reset email
- [ ] Add 2FA code email
- **Time Estimate**: 2-3 hours

### Phase 4: Testing & Monitoring
- [ ] Test all templates with SendGrid
- [ ] Set up email delivery monitoring
- [ ] Monitor bounce/complaint rates
- **Time Estimate**: 2 hours

---

## 📊 Email Statistics

Track email performance in SendGrid:
- Go to https://app.sendgrid.com/ → **Dashboard**
- View:
  - **Delivered**: Successfully sent emails
  - **Opened**: Customer opened email
  - **Clicked**: Customer clicked link
  - **Bounced**: Invalid email address
  - **Complained**: Marked as spam
  - **Unsubscribed**: User unsubscribed

---

## 🐛 Troubleshooting

### Issue: "No email provider configured"
**Solution**: Check that both env vars are set:
```bash
echo $SENDGRID_API_KEY  # Should show a value
echo $GMAIL_ADDRESS     # Should show your Gmail
```

### Issue: "SendGrid error: Invalid sender email"
**Solution**: Make sure Gmail address is verified in SendGrid Settings → Sender Authentication

### Issue: "Email sent to test@example.com"
This is normal development behavior. When no SendGrid key is configured, emails are logged instead of sent.

### Issue: Wholesale emails not arriving
**Solution**: Check that `wholesale@washlee.com.au` exists in your email system. Update it if using different email.

---

## 💡 Next Actions

1. **Configure SendGrid**: Complete steps in "Configuration" section
2. **Update `.env.local`**: Add `SENDGRID_API_KEY` and `GMAIL_ADDRESS`
3. **Test Wholesale Emails**: Submit a wholesale inquiry and verify emails arrive
4. **Integrate Order Emails**: Start with order confirmation, then add others
5. **Monitor**: Track email metrics in SendGrid dashboard

---

## 📝 File Reference

**Single Email Service File**:
- `/lib/emailService.ts` (800 lines)
  - All templates
  - All sender functions
  - SendGrid integration
  - Error handling

**Files Updated to Use New Service**:
- `/app/api/wholesale/route.ts` - Now sends notifications ✅

**Files Still To Integrate** (TODO):
- `/app/api/orders/route.ts` - Order confirmation
- `/app/auth/signup/page.tsx` - Welcome email
- `/app/booking/page.tsx` - Pickup reminder scheduler
- `/app/api/pro-application/route.ts` - Approval/rejection emails
- `/app/api/stripe/webhook/route.ts` - Payment notifications
- `/app/dashboard/security/page.tsx` - Password reset

---

## 🎓 Key Differences from Old System

| Feature | Old | New |
|---------|-----|-----|
| **Files** | 5 different implementations | 1 unified file |
| **Sender** | Various (noreply@washlee.com) | Your Gmail address |
| **Service** | SendGrid + Resend mix | SendGrid only |
| **Templates** | Spread across files | All in one place |
| **Functions** | Class-based + exports | Direct imports |
| **Error Handling** | Inconsistent | Standardized |
| **Maintenance** | Nightmare (update 5 places) | Simple (update 1 place) |

---

**Created**: March 7, 2026  
**Status**: Ready to implement  
**Owner**: Washlee Email Service  
**Support**: Check console logs for `[EMAIL]` prefix
