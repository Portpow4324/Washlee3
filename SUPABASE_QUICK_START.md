# Supabase Migration - Quick Start Guide

## 🚀 What's Done

✅ **Firebase completely removed** from codebase
✅ **Supabase clients** already exist in `/lib/supabaseClient.ts`, `/lib/supabaseAuthClient.ts`, `/lib/supabaseServer.ts`
✅ **AuthContext.tsx** rewritten for Supabase
✅ **Key services updated**: serverVerification, paymentService, adminSetup
✅ **.env.local** configured for Supabase (needs credentials)
✅ **Supabase schema** ready in `SUPABASE_FRESH_START.sql`
✅ **CSV data** cleaned and validated (50 rows across 11 files)

---

## ⏳ What's Needed

### 1. **Set Up Supabase Project** (If not done)
- Go to https://supabase.com
- Create new project
- Copy project URL and API keys
- Update `.env.local`:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

### 2. **Deploy Database Schema**
```sql
-- Open Supabase > SQL Editor
-- Copy all content from SUPABASE_FRESH_START.sql
-- Run in SQL Editor
-- Verify 15 tables created ✓
```

### 3. **Import Data** (Optional - for testing)
```
1. Go to Supabase > Database > Tables
2. Select each table from CSV_CLEAN/ directory in order:
   - users.csv (must be first)
   - customers.csv
   - employees.csv
   - orders.csv
   - wash_clubs.csv
   - reviews.csv
   - transactions.csv
   - verification_codes.csv
   - admin_logs.csv
   - And others...
3. Verify 50 rows imported ✓
```

### 4. **Update API Routes** (Critical)

Files that still need updating:
- `/app/api/auth/*` (login, logout, verify, etc.)
- `/app/api/orders/*`
- `/app/api/pro/*`
- `/app/api/payments/*`

**Pattern to replace**:
```typescript
// OLD (Firebase)
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

const userRef = await getDoc(doc(db, 'users', userId))

// NEW (Supabase)
import { supabase } from '@/lib/supabaseClient'

const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()
```

### 5. **Create/Update Signup** (Critical)

You need signup to work. Either:

**Option A: Create API route** (`/app/api/auth/signup/route.ts`)
```typescript
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  const { email, password, phone, name, userType } = await req.json()

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  // 2. Create user record
  await supabase.from('users').insert([{
    id: authData.user.id,
    email,
    name,
    phone,
    user_type: userType, // 'customer' or 'pro'
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }])

  // 3. Create customer or employee record
  if (userType === 'customer') {
    await supabase.from('customers').insert([{
      user_id: authData.user.id,
      created_at: new Date().toISOString(),
    }])
  } else if (userType === 'pro') {
    await supabase.from('employees').insert([{
      user_id: authData.user.id,
      status: 'active',
      created_at: new Date().toISOString(),
    }])
  }

  return Response.json({ success: true })
}
```

**Option B: Use Supabase Auth UI** (easiest)
```typescript
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabaseClient'

export default function SignUp() {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      theme="dark"
      providers={['google']}
      redirectTo={`${window.location.origin}/auth/callback`}
    />
  )
}
```

### 6. **Update Dashboard Queries**

**Customer Dashboard** Example:
```typescript
// OLD (Firebase)
const ordersQuery = query(collection(db, 'orders'), where('customerId', '==', userId))
const querySnapshot = await getDocs(ordersQuery)

// NEW (Supabase)
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

**Pro Dashboard** Example:
```typescript
// OLD (Firebase)
const jobsQuery = query(collection(db, 'orders'), where('status', '==', 'available'))

// NEW (Supabase)
const { data: jobs } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'available')
  .order('created_at', { ascending: false })
```

### 7. **Test Everything**

- [ ] Can sign up as customer
- [ ] Can sign up as pro
- [ ] Can log in
- [ ] Can log out
- [ ] Dashboard loads data
- [ ] Can create order (if applicable)
- [ ] Verification codes work
- [ ] Admin functions work

---

## 🛠️ Helpful Commands

**Check for remaining Firebase imports**:
```bash
grep -r "from 'firebase" app/ lib/ --include="*.ts" --include="*.tsx" | grep -v ".md"
grep -r "firebase-admin" app/ lib/ --include="*.ts" --include="*.tsx"
```

**Verify Supabase is configured**:
```bash
# In browser console
import { supabase } from '@/lib/supabaseClient'
console.log(supabase.auth)  // Should not be undefined
```

---

## 📁 File Locations

**Important Files**:
- Schema: `/SUPABASE_FRESH_START.sql`
- Data: `/CSV_CLEAN/*.csv`
- Auth: `/lib/AuthContext.tsx`
- Services: `/lib/serverVerification.ts`, `/lib/paymentService.ts`, `/lib/adminSetup.ts`
- Progress: `/FIREBASE_REMOVAL_PROGRESS.md`

**To Update**:
- API routes: `/app/api/auth/*`, `/app/api/orders/*`, etc.
- Signup: `/app/auth/signup/page.tsx` or create `/app/api/auth/signup/route.ts`
- Dashboards: `/app/dashboard/customer/page.tsx`, `/app/dashboard/pro/page.tsx`

---

## 🆘 Common Issues & Fixes

### Issue: `NEXT_PUBLIC_SUPABASE_URL is undefined`
**Fix**: Update `.env.local` with actual Supabase project URL

### Issue: `Supabase client not initialized`
**Fix**: Check `/lib/supabaseClient.ts` exports correctly

### Issue: `Auth state not persisting`
**Fix**: Ensure AuthProvider wraps entire app in `/app/layout.tsx`

### Issue: `Column does not exist` error
**Fix**: Schema not deployed - run SUPABASE_FRESH_START.sql

### Issue: `Relation does not exist` error
**Fix**: Same as above - deploy schema first

---

## 📞 Support

If you run into issues:
1. Check the `/FIREBASE_REMOVAL_PROGRESS.md` for detailed status
2. Look at `/lib/AuthContext.tsx` for Supabase auth pattern
3. Review `/lib/serverVerification.ts` and `/lib/paymentService.ts` for service examples
4. Check Supabase docs at https://supabase.com/docs

---

**Status**: 45% Complete - Ready for API routes and signup
**Time to completion**: ~4-6 hours for full migration including testing

