# Washlee Setup & Integration Guide

## Authentication & Protected Routes

### ✅ Completed
- Firebase Authentication (email/password signup/login)
- User session persistence with AuthContext
- Protected routes middleware for private pages
- User profile storage in Firestore
- Auth token cookies for middleware

### Current Implementation
- **Signup**: Creates Firebase user + Firestore profile
- **Login**: Signs in with email/password
- **Protected Pages**: 
  - `/privacy-policy`
  - `/terms-of-service` 
  - `/cookie-policy`
  - `/dashboard/customer`
  - `/dashboard/pro`
- **Redirects**: Unauthenticated users → `/auth/login`

### Testing Authentication
1. Go to `http://localhost:3000/auth/signup`
2. Create an account (customer or pro)
3. Get redirected to dashboard
4. Try accessing `/privacy-policy` without login - should redirect to login

---

## Payment Integration with Stripe

### Prerequisites
1. **Stripe Account**: https://dashboard.stripe.com
2. **API Keys**: Get from https://dashboard.stripe.com/apikeys
   - Copy "Secret key" (starts with `sk_`)
   - Copy "Publishable key" (starts with `pk_`)

### Setup Steps

#### 1. Install Stripe Package
```bash
npm install stripe @stripe/react-stripe-js @stripe/js
```

#### 2. Add Environment Variables
Create `.env.local` (or add to existing file):
```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_DOMAIN=http://localhost:3000
```

#### 3. Implement Stripe Checkout (API Route)
Update `/app/api/payment/checkout.ts`:

```typescript
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weight, orderDescription } = body

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Washlee Laundry Service',
              description: orderDescription || `${weight}kg laundry`,
            },
            unit_amount: Math.round(weight * 300), // $3 per kg in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/`,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
```

#### 4. Create Stripe Elements Component
Create `/components/StripeCheckout.tsx`:

```typescript
'use client'

import { loadStripe } from '@stripe/js'
import { useEffect, useState } from 'react'
import Button from '@/components/Button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function StripeCheckout({ weight }: { weight: number }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight, orderDescription: `${weight}kg laundry` }),
      })

      const { sessionId, error } = await response.json()
      if (error) throw new Error(error)

      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({ sessionId })
      if (result.error) throw new Error(result.error.message)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Payment error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={isLoading} className="w-full">
      {isLoading ? 'Processing...' : `Checkout - $${(weight * 3).toFixed(2)}`}
    </Button>
  )
}
```

#### 5. Use in Your Pages
Example in homepage or booking page:
```tsx
import StripeCheckout from '@/components/StripeCheckout'

export default function BookingPage() {
  const weight = 5 // kg

  return (
    <div>
      <h2>Complete Your Order</h2>
      <p>Weight: {weight}kg</p>
      <p>Price: ${(weight * 3).toFixed(2)}</p>
      <StripeCheckout weight={weight} />
    </div>
  )
}
```

### Pricing Model
- **Base**: $3.00 per kg
- **Add-ons**:
  - Hang Dry: +$2.00
  - Delicates: +$1.50
  - Comforters: +$5.00
  - Stain Treatment: +$2.50

### Testing with Stripe Test Cards
Use these in Stripe checkout:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)

---

## Database Structure (Firestore)

### Collections

#### `users/{uid}`
```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "name": "John Doe",
  "userType": "customer|pro",
  "phone": "+61234567890",
  "address": "123 Main St",
  "city": "Sydney",
  "state": "NSW",
  "postcode": "2000",
  "createdAt": "2026-01-18T10:00:00Z"
}
```

#### `orders/{orderId}` (Create after payment)
```json
{
  "customerId": "uid",
  "weight": 5,
  "addOns": ["hangDry", "delicates"],
  "pickupAddress": "123 Main St, Sydney NSW 2000",
  "pickupTime": "2026-01-18T14:00:00Z",
  "deliveryTime": "2026-01-19T17:00:00Z",
  "status": "pending|confirmed|in_transit|completed|cancelled",
  "amount": 18.50,
  "stripeSessionId": "cus_xxxxx",
  "createdAt": "2026-01-18T10:00:00Z"
}
```

#### `pros/{uid}` (Extended user info for pros)
```json
{
  "rating": 4.98,
  "totalJobs": 234,
  "totalEarnings": 3250.00,
  "availability": "available|unavailable",
  "workingHours": { "start": "08:00", "end": "18:00" },
  "serviceArea": ["2000", "2001", "2002"],
  "bankAccount": "xxx",
  "verifiedAt": "2026-01-18T10:00:00Z"
}
```

---

## Next Steps

### Phase 1: Payment Processing (Now)
- ✅ Setup Stripe checkout API
- ✅ Create StripeCheckout component
- ✅ Add to booking flow
- Add webhook for successful payments (`/app/api/webhooks/stripe`)

### Phase 2: Order Management
- Create order creation endpoint
- Real-time order status updates
- Assign jobs to pros

### Phase 3: Real-time Tracking
- Firebase Realtime DB listeners for order status
- Map integration for pickup/delivery tracking
- Push notifications

### Phase 4: Reviews & Ratings
- Create review system
- Pro rating calculation
- Customer feedback

### Phase 5: Advanced Features
- Subscription plans
- Bulk discounts
- Loyalty rewards integration

---

## Troubleshooting

### "Stripe key not found"
- Check `.env.local` file exists
- Verify key format: `sk_test_` or `pk_test_`
- Restart dev server: `npm run dev`

### "Payment failed"
- Check API route responding: `POST /api/payment/checkout`
- Verify Stripe credentials are correct
- Check browser console for errors

### "Auth redirect loop"
- Verify middleware.ts matches your protected routes
- Check auth token cookie is being set
- Clear browser cookies and try again

### "User not found after login"
- Ensure Firestore database is created
- Check Firebase credentials in `lib/firebase.ts`
- Verify user document was created in Firestore

---

## Environment Variables Checklist

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# App Configuration
NEXT_PUBLIC_DOMAIN=http://localhost:3000
```

---

## Support Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Washlee Project Instructions**: See `.github/copilot-instructions.md`
