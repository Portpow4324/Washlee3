# Deleted Files & Recent Changes Summary

## Overview
On **February 4, 2026**, the commit `2c9c893` ("Save all changes: updated pro pages with image, combined signup pages, removed application forms") removed 4 old API/page files that are no longer needed in the application.

---

## 🗑️ DELETED FILES (4 Files)

### 1. **`app/admin-setup/page.tsx`** - Admin Setup Page
**Purpose:** A page to grant admin privileges to Firebase users

**Key Features:**
- Check login status
- Grant admin privileges via API call to `/api/admin/setup`
- Shows success/error messages
- Provides instructions for accessing admin dashboard

**Code Summary:**
```typescript
- Component: AdminSetupPage
- Required: User to be logged in
- Makes POST request to `/api/admin/setup` with ID token
- Sets custom claims in Firebase Auth
- Shows 6-step process for accessing admin dashboard
```

**When Used:** For initial admin account setup during development

---

### 2. **`app/api/notifications/send.ts`** - Notifications API
**Purpose:** Send and manage notifications (email, SMS, push, in-app)

**Key Features:**
- POST: Send notifications to users
- GET: Retrieve user notifications with filtering
- PATCH: Mark notifications as read/unread/delete

**Endpoints:**
```
POST   /api/notifications/send    - Send notification
GET    /api/notifications         - Get user's notifications (with limit & unreadOnly filter)
PATCH  /api/notifications         - Mark as read/unread/delete
```

**Supported Events:**
- order_confirmed
- pro_assigned
- order_pickup
- order_washing
- order_delivery
- order_completed
- order_cancelled
- review_requested
- pro_verified
- earnings_ready
- support_response
- promotional

**Notification Types:** email, sms, push, in-app

**Database:** Firestore collection: `notifications`

**TODO in Code:**
- Integrate Resend for email notifications
- Integrate Twilio for SMS notifications
- Integrate FCM for push notifications

---

### 3. **`app/api/orders/index.ts`** - Orders API
**Purpose:** (File was empty - no content in git history)

---

### 4. **`app/api/payments.ts`** - Payment Processing API
**Purpose:** Handle Stripe payment operations

**Key Actions:**
```
create_payment_intent   - Create Stripe PaymentIntent for order
confirm_payment         - Confirm payment (handled by webhook)
get_payment_methods     - Get saved payment methods for customer
save_payment_method     - Attach/save new payment method
```

**Features:**
- Automatic Stripe customer creation
- Links Firebase users to Stripe customers via metadata
- Saves payment records to Firestore
- Integrates with Firestore users collection

**Firestore Integration:**
- Stores in: `payments` collection
- User data: `users/{uid}` (stripeCustomerId, etc.)
- Subcollection: `users/{uid}/payment_methods`

**Payment Intent Metadata:**
```json
{
  "orderId": "order-id",
  "firebaseUid": "user-uid"
}
```

---

### 5. **`app/api/webhooks/stripe.ts`** - Stripe Webhook Handler
**Purpose:** Process Stripe webhook events for payment & subscription updates

**Events Handled:**
```
payment_intent.succeeded       - Payment successful
payment_intent.payment_failed  - Payment failed
charge.refunded               - Payment refunded
customer.subscription.updated  - Subscription changed
customer.subscription.deleted  - Subscription cancelled
```

**Actions per Event:**

| Event | Action |
|-------|--------|
| **payment_intent.succeeded** | Mark payment as succeeded, update order status to "confirmed" |
| **payment_intent.payment_failed** | Mark payment as failed |
| **charge.refunded** | Mark payment as refunded, store refund amount |
| **customer.subscription.updated** | Update user subscription status & end date |
| **customer.subscription.deleted** | Mark subscription as cancelled |

**Database Updates:**
- Collections: `payments`, `orders`, `users`
- Timestamp: All updates include `updatedAt` timestamp

**Authentication:** Stripe webhook signature verification using `webhookSecret`

---

## 📊 Most Recent Changes (After Deletion)

### 11 Commits After Deletion

| Commit | Message |
|--------|---------|
| 69ec927 | Add offline error handling to AuthContext |
| 9f345a9 | Fix reviews/moderation route |
| dfd2e69 | Fix remaining Next.js 16 dynamic route params |
| 525f9bf | Fix Next.js 16 dynamic route parameter types |
| a23a4f8 | Fix build errors & disable SendGrid transport |
| 45c56ce | Add Render deployment configuration |
| 2ee6505 | Update README |
| d48efce | first commit |
| f2559a7 | first commit |
| 8072cd1 | Initial Washlee application |
| e01c460 | first commit |

### Major Changes Summary (27,034+ insertions)

**New Files Added:**
- Backend Node.js/Express server structure
- Employee inquiry system (admin interface)
- API routes for inquiries, offers, and tracking
- Documentation files (50+ markdown files)
- Deployment configuration (Render)

**Modified Key Files:**
- `lib/AuthContext.tsx` - Added offline error handling
- `app/auth/login/page.tsx` - Login flow improvements
- `app/auth/pro-signup-form/page.tsx` - Expanded pro signup
- `app/checkout/success/page.tsx` - Checkout success handling
- `app/tracking/page.tsx` - Redesigned tracking interface
- `package.json` - Updated dependencies
- `README.md` - Comprehensive documentation

**New Features:**
- Admin inquiries management
- Employee offer system
- Marketing campaigns API
- Phone number validation
- Complete profile page for auth
- Order tracking improvements

---

## 🔄 Why These Files Were Deleted

1. **`admin-setup/page.tsx`** - Admin setup now handled differently (likely via secret-admin page)
2. **`api/notifications/send.ts`** - Notification system to be implemented later with external services
3. **`api/orders/index.ts`** - Empty file, not in use
4. **`api/payments.ts`** - Payment logic refactored into individual route files
5. **`api/webhooks/stripe.ts`** - Webhook handling moved to modular structure

---

## ⚠️ Important Notes

### Stripe Webhook Signature Verification
The webhook implementation used:
```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

This requires `STRIPE_WEBHOOK_SECRET` in `.env.local`

### Custom Claims in Firebase
The admin-setup page used Firebase custom claims:
```typescript
idTokenResult?.claims?.admin === true
```

This is still referenced in `AuthContext.tsx` if admin functionality is needed.

---

## 📝 Reconstruction Guide

If you need to restore these files:

1. Run: `git show 2c9c893^:app/admin-setup/page.tsx > app/admin-setup/page.tsx`
2. Run: `git show 2c9c893^:app/api/notifications/send.ts > app/api/notifications/send.ts`
3. Run: `git show 2c9c893^:app/api/payments.ts > app/api/payments.ts`
4. Run: `git show 2c9c893^:app/api/webhooks/stripe.ts > app/api/webhooks/stripe.ts`

Or view the full file contents above.

---

**Last Updated:** March 5, 2026
