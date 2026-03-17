# 📧 Email Service - Quick Reference Card

## One-Line Summary
✅ Unified all 5 email implementations into 1 file with 13 ready-to-use templates powered by SendGrid + your Gmail address

---

## Configuration (2 Steps)

### Step 1: Get SendGrid API Key
1. Go to https://app.sendgrid.com/
2. Settings → API Keys → Create API Key
3. Copy key

### Step 2: Update .env.local
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxx  # From above
GMAIL_ADDRESS=your-email@gmail.com  # Your Gmail (must verify in SendGrid first)
NEXT_PUBLIC_APP_URL=https://washlee.com.au  # For email links
```

**That's it!** ✅

---

## All Email Templates (13)

### Customer (6)
| Template | When | Function |
|----------|------|----------|
| `welcome` | Signup | `sendWelcomeEmail()` |
| `order_confirmation` | Order created | `sendOrderConfirmation()` |
| `pickup_reminder` | 24h before | `sendPickupReminder()` |
| `order_shipped` | Picked up | `sendOrderShipped()` |
| `delivery_notification` | Out for delivery | `sendDeliveryNotification()` |
| `rating_request` | 2h after delivery | `sendRatingRequest()` |

### Pro/Worker (3)
| Template | When | Function |
|----------|------|----------|
| `pro_order_assigned` | New order | `sendProOrderAssignment()` |
| `pro_application_approved` | App approved | `sendProApplicationApproved()` |
| `pro_application_rejected` | App rejected | `sendProApplicationRejected()` |

### Admin/System (4)
| Template | When | Function |
|----------|------|----------|
| `wholesale_inquiry_received` | Inquiry submitted | `sendWholesaleInquiryAdminNotification()` ✅ |
| `wholesale_inquiry_confirmation` | Inquiry submitted | `sendWholesaleInquiryConfirmation()` ✅ |
| `payment_failed` | Payment fails | `sendPaymentFailed()` |
| `password_reset` | Reset requested | `sendPasswordReset()` |

---

## Usage (Copy-Paste Ready)

### Send Order Confirmation
```typescript
import { sendOrderConfirmation } from '@/lib/emailService'

await sendOrderConfirmation(
  'customer@example.com',    // email
  'John Smith',              // customerName
  'ORD-12345',               // orderId
  '2026-03-15',              // pickupDate
  '10:00 AM',                // pickupTime
  '5',                       // weight (kg)
  'Standard Wash + Fold',    // serviceType
  '15.00',                   // total ($)
  'https://washlee.com.au/tracking/ORD-12345'  // trackingLink
)
```

### Send Wholesale Notifications
```typescript
import { 
  sendWholesaleInquiryAdminNotification,
  sendWholesaleInquiryConfirmation 
} from '@/lib/emailService'

// To admin
await sendWholesaleInquiryAdminNotification(
  'wholesale@washlee.com.au',
  'ABC Laundry',           // company
  'John Manager',          // contactName
  'john@abc.com.au',       // email
  '0412345678',            // phone
  '200',                   // estimatedWeight (kg)
  'bulk_laundry',          // orderType
  'weekly',                // frequency
  'INQ-001',               // inquiryId
  'Need weekly service',   // notes
  'https://washlee.com.au/admin/wholesale/INQ-001'  // adminLink
)

// To customer
await sendWholesaleInquiryConfirmation(
  'john@abc.com.au',
  'John Manager',
  'ABC Laundry',
  '200',
  'bulk_laundry',
  'weekly',
  'INQ-001'
)
```

---

## Where to Add Each Email

| Email Type | Add to File | Line Approx |
|-----------|-----------|---------|
| Welcome | `/app/auth/signup/page.tsx` | After user signup success |
| Order Confirmation | `/app/api/orders/route.ts` | After order created (line ~100) |
| Pickup Reminder | Scheduler/Cron job | 24h before pickupDate |
| Order Shipped | `/app/api/orders/[orderId]/status` | When status = 'picked_up' |
| Delivery Notification | `/app/api/orders/[orderId]/status` | When status = 'delivering' |
| Rating Request | `/app/api/orders/[orderId]/status` | 2h after status = 'delivered' |
| Pro Order Assigned | `/app/api/orders/[orderId]/assign-pro` | When order assigned to pro |
| Pro Application Approved | `/app/api/pro-application/approve` | When application approved |
| Pro Application Rejected | `/app/api/pro-application/reject` | When application rejected |
| Wholesale (Admin) | `/app/api/wholesale/route.ts` | ✅ Already implemented |
| Wholesale (Customer) | `/app/api/wholesale/route.ts` | ✅ Already implemented |
| Payment Failed | `/app/api/stripe/webhook` | When charge.failed event |
| Password Reset | `/app/auth/forgot-password` | When reset link generated |

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "No email provider configured" | Set SENDGRID_API_KEY and GMAIL_ADDRESS in .env.local |
| "Invalid sender email" | Verify Gmail address in SendGrid dashboard first |
| Emails go to spam | Add `from: 'noreply@washlee.com.au'` to allowlist in email client |
| Template variables not filled | Check variable names match exactly (case-sensitive) |
| SendGrid returns 403 | API key is wrong or doesn't have Mail Send permission |

---

## File Reference

- 📄 **Main**: `/lib/emailService.ts` (all templates + functions)
- 📋 **Setup**: `/EMAIL_SERVICE_SETUP.md` (detailed instructions)
- 📍 **Sections**: `/EMAIL_SECTIONS_REFERENCE.md` (where to add each)
- ✅ **Already Integrated**: `/app/api/wholesale/route.ts`

---

## Environment Variables

```env
# Required for production
SENDGRID_API_KEY=SG.xxx...  # SendGrid API key
GMAIL_ADDRESS=you@gmail.com # Your Gmail address (must verify)

# Optional for email links
NEXT_PUBLIC_APP_URL=https://washlee.com.au

# For development/testing
# (Leave SENDGRID_API_KEY empty to use mock mode - logs to console)
```

---

## Status

- ✅ Email service unified
- ✅ 13 templates ready
- ✅ Wholesale emails working
- ⏳ 11 more integrations needed
- 📋 All documented with examples

**Estimated integration time**: 10-15 hours total

---

## Links

- **SendGrid Dashboard**: https://app.sendgrid.com/
- **Setup Guide**: `EMAIL_SERVICE_SETUP.md`
- **Integration Reference**: `EMAIL_SECTIONS_REFERENCE.md`
- **Complete Summary**: `EMAIL_CONSOLIDATION_SUMMARY.md`

---

**Remember**: When in doubt, look at `sendWholesaleInquiryAdminNotification()` in `/lib/emailService.ts` for a working example! ✨
