# 📧 Email Integration Sections - Complete Reference

## Quick Summary
You now have a **unified email service** ready to use. Below is the complete map of all email message types needed and where they should be sent in your application.

---

## 🟢 COMPLETED EMAIL INTEGRATIONS

### ✅ Wholesale System (`/app/api/wholesale/route.ts`)
**Status**: IMPLEMENTED
- ✅ Sends to: `wholesale@washlee.com.au` (admin notification)
- ✅ Sends to: Customer email (confirmation)
- **Template Used**: `wholesale_inquiry_received` + `wholesale_inquiry_confirmation`
- **Implementation**: Lines 28-46 in `/app/api/wholesale/route.ts`

---

## 🟡 PARTIALLY IMPLEMENTED

### ⚠️ Authentication (`/app/auth/`)
**Status**: Partial (signup exists, reset needed)

#### Welcome Email - READY TO IMPLEMENT
```typescript
// Location: /app/auth/signup/page.tsx or /app/api/auth/signup (server action)
import { sendWelcomeEmail } from '@/lib/emailService'

// After user successfully signs up:
await sendWelcomeEmail(
  user.email,
  userData.firstName,
  'https://washlee.com.au/booking'
)
```

#### Password Reset Email - READY TO IMPLEMENT
```typescript
// Location: /app/auth/forgot-password/page.tsx or /app/api/auth/forgot-password
import { sendPasswordReset } from '@/lib/emailService'

// When user requests password reset:
await sendPasswordReset(
  user.email,
  user.firstName,
  `https://washlee.com.au/auth/reset-password?token=${resetToken}`
)
```

---

## 🔴 NOT IMPLEMENTED (PRIORITY LIST)

### 1️⃣ Order Management (`/app/api/orders/route.ts`) - HIGH PRIORITY
**Impact**: Customer won't know order was confirmed

#### 1a. Order Confirmation Email
```typescript
// Location: /app/api/orders/route.ts (line ~100, after order created)
import { sendOrderConfirmation } from '@/lib/emailService'

// After order document created in Firestore:
const result = await sendOrderConfirmation(
  customerEmail,      // from auth
  customerName,       // from user profile
  orderId,            // from docRef.id
  pickupDate,         // from bookingData
  pickupTime,         // from bookingData
  estimatedWeight,    // calculated (bagCount * 2.5)
  serviceType,        // e.g., "Standard Wash + Fold"
  orderTotal,         // from request body
  `https://washlee.com.au/tracking/${orderId}`
)

if (!result.success) {
  console.error('Order confirmation email failed:', result.error)
  // Don't fail order creation, just log the error
}
```

#### 1b. Pickup Reminder Email
```typescript
// Location: /app/api/orders/[orderId]/reminder (NEW ROUTE)
// Trigger: Scheduled job 24 hours before pickup
import { sendPickupReminder } from '@/lib/emailService'

await sendPickupReminder(
  customerEmail,
  customerName,
  pickupTime,     // from order.bookingData
  orderId
)
```

#### 1c. Order Shipped/Picked Up Email
```typescript
// Location: /app/api/orders/[orderId]/status (when status changes to 'picked_up')
import { sendOrderShipped } from '@/lib/emailService'

await sendOrderShipped(
  customerEmail,
  customerName,
  orderId,
  proName,            // from assigned pro
  estimatedDelivery,  // calculate (pickup + 2-3 days)
  `https://washlee.com.au/tracking/${orderId}`
)
```

#### 1d. Order Out for Delivery Email
```typescript
// Location: /app/api/orders/[orderId]/status (when status changes to 'delivering')
import { sendDeliveryNotification } from '@/lib/emailService'

await sendDeliveryNotification(
  customerEmail,
  customerName,
  orderId,
  proName,
  deliveryTime,       // e.g., "2:30 PM - 3:30 PM"
  `https://washlee.com.au/tracking/${orderId}`
)
```

#### 1e. Rating Request Email
```typescript
// Location: /app/api/orders/[orderId]/status (when status changes to 'delivered')
// Trigger: 2 hours after delivery
import { sendRatingRequest } from '@/lib/emailService'

await sendRatingRequest(
  customerEmail,
  customerName,
  proName,
  orderId,
  `https://washlee.com.au/dashboard/orders/${orderId}/review`
)
```

---

### 2️⃣ Pro/Worker System (`/app/api/pro-*` routes) - MEDIUM PRIORITY
**Impact**: Pros won't know they have new orders

#### 2a. Pro Order Assignment Email
```typescript
// Location: /app/api/orders/[orderId]/assign-pro or /app/api/pro/orders/assign
import { sendProOrderAssignment } from '@/lib/emailService'

// When order is assigned to a pro:
await sendProOrderAssignment(
  proEmail,           // from pro profile
  proFirstName,
  orderId,
  customerName,       // from order
  pickupTime,
  estimatedWeight,
  estimatedEarnings,  // e.g., "$18.50"
  `https://washlee.com.au/dashboard/pro/orders/${orderId}`
)
```

#### 2b. Pro Application Approved Email
```typescript
// Location: /app/api/pro-application/approve (NEW ROUTE)
import { sendProApplicationApproved } from '@/lib/emailService'

