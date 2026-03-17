# Supabase Migration: Complete Phase-by-Phase Breakdown

## Executive Summary

You're migrating from Firebase (NoSQL) to Supabase (PostgreSQL). This keeps your entire frontend/UI intact while replacing the backend database.

**Total Time**: 7-10 hours (can be done incrementally)
**Complexity**: Medium (pattern-based replacements)
**Risk Level**: Low (Firebase remains as backup until cutover)

---

## Phase Overview

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Environment Setup | 15 min | ✅ DONE |
| 2 | Database Schema | 15 min | ⏳ READY |
| 3 | AuthContext.tsx | 45 min | 📋 GUIDE READY |
| 4 | Email Routes | 1.5 hrs | 📋 PENDING |
| 5 | API Routes (40 files) | 2-3 hrs | 📋 PENDING |
| 6 | Frontend Pages (40+) | 1-2 hrs | 📋 PENDING |
| 7 | Testing & Deploy | 1 hr | 📋 PENDING |

---

## Phase 1: Environment Setup ✅ COMPLETED

**Status**: All prerequisites are in place

### What Was Done:
✅ Supabase account created
✅ Project credentials obtained
✅ 3 client files created:
  - `lib/supabaseClient.ts` - Client-side operations
  - `lib/supabaseServer.ts` - Server-side admin
  - `lib/supabaseAuthClient.ts` - Auth helpers
✅ Environment variables configured in `.env.local`

### Verify Phase 1:
```bash
grep "NEXT_PUBLIC_SUPABASE\|SUPABASE_SERVICE" .env.local
# Should show 3 variables ✓

ls -la lib/supabase*.ts
# Should show 3 files ✓
```

---

## Phase 2: Database Schema ⏳ READY TO START

**Status**: Ready for you to execute manually in Supabase UI

### What You'll Do:
1. Go to https://app.supabase.com
2. Select your Washlee project
3. Click SQL Editor → New Query
4. Copy entire contents of `SUPABASE_MIGRATION_SCHEMA.sql` (348 lines)
5. Paste into editor and Run

### What Gets Created:
```
✅ 11 PostgreSQL tables
✅ 30+ indexes for performance
✅ Row Level Security (RLS) policies
✅ Utility functions (card number generation)
✅ Triggers (auto-timestamp updates)
```

### Tables Created:
- users, customers, employees
- wash_clubs, wash_club_verification, wash_club_transactions
- orders, reviews, inquiries, transactions, verification_codes

### Time: 10-15 minutes

### Next: After Phase 2
- Confirm all 11 tables appear in Supabase Tables list
- Reply "Phase 2 complete" and we move to Phase 3

### Quick Reference:
File: `SUPABASE_PHASE_2_SETUP.md` (detailed guide)
File: `PHASE_2_QUICK_START.txt` (3-step summary)

---

## Phase 3: AuthContext.tsx 📋 GUIDE READY

**Status**: Complete guide created, ready to implement

### What Changes:
Replace authentication from Firebase Auth to Supabase Auth

### Key Replacements:

**Imports:**
```tsx
// OLD
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'

// NEW
import { supabaseClient } from '@/lib/supabaseClient'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
```

**Auth Listener:**
```tsx
// OLD
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) { ... }
})

// NEW
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) { ... }
})
```

**Database Query:**
```tsx
// OLD
const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid))

// NEW
const { data: userRecord } = await supabaseClient
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()
```

### Files to Update:
- `lib/AuthContext.tsx` (268 lines → complete replacement with new Supabase version)

### Testing:
```bash
npm run build          # TypeScript check
npm run dev           # Start server
# Test login at /auth/login
# Check console for [Auth] debug logs
```

### Time: 45 minutes (mostly copy-paste + testing)

### Reference:
File: `SUPABASE_PHASE_3_AUTHCONTEXT.md` (complete updated code)

---

## Phase 4: Email Verification Routes 📋 PENDING

**Status**: Guide to be created (SendGrid stays, only DB layer changes)

### Files to Update: 4 routes
- `app/api/wash-club/send-verification-email/route.ts`
- `app/api/wash-club/verify-email/route.ts`
- `app/api/email/send-verification-code/route.ts`
- `app/api/email/verify-code/route.ts`

### What Changes:
- SendGrid API calls: NO CHANGES ✓ (independent)
- Email templates: NO CHANGES ✓
- Database layer: Firebase → Supabase ✓

### Pattern:
```tsx
// OLD - Firebase Firestore
const docSnap = await getDoc(doc(db, 'wash_club_verification', userId))
await setDoc(doc(db, 'wash_club_verification', userId), { ... })

// NEW - Supabase PostgreSQL
const { data } = await supabaseClient
  .from('wash_club_verification')
  .select('*')
  .eq('user_id', userId)
  .single()

await supabaseClient
  .from('wash_club_verification')
  .insert([{ ... }])
```

