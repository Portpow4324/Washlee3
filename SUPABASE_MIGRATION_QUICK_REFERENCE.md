# Quick Reference: Supabase Migration Patterns

## Common Migration Scenarios

### 1. Real-Time Listeners

#### Firebase
```typescript
import { onSnapshot, doc, db } from 'firebase/firestore'

onSnapshot(doc(db, 'orders', orderId), (doc) => {
  console.log(doc.data())
})
```

#### Supabase
```typescript
import { supabase } from '@/lib/supabaseClient'

supabase
  .from(`orders:id=eq.${orderId}`)
  .on('*', (payload) => console.log(payload.new))
  .subscribe()
```

---

### 2. Simple Queries

#### Firebase
```typescript
const docSnap = await getDoc(doc(db, 'users', uid))
const userData = docSnap.data()
```

#### Supabase
```typescript
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', uid)
  .single()
```

---

### 3. Filtered Queries

#### Firebase
```typescript
const snapshot = await getDocs(
  query(collection(db, 'orders'), where('status', '==', 'pending'))
)
const orders = snapshot.docs.map(d => d.data())
```

#### Supabase
```typescript
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'pending')
```

---

### 4. Inserts

#### Firebase
```typescript
await addDoc(collection(db, 'orders'), {
  status: 'pending',
  createdAt: Timestamp.now()
})
```

#### Supabase
```typescript
await supabase.from('orders').insert({
  status: 'pending',
  created_at: new Date().toISOString()
})
```

---

### 5. Updates

#### Firebase
```typescript
await updateDoc(doc(db, 'orders', orderId), {
  status: 'delivered',
  updatedAt: Timestamp.now()
})
```

#### Supabase
```typescript
await supabase
  .from('orders')
  .update({
    status: 'delivered',
    updated_at: new Date().toISOString()
  })
  .eq('id', orderId)
```

---

### 6. Admin Operations

#### Firebase
```typescript
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

await adminAuth.setCustomUserClaims(uid, { admin: true })
await adminDb.collection('users').doc(uid).update({ isAdmin: true })
```

#### Supabase
```typescript
import { adminClient } from '@/lib/multiServiceAccount'

await adminClient
  .from('users')
  .update({ is_admin: true })
  .eq('id', uid)
```

---

### 7. Authentication

#### Firebase
```typescript
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const signOutUser = async () => {
  await signOut(auth)
}
```

#### Supabase
```typescript
import { useAuth } from '@/lib/AuthContext'

const { logout } = useAuth()
const signOutUser = async () => {
  await logout()
}
```

---

### 8. Timestamps

#### Firebase
```typescript
import { Timestamp } from 'firebase/firestore'

const timestamp = Timestamp.now()
// or
const timestamp = Timestamp.fromDate(new Date())
```

#### Supabase
```typescript
const timestamp = new Date().toISOString()
// or use PostgreSQL functions
// or use: created_at: new Date()
```

---

### 9. Nested Data

#### Firebase (Subcollections)
```typescript
const snapshot = await getDocs(
  collection(db, 'orders', orderId, 'tracking_updates')
)
```

#### Supabase (Related Tables)
```typescript
const { data } = await supabase
  .from('tracking_updates')
  .select('*')
  .eq('order_id', orderId)
```

---

### 10. Array Operations

#### Firebase
```typescript
import { arrayUnion, arrayRemove } from 'firebase/firestore'

await updateDoc(ref, {
  tags: arrayUnion('new-tag'),
  // or
  items: arrayRemove('old-item')
})
```

#### Supabase
```typescript
// Option 1: Fetch, modify, update
const { data: order } = await supabase
  .from('orders')
  .select('tags')
  .eq('id', orderId)
  .single()

await supabase
  .from('orders')
  .update({ tags: [...order.tags, 'new-tag'] })
  .eq('id', orderId)

// Option 2: Use PostgreSQL functions
// await supabase.rpc('array_append', { id: orderId, value: 'new-tag' })
```

---

## Field Name Mapping

Common name changes (Firebase → Supabase):

```
isAdmin → is_admin
createdAt → created_at
updatedAt → updated_at
proId → pro_id
customerId → customer_id
deliveryCity → delivery_city
deliveryState → delivery_state
proLocation → pro_location
deliveryProof → delivery_proof
trackingUpdates → tracking_updates (separate table)
userId → user_id
orderId → order_id
accountType → account_type
userType → user_type
adminRole → admin_role
adminSince → admin_since
notificationCount → notification_count
lastNotified → last_notified
totalDistance → total_distance
avgSpeed → avg_speed
```

---

## Common Components to Update

### Headers
- `components/Header.tsx` - Replace `signOut(auth)` with `logout()`
- `components/ProHeader.tsx` - Same pattern
- `components/EmployeeHeader.tsx` - Same pattern

### Dashboards  
- `app/dashboard/page.tsx` - Replace Firestore queries with Supabase
- `app/pro/*/page.tsx` - Update job/order queries
- `app/admin/*/page.tsx` - Update admin queries

### Pages
- `app/tracking/[id]/page.tsx` - Use `subscribeToTracking()`
- `app/notifications/page.tsx` - Replace Firestore listener
- `app/referrals/page.tsx` - Update referral queries

### API Routes
- `app/api/orders/*` - Use Supabase client
- `app/api/admin/*` - Use adminClient
- `app/api/pro/*` - Use Supabase client

---

## Useful Supabase Functions

### Auth
```typescript
const { data: { user } } = await supabase.auth.getUser()
const { data, error } = await supabase.auth.signUp({ email, password })
const { error } = await supabase.auth.signOut()
```

### Real-Time
```typescript
const channel = supabase
  .channel('orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
  .subscribe()

channel.unsubscribe()
```

### Admin API
```typescript
const { data } = await supabase.auth.admin.listUsers()
const { data: { user } } = await supabase.auth.admin.getUserById(uid)
await supabase.auth.admin.updateUserById(uid, { user_metadata: {} })
```

---

## Error Handling Pattern

```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Query failed:', error.message)
    return null
  }

  return data
} catch (error) {
  console.error('Unexpected error:', error)
  return null
}
```

---

## Files That Already Use Supabase Patterns

Use these as reference implementations:

- ✅ `lib/trackingService.ts` - Real-time + queries
- ✅ `lib/multiServiceAccount.ts` - Admin operations
- ✅ `lib/middleware/admin.ts` - JWT verification
- ✅ `lib/AuthContext.tsx` - Auth flow
- ✅ `app/api/auth/signup/route.ts` - Auth API
- ✅ `app/api/offers/accept/route.ts` - API pattern
- ✅ `lib/serverVerification.ts` - Admin verification
- ✅ `lib/adminSetup.ts` - Admin setup
- ✅ `lib/paymentService.ts` - Service pattern

---

## Testing Checklist

When migrating a component/page:

- [ ] No Firebase imports remain
- [ ] All Firestore queries converted to Supabase
- [ ] Timestamps converted to ISO strings
- [ ] Snake_case field names used
- [ ] Error handling in place
- [ ] Real-time listeners cleanup on unmount
- [ ] TypeScript types updated
- [ ] No console errors in dev tools

---

**Reference Guide v1.0** — Updated Jan 18, 2026