await sendProApplicationApproved(
  applicantEmail,
  applicantFirstName,
  proId,              // generated Pro ID
  'https://washlee.com.au/dashboard/pro'
)
```

#### 2c. Pro Application Rejected Email
```typescript
// Location: /app/api/pro-application/reject (NEW ROUTE)
import { sendProApplicationRejected } from '@/lib/emailService'

await sendProApplicationRejected(
  applicantEmail,
  applicantFirstName,
  rejectionReason     // e.g., "Failed background check"
)
```

---

### 3️⃣ Payment System (`/app/api/stripe/webhook` or `/app/api/orders`) - MEDIUM PRIORITY
**Impact**: Customers can't recover from failed payments

#### 3a. Payment Failed Email
```typescript
// Location: /app/api/stripe/webhook (when charge.failed event)
import { sendPaymentFailed } from '@/lib/emailService'

await sendPaymentFailed(
  customerEmail,
  customerName,
  orderId,
  errorMessage,       // from Stripe error
  orderTotal,
  `https://washlee.com.au/dashboard/orders/${orderId}/pay`
)
```

---

## 📋 Complete Email Template Reference

| Template | To | When | Function |
|----------|-----|------|----------|
| `welcome` | Customer | After signup | `sendWelcomeEmail()` |
| `order_confirmation` | Customer | Order created | `sendOrderConfirmation()` |
| `pickup_reminder` | Customer | 24h before pickup | `sendPickupReminder()` |
| `order_shipped` | Customer | Order picked up | `sendOrderShipped()` |
| `delivery_notification` | Customer | Out for delivery | `sendDeliveryNotification()` |
| `rating_request` | Customer | 2h after delivery | `sendRatingRequest()` |
| `pro_order_assigned` | Pro | New order assigned | `sendProOrderAssignment()` |
| `pro_application_approved` | Applicant | Application approved | `sendProApplicationApproved()` |
| `pro_application_rejected` | Applicant | Application rejected | `sendProApplicationRejected()` |
| `wholesale_inquiry_received` | Admin | Wholesale inquiry submitted | `sendWholesaleInquiryAdminNotification()` ✅ |
| `wholesale_inquiry_confirmation` | Customer | Wholesale inquiry submitted | `sendWholesaleInquiryConfirmation()` ✅ |
| `payment_failed` | Customer | Payment processing failed | `sendPaymentFailed()` |
| `password_reset` | Customer | Password reset requested | `sendPasswordReset()` |

---

## 🔄 Recommended Implementation Order

### Sprint 1: Order Emails (4-6 hours)
1. Order confirmation (highest impact)
2. Pickup reminder (improves attendance)
3. Order shipped (transparency)
4. Delivery notification (tracking)
5. Rating request (feedback)

### Sprint 2: Pro Emails (2-3 hours)
1. Pro order assignment (enables pro system)
2. Application approved (retention)
3. Application rejected (transparency)

### Sprint 3: Payment & Account (2-3 hours)
1. Payment failed (recovery)
2. Password reset (security)

---

## 💡 Implementation Tips

### Tip 1: Use Firestore Triggers
Instead of adding code to multiple routes, use Firestore Cloud Functions:
```typescript
// Trigger when order.status = 'picked_up'
export const orderPickedUpTrigger = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data()
    if (newData.status === 'picked_up') {
      await sendOrderShipped(...)
    }
  })
```

### Tip 2: Error Handling
Always use try-catch but don't fail the main operation:
```typescript
try {
  await sendOrderConfirmation(...)
} catch (error) {
  console.error('Email failed (non-critical):', error)
  // User's order still created successfully
}
```

### Tip 3: Testing
In development, set:
```env
SENDGRID_API_KEY=  # Leave empty to use mock mode
GMAIL_ADDRESS=     # Leave empty to skip actual sending
```

Emails will log to console instead of sending.

---

## ✅ Verification Checklist

Before deploying email integrations:

- [ ] SENDGRID_API_KEY is set in `.env.local`
- [ ] GMAIL_ADDRESS is verified in SendGrid dashboard
- [ ] Test email sent successfully in development
- [ ] Check email appears in spam folder (add to allowlist)
- [ ] Variables properly populated (no `{{variable}}` in final email)
- [ ] Links point to correct URLs
- [ ] Email looks good on mobile devices
- [ ] Unsubscribe link works (add if marketing email)
- [ ] Monitor bounce rate in SendGrid

---

## 📊 Email Flow Diagram

```
User Signs Up
    ↓
[sendWelcomeEmail]
    ↓
User Books Order
    ↓
[sendOrderConfirmation]
    ↓
    ├→ 24h before pickup
    │   ↓
    │   [sendPickupReminder]
    │
    ├→ Pro picks up
    │   ↓
    │   [sendOrderShipped]
    │
    ├→ Out for delivery
    │   ↓
    │   [sendDeliveryNotification]
    │
    └→ Delivered + 2h
        ↓
        [sendRatingRequest]
```

---

**Last Updated**: March 7, 2026  
**Total Email Types**: 13  
**Completed**: 2 (Wholesale)  
**To Implement**: 11  
**Estimated Time**: 10-15 hours total
