# Quick Start: Refund System Setup

## What's Been Done ✅

1. **Frontend UI**: Added "Clear Cancelled Orders" and "Request Refund" buttons to customer orders page
2. **Backend API**: Created `/api/orders/refund` endpoint to handle refund requests
3. **Database Schema**: Created migration file with `refund_requests` table
4. **Email Integration**: Endpoint sends refund confirmation email with payment link

## What You Need to Do Now

### Step 1: Run Database Migration (5 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy the entire contents of this file:
   ```
   migrations/create_refund_requests_table.sql
   ```
6. Paste into Supabase SQL Editor
7. Click **Run** (or press Cmd+Enter)
8. Wait for confirmation: "Success!"

**Verify**: Run this query to confirm table was created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'refund_requests';
```

You should see: `refund_requests`

### Step 2: Test the UI in Your App

1. Make sure dev server is running: `npm run dev`
2. Go to http://localhost:3000/dashboard/orders
3. Look for the "Clear Cancelled" button (appears when you have cancelled orders)
4. Click on a cancelled order - you should see "Request Refund" button
5. Click "Request Refund" to see the confirmation modal

### Step 3: Configure Email Service (Optional but Recommended)

**For Testing**: You can test without email first

**For Production**: Add SendGrid credentials to `.env.local`:
```
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=noreply@washlee.com
```

Get SendGrid API key: [https://sendgrid.com/pricing/](https://sendgrid.com/pricing/)

### Step 4: Payment Gateway Setup (For Processing Actual Refunds)

**Option A: Stripe**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Option B: PayPal**
```
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
```

## Testing the Flow

### Manual Test (No Payment Processing)

1. **Create a test cancelled order**:
   - Book an order
   - Go to `/tracking?orderId=YOUR_ORDER_ID`
   - Click "Cancel Order" (or use admin panel)

2. **Request Refund**:
   - Go to `/dashboard/orders`
   - Find the cancelled order
   - Click "Request Refund"
   - Confirm in modal

3. **Verify Database**:
   - Go to Supabase Dashboard
   - Open `refund_requests` table
   - You should see a new pending refund request

4. **Check Logs**:
   - In your terminal running `npm run dev`
   - Look for `[Refund API]` log messages

### Email Test (Requires SendGrid)

1. Set up SendGrid API key in `.env.local`
2. Restart dev server: `npm run dev`
3. Request a refund
4. Check your email inbox for refund confirmation

## File Locations

**Database Migration**:
- `migrations/create_refund_requests_table.sql`

**Frontend Code**:
- `app/dashboard/orders/page.tsx` (UI added)

**Backend API**:
- `app/api/orders/refund/route.ts` (new endpoint)

**Documentation**:
- `REFUND_SYSTEM_SETUP.md` (complete guide)
- `REFUND_SYSTEM_PROGRESS.md` (progress report)

## Troubleshooting

### Database migration fails
- Check if `orders` and `users` tables exist
- Verify table names match exactly
- Try running migration line by line

### Email not working
- Verify SendGrid credentials
- Check `.env.local` has `SENDGRID_API_KEY`
- Check email service is configured correctly
- Look for `[Refund API] Email sent to:` in console

### Refund API returns 404
- Verify order exists in database
- Verify order status is 'cancelled'
- Verify userId matches order.user_id
- Check browser console for API error response

### Buttons not appearing
- Clear browser cache
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Make sure you have cancelled orders

## Next Steps

1. **Complete**: Run database migration
2. **Test**: Verify refund request UI works
3. **Optional**: Set up email service
4. **Optional**: Integrate payment processing (Stripe/PayPal)
5. **Optional**: Create refund payment page

## Questions?

See `REFUND_SYSTEM_SETUP.md` for comprehensive guide with code examples.

---

**TL;DR**: 
1. Copy `migrations/create_refund_requests_table.sql` 
2. Run in Supabase SQL Editor
3. Test the UI in your app
4. Done! ✅
