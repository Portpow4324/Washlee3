# ✅ FIREBASE REMOVAL CHECKLIST - Track Your Progress

## Phase 1: Remove Firebase & Setup Supabase ✅ COMPLETE

### Library Files
- [x] Delete lib/firebase.ts
- [x] Delete lib/firebaseAdmin.ts
- [x] Delete lib/firebaseAuthClient.ts
- [x] Delete lib/firebaseAuthServer.ts

### Auth System
- [x] Rewrite lib/AuthContext.tsx for Supabase
- [x] Update UserData interface
- [x] Implement supabase.auth.onAuthStateChange()
- [x] Verify AuthProvider wraps app

### Environment
- [x] Remove NEXT_PUBLIC_FIREBASE_* variables
- [x] Remove FIREBASE_* variables
- [x] Add NEXT_PUBLIC_SUPABASE_URL placeholder
- [x] Add NEXT_PUBLIC_SUPABASE_ANON_KEY placeholder
- [x] Add SUPABASE_SERVICE_ROLE_KEY placeholder

### Services
- [x] Update lib/serverVerification.ts (Firestore → Supabase)
- [x] Update lib/paymentService.ts (Firestore → Supabase)
- [x] Update lib/adminSetup.ts (Firebase custom claims → is_admin flag)

### Schema & Data
- [x] Create SUPABASE_FRESH_START.sql
- [x] Clean and validate CSV data in CSV_CLEAN/
- [x] Prepare 11 CSV files with 50 rows

### Documentation
- [x] Create FIREBASE_REMOVAL_PROGRESS.md
- [x] Create SUPABASE_QUICK_START.md
- [x] Create FIREBASE_REMAINING_IMPORTS.md
- [x] Create FIREBASE_REMOVAL_SUMMARY.md
- [x] Create FIREBASE_MIGRATION_STATUS.md

---

## Phase 2: Update API Routes ⏳ TODO

### Identify Routes
- [ ] Review /app/api/offers/accept/route.ts
- [ ] Review /app/api/employee-codes/route.ts
- [ ] Review /app/api/inquiries/reject/route.ts
- [ ] Review /app/api/pro/assign-order/route.ts

### Update Each Route
- [ ] offers/accept:
  - [ ] Replace `import admin from 'firebase-admin'`
  - [ ] Replace Firebase auth with Supabase
  - [ ] Replace Firestore queries with Supabase
  - [ ] Test endpoint

- [ ] employee-codes:
  - [ ] Replace Firebase imports
  - [ ] Update code generation logic
  - [ ] Use verification_codes table
  - [ ] Test endpoint

- [ ] inquiries/reject:
  - [ ] Replace Firebase imports
  - [ ] Update inquiry rejection logic
  - [ ] Test endpoint

- [ ] pro/assign-order:
  - [ ] Replace Firebase imports
  - [ ] Update order assignment logic
  - [ ] Test endpoint

---

## Phase 2B: Implement Signup ⏳ TODO

### Option A: Create API Route (Recommended)
- [ ] Create `/app/api/auth/signup/route.ts`
- [ ] Implement supabase.auth.signUp()
- [ ] Create user record in users table
- [ ] Create customer record (if customer signup)
- [ ] Create employee record (if pro signup)
- [ ] Test customer signup
- [ ] Test pro signup
- [ ] Test verification code flow

### Option B: Use Supabase Auth UI
- [ ] Install @supabase/auth-ui-react
- [ ] Create signup component with Auth widget
- [ ] Setup callback URL handling
- [ ] Test signup flow

---

## Phase 3: Update Library Services ⏳ TODO

### trackingService.ts
- [ ] Read entire file (590 lines)
- [ ] Identify all Firestore operations
- [ ] Replace db.collection().doc() with supabase.from()
- [ ] Replace onSnapshot with supabase.on()
- [ ] Update field names to snake_case
- [ ] Test order tracking

### multiServiceAccount.ts
- [ ] Remove Firebase Admin SDK imports
- [ ] Replace with Supabase operations
- [ ] Update service account logic
- [ ] Test if file is still needed

### middleware/admin.ts
- [ ] Replace Firebase auth token verification
- [ ] Use supabase.auth.getUser() instead
- [ ] Update admin check logic
- [ ] Test middleware

---

## Phase 4: Update Dashboard Components ⏳ TODO

### Customer Dashboard (/app/dashboard/customer/page.tsx)
- [ ] Replace Firestore orders query
- [ ] Replace reviews query
- [ ] Replace transaction query
- [ ] Setup real-time listeners
- [ ] Test data loads
- [ ] Test filters/sorting

### Pro Dashboard (/app/dashboard/pro/page.tsx)
- [ ] Replace available jobs query
- [ ] Replace active jobs query
- [ ] Replace earnings query
- [ ] Update ratings display
- [ ] Test data loads