### Impact: ~20 KB of changes
### Time: 1.5 hours

### What Doesn't Change:
✅ SendGrid API (status 202 still works)
✅ Email templates
✅ Verification flow/logic
✅ Response formats

---

## Phase 5: API Routes (40 Files) 📋 PENDING

**Status**: List of all 40 files ready to convert

### Scope: 224 KB of code
### Pattern: Replace Firebase SDK with Supabase SDK

### Common Patterns to Replace:

**Pattern 1: Read Data**
```tsx
// OLD Firebase
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
const q = query(collection(db, 'orders'), where('userId', '==', userId))
const snapshot = await getDocs(q)

// NEW Supabase
import { supabaseServer } from '@/lib/supabaseServer'
const { data: orders } = await supabaseServer
  .from('orders')
  .select('*')
  .eq('user_id', userId)
```

**Pattern 2: Write Data**
```tsx
// OLD Firebase
import { setDoc, doc } from 'firebase/firestore'
await setDoc(doc(db, 'users', userId), userData)

// NEW Supabase
await supabaseServer
  .from('users')
  .upsert({ id: userId, ...userData })
```

**Pattern 3: Delete Data**
```tsx
// OLD Firebase
import { deleteDoc, doc } from 'firebase/firestore'
await deleteDoc(doc(db, 'orders', orderId))

// NEW Supabase
await supabaseServer
  .from('orders')
  .delete()
  .eq('id', orderId)
```

### Files to Update (Priority Order):
1. Authentication routes (5 files)
2. Wash Club routes (8 files)
3. Order routes (10 files)
4. Payment/Stripe routes (6 files)
5. Admin routes (11 files)

### Time: 2-3 hours
### Complexity: Low (pattern-based)

---

## Phase 6: Frontend Pages (40+ Files) 📋 PENDING

**Status**: List of pages ready to update

### Scope: ~600 KB of frontend code
### Pattern: Replace Firebase imports with Supabase

### Common Frontend Patterns:

**Pattern 1: Initialize Firebase (OLD)**
```tsx
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export default function Page() {
  const [orders, setOrders] = useState([])
  
  useEffect(() => {
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid))
    getDocs(q).then(snapshot => {
      setOrders(snapshot.docs.map(doc => doc.data()))
    })
  }, [user])
}
```

**Pattern 2: Use Supabase (NEW)**
```tsx
import { supabaseClient } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

export default function Page() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  
  useEffect(() => {
    if (!user) return
    
    supabaseClient
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => setOrders(data || []))
  }, [user])
}
```

### Pages Categories:

**Authentication Pages (2)**
- /auth/login
- /auth/signup

**Dashboard Pages (2)**
- /dashboard/customer
- /dashboard/pro

**Wash Club Pages (2)**
- /wash-club
- /wash-club/onboarding

**Public Pages (8)**
- /, /how-it-works, /pricing, /faq, /pro, /tracking, etc.

