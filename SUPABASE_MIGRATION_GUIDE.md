# Supabase Migration Guide - Washlee

## Overview

This guide covers the complete Firebase → Supabase migration for Washlee. The migration is **low-risk** because:

- ✅ SendGrid email service is **100% independent** (pure REST API, no database changes needed)
- ✅ All UI/design components remain **unchanged**
- ✅ Only **database layer** (400 KB of code) needs conversion
- ✅ Email templates stay **exactly the same**
- ✅ Card generation system **stays the same**

## Timeline Estimate: 7-10 hours

### Phase 1: Setup (30 min)
### Phase 2: Database Schema (1 hour)
### Phase 3: Core Auth (2 hours)
### Phase 4: Email Verification (1.5 hours)
### Phase 5: API Routes (2-3 hours)
### Phase 6: Frontend Pages (1-2 hours)
### Phase 7: Testing & Debugging (1 hour)

---

## Phase 1: Environment Setup ✅ COMPLETE

### Status: Environment variables configured
- `NEXT_PUBLIC_SUPABASE_URL=https://mxxxxxfrvpqgzwfxpxwq.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI`
- `SUPABASE_SERVICE_ROLE_KEY=sb_secret_qXA2QNAt019Aanc7kaopCg_QSTm7Gzb`

### Client Files Created
- ✅ `lib/supabaseClient.ts` - Client-side Supabase client
- ✅ `lib/supabaseServer.ts` - Server-side admin client
- ✅ `@supabase/supabase-js` - Package installed

---

## Phase 2: Database Schema

### Step 1: Create Schema in Supabase Console

1. Go to: https://app.supabase.com/projects
2. Select your project
3. Go to SQL Editor
4. Run the SQL from `SUPABASE_MIGRATION_SCHEMA.sql`

This will create:
- `users` table (extends auth.users)
- `customers` table
- `employees` table
- `wash_clubs` table
- `wash_club_verification` table
- `wash_club_transactions` table
- `orders` table
- `reviews` table
- `inquiries` table
- `transactions` table
- `verification_codes` table
- Indexes and RLS policies
- Utility functions

### Step 2: Data Migration (if needed)

If you have existing Firebase data:

```bash
# 1. Export Firebase collections as JSON
# 2. Transform to PostgreSQL format
# 3. Import to Supabase

# For now, we're starting fresh with Supabase
```

### Step 3: Verify Tables

```sql
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
```

---

## Phase 3: Authentication Migration

### Current Setup (Firebase)
```typescript
// lib/firebaseAuthClient.ts
const auth = getAuth()
const user = auth.currentUser
```

### New Setup (Supabase)
```typescript
// lib/supabaseAuthClient.ts
const { data: { user } } = await supabase.auth.getUser()
```

### Files to Create/Update

#### 1. Create `lib/supabaseAuthClient.ts`

```typescript
import { supabase } from './supabaseClient'

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('[AUTH] Error getting user:', error)
    return null
  }
  return user
}

/**
 * Create authenticated request headers
 */
export async function getAuthHeaders() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) {
    throw new Error('No active session')
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Logout current user
 */
export async function logout() {
  return await supabase.auth.signOut()
}
```

#### 2. Update `lib/AuthContext.tsx`

Replace Firebase Auth with Supabase Auth:

```typescript
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user || null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

## Phase 4: Email Verification Migration

### No Changes Needed! 🎉

SendGrid email service stays exactly the same:
- API key: `SENDGRID_API_KEY`
- Email templates: `lib/emailService.ts` (unchanged)
- Verification code generation: (unchanged)

### Only Database Layer Changes

#### Convert: `app/api/wash-club/send-verification-email/route.ts`

**Before (Firebase):**
```typescript
await db.collection('wash_club_verification').doc(userId).set({
  email: userEmail,
  code: code,
  expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  createdAt: admin.firestore.Timestamp.now(),
})
```

**After (Supabase):**
```typescript
import { supabaseAdmin } from '@/lib/supabaseServer'

await supabaseAdmin
  .from('wash_club_verification')
  .upsert({
    user_id: userId,
    email: userEmail,
    code: code,
    expires_at: expiresAt.toISOString(),
  })
```

#### Convert: `app/api/wash-club/verify-email/route.ts`

**Before (Firebase):**
```typescript
const docSnap = await db
  .collection('wash_club_verification')
  .doc(userId)
  .get()

if (!docSnap.exists) {
  return { error: 'No verification found' }
}
```

**After (Supabase):**
```typescript
const { data, error } = await supabaseAdmin
  .from('wash_club_verification')
  .select()
  .eq('user_id', userId)
  .single()

if (error || !data) {
  return { error: 'No verification found' }
}
```

---

## Phase 5: API Routes Migration

### Pattern: Firebase → Supabase

All 40 API routes follow this pattern:

```typescript
// BEFORE: Firebase Admin SDK
import admin from 'firebase-admin'
const db = admin.firestore()

const docSnap = await db.collection('users').doc(userId).get()
const userData = docSnap.data()
```

```typescript
// AFTER: Supabase Client
import { supabaseAdmin } from '@/lib/supabaseServer'

const { data: userData, error } = await supabaseAdmin
  .from('users')
  .select()
  .eq('id', userId)
  .single()

