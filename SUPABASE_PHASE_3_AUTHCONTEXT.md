# SUPABASE PHASE 3: Update AuthContext.tsx

## Overview
Replace Firebase Auth with Supabase Auth. This is the critical authentication layer that affects everything.

**Time Required**: 30-45 minutes
**Complexity**: Medium (replacing auth methods)
**Prerequisites**: Phase 2 schema created ✅

---

## What's Changing

### Current (Firebase):
```tsx
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

onAuthStateChanged(auth, async (firebaseUser) => {
  // Firebase auth logic
  const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
})
```

### New (Supabase):
```tsx
import { supabaseClient } from '@/lib/supabaseClient'

supabaseClient.auth.onAuthStateChange((event, session) => {
  // Supabase auth logic
  const { data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()
})
```

---

## Step 1: Create New AuthContext.tsx

Replace the entire file at: `lib/AuthContext.tsx`

```tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface UserData {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
  created_at: string
  user_type: 'customer' | 'pro' | 'employee' | 'admin'
  is_admin?: boolean
  is_employee?: boolean
  employee_id?: string
  employee_status?: 'active' | 'inactive' | 'suspended'
  approval_date?: string
  personal_use?: string
  marketing_texts?: boolean
  account_texts?: boolean
  has_multiple_roles?: boolean
  linked_employee_id?: string
  linked_customer_id?: string
  current_plan?: 'none' | 'starter' | 'professional' | 'washly'
  business_account_type?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: string
  subscription?: {
    plan: 'free' | 'pro' | 'washly'
    status: 'active' | 'paused' | 'cancelled'
    start_date: string
    renewal_date?: string
  }
  profile_picture_url?: string
}

interface AuthContextType {
  user: SupabaseUser | null
  session: Session | null
  userData: UserData | null
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const previousUserRef = useRef<string | null>(null)

  useEffect(() => {
    // Avoid duplicate listeners
    if (unsubscribeRef.current) {
      return
    }

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabaseClient.auth.getSession()
        
        if (initialSession?.user) {
          setSession(initialSession)
          setUser(initialSession.user)
          await fetchUserData(initialSession.user.id)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('[Auth] Error checking initial session:', error)
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        const currentUserIdentifier = session?.user?.email || 'logged out'
        
        if (previousUserRef.current !== currentUserIdentifier) {
          if (session?.user) {
            console.log('[Auth] State changed: authenticated as', session.user.email)
          } else {
            console.log('[Auth] State changed: logged out')
          }
          previousUserRef.current = currentUserIdentifier
        }

        if (session?.user) {
          setSession(session)
          setUser(session.user)
          await fetchUserData(session.user.id)
        } else {
          setSession(null)
          setUser(null)
          setUserData(null)
        }
        
        setLoading(false)
      }
    )

    unsubscribeRef.current = () => {
      subscription?.unsubscribe()
    }

    return () => {
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
    }
  }, [])

  const fetchUserData = async (userId: string) => {
    try {
      const { data: userRecord, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (userRecord) {
        const convertedData: UserData = {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name || '',
          phone: userRecord.phone || '',
          created_at: userRecord.created_at,
          user_type: userRecord.user_type || 'customer',
          is_admin: userRecord.is_admin || false,
          is_employee: userRecord.is_employee || false,
          profile_picture_url: userRecord.profile_picture_url,
          marketing_texts: true,
          account_texts: true,
        }
        setUserData(convertedData)
      } else {
        // User doesn't exist in public.users yet, create it
        const { user: supabaseUser } = await supabaseClient.auth.getUser()
        
        if (supabaseUser) {
          const newUserData = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || 
                  supabaseUser.email?.split('@')[0] || 'User',
            user_type: 'customer' as const,
            phone: '',
            created_at: new Date().toISOString(),
            is_admin: false,
            is_employee: false,
            marketing_texts: true,
            account_texts: true,
          }

          // Insert user record
          const { error: insertError } = await supabaseClient
            .from('users')
            .insert([newUserData])

          if (insertError && insertError.code !== '23505') {
            // 23505 = unique violation (user already exists)
            throw insertError
          }

          setUserData(newUserData as UserData)
        }
      }
    } catch (error) {
      console.error('[Auth] Error fetching user data:', error)
      // Continue even if user data fetch fails
      setUserData(null)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    userData,
    loading,
    isAuthenticated: !!session?.user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

---

## Step 2: Key Changes Explained

### 1. **Imports Changed**
```tsx
// OLD
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'

