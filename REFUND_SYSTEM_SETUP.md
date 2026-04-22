# Refund System Setup Guide

## Overview
The refund system allows customers to request refunds for cancelled orders and receive payment via Stripe or PayPal. This guide walks through the setup process.

## Changes Made

### 1. Frontend Changes

#### `/app/dashboard/orders/page.tsx`
- **Added Clear Cancelled Orders Button**: Removes cancelled orders from the dashboard
- **Added Request Refund Button**: Allows customers to request refunds for cancelled orders
- **Added Refund Confirmation Modal**: Explains the refund process before requesting
- **Enhanced Cancelled Order Alert**: Shows "Request Refund" and "Remove from List" actions
- **New State Variables**:
  - `isClearingCancelled`: Tracks clearing operation
  - `showInitiateRefund`: Tracks which order's refund is being initiated
- **New Functions**:
  - `handleClearCancelledOrders()`: Removes cancelled orders from view
  - `handleInitiateRefund(orderId)`: Calls the refund API

### 2. Backend API

#### `/app/api/orders/refund/route.ts` (NEW)
**POST Endpoint** - Creates a refund request

**Request Body:**
```json
{
  "orderId": "uuid",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund request created. Check your email for payment instructions.",
  "refund": {
    "id": "uuid",
    "orderId": "uuid",
    "amount": 29.99,
    "status": "pending",
    "createdAt": "2025-01-18T10:30:00Z"
  }
}
```

**Process:**
1. Validates order exists and is cancelled
2. Checks user authorization
3. Prevents duplicate refund requests
4. Creates refund request in database
5. Sends email with payment link
6. Returns refund details

### 3. Database Schema

#### New Table: `refund_requests`
```sql
CREATE TABLE refund_requests (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL (references orders),
  user_id UUID NOT NULL (references users),
  amount NUMERIC(10, 2),
  status TEXT ('pending', 'processing', 'completed', 'failed'),
  payment_method TEXT ('stripe', 'paypal', 'manual'),
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
)
```

**Indexes:**
- `idx_refund_requests_order_id`
- `idx_refund_requests_user_id`
- `idx_refund_requests_status`
- `idx_refund_requests_created_at`

## Setup Steps

### Step 1: Run Database Migration

Go to Supabase Dashboard > SQL Editor and run the migration:

```bash
# Copy contents of: migrations/create_refund_requests_table.sql
# Paste into Supabase SQL Editor and execute
```

This creates:
- `refund_requests` table
- RLS policies for security
- Indexes for performance
- Automatic timestamp trigger

### Step 2: Configure Environment Variables

Add to `.env.local`:
```
# Email Service (for refund notifications)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@washlee.com

# Stripe Integration (optional for payment processing)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_stripe_key

# PayPal Integration (optional for payment processing)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### Step 3: Set Up Payment Gateway (Stripe/PayPal)

#### Option A: Stripe Integration
1. Create Stripe account at https://stripe.com
2. Get API keys from Stripe Dashboard
3. Create a refund payment page at `/app/refund-payment/page.tsx` that:
   - Validates the refund token
   - Displays refund amount
   - Integrates Stripe Elements for payment
   - Processes payment and updates refund status

#### Option B: PayPal Integration
1. Create PayPal Developer account at https://developer.paypal.com
2. Get API credentials
3. Create similar refund payment page with PayPal SDK

### Step 4: Create Refund Payment Page

Create `/app/refund-payment/page.tsx`:
```tsx
'use client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'

