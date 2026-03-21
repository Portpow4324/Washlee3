# Firebase Imports Still Present - Priority List

## Critical (App Won't Work Without)

### API Routes Using Firebase Admin SDK
These must be updated for the app to function:

**Count**: 4 files

1. **`/app/api/offers/accept/route.ts`**
   - Uses: `firebase-admin`
   - Purpose: Accept offers
   - Priority: HIGH
   - Estimated Time: 15 min

2. **`/app/api/employee-codes/route.ts`**
   - Uses: `firebase-admin`
   - Purpose: Generate/manage employee verification codes
   - Priority: HIGH
   - Estimated Time: 15 min

3. **`/app/api/pro/assign-order/route.ts`**
   - Uses: `firebase-admin`
   - Purpose: Assign orders to pro/employees
   - Priority: HIGH
   - Estimated Time: 20 min

4. **`/app/api/inquiries/reject/route.ts`**
   - Uses: `firebase-admin`
   - Purpose: Reject pro inquiries
   - Priority: HIGH
   - Estimated Time: 15 min

---

## Important (Core Functionality)

### Library Files
**Count**: 3 files

1. **`/lib/trackingService.ts`** (590 lines)
   - Uses: Firestore queries for order tracking
   - Purpose: Real-time order tracking updates
   - Priority: MEDIUM-HIGH
   - Estimated Time: 30 min

2. **`/lib/multiServiceAccount.ts`** (226 lines)
   - Uses: Firebase Admin SDK multiple service accounts
   - Purpose: Multi-account management
   - Priority: MEDIUM
   - Estimated Time: 20 min

3. **`/lib/middleware/admin.ts`** 
   - Uses: Firebase Admin SDK
   - Purpose: Admin authorization middleware
   - Priority: MEDIUM-HIGH
   - Estimated Time: 15 min

---

## Summary by Impact

| File Type | Count | Firebase References | Impact | Priority |
|-----------|-------|-------------------|--------|----------|
| API Routes | 4 | `firebase-admin` | Cannot handle requests | CRITICAL |
| Services | 3 | `db`, `admin` | Cannot track/manage data | HIGH |
| **Total** | **7** | | | |

---

## Recommended Update Order

### Phase 2A (Block 1) - Make API Routes Work (1 hour)
1. `/app/api/offers/accept/route.ts`
2. `/app/api/employee-codes/route.ts`
3. `/app/api/inquiries/reject/route.ts`
4. `/app/api/pro/assign-order/route.ts`

### Phase 2B (Block 2) - Update Services (1.5 hours)
5. `/lib/middleware/admin.ts`
6. `/lib/trackingService.ts`
7. `/lib/multiServiceAccount.ts`

### Total Remaining Work
- **Time**: 2-2.5 hours
- **Files**: 7
- **Lines of Code**: ~1000+

---

## How to Update Each Type

### API Route Pattern
```typescript
// OLD
import admin from 'firebase-admin'
const db = admin.firestore()

// NEW
import { supabase } from '@/lib/supabaseClient'

// OLD: db.collection().doc().get()
// NEW: supabase.from('table').select().eq('id', value).single()
```

### Service Pattern
```typescript
// OLD
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

// NEW
import { supabase } from '@/lib/supabaseClient'

// OLD: await getDoc(doc(db, 'collection', id))
// NEW: await supabase.from('table').select().eq('id', id).single()
```

### Middleware Pattern
```typescript
// OLD
import admin from 'firebase-admin'
const decodedToken = await admin.auth().verifyIdToken(token)

// NEW
const { data: { user }, error } = await supabase.auth.getUser(token)
```

---

## Files That Are ALREADY Updated ✅

These no longer have Firebase imports:

1. ✅ `/lib/AuthContext.tsx` - Fully Supabase
2. ✅ `/lib/serverVerification.ts` - Fully Supabase
3. ✅ `/lib/paymentService.ts` - Fully Supabase
4. ✅ `/lib/adminSetup.ts` - Fully Supabase
5. ✅ `/.env.local` - Removed all Firebase vars

---

## Next Session Action Plan

If you want to continue:

1. **Start with API routes** (makes app functional)
   - Pick one file from Phase 2A
   - Replace Firebase admin with Supabase
   - Test the endpoint

2. **Update services** (makes features work)
   - Pick one service file
   - Replace Firestore queries with Supabase
   - Test the feature

3. **Deploy and test**
   - Run schema in Supabase
   - Test auth flow
   - Test data operations

---

## Quick Command to See All Firebase References

```bash
# Find all Firebase imports in app and lib
grep -r "firebase-admin\|from 'firebase\|from \"firebase" app/ lib/ --include="*.ts" --include="*.tsx"

# Count them
grep -r "firebase-admin\|from 'firebase\|from \"firebase" app/ lib/ --include="*.ts" --include="*.tsx" | wc -l
```

---

**Total Remaining Firebase References**: ~7 files, ~1000+ lines of code
**Estimated Time to Complete**: 2-2.5 hours
**Current Status**: 45% Complete (5 critical files done)

