# Stripe Subscription Integration - Setup Guide

## ✅ Completed

### Files Created/Updated:
1. ✅ `/app/subscriptions/page.tsx` - Updated with Stripe checkout integration
2. ✅ `/app/api/subscriptions/create-checkout-session/route.ts` - New API route for subscription checkout
3. ✅ `/components/Header.tsx` - Button sizes restored to original (text-base)

### Features Implemented:
- ✅ Button sizes restored to `lg` (px-8 py-4 text-xl)
- ✅ Loading states with spinner animation
- ✅ Stripe integration for checkout
- ✅ Two different flows:
  - **From Signup**: Selects plan and returns to signup form
  - **From Dashboard**: Creates Stripe checkout session and redirects to payment

---

## 🔧 What You Need to Do in Stripe Dashboard

To complete the integration, you need to create three subscription products in Stripe:

### Step 1: Create Products in Stripe

Go to **Stripe Dashboard → Products**

#### Product 1: Starter Plan
- **Name:** Starter Plan
- **Price:** $9.99/month
- **Copy the Price ID** (looks like: `price_1StlVu...`)

#### Product 2: Professional Plan
- **Name:** Professional Plan
- **Price:** $19.99/month
- **Copy the Price ID**

#### Product 3: Washly Premium Plan
- **Name:** Washly Premium Plan
- **Price:** $49.99/month
- **Copy the Price ID**

### Step 2: Update the Plan Mapping

Once you have the Price IDs, update the mapping in `/app/api/subscriptions/create-checkout-session/route.ts`:

```typescript
const PLAN_STRIPE_MAPPING: Record<string, { priceId: string; name: string; amount: number }> = {
  'starter': {
    priceId: 'price_1StlVu38bIfbwMU6abc...', // YOUR ACTUAL PRICE ID
    name: 'Starter Plan',
    amount: 999,
  },
  'professional': {
    priceId: 'price_1StlVu38bIfbwMU6def...', // YOUR ACTUAL PRICE ID
    name: 'Professional Plan',
    amount: 1999,
  },
  'washly': {
    priceId: 'price_1StlVu38bIfbwMU6ghi...', // YOUR ACTUAL PRICE ID
    name: 'Washly Premium Plan',
    amount: 4999,
  },
}
```

---

## 🚀 How It Works

### From Signup Page:
1. User reaches subscription step
2. Clicks "Choose Plan" on any plan card
3. Plan selection is passed to signup flow
4. User completes signup with selected plan
5. After signup, can upgrade from dashboard

### From Main Menu / Already Logged In:
1. User clicks "Plans" in header
2. User selects a plan
3. Loading spinner appears
4. Redirects to Stripe Hosted Checkout
5. User enters payment details
6. Succeeds → `/dashboard/subscription/success`
7. Canceled → `/subscriptions?cancelled=true`

---

## 📝 Environment Variables

Already configured in `.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🔐 Security Features

- Token verification for authenticated users
- Email validation for checkout
- Metadata tracking (userId, plan, planName)
- Error handling and logging
- Loading states prevent multiple clicks

---

## 🎨 UI/UX Improvements

### Button Sizes:
- Restored to original size: **Large (lg)** 
- Padding: `px-8 py-4`
- Font: `text-xl`
- Min height: `48px`

### Loading States:
- Spinner animation while processing
- "Processing..." text
- Disabled state prevents re-clicks
- Works on both "Choose Plan" and "No Thanks" buttons

### Error Handling:
- User-friendly error messages
- Console logging for debugging
- Graceful fallbacks

---

## 📊 Plan Details

| Plan | Price | Features |
|------|-------|----------|
| Pay Per Order | Flexible | No subscription, pay as you go |
| Starter | $9.99/mo | 5-10% discount, unlimited orders |
| Professional | $19.99/mo | 10-15% discount, priority support |
| Washly Premium | $49.99/mo | 20% discount, concierge service |

---

## ✨ Next Steps (Optional)

1. **Create Success Page**: Build `/app/dashboard/subscription/success/page.tsx`
   - Show confirmation message
   - Display subscription details
   - Link to dashboard

2. **Add Webhook Handler**: Create `/app/api/webhooks/stripe/route.ts`
   - Listen for `payment_intent.succeeded`
   - Update user subscription status in Firestore
   - Send confirmation email

3. **Update Customer Profile**: 
   - Add `subscriptionStatus` field
   - Add `subscriptionPlan` field
   - Add `subscriptionStartDate` field

4. **Dashboard Subscription Card**:
   - Show current plan
   - Allow plan changes
   - Show next billing date
   - Manage payment methods

---

## 🧪 Testing in Stripe Test Mode

Use these test card numbers:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Exp: Any future date
- CVC: Any 3 digits

**Requires Authentication:**
- Card: `4000 0027 6000 3184`
- Exp: Any future date
- CVC: Any 3 digits

---

## 📞 Support

If you need help:
1. Check Stripe logs in Dashboard
2. Review browser console for errors
3. Check server logs for API errors
4. Verify Price IDs are correct in code

---

**Status:** ✅ Ready for Stripe Product Setup