export default function RefundPaymentPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [refundDetails, setRefundDetails] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | null>(null)

  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
        setRefundDetails(decoded)
      } catch (err) {
        console.error('Invalid refund token')
      }
    }
  }, [token])

  if (!refundDetails) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <h1 className="text-3xl font-bold text-[#1f2d2b] mb-2">Complete Your Refund</h1>
            <p className="text-[#6b7b78] mb-8">Choose your preferred payment method</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-[#1f2d2b] mb-2">Refund Details</h3>
              <p className="text-sm text-[#6b7b78] mb-2">
                <strong>Order ID:</strong> {refundDetails.orderid.slice(0, 8)}
              </p>
              <p className="text-2xl font-bold text-[#48C9B0] mb-4">
                ${refundDetails.amount.toFixed(2)}
              </p>
              <p className="text-xs text-[#6b7b78]">
                This refund will be sent to your original payment method within 3-5 business days after processing.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <button
                onClick={() => setSelectedMethod('stripe')}
                className={`w-full p-4 border-2 rounded-lg transition ${
                  selectedMethod === 'stripe'
                    ? 'border-[#48C9B0] bg-[#E8FFFB]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-[#1f2d2b]">💳 Pay with Stripe</p>
                <p className="text-xs text-[#6b7b78]">Credit/Debit Card</p>
              </button>

              <button
                onClick={() => setSelectedMethod('paypal')}
                className={`w-full p-4 border-2 rounded-lg transition ${
                  selectedMethod === 'paypal'
                    ? 'border-[#48C9B0] bg-[#E8FFFB]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-[#1f2d2b]">🅿️ Pay with PayPal</p>
                <p className="text-xs text-[#6b7b78]">PayPal Balance or Card</p>
              </button>
            </div>

            {selectedMethod && (
              <Button
                size="lg"
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Continue with ${selectedMethod === 'stripe' ? 'Stripe' : 'PayPal'}`}
              </Button>
            )}

            <p className="text-xs text-[#6b7b78] text-center mt-6">
              💡 Tip: Process your refund within 30 days to avoid expiration
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

### Step 5: Test the Refund Flow

1. **Create a cancelled order** in your test environment
2. **Click "Request Refund"** on the order in My Orders page
3. **Confirm the refund** in the modal
4. **Check your email** for the refund payment link
5. **Click the link** to complete refund payment

## API Integration Steps

### For Stripe Refunds:
```typescript
// In /app/api/orders/refund/route.ts - add Stripe integration
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// After creating refund_request:
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: `Refund for Order ${orderId.slice(0, 8)}`
      },
      unit_amount: order.total_price * 100
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/refund-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders`,
})
```

### For PayPal Refunds:
```typescript
// Similar pattern using PayPal SDK
// Create order and return approval link to customer
```

## 24-Hour Auto-Cleanup (Optional)

To automatically remove cancelled orders after 24 hours, add a cron job:

```typescript
// /app/api/cron/cleanup-cancelled-orders/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('status', 'cancelled')
      .lt('created_at', cutoffTime)

    return NextResponse.json({
      success: true,
      message: `Cleaned up cancelled orders older than 24 hours`,
    })
  } catch (err) {
    console.error('Cleanup error:', err)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
```

Set up with Vercel Cron or external service (Cronitor, EasyCron) to call:
```
https://yoursite.com/api/cron/cleanup-cancelled-orders
```

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] User can click "Request Refund" on cancelled order
- [ ] Refund confirmation modal appears
- [ ] Email received with refund payment link
- [ ] Refund payment page loads correctly
- [ ] Can select Stripe or PayPal
- [ ] Refund status updates to "processing" after payment
- [ ] "Clear Cancelled" button removes cancelled orders from view
- [ ] Cancelled orders don't appear after browser refresh (if removed)

## Troubleshooting

### Refund button not appearing
- Ensure order status is 'cancelled'
- Check browser console for errors
- Verify userId matches order.user_id

### Email not received
- Check SENDGRID_API_KEY in .env.local
- Verify email sending is configured
- Check spam folder
- Review server logs for email service errors

### Database table not created
- Run migration directly in Supabase SQL Editor
- Check for any SQL syntax errors
- Verify migration file executed completely

## Next Steps

1. Deploy refund table migration to production
2. Set up Stripe/PayPal test accounts
3. Create refund payment page
4. Test end-to-end flow
5. Configure payment gateway integration
6. Set up automatic email notifications
7. Monitor refund requests in admin panel

---

**Last Updated**: January 18, 2026
