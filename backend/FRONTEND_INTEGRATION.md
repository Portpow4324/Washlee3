# Frontend Integration Examples

Code snippets for integrating Washlee backend with your Next.js frontend.

---

## 1. Payment Service

Create `lib/paymentService.ts`:

```typescript
import { getAuth } from 'firebase/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(plan: string, priceId: string) {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get Firebase ID token
  const token = await user.getIdToken()

  const response = await fetch(`${API_URL}/payments/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan, priceId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create checkout session')
  }

  const data = await response.json()
  return data // { url, sessionId }
}

/**
 * Redirect to Stripe checkout
 */
export async function redirectToCheckout(plan: string, priceId: string) {
  try {
    const { url } = await createCheckoutSession(plan, priceId)
    window.location.href = url
  } catch (error) {
    console.error('Checkout error:', error)
    throw error
  }
}
```

---

## 2. Admin Service

Create `lib/adminService.ts`:

```typescript
import { getAuth } from 'firebase/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface AdminServiceOptions {
  throwOnError?: boolean
}

/**
 * Helper: Get auth header
 */
async function getAuthHeader() {
  const auth = getAuth()
  const token = await auth.currentUser?.getIdToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Fetch admin data (generic)
 */
export async function fetchAdminData(
  endpoint: string,
  options: AdminServiceOptions = {}
) {
  try {
    const headers = await getAuthHeader()

    const response = await fetch(`${API_URL}/admin${endpoint}`, {
      headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to fetch ${endpoint}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Admin fetch error [${endpoint}]:`, error)
    if (options.throwOnError) throw error
    return null
  }
}

/**
 * Get pending payment users
 */
export async function getPendingPaymentUsers() {
  return fetchAdminData('/users/pending-payments')
}

/**
 * Get active subscription users
 */
export async function getActiveSubscriptionUsers() {
  return fetchAdminData('/users/subscriptions')
}

/**
 * Get wash club members
 */
export async function getWashClubUsers() {
  return fetchAdminData('/users/wash-club')
}

/**
 * Get employees
 */
export async function getEmployeeUsers() {
  return fetchAdminData('/users/employees')
}

/**
 * Get customers only
 */
export async function getCustomerOnlyUsers() {
  return fetchAdminData('/users/customers-only')
}

/**
 * Confirm payment (admin override)
 */
export async function confirmPayment(uid: string) {
  try {
    const headers = await getAuthHeader()

    const response = await fetch(
      `${API_URL}/admin/users/${uid}/confirm-payment`,
      {
        method: 'POST',
        headers,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to confirm payment')
    }

    return await response.json()
  } catch (error) {
    console.error('Confirm payment error:', error)
    throw error
  }
}

/**
 * Reject payment
 */
export async function rejectPayment(uid: string) {
  try {
    const headers = await getAuthHeader()

    const response = await fetch(
      `${API_URL}/admin/users/${uid}/reject-payment`,
      {
        method: 'POST',
        headers,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to reject payment')
    }

    return await response.json()
  } catch (error) {
    console.error('Reject payment error:', error)
    throw error
  }
}
```

---

## 3. Subscription Button Component

Create `components/SubscribeButton.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { redirectToCheckout } from '@/lib/paymentService'
import { Button } from '@/components/ui/button'

interface SubscribeButtonProps {
  plan: 'wash_club' | 'subscription'
  priceId: string
  children?: React.ReactNode
}

export function SubscribeButton({
  plan,
  priceId,
  children = 'Subscribe',
}: SubscribeButtonProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/auth/login'
      return
    }

    setLoading(true)
    setError(null)

    try {
      await redirectToCheckout(plan, priceId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handleClick} disabled={loading} className="w-full">
        {loading ? 'Loading...' : children}
      </Button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </>
  )
}
```

---

## 4. Advanced Admin Sorting Service

Create `lib/adminSortingService.ts` for the `/secret-admin` page:

```typescript
import { getAuth } from 'firebase/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface SortedUser {
  uid: string
  email: string
  createdAt: string
  subscription?: {
    active: boolean
    plan: string
    paymentStatus: string
  }
  isEmployee?: boolean
  loyaltyMember?: boolean
  adminApproval?: {
    status: string
    confirmedBy?: string
    confirmedAt?: string
  }
}

interface SortingResponse {
  count: number
  users: SortedUser[]
  lastUpdated: string
}

/**
 * Get authentication header for admin requests
 */
async function getAuthHeader() {
  const auth = getAuth()
  const token = await auth.currentUser?.getIdToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Get users pending payment approval
 * Returns users with subscription.paymentStatus === 'pending'
 */
export async function getPendingPaymentUsers(): Promise<SortingResponse> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_URL}/admin/users/pending-payments`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to fetch pending payment users')
  }

  return response.json()
}

/**
 * Get users with active subscriptions
 * Returns users with subscription.active === true
 */
export async function getActiveSubscriptionUsers(): Promise<SortingResponse> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_URL}/admin/users/subscriptions`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to fetch active subscription users')
  }

  return response.json()
}

/**
 * Get wash club members
 * Returns users with loyaltyMember === true AND subscription.plan === 'wash_club'
 */
export async function getWashClubUsers(): Promise<SortingResponse> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_URL}/admin/users/wash-club`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to fetch wash club users')
  }

  return response.json()
}

