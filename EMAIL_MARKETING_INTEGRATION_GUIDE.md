# Email Marketing System - Integration Guide

## Overview

Washlee now has a comprehensive email marketing system that sends transactional and marketing emails at key customer lifecycle moments. This ensures reliability, engagement, and customer satisfaction.

## Email Services

### Primary Service: Resend
- **File**: `/lib/resend-email.ts`
- **Provider**: Resend API (resend.com)
- **Use Case**: Transactional emails with HTML templates
- **Configuration**: 
  - API Key: `RESEND_API_KEY`
  - From Email: `RESEND_FROM_EMAIL`

### Backup Service: SendGrid
- **File**: `/lib/sendgrid-email.ts`
- **Provider**: SendGrid API
- **Use Case**: Template-based emails with pre-designed templates
- **Configuration**: `SENDGRID_API_KEY`

## Email Marketing Module

### File: `/lib/emailMarketing.ts`

Comprehensive email marketing service with the following functions:

#### 1. **sendWelcomeEmail()**
- **Triggered**: When customer signs up
- **Location**: `/app/api/auth/signup/route.ts`
- **Contains**:
  - Welcome message
  - $10 OFF discount code: `WELCOME10`
  - 6 key benefits
  - How it works 4-step guide
  - CTA to schedule first pickup
- **Status**: ✅ **INTEGRATED** - Sends on customer signup

#### 2. **sendOrderConfirmationEmail()**
- **Triggered**: When order is created
- **Location**: `/app/api/orders/route.ts`
- **Contains**:
  - Order confirmation
  - Order ID and details
  - Pickup date/time/address
  - Total price
  - Problem section (didn't make this order?)
  - Refund request link
  - Track order button
- **Status**: ✅ **INTEGRATED** - Sends on order creation

#### 3. **sendRefundRequestEmail()**
- **Triggered**: When customer submits refund request
- **Location**: `/app/api/refunds/route.ts`
- **Contains**:
  - Refund confirmation
  - **Unique ticket ID**: `WASH-YYYYMMDD-XXXXXX`
  - Order details
  - Refund status timeline
  - Next steps
- **Status**: ✅ **READY** - Automatically sends when refund created

#### 4. **sendSubscriptionSignupEmail()**
- **Triggered**: When customer subscribes to plan
- **Contains**:
  - Plan name and pricing
  - Subscription benefits
  - Billing information
  - How to manage subscription
- **Status**: 🔄 **READY** - Needs integration at subscription endpoint

#### 5. **sendLoyaltyProgramEmail()**
- **Triggered**: When customer enrolls in loyalty program
- **Contains**:
  - Starting points balance
  - How points work (1 point = $0.01)
  - Earning rules (10 points per $1)
  - Redemption options
  - Bonus opportunities
- **Status**: 🔄 **READY** - Needs integration at loyalty enrollment

#### 6. **sendOrderReadyEmail()**
- **Triggered**: When order washing is complete and ready
- **Contains**:
  - Order ready confirmation
  - Estimated delivery date
  - Timeline of process
  - Delivery tracking link
- **Status**: 🔄 **READY** - Needs integration at order status update

#### 7. **sendOrderDeliveredEmail()**
- **Triggered**: When order is delivered
- **Contains**:
  - Delivery confirmation
  - Delivery date/time
  - Request for review
  - Next order CTA
- **Status**: 🔄 **READY** - Needs integration at delivery confirmation

#### 8. **sendPromotionalEmail()**
- **Triggered**: For custom promotional campaigns
- **Contains**:
  - Custom title and message
  - Promotional code (optional)
  - Custom CTA
- **Status**: 🔄 **READY** - Can be used for marketing campaigns

## Refund System

### API Endpoint: `/app/api/refunds/route.ts`

#### POST Request
```typescript
POST /api/refunds
Content-Type: application/json

{
  "orderId": "order-123",
  "customerId": "user-uuid",
  "reason": "Quality issue",
  "refundAmount": 45.50,
  "description": "Items were not properly cleaned",
  "email": "customer@example.com",
  "customerName": "John Doe",
  "orderDate": "2024-01-15"
}
```

#### Response
```json
{
  "success": true,
  "ticketId": "WASH-20240115-ABC123",
  "orderId": "order-123",
  "refundAmount": 45.50,
  "status": "PENDING",
  "message": "Refund request created successfully. Ticket ID: WASH-20240115-ABC123"
}
```

#### GET Request
```typescript
GET /api/refunds?orderId=order-123
// or
GET /api/refunds?ticketId=WASH-20240115-ABC123
// or
GET /api/refunds?customerId=user-uuid
```

### Database Table
**Table**: `refund_requests`

```sql
CREATE TABLE refund_requests (
  id UUID PRIMARY KEY,
  ticket_id TEXT UNIQUE,
  order_id TEXT,
  customer_id UUID,
  reason TEXT,
  refund_amount DECIMAL,
  description TEXT,
  status TEXT, -- PENDING, APPROVED, REJECTED, PROCESSED
  admin_notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  processed_at TIMESTAMP
);
```

**Run Migration**: 
1. Go to Supabase SQL Editor
2. Copy content from `REFUND_SYSTEM_MIGRATION.sql`
3. Execute the SQL

## Implementation Checklist

### ✅ Completed
- [x] Welcome email on signup
- [x] Order confirmation email on order creation
- [x] Refund system with unique ticket IDs
- [x] Email marketing module with 8 email types
- [x] Resend integration (primary service)
- [x] SendGrid integration (backup service)

### 🔄 Needs Integration
- [ ] Subscription signup email at `/app/api/subscriptions/route.ts`
- [ ] Loyalty program enrollment email at loyalty endpoint
- [ ] Order ready email at order status update endpoint
- [ ] Order delivered email at delivery confirmation endpoint
- [ ] Customer dashboard "Request Refund" button
- [ ] Admin panel for refund management

### 🚧 Needs Development
- [ ] Refund request form on customer dashboard
- [ ] Admin refund review dashboard
- [ ] Admin email notifications for refund requests
- [ ] Automatic refund processing workflow
- [ ] Promotional email campaign system
- [ ] Email unsubscribe preferences

## Integration Examples

### Example 1: Using sendWelcomeEmail()

```typescript
import { sendWelcomeEmail } from '@/lib/emailMarketing'

// In your signup flow:
const result = await sendWelcomeEmail({
  to: 'customer@example.com',
  customerName: 'John',
  email: 'customer@example.com'
})
```

### Example 2: Using sendOrderConfirmationEmail()

```typescript
import { sendOrderConfirmationEmail } from '@/lib/emailMarketing'

// In your order creation flow:
const result = await sendOrderConfirmationEmail({
  to: orderData.customerEmail,
  customerName: orderData.customerName,
  orderId: orderData.id,
  pickupDate: '2024-01-16',
  pickupTime: '10:00 AM - 2:00 PM',
  pickupAddress: '123 Main St, City, State',
  totalPrice: 45.50,
  serviceType: 'Express',
  weight: 5,
  orderUrl: `https://washlee.com/tracking/${orderData.id}`
})
```

### Example 3: Using Refund API

```typescript
// Frontend - Request refund
const response = await fetch('/api/refunds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'order-123',
    customerId: userId,
    reason: 'Quality issue',
    refundAmount: 45.50,
    description: 'Items were damaged',
    email: userEmail,
    customerName: userName,
    orderDate: new Date().toISOString().split('T')[0]
  })
})

