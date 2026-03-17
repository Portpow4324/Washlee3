# Quick Debugging & Error Reference Guide

## 🔴 Critical Setup - Must Do First

### 1. Firebase Setup (Required for ANY API to work)
**File**: `.env.local`
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Admin SDK (for server-side)
FIREBASE_ADMIN_SDK_KEY=your-service-account-json-as-string
```

**Verification**:
```bash
# Build will tell you what's missing:
npm run build
# Look for: "Can't determine Firebase Database URL"
```

### 2. Stripe Setup (For payments)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Email Setup (For notifications)
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
# OR
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 4. Google Maps (For address selection)
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 🐛 Common Errors & Fixes

### Error: "Cannot find module '@/lib/firebase'"
**Cause**: Path alias not working
**Fix**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Error: "Firebase Database URL not configured"
**Cause**: `NEXT_PUBLIC_FIREBASE_DATABASE_URL` missing
**Fix**: Add to `.env.local` (see above)

### Error: "Cannot read property 'user' of undefined"
**Cause**: auth.currentUser doesn't exist (user not logged in)
**Fix**: Add null check
```typescript
// ❌ Bad:
const email = auth.currentUser.email

// ✅ Good:
const email = auth.currentUser?.email || 'unknown'
```

### Error: "Stripe key not found" on checkout
**Cause**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` missing
**Fix**: Restart dev server after adding to `.env.local`
```bash
# Kill server: Ctrl+C
# Remove .next cache
rm -rf .next

# Restart
npm run dev
```

### Error: "Cannot GET /api/orders"
**Cause**: API route doesn't exist or has wrong format
**Fix**: Check file naming
```
❌ /api/orders.ts      (Old Pages API format)
✅ /api/orders/route.ts (App Router format)
```

### Error: "500 Internal Server Error" on API
**Cause**: Usually missing environment variable or database connection
**Fix**: 
1. Check `.env.local` has all required vars
2. Check Firebase is configured
3. Look at server console for stack trace
4. Add try-catch with logging:
```typescript
export async function GET(req: Request) {
  try {
    // Your code
  } catch (error: any) {
    console.error('API Error:', error.message)
    return Response.json({error: error.message}, {status: 500})
  }
}
```

### Error: "CORS error" on API calls
**Cause**: Frontend calling API from different origin
**Fix**: Add CORS headers to route:
```typescript
export async function GET() {
  return Response.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
    }
  })
}
```

---

## ✅ Verification Checklist

### Before Running Dev Server
```bash
# 1. Check Node version
node --version  # Should be 18+

# 2. Install dependencies
npm install

# 3. Check .env.local exists
test -f .env.local && echo "✅ .env.local exists" || echo "❌ Missing .env.local"

# 4. Check required env vars
grep -c "NEXT_PUBLIC_FIREBASE_API_KEY" .env.local || echo "❌ Firebase not configured"
```

### After Starting Dev Server
```bash
# 1. Check homepage loads
curl http://localhost:3000 | grep -q "Washlee" && echo "✅ Homepage works"

# 2. Check Firebase auth works
curl -s http://localhost:3000/api/test | jq .

# 3. Check no build errors
# Open http://localhost:3000 and check browser console for red errors
```

### TypeScript & Build Checks
```bash
# Check for type errors (without building)
npx tsc --noEmit

# Full build test
npm run build

# Check production build runs
npm run start
# Try accessing http://localhost:3000
```

---

## 🔍 How to Find & Fix Issues

### Step 1: Identify the Problem
**Where to look**:
- Browser console (Ctrl+Shift+K) - Frontend errors
- Server console output - API/backend errors
- Network tab (F12 → Network) - Failed requests

### Step 2: Understand the Error
```
Error Message              | Probable Cause
"404 Not found"           | Page/API route doesn't exist
"401 Unauthorized"        | Missing auth token
"500 Internal Server"     | Code error or missing config
"Cannot read property"    | Null/undefined variable
"Module not found"        | Wrong import path
"Stripe error"           | Missing/wrong API key
```

### Step 3: Fix the Issue
```
1. Check environment variables (.env.local)
2. Check import paths and file names
3. Add console.log() to debug
4. Check if service is initialized (Firebase, Stripe)
5. Test with curl if it's an API
6. Look at similar working code for comparison
```

### Step 4: Verify the Fix
```bash
# Clear caches
rm -rf .next node_modules/.cache

# Restart dev server
npm run dev

# Test specific page
curl http://localhost:3000/api/test
```

---

## 🧪 Testing Individual Features

### Test Remember Me (Already Implemented ✅)
```javascript
// Browser console:

// 1. Check if localStorage works
localStorage.setItem('test', 'value')
localStorage.getItem('test')  // Should return 'value'

// 2. Check Remember Me data
localStorage.getItem('customerRememberMe')
localStorage.getItem('customerRememberMeExpiry')

// 3. Visit test page
// http://localhost:3000/test-remember-me
// Should show 9 tests all passing ✅
```

### Test Stripe Checkout
```javascript
// Browser console on /checkout page:

// 1. Check Stripe is loaded
window.Stripe  // Should show function

// 2. Check key is available
console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

// 3. Try creating payment session
fetch('/api/payment/checkout', {
  method: 'POST',
  body: JSON.stringify({ orderId: 'test123' })
}).then(r => r.json()).then(console.log)
```

### Test Firebase Connection
```javascript
// Browser console:

// 1. Check Firebase loads
import { db } from '@/lib/firebase'
console.log(db)  // Should show Firestore instance

// 2. Try reading data (if you have test data)
import { collection, getDocs } from 'firebase/firestore'
const users = await getDocs(collection(db, 'users'))
console.log(users.size)  // Should show number of users

// 3. Check auth
import { auth } from '@/lib/firebase'
console.log(auth.currentUser)  // null if not logged in
```

---

## 📋 Complete Issue Checklist

When you encounter an error:

- [ ] Read full error message
- [ ] Check if environment variables are set
- [ ] Verify file paths are correct
- [ ] Check Firebase is configured
- [ ] Look for console.error() in your code
- [ ] Test with `curl` if it's an API
- [ ] Check if service (Firebase, Stripe) is initialized
- [ ] Look for typos in variable names
- [ ] Verify imports match exports
- [ ] Check TypeScript types match
- [ ] Ensure async/await is used correctly
- [ ] Check for missing error handling
- [ ] Verify database indexes exist
- [ ] Test with simple example first

---

## 🎯 Priority Order for Setup

1. **MUST HAVE** (Project won't run without):
   - [ ] Firebase API credentials
   - [ ] Stripe keys
   - [ ] Google Maps API key

2. **SHOULD HAVE** (Functionality broken without):
   - [ ] SendGrid/Resend API key
   - [ ] Firebase Realtime Database URL
   - [ ] Google OAuth credentials

3. **NICE TO HAVE** (Features incomplete without):
   - [ ] Twilio (SMS)
   - [ ] Firebase Cloud Functions deployed
   - [ ] Stripe webhook secret

---

**Last Updated**: March 5, 2026  
**Status**: ✅ Ready for use