/**
 * Get employees
 * Returns users with isEmployee === true
 */
export async function getEmployeeUsers(): Promise<SortingResponse> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_URL}/admin/users/employees`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to fetch employee users')
  }

  return response.json()
}

/**
 * Get customer-only users (non-employees)
 * Returns users with isEmployee === false OR not set
 */
export async function getCustomerOnlyUsers(): Promise<SortingResponse> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_URL}/admin/users/customers-only`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to fetch customer-only users')
  }

  return response.json()
}

/**
 * Confirm pending payment (admin override)
 * Updates user's subscription.paymentStatus to 'confirmed'
 */
export async function confirmPayment(uid: string) {
  const headers = await getAuthHeader()
  const response = await fetch(
    `${API_URL}/admin/users/${uid}/confirm-payment`,
    {
      method: 'POST',
      headers,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to confirm payment')
  }

  return response.json()
}

/**
 * Reject pending payment
 * Updates user's subscription.paymentStatus to 'rejected'
 */
export async function rejectPayment(uid: string) {
  const headers = await getAuthHeader()
  const response = await fetch(
    `${API_URL}/admin/users/${uid}/reject-payment`,
    {
      method: 'POST',
      headers,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to reject payment')
  }

  return response.json()
}
```

---

## 5. Admin Dashboard Component

Create `components/AdminDashboard.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import {
  getPendingPaymentUsers,
  getActiveSubscriptionUsers,
  getWashClubUsers,
  confirmPayment,
  rejectPayment,
} from '@/lib/adminService'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface User {
  uid: string
  email: string
  subscription: {
    paymentStatus: string
    plan: string
  }
}

export function AdminDashboard() {
  const { userData } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userData?.isAdmin) return

    loadData()
  }, [userData])

  async function loadData() {
    try {
      const [pending, active] = await Promise.all([
        getPendingPaymentUsers(),
        getActiveSubscriptionUsers(),
      ])

      setPendingUsers(pending?.users || [])
      setActiveUsers(active?.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(uid: string) {
    try {
      await confirmPayment(uid)
      // Remove from pending list
      setPendingUsers(pendingUsers.filter(u => u.uid !== uid))
      // Reload data
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm')
    }
  }

  async function handleReject(uid: string) {
    try {
      await rejectPayment(uid)
      setPendingUsers(pendingUsers.filter(u => u.uid !== uid))
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    }
  }

  if (!userData?.isAdmin) {
    return <div>Access denied - admin only</div>
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-900 p-4 rounded">
          {error}
        </div>
      )}

      {/* Pending Payments */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          Pending Payments ({pendingUsers.length})
        </h2>

        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user.uid}
              className="flex justify-between items-center p-4 bg-gray-50 rounded"
            >
              <div>
                <p className="font-semibold">{user.email}</p>
                <p className="text-sm text-gray-600">
                  Plan: {user.subscription.plan}
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  onClick={() => handleConfirm(user.uid)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => handleReject(user.uid)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Subscriptions */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          Active Subscriptions ({activeUsers.length})
        </h2>

        <div className="space-y-2">
          {activeUsers.map((user) => (
            <div key={user.uid} className="flex justify-between p-4 bg-gray-50 rounded">
              <p className="font-semibold">{user.email}</p>
              <p className="text-sm text-green-600">
                {user.subscription.plan}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
```

---

## 6. Secret Admin Dashboard Page Component

Create `components/SecretAdminDashboard.tsx` for the `/secret-admin` page with all sorting features:

```typescript
'use client'

import { useState, useEffect } from 'react'
import {
  getPendingPaymentUsers,
  getActiveSubscriptionUsers,
  getWashClubUsers,
  getEmployeeUsers,
  getCustomerOnlyUsers,
  confirmPayment,
  rejectPayment,
} from '@/lib/adminSortingService'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface User {
  uid: string
  email: string
  createdAt: string
  subscription?: {
    active: boolean
    plan: string
    paymentStatus: string
  }
  isEmployee?: boolean
  loyaltyMember?: boolean
}

type SortingView = 
  | 'pending-payments' 
  | 'subscriptions' 
  | 'wash-club' 
  | 'employees' 
  | 'customers-only'

interface SortingData {
  view: SortingView
  count: number
  users: User[]
  loading: boolean
  error: string | null
}

export function SecretAdminDashboard() {
  const [activeView, setActiveView] = useState<SortingView>('pending-payments')
  const [data, setData] = useState<Record<SortingView, SortingData>>({
    'pending-payments': { view: 'pending-payments', count: 0, users: [], loading: false, error: null },
    'subscriptions': { view: 'subscriptions', count: 0, users: [], loading: false, error: null },
    'wash-club': { view: 'wash-club', count: 0, users: [], loading: false, error: null },
    'employees': { view: 'employees', count: 0, users: [], loading: false, error: null },
    'customers-only': { view: 'customers-only', count: 0, users: [], loading: false, error: null },
  })

  const currentData = data[activeView]

  // Load data when view changes
  useEffect(() => {
    loadData(activeView)
  }, [activeView])

  async function loadData(view: SortingView) {
    setData(prev => ({
      ...prev,
      [view]: { ...prev[view], loading: true, error: null }
    }))

    try {
      let response
      switch (view) {
        case 'pending-payments':
          response = await getPendingPaymentUsers()
          break
        case 'subscriptions':
          response = await getActiveSubscriptionUsers()
          break
        case 'wash-club':
          response = await getWashClubUsers()
          break
        case 'employees':
          response = await getEmployeeUsers()
          break
        case 'customers-only':
          response = await getCustomerOnlyUsers()
          break
      }

      setData(prev => ({
        ...prev,
        [view]: {
          ...prev[view],
          users: response?.users || [],
          count: response?.count || 0,
          loading: false
        }
      }))
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to load data'
      setData(prev => ({
        ...prev,
        [view]: { ...prev[view], error, loading: false }
      }))
    }
  }

  async function handleConfirm(uid: string) {
    try {
      await confirmPayment(uid)
      // Reload current view
      loadData(activeView)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to confirm'
      setData(prev => ({
        ...prev,
        [activeView]: { ...prev[activeView], error }
      }))
    }
  }

  async function handleReject(uid: string) {
    try {
      await rejectPayment(uid)
      // Reload current view
      loadData(activeView)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to reject'
      setData(prev => ({
        ...prev,
        [activeView]: { ...prev[activeView], error }
      }))
    }
  }

  const sortingViews = [
    { key: 'pending-payments', label: '⏳ Pending Payments' },
    { key: 'subscriptions', label: '✓ Active Subscriptions' },
    { key: 'wash-club', label: '🧺 Wash Club Members' },
    { key: 'employees', label: '👔 Employees' },
    { key: 'customers-only', label: '👥 Customers Only' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">User sorting and management</p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
          {sortingViews.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as SortingView)}
              className={`p-3 rounded-lg font-semibold transition ${
                activeView === key
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card className="p-8">
          {/* Error State */}
          {currentData.error && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-lg mb-6">
              <p className="font-semibold">Error: {currentData.error}</p>
            </div>
          )}

          {/* Loading State */}
          {currentData.loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          )}

          {/* Empty State */}
          {!currentData.loading && currentData.users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          )}

          {/* Users List */}
          {!currentData.loading && currentData.users.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Users ({currentData.count})
                </h2>
              </div>

              <div className="space-y-4">
                {currentData.users.map((user) => (
                  <div
                    key={user.uid}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.email}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>ID: {user.uid.slice(0, 8)}...</span>
                        {user.subscription && (
                          <>
                            <span>Plan: {user.subscription.plan}</span>
                            <span className={`font-semibold ${
                              user.subscription.paymentStatus === 'confirmed'
                                ? 'text-green-600'
                                : user.subscription.paymentStatus === 'rejected'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}>
                              {user.subscription.paymentStatus}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions for Pending Payments View */}
                    {activeView === 'pending-payments' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleConfirm(user.uid)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                        >
                          ✓ Confirm
                        </Button>
                        <Button
                          onClick={() => handleReject(user.uid)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
                        >
                          ✕ Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
```

---

## 7. Using the Dashboard Page

Update `app/secret-admin/page.tsx`:

```typescript
'use client'

import { SecretAdminDashboard } from '@/components/SecretAdminDashboard'
import { useAdminStatus } from '@/lib/useAdminStatus'

export default function SecretAdminPage() {
  const { isAdmin, loading } = useAdminStatus()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have admin privileges</p>
        </div>
      </div>
    )
  }

  return <SecretAdminDashboard />
}
```

---

## 5. Environment Setup

Add to `frontend/.env.local`:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For production:
```env
NEXT_PUBLIC_API_URL=https://api.washlee.com
```

---

## 8. Firebase Custom Claims Hook

Create `lib/useAdminStatus.ts`:

```typescript
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'

export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdTokenResult(true)
          setIsAdmin(token.claims.admin === true)
        } catch (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { isAdmin, loading }
}
```

---

## 9. Real-Time Subscription Listener

Create `lib/useSubscription.ts`:

```typescript
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setSubscription(null)
        setLoading(false)
        return
      }

      // Listen to user doc for subscription changes
      const userRef = doc(db, 'users', user.uid)
      const unsubscribeDoc = onSnapshot(
        userRef,
        (doc) => {
          if (doc.exists()) {
            setSubscription(doc.data().subscription)
          }
          setLoading(false)
        },
        (error) => {
          console.error('Subscription listener error:', error)
          setLoading(false)
        }
      )

      return () => unsubscribeDoc()
    })

    return () => unsubscribe()
  }, [])

  return {
    subscription,
    isActive: subscription?.active || false,
    plan: subscription?.plan,
    loading,
  }
}
```

---

## 10. Error Boundary

Create `components/ApiErrorBoundary.tsx`:

```typescript
'use client'

import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ApiErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('API Error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded">
          <h2 className="font-bold mb-2">Something went wrong</h2>
          <p className="text-sm">{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## 11. Real-Time Data Syncing Hook

Create `lib/useAdminDataSync.ts` for polling the admin endpoints:

```typescript
import { useEffect, useState, useCallback } from 'react'
import {
  getPendingPaymentUsers,
  getActiveSubscriptionUsers,
  getWashClubUsers,
  getEmployeeUsers,
  getCustomerOnlyUsers,
} from '@/lib/adminSortingService'

interface SyncData {
  pendingPayments: any[]
  activeSubscriptions: any[]
  washClub: any[]
  employees: any[]
  customersOnly: any[]
  lastUpdated: Date | null
  loading: boolean
  error: string | null
}

interface UseAdminDataSyncOptions {
  pollInterval?: number // milliseconds
  enabled?: boolean
}

/**
 * Hook for real-time admin data syncing
 * Automatically polls backend for user data changes
 */
export function useAdminDataSync({
  pollInterval = 5000, // 5 seconds by default
  enabled = true,
}: UseAdminDataSyncOptions = {}) {
  const [data, setData] = useState<SyncData>({
    pendingPayments: [],
    activeSubscriptions: [],
    washClub: [],
    employees: [],
    customersOnly: [],
    lastUpdated: null,
    loading: true,
    error: null,
  })

  const syncData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, error: null }))

      const [pending, subscriptions, washClub, employees, customersOnly] = await Promise.all([
        getPendingPaymentUsers(),
        getActiveSubscriptionUsers(),
        getWashClubUsers(),
        getEmployeeUsers(),
        getCustomerOnlyUsers(),
      ])

      setData({
        pendingPayments: pending?.users || [],
        activeSubscriptions: subscriptions?.users || [],
        washClub: washClub?.users || [],
        employees: employees?.users || [],
        customersOnly: customersOnly?.users || [],
        lastUpdated: new Date(),
        loading: false,
        error: null,
      })
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to sync data'
      setData(prev => ({
        ...prev,
        error,
        loading: false,
      }))
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Initial sync
    syncData()

    // Polling interval
    const interval = setInterval(syncData, pollInterval)

    return () => clearInterval(interval)
  }, [syncData, enabled, pollInterval])

  return {
    ...data,
    refetch: syncData,
  }
}
```

---

## 12. Admin Data Summary Component

Create `components/AdminDataSummary.tsx` for a quick overview of all user categories:

```typescript
'use client'

import { useAdminDataSync } from '@/lib/useAdminDataSync'
import { Card } from '@/components/ui/card'

export function AdminDataSummary() {
  const {
    pendingPayments,
    activeSubscriptions,
    washClub,
    employees,
    customersOnly,
    lastUpdated,
    loading,
    error,
    refetch,
  } = useAdminDataSync({ pollInterval: 10000 })

  const stats = [
    {
      label: 'Pending Payments',
      count: pendingPayments.length,
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⏳',
    },
    {
      label: 'Active Subscriptions',
      count: activeSubscriptions.length,
      color: 'bg-green-100 text-green-800',
      icon: '✓',
    },
    {
      label: 'Wash Club Members',
      count: washClub.length,
      color: 'bg-blue-100 text-blue-800',
      icon: '🧺',
    },
    {
      label: 'Employees',
      count: employees.length,
      color: 'bg-purple-100 text-purple-800',
      icon: '👔',
    },
    {
      label: 'Customers Only',
      count: customersOnly.length,
      color: 'bg-gray-100 text-gray-800',
      icon: '👥',
    },
  ]

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">User Summary</h2>
        <button
          onClick={refetch}
          disabled={loading}
          className="px-4 py-2 bg-teal-600 text-white rounded font-semibold hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-900 p-3 rounded mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-lg text-center ${stat.color}`}
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.count}</div>
            <div className="text-sm font-semibold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-500 mt-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </Card>
  )
}
```

---

## 13. Subscription Button Component

Create `components/SubscribeButton.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { redirectToCheckout } from '@/lib/paymentService'
import { Button } from '@/components/ui/button'

