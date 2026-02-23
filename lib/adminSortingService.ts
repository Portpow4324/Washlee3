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