// NEW
import { supabaseClient } from '@/lib/supabaseClient'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
```

### 2. **Data Types Changed**
```tsx
// Firebase uses snake_case in code, Firestore is flexible
// Supabase uses snake_case in database

// OLD Firebase properties:
uid, userType, isAdmin, createdAt

// NEW Supabase properties:
id, user_type, is_admin, created_at
```

### 3. **Auth State Listener Changed**
```tsx
// OLD Firebase:
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) { ... }
})

// NEW Supabase:
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) { ... }
})
```

### 4. **Database Query Changed**
```tsx
// OLD Firebase:
const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
const userData = userSnap.data()

// NEW Supabase:
const { data: userRecord } = await supabaseClient
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()
```

### 5. **New User Creation Changed**
```tsx
// OLD Firebase:
await setDoc(doc(db, 'users', firebaseUser.uid), newUserData)

// NEW Supabase:
await supabaseClient
  .from('users')
  .insert([newUserData])
```

---

## Step 3: Update Usage Throughout Codebase

### In Components:

**OLD Firebase Pattern:**
```tsx
const { user, userData } = useAuth()
if (!user) return <Navigate to="/login" />
```

**NEW Supabase Pattern:**
```tsx
const { user, userData, isAuthenticated } = useAuth()
if (!isAuthenticated) return <Navigate to="/login" />
```

### In API Routes:

Will be covered in Phase 5 (API routes conversion)

---

## Step 4: Files That Reference AuthContext

Search for `useAuth()` calls and verify they still work:

```bash
grep -r "useAuth()" app/ components/ lib/ --include="*.tsx"
```

Most existing code should work without changes because we maintained the same property names where possible.

---

## Testing Phase 3

### 1. Build Check
```bash
npm run build
```
Should complete with no TypeScript errors.

### 2. Dev Server
```bash
npm run dev
```
Open browser, check console for auth debug logs.

### 3. Test Login
1. Go to http://localhost:3000/auth/login
2. Try logging in with test user
3. Check browser console for `[Auth] State changed: authenticated as...`
4. Verify user data loads

### 4. Check useAuth Hook
In any page component:
```tsx
const { user, userData, loading, isAuthenticated } = useAuth()
console.log('Auth status:', { user, userData, loading, isAuthenticated })
```

---

## Troubleshooting Phase 3

### Error: "supabaseClient is not defined"
- Make sure `lib/supabaseClient.ts` exists ✓
- Check import path is correct ✓
- Verify `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` ✓

### Error: "Cannot read property 'onAuthStateChange'"
- supabaseClient is not initialized
- Check that Supabase URL/keys are in `.env.local`

### Auth state not persisting between page reloads
- This is normal - it takes ~1 second to load from Supabase
- Add `loading` check to prevent flash of login page

### User data not loading
- Check that schema Phase 2 was successful
- Verify `public.users` table exists in Supabase
- Check RLS policies (should allow select for own user)

---

## What's NOT Changing

✅ Component usage: `useAuth()` still works
✅ Property access: Most names are the same
✅ UI/styling: Zero changes
✅ SendGrid: Still works independently
✅ Stripe: Still works independently
✅ API structure: Routes stay the same

---

## Completion Checklist

- [ ] Read full AuthContext.tsx replacement above
- [ ] Copy the new code to `lib/AuthContext.tsx`
- [ ] Run `npm run build` (should succeed)
- [ ] Check for TypeScript errors: `npm run lint`
- [ ] Start dev server: `npm run dev`
- [ ] Test login at `/auth/login`
- [ ] Verify console logs show `[Auth] State changed`
- [ ] Check user data loads correctly

---

## Next Phase

**Phase 4: Update Email Verification Routes**
- Files: 4 routes (~20 KB)
- SendGrid stays (independent REST API)
- Only database layer changes (Firestore → Supabase)

When ready for Phase 4, reply: "Phase 3 complete, ready for Phase 4"