interface SubscribeButtonProps {
  plan: 'wash_club' | 'subscription'
  priceId: string
  children?: React.ReactNode
}

export function SubscribeButton({
  plan,
  priceId,
  children = 'Subscribe',
}: SubscribeButtonProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/auth/login'
      return
    }

    setLoading(true)
    setError(null)

    try {
      await redirectToCheckout(plan, priceId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handleClick} disabled={loading} className="w-full">
        {loading ? 'Loading...' : children}
      </Button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </>
  )
}
```

---

## Usage Examples

### 1. Secret Admin Page with Full Dashboard

```typescript
// app/secret-admin/page.tsx
'use client'

import { SecretAdminDashboard } from '@/components/SecretAdminDashboard'
import { AdminDataSummary } from '@/components/AdminDataSummary'
import { useAdminStatus } from '@/lib/useAdminStatus'
import { ApiErrorBoundary } from '@/components/ApiErrorBoundary'

export default function SecretAdminPage() {
  const { isAdmin, loading } = useAdminStatus()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Access Denied</div>
  }

  return (
    <ApiErrorBoundary>
      <AdminDataSummary />
      <SecretAdminDashboard />
    </ApiErrorBoundary>
  )
}
```

### 2. Subscribe Button in Pricing Page

```typescript
import { SubscribeButton } from '@/components/SubscribeButton'

