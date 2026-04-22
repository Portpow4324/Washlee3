# Checkout Session Creation Fix

## Problem
The subscriptions page was throwing "Failed to create checkout session" error when users tried to select a plan.

## Root Causes
1. **Mismatched API contract**: Frontend was sending `plan: planId` but the API expected `userId` and `planType`
2. **Invalid database table**: API was trying to insert into non-existent `checkout_sessions` table
3. **No Stripe integration**: API wasn't actually creating a Stripe checkout session
4. **Poor error reporting**: Error messages weren't detailed enough to debug issues

## Solutions Implemented

### 1. Backend API Route (`app/api/subscriptions/create-checkout-session/route.ts`)
- Rewritten to actually integrate with Stripe SDK
- Now accepts the correct `plan` parameter from frontend
- Creates a real Stripe checkout session with proper line items and mode
- Returns both `sessionId` and `url` for flexibility
- Added comprehensive logging for debugging
- Proper error handling with detailed error messages

### 2. Frontend (`app/subscriptions/page.tsx`)
- Added logging to track the entire checkout flow
- Better error handling with detailed error messages to user
- Parses API error response properly
- Supports both direct URL redirect and fallback session ID approach

### 3. Required Environment Variables
You need to add these to `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PRICE_ID_STARTER=price_xxxxx
STRIPE_PRICE_ID_PLUS=price_xxxxx
STRIPE_PRICE_ID_PREMIUM=price_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Plan Mapping
The API now maps plan IDs to Stripe price IDs:
- `none` → No subscription (pay-per-order, no Stripe checkout)
- `starter` → `STRIPE_PRICE_ID_STARTER`
- `professional` → `STRIPE_PRICE_ID_PROFESSIONAL`
- `washly` → `STRIPE_PRICE_ID_WASHLY`

## Testing the Fix

1. **Setup**: Ensure Stripe test keys are in `.env.local`
2. **Navigate**: Go to `/subscriptions` page
3. **Select Plan**: Click on any plan's "Select Plan" button
4. **Check Logs**: Look at browser console for `[Checkout]` logs showing:
   - User authentication check
   - Plan selection
   - API response status and data
   - Stripe checkout URL
5. **Payment Page**: Should open Stripe checkout in new tab

## Debugging

If you still see errors, check:
1. **Console logs**: Browser console shows `[Checkout]` logs with detailed flow
2. **API response**: Check if API returns 400/500 errors with the error message
3. **Environment variables**: Verify `STRIPE_SECRET_KEY` and price IDs are set
4. **Plan ID**: Ensure the plan ID matches one of: `none`, `starter`, `professional`, `washly`

## Enhanced Error Messages
Now shows:
- `[Checkout] Missing plan parameter`
- `[Checkout] Invalid plan selected`
- `[Checkout] Stripe not configured`
- `[Checkout] No checkout URL or session ID returned from API`

Plus detailed error from Stripe if session creation fails.