**Admin Pages (12)**
- /admin/*, /admin/employees/*, /admin/wash-club/*, etc.

**Account Pages (6)**
- /account/*, /settings/*, etc.

### Time: 1-2 hours (mostly imports, similar logic)

---

## Phase 7: Testing & Deployment 📋 PENDING

**Status**: Testing guide to be created

### What to Test:

**1. Build Check**
```bash
npm run build
# Should complete with 0 errors
# Expected: "compiled successfully"
```

**2. Development Server**
```bash
npm run dev
# http://localhost:3000
# Check console for [Auth] logs
```

**3. User Flows**

**Flow 1: Authentication**
- [ ] Sign up new account
- [ ] Verify email
- [ ] Log in
- [ ] Logout

**Flow 2: Wash Club**
- [ ] Join Wash Club
- [ ] Receive verification email
- [ ] Complete onboarding
- [ ] See card number
- [ ] Check credits

**Flow 3: Orders**
- [ ] Create order
- [ ] Check order status
- [ ] Make payment
- [ ] Receive order confirmation email

**Flow 4: Dashboard**
- [ ] Customer dashboard (orders list, stats)
- [ ] Pro dashboard (available jobs, earnings)
- [ ] Admin dashboard (user management)

**Flow 5: Email**
- [ ] Verification emails received
- [ ] Order confirmation emails received
- [ ] Emails have correct links

### Rollback Plan (if issues found)
- Keep Firebase running in parallel
- Switch back: `auth` import to Firebase
- Revert last commit: `git revert HEAD`
- Database stays Supabase (one-way migration)

### Production Deployment
```bash
npm run build          # Final build
git commit -m "Supabase migration complete"
git push
# Deploy to Vercel/your platform
```

### Time: 1 hour

---

## What Stays The Same (No Changes!)

✅ **SendGrid Integration**
- Email API (independent REST API)
- Email templates
- Verification flows
- Status 202 responses still work

✅ **Stripe Payments**
- Payment processing
- Subscription management
- Webhook handlers
- Card tokenization

✅ **UI/Styling**
- All Tailwind CSS
- Components (Button, Card, WashClubCard, etc.)
- Page designs
- Animations

✅ **Business Logic**
- Card number generation (WASH-XXXX-XXXX-XXXX)
- Credit calculation
- Order flow
- Pro matching

✅ **External Services**
- Google OAuth (update in Supabase Auth settings)
- Maps API
- Analytics

---

## Migration Checklist

### Phase 1: Environment ✅
- [x] Supabase account created
- [x] Credentials obtained
- [x] Client files created
- [x] Environment variables set

### Phase 2: Schema ⏳
- [ ] SQL schema executed in Supabase
- [ ] All 11 tables visible
- [ ] Indexes created
- [ ] RLS policies active

### Phase 3: Auth 📋
- [ ] AuthContext.tsx updated to Supabase
- [ ] Build succeeds
- [ ] Login flow works
- [ ] User data loads

### Phase 4: Email Routes 📋
- [ ] 4 email routes updated
- [ ] SendGrid still sends emails
- [ ] Database layer uses Supabase
- [ ] Email verification works

### Phase 5: API Routes 📋
- [ ] All 40 API routes converted
- [ ] Endpoints tested
- [ ] Stripe routes working
- [ ] Admin endpoints working

### Phase 6: Frontend 📋
- [ ] All 40+ pages updated
- [ ] useAuth() works everywhere
- [ ] Queries use supabaseClient
- [ ] Real-time features work

### Phase 7: Testing 📋
- [ ] npm run build succeeds
- [ ] All user flows tested
- [ ] Email receipts verified
- [ ] Performance acceptable

---

## Important Notes

### Security
- ✅ Row Level Security (RLS) policies created
- ✅ Service Role Key stored only in `.env.local` (never in frontend)
- ✅ Anon Key can be public (limited by RLS)
- ✅ User can only access their own data

### Performance
- ✅ PostgreSQL generally faster than Firestore for queries
- ✅ Indexes created for all common lookups
- ✅ Real-time subscriptions supported via Supabase Realtime

### Data Migration
- Optional: Copy existing Firebase data to Supabase
- For this project: Start fresh (new users after deployment)
- Or: Export Firestore, import to PostgreSQL (separate process)

### Rollback Strategy
- Keep Firebase code as backup for first week
- Run both in parallel during testing
- If issues found, revert imports and redeploy
- Database schema stays on Supabase

---

## Next Immediate Steps

### Right Now:
1. **Execute Phase 2** (Database Schema)
   - File: `SUPABASE_PHASE_2_SETUP.md`
   - Time: 10 minutes
   - Go to: https://app.supabase.com → SQL Editor

### After Phase 2 Complete:
2. **Implement Phase 3** (AuthContext.tsx)
   - File: `SUPABASE_PHASE_3_AUTHCONTEXT.md`
   - Time: 45 minutes
   - Replace entire `lib/AuthContext.tsx`

### Then Phases 4-7:
3. Will create specific guides for each phase
4. Can be done one phase at a time
5. Estimated completion: 1-2 days of work

---

## Quick Reference Files

```
Phase 2: SUPABASE_PHASE_2_SETUP.md       ← START HERE
Phase 2: PHASE_2_QUICK_START.txt
Phase 3: SUPABASE_PHASE_3_AUTHCONTEXT.md (with full code)
Schema:  SUPABASE_MIGRATION_SCHEMA.sql
Clients: lib/supabaseClient.ts
Clients: lib/supabaseServer.ts
Clients: lib/supabaseAuthClient.ts
```

---

## Support

**If you get stuck:**
1. Check troubleshooting section in relevant phase guide
2. Check error messages in browser console (F12)
3. Verify environment variables are set
4. Restart dev server: `npm run dev`
5. Clear browser cache if needed

**Checkpoints:**
- After Phase 2: Tables visible in Supabase ✓
- After Phase 3: Login works, user data loads ✓
- After Phase 4: Verification emails sent ✓
- After Phase 5: API endpoints respond ✓
- After Phase 6: Pages load data ✓
- After Phase 7: All flows tested ✓

---

**Status: Ready for Phase 2 Execution**

When ready, reply: "Starting Phase 2" and execute the SQL schema at https://app.supabase.com