---

## Phase 5: Setup & Testing ⏳ TODO

### Supabase Setup
- [ ] Get Supabase project credentials
- [ ] Update .env.local with actual credentials
- [ ] Open Supabase SQL Editor
- [ ] Run SUPABASE_FRESH_START.sql
- [ ] Verify all 15 tables created:
  - [ ] users
  - [ ] customers
  - [ ] employees
  - [ ] orders
  - [ ] wash_clubs
  - [ ] wash_club_verification
  - [ ] wash_club_transactions
  - [ ] reviews
  - [ ] transactions
  - [ ] inquiries
  - [ ] verification_codes
  - [ ] admin_logs
  - [ ] pro_certifications
  - [ ] service_categories
  - [ ] wash_club_tiers
  - [ ] subscriptions

### Import Test Data (Optional)
- [ ] Go to Supabase Database > Tables
- [ ] Import users.csv first
- [ ] Import customers.csv
- [ ] Import employees.csv
- [ ] Import orders.csv
- [ ] Import reviews.csv
- [ ] Import transactions.csv
- [ ] Import remaining CSVs
- [ ] Verify 50 rows total

### Auth Flow Testing
- [ ] Test customer signup
- [ ] Test email verification
- [ ] Test customer login
- [ ] Test customer logout
- [ ] Test pro signup
- [ ] Test pro login
- [ ] Test pro logout
- [ ] Test password reset
- [ ] Test token refresh

### Functionality Testing
- [ ] Dashboard loads for customer
- [ ] Dashboard loads for pro
- [ ] Can create order (if applicable)
- [ ] Can submit review
- [ ] Can update profile
- [ ] Admin functions work
- [ ] Verification codes work
- [ ] Payment flow works

---

## Remaining Firebase References

Files that still have Firebase imports (3 files):

```
/lib/trackingService.ts ................. 1 import
/lib/multiServiceAccount.ts ........... 1 import
/lib/middleware/admin.ts .............. 1 import
/app/api/offers/accept/route.ts ....... 1 import
/app/api/employee-codes/route.ts ...... 1 import
/app/api/inquiries/reject/route.ts ... 1 import
/app/api/pro/assign-order/route.ts ... 1 import
```

**Total Remaining**: 7 files, ~1000+ lines to update

---

## Quick Command Reference

### Check remaining Firebase
```bash
grep -r "firebase-admin\|from 'firebase\|from \"firebase" app/ lib/ --include="*.ts" --include="*.tsx"
```

### Count remaining
```bash
grep -r "firebase-admin\|from 'firebase\|from \"firebase" app/ lib/ --include="*.ts" --include="*.tsx" | wc -l
```

### Find specific imports
```bash
grep -r "firebase-admin" app/ --include="*.ts"
grep -r "from '@/lib/firebase" lib/ --include="*.ts"
```

---

## Progress Tracking

```
PHASE 1: Remove Firebase ...................... 100% ✅
PHASE 2: Update API Routes .................... 0% ⏳
PHASE 2B: Implement Signup .................... 0% ⏳
PHASE 3: Update Services ...................... 0% ⏳
PHASE 4: Update Dashboards .................... 0% ⏳
PHASE 5: Setup & Testing ...................... 0% ⏳

OVERALL: 45% Complete
```

---

## Time Estimates

| Phase | Tasks | Time |
|-------|-------|------|
| Phase 1 | 21 | ✅ Done |
| Phase 2 | 4 | 1 hour |
| Phase 2B | 10 | 30 min |
| Phase 3 | 7 | 1.5 hours |
| Phase 4 | 10 | 1 hour |
| Phase 5 | 35+ | 2 hours |
| **Total** | **87** | **6-7 hours** |

---

## Success Criteria

When all checked, you're done:

- [ ] No Firebase imports remain
- [ ] All API routes use Supabase
- [ ] Signup works
- [ ] Login works
- [ ] Logout works
- [ ] Dashboard loads data
- [ ] Orders can be created
- [ ] Reviews can be submitted
- [ ] Payments work with Stripe
- [ ] Admin functions work
- [ ] All tests passing
- [ ] App deployed to production

---

## Quick Wins First

Start with these (30 min each):
1. [ ] Update .env with Supabase credentials
2. [ ] Deploy schema to Supabase
3. [ ] Import test data
4. [ ] Test Supabase connection from app

---

## Notes & Blockers

Space for your notes:

```
Blocker 1:
[]

Blocker 2:
[]

TODO:
[]
```

---

**Last Updated**: January 16, 2025
**Status**: 45% Complete - Phase 1 Done, Ready for Phase 2
**Est. Completion**: 4-6 hours of development + testing