export function PricingCard() {
  return (
    <div>
      <h3>Wash Club</h3>
      <p>$29/month</p>
      <SubscribeButton
        plan="wash_club"
        priceId="price_1234567890abcdef"
      >
        Subscribe Now
      </SubscribeButton>
    </div>
  )
}
```

### 3. Admin Dashboard in Admin Panel

```typescript
import { AdminDashboard } from '@/components/AdminDashboard'
import { ApiErrorBoundary } from '@/components/ApiErrorBoundary'

export default function AdminPage() {
  return (
    <ApiErrorBoundary>
      <AdminDashboard />
    </ApiErrorBoundary>
  )
}
```

### 4. Real-Time User Stats Widget

```typescript
import { useAdminDataSync } from '@/lib/useAdminDataSync'

export function UserStatsWidget() {
  const { pendingPayments, activeSubscriptions, loading } = useAdminDataSync({
    pollInterval: 5000
  })

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-yellow-50 rounded">
        <p className="text-gray-600">Pending</p>
        <p className="text-3xl font-bold">{pendingPayments.length}</p>
      </div>
      <div className="p-4 bg-green-50 rounded">
        <p className="text-gray-600">Active</p>
        <p className="text-3xl font-bold">{activeSubscriptions.length}</p>
      </div>
    </div>
  )
}
```

### 5. Listen to Subscription Changes

```typescript
import { useSubscription } from '@/lib/useSubscription'

