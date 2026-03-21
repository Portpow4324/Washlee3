# Test Supabase Connection - Verify Everything Works

After you deploy the schema, run this to verify your connection:

## Step 1: Start Dev Server
```bash
cd /Users/lukaverde/Desktop/Website.BUsiness
npm run dev
```

You should see:
```
▲ Next.js 16.1.3
- Local: http://localhost:3000
```

## Step 2: Open Browser Console
1. Go to http://localhost:3000
2. Press **F12** to open DevTools
3. Click **Console** tab

## Step 3: Check for Errors
Look for these messages:

### ✅ GOOD - You should see:
- No auth errors
- App loads normally
- No red error messages

### ❌ BAD - If you see:
```
NEXT_PUBLIC_SUPABASE_URL is not defined
```
Fix: Check `.env.local` has Supabase credentials

### ❌ BAD - If you see:
```
Failed to fetch tables from Supabase
```
Fix: Schema not deployed - run `SUPABASE_FRESH_START.sql` in Supabase

## Step 4: Quick Connection Test
Paste this in browser console:
```javascript
import { supabase } from '@/lib/supabaseClient'
supabase.from('users').select('count', { count: 'exact' }).then(r => console.log('Supabase connected!', r))
```

If it works, you'll see:
```
Supabase connected! { ... }
```

## What's Working

After deployment, these should work:
- ✅ User authentication (AuthContext.tsx)
- ✅ Database connection
- ✅ Verification codes
- ✅ Admin functions
- ✅ Payment service

## What's NOT Working Yet

These need updates in next session:
- ⏳ API routes (4 files)
- ⏳ Signup endpoint
- ⏳ Dashboard queries
- ⏳ Real-time updates

---

**Next**: Deploy schema, then tell me "Schema deployed" or "Connection working" and we'll fix the remaining pieces!