if (error) throw error
```

### Quick Migration Checklist

- [ ] Convert `admin.firestore()` → `supabaseAdmin`
- [ ] Convert `.collection('table')` → `.from('table')`
- [ ] Convert `.doc(id)` queries → `.eq('id', id)`
- [ ] Convert `.get()` → `.select()`
- [ ] Convert `.set()` → `.insert()` or `.upsert()`
- [ ] Convert `.update()` → `.update()`
- [ ] Convert `.delete()` → `.delete()`
- [ ] Convert Timestamps → ISO strings

### Key Files to Convert

Priority order (highest impact first):

1. **Wash Club Routes (5 files, ~450 lines)**
   - `app/api/wash-club/send-verification-email/route.ts`
   - `app/api/wash-club/verify-email/route.ts`
   - `app/api/wash-club/complete-enrollment/route.ts`
   - `app/api/wash-club/apply-credits/route.ts`
   - `app/api/wash-club/membership/route.ts`

2. **Order Routes (5 files, ~350 lines)**
   - `app/api/orders/route.ts`
   - `app/api/orders/user/[uid]/route.ts`
   - `app/api/orders/pro/assigned/route.ts`
   - `app/api/checkout/route.ts`
   - `app/api/webhook/stripe/route.ts`

3. **Inquiry Routes (3 files, ~250 lines)**
   - `app/api/inquiries/create/route.ts`
   - `app/api/inquiries/list/route.ts`
   - `app/api/inquiries/approve/route.ts`

4. **Review Routes (4 files, ~200 lines)**
   - `app/api/reviews/create/route.ts`
   - `app/api/reviews/index.ts`
   - `app/api/reviews/moderation/route.ts`

5. **Admin Routes (6 files, ~300 lines)**
   - `app/api/admin/users/pending-payments/route.ts`
   - `app/api/admin/users/subscriptions/route.ts`
   - `app/api/admin/users/wash-club/route.ts`
   - etc.

6. **Other Routes (17 files, ~350 lines)**
   - Pro assignment, wholesale, claims, analytics, etc.

---

## Phase 6: Frontend Pages Migration

### Pattern: Firebase Queries → Supabase Queries

```typescript
// BEFORE: Firebase
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

onSnapshot(
  query(
    collection(db, 'orders'),
    where('userId', '==', user.uid)
  ),
  (snapshot) => {
    const orders = snapshot.docs.map(doc => doc.data())
    setOrders(orders)
  }
)
```

```typescript
// AFTER: Supabase
import { supabase } from '@/lib/supabaseClient'

const { data: orders } = await supabase
  .from('orders')
  .select()
  .eq('user_id', user.id)

// For real-time:
supabase
  .from('orders')
  .on('*', () => {
    // Re-fetch data
  })
  .subscribe()
```

### Pages to Update

- `app/dashboard/customer/page.tsx` (orders, payments)
- `app/dashboard/pro/page.tsx` (available jobs, earnings)
- `app/tracking/page.tsx` (real-time tracking)
- `app/auth/login/page.tsx` (auth flow)
- `app/auth/signup/page.tsx` (user creation)

---

## Phase 7: Testing & Deployment

### Pre-Launch Checklist

- [ ] All API routes updated and tested
- [ ] Email verification working (SendGrid confirmed)
- [ ] Card numbers generating correctly
- [ ] Wash Club enrollment flow complete
- [ ] Orders creating and updating
- [ ] Authentication working (login/logout)
- [ ] Real-time updates functioning
- [ ] Admin endpoints working
- [ ] Error handling in place
- [ ] Console errors cleared

### Testing Commands

```bash
# 1. Run type check
npm run lint

# 2. Build for production
npm run build

# 3. Start dev server
npm run dev

# 4. Test key flows:
# - Sign up as customer
# - Join Wash Club (if logged in)
# - Create order
# - Apply credits
# - Check order tracking
```

---

## Rollback Plan

If issues arise:

1. Keep Firebase credentials in `.env.local` (don't remove)
2. Keep Firebase SDK imports in lib/ (don't delete)
3. Gradually migrate routes one at a time
4. Test each route before deploying
5. Monitor error logs during deployment

---

## Important Notes

### SendGrid Email Service
✅ **NO CHANGES NEEDED**
- Uses independent REST API
- Email templates unchanged
- Email sending logic unchanged
- Just keep `SENDGRID_API_KEY` in `.env.local`

### Stripe Integration
✅ **NO CHANGES NEEDED**
- Independent payment processor
- Just keep `STRIPE_*` keys in `.env.local`

### Card Number Generation
✅ **NO CHANGES NEEDED**
- `generateCardNumber()` function logic stays the same
- Just update Firestore query → Supabase query

### UI/Design Components
✅ **NO CHANGES NEEDED**
- `WashClubCard.tsx` component stays the same
- All button, card, layout components unchanged
- Styling with Tailwind unchanged

---

## Next Steps

1. **Run SQL schema in Supabase SQL Editor**
2. **Create `lib/supabaseAuthClient.ts`**
3. **Update `lib/AuthContext.tsx`**
4. **Convert email verification routes (Phase 4)**
5. **Convert API routes one by one (Phase 5)**
6. **Update frontend pages (Phase 6)**
7. **Test and deploy (Phase 7)**

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

## Questions?

Check console logs for:
- `[SUPABASE]` - Supabase client operations
- `[AUTH]` - Authentication errors
- `[API]` - API route errors
- `[EMAIL]` - Email service errors (SendGrid)

---

**Last Updated**: January 18, 2025
**Migration Status**: 🔄 Phase 1 Complete, Phase 2-7 In Progress
