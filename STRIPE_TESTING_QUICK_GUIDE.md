# Stripe Checkout Testing - Quick Reference

## Problem Fixed ✅
Stripe checkout was hardcoded to redirect to `http://localhost:3001/checkout/success` even when app ran on different port.

## Solution
Dynamic baseUrl detection from request headers in both checkout routes.

## Quick Test

### Step 1: Start Dev Server
```bash
npm run dev
# App runs on http://localhost:3000
```

### Step 2: Create Order
1. Go to http://localhost:3000/booking
2. Fill in laundry details
3. Click "Proceed to Checkout"

### Step 3: Verify Fix
Open browser DevTools (F12) → Console tab

**Look for these logs:**
```
[CHECKOUT-SIMPLE] Initializing Stripe...
[CHECKOUT-SIMPLE] Base URL determined:
[CHECKOUT-SIMPLE]   - x-forwarded-proto: null
[CHECKOUT-SIMPLE]   - x-forwarded-host: null
[CHECKOUT-SIMPLE]   - request host: localhost:3000
[CHECKOUT-SIMPLE]   - final URL: http://localhost:3000
```

**If you see `localhost:3000`, the fix is working! ✅**

### Step 4: Complete Checkout
1. New Stripe checkout tab opens automatically
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date and any CVC
4. Fill in name/email
5. Click "Pay" 

### Step 5: Verify Redirect
After payment, you'll be redirected to:
```
http://localhost:3000/checkout/success?session_id=cs_test_...
```

**Not to localhost:3001! ✅**

## Testing on Different Port

### Run on Port 3001
```bash
npm run dev -- -p 3001
```

**Expected baseUrl log:**
```
[CHECKOUT-SIMPLE]   - request host: localhost:3001
[CHECKOUT-SIMPLE]   - final URL: http://localhost:3001
```

**Expected redirect after payment:**
```
http://localhost:3001/checkout/success?session_id=...
```

## Files Changed

1. `/app/api/checkout/route.ts` - Line 85-110 (baseUrl detection)
2. `/app/api/checkout-simple/route.ts` - Line 40-65 (baseUrl detection)

## What Changed

**Before (Broken):**
```typescript
const baseUrl = 'http://localhost:3001'  // ❌ Always localhost:3001
```

**After (Fixed):**
```typescript
let baseUrl: string

if (forwardedProto && forwardedHost) {
  const cleanHost = forwardedHost.split(',')[0].trim()
  baseUrl = `${forwardedProto}://${cleanHost}`
} else if (requestHost) {
  baseUrl = `http://${requestHost}`  // ✅ Uses actual request host
} else {
  baseUrl = 'http://localhost:3000'
}
```

## Expected Console Logs

### Development (localhost)
```
[CHECKOUT-SIMPLE] Base URL determined:
[CHECKOUT-SIMPLE]   - x-forwarded-proto: null
[CHECKOUT-SIMPLE]   - x-forwarded-host: null
[CHECKOUT-SIMPLE]   - request host: localhost:3000 (or 3001, etc)
[CHECKOUT-SIMPLE]   - final URL: http://localhost:3000
```

### Production (with reverse proxy)
```
[CHECKOUT-SIMPLE] Base URL determined:
[CHECKOUT-SIMPLE]   - x-forwarded-proto: https
[CHECKOUT-SIMPLE]   - x-forwarded-host: example.com
[CHECKOUT-SIMPLE]   - request host: 127.0.0.1:3000
[CHECKOUT-SIMPLE]   - final URL: https://example.com
```

## Troubleshooting

### Issue: Still seeing localhost:3001 in logs
- Clear browser cache (Cmd+Shift+Delete)
- Hard refresh (Cmd+Shift+R on Mac)
- Check Network tab to see fresh request to `/api/checkout-simple`

### Issue: No console logs appearing
- Make sure DevTools Console is open before clicking checkout
- Check if console is set to "All" levels (not filtering)
- Try in a fresh incognito window

### Issue: Redirect still going to wrong URL
1. Check browser's address bar after Stripe payment
2. Check Network tab for final redirect destination
3. May need to restart dev server: `npm run dev`

## Success Criteria ✅

- [ ] Sees `[CHECKOUT-SIMPLE]` logs in console
- [ ] Logs show correct request host in final URL
- [ ] After payment, redirects to correct `/checkout/success` page
- [ ] No errors in console or Network tab
- [ ] Works on localhost:3000 AND localhost:3001

---

## Next Steps

After verifying the fix works:

1. Test on production domain
2. Verify reverse proxy headers are set correctly
3. Monitor server logs for baseUrl values
4. Update deployment documentation if needed

---

**Fix Status:** ✅ Complete & Ready for Testing