const data = await response.json()
console.log('Ticket ID:', data.ticketId) // WASH-20240115-ABC123
```

## Environment Variables

Add to `.env.local`:

```
# Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@washlee.com
ADMIN_EMAIL=support@washlee.com

# Optional: SendGrid backup
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# App URLs
NEXT_PUBLIC_APP_URL=https://washlee.com
```

## Email Template Colors

- **Primary Teal**: `#48C9B0` - Used for primary CTAs and highlights
- **Light Mint**: `#E8FFFB` - Used for backgrounds and info boxes
- **Dark**: `#1f2d2b` - Used for text
- **Secondary Colors**: `#9C27B0` (subscriptions), `#FF9800` (refunds), `#4CAF50` (delivered)

## Testing

### Test Welcome Email
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "userType": "customer"
  }'
```

### Test Order Confirmation Email
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user-uuid",
    "email": "test@example.com",
    "customerName": "Test User",
    "orderTotal": 45.50,
    "bookingData": {
      "pickupDate": "2024-01-16",
      "pickupTime": "10:00 AM",
      "pickupAddress": "123 Main St"
    }
  }'
```

### Test Refund Request
```bash
curl -X POST http://localhost:3000/api/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "customerId": "user-uuid",
    "reason": "Quality issue",
    "refundAmount": 45.50,
    "email": "test@example.com",
    "customerName": "Test User",
    "orderDate": "2024-01-15"
  }'
```

## Monitoring

Check email sending status:
1. Resend Dashboard: https://resend.com/emails
2. Supabase Logs: Supabase Dashboard → Logs
3. Console logs with `[EmailMarketing]` prefix in server logs

## Support

For issues with email delivery:
1. Check console logs for `[EmailMarketing]` messages
2. Verify email in Resend dashboard
3. Check SMTP/API key configuration
4. Review email HTML for rendering issues in email clients

## Next Phase

1. Create customer dashboard "Request Refund" button
2. Create admin panel for refund review and approval
3. Implement automatic refund processing
4. Add promotional email campaign system
5. Create email preference management in customer settings