export function SubscriptionStatus() {
  const { subscription, isActive, plan, loading } = useSubscription()

  if (loading) return <div>Loading...</div>

  if (!isActive) {
    return <div>No active subscription</div>
  }

  return <div>Active: {plan}</div>
}
```

---

## Admin API Integration Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│         Frontend: /secret-admin Page                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. useAdminStatus() - Check if user is admin              │
│        ↓                                                     │
│  2. SecretAdminDashboard loads and shows 5 sorting views   │
│        ↓                                                     │
│  3. User selects a view (e.g., "Pending Payments")         │
│        ↓                                                     │
│  4. Calls getPendingPaymentUsers()                         │
│        ↓                                                     │
└─────────────────────────────────────────────────────────────┘
        ↓ HTTP GET /admin/users/pending-payments ↓
┌─────────────────────────────────────────────────────────────┐
│          Backend: Express API Server                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Verify Firebase token in auth middleware               │
│  2. Check admin claim in authorization middleware          │
│  3. Query Firestore for pending payment users              │
│  4. Return sorted list of users                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
        ↓ JSON Response { users: [...], count: N } ↓
┌─────────────────────────────────────────────────────────────┐
│      Frontend: Display Results                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SecretAdminDashboard renders user list with:              │
│  - Email address                                            │
│  - User ID                                                  │
│  - Subscription plan                                        │
│  - Payment status                                           │
│  - Action buttons (Confirm/Reject) for pending view        │
│                                                              │
│  When admin clicks "Confirm":                              │
│        ↓                                                     │
│  5. Calls confirmPayment(uid)                              │
│        ↓                                                     │
└─────────────────────────────────────────────────────────────┘
        ↓ HTTP POST /admin/users/{uid}/confirm-payment ↓
┌─────────────────────────────────────────────────────────────┐
│          Backend: Update User Status                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Verify token and admin privileges                      │
│  2. Update user doc: subscription.paymentStatus = 'confirmed'
│  3. Log action with admin UID                              │
│  4. Return success response                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
        ↓ { success: true, user: {...} } ↓
┌─────────────────────────────────────────────────────────────┐
│      Frontend: Update UI                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  - Remove user from pending list                            │
│  - Refresh data from backend                               │
│  - Show success message                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Endpoints Reference

All endpoints require Firebase ID token in `Authorization: Bearer <token>` header.

### Sorting Endpoints (GET)
- `GET /admin/users/pending-payments` - Pending payment confirmations
- `GET /admin/users/subscriptions` - Active subscription users  
- `GET /admin/users/wash-club` - Wash club members
- `GET /admin/users/employees` - Employee accounts
- `GET /admin/users/customers-only` - Customer-only accounts

### Admin Action Endpoints (POST)
- `POST /admin/users/{uid}/confirm-payment` - Approve pending payment
- `POST /admin/users/{uid}/reject-payment` - Reject pending payment

All sorting endpoints return:
```json
{
  "count": 5,
  "users": [
    {
      "uid": "user123",
      "email": "user@example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "subscription": {
        "active": true,
        "plan": "wash_club",
        "paymentStatus": "pending"
      },
      "isEmployee": false,
      "loyaltyMember": true
    }
  ],
  "lastUpdated": "2024-01-20T15:45:30Z"
}
```

---

## API URL Configuration

For different environments, use:

```typescript
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.API_URL || 'http://localhost:3001'
  }

  // Client-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
}

const API_URL = getApiUrl()
```

---

**Ready to integrate!** Copy these files into your frontend and start accepting payments.
