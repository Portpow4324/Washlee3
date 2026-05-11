'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_ACCESS_KEY = 'ownerAccess'
const ADMIN_LOGIN_TIME_KEY = 'adminLoginTime'
const ADMIN_ACCESS_TTL_MS = 12 * 60 * 60 * 1000

function safeGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    // Some browsers block storage in private or restricted modes.
  }
}

function safeRemove(storage: Storage, key: string) {
  try {
    storage.removeItem(key)
  } catch {
    // Some browsers block storage in private or restricted modes.
  }
}

function accessFrom(storage: Storage) {
  const granted = safeGet(storage, ADMIN_ACCESS_KEY) === 'true'
  if (!granted) return false

  const loginTime = safeGet(storage, ADMIN_LOGIN_TIME_KEY)
  if (!loginTime) return true

  const createdAt = new Date(loginTime).getTime()
  if (Number.isNaN(createdAt)) return false

  return Date.now() - createdAt < ADMIN_ACCESS_TTL_MS
}

export function grantAdminAccess() {
  if (typeof window === 'undefined') return

  const now = new Date().toISOString()
  safeSet(window.sessionStorage, ADMIN_ACCESS_KEY, 'true')
  safeSet(window.sessionStorage, ADMIN_LOGIN_TIME_KEY, now)
  safeSet(window.localStorage, ADMIN_ACCESS_KEY, 'true')
  safeSet(window.localStorage, ADMIN_LOGIN_TIME_KEY, now)
}

export function clearAdminAccess() {
  if (typeof window === 'undefined') return

  safeRemove(window.sessionStorage, ADMIN_ACCESS_KEY)
  safeRemove(window.sessionStorage, ADMIN_LOGIN_TIME_KEY)
  safeRemove(window.localStorage, ADMIN_ACCESS_KEY)
  safeRemove(window.localStorage, ADMIN_LOGIN_TIME_KEY)
}

export function hasAdminAccess() {
  if (typeof window === 'undefined') return false

  const hasAccess = accessFrom(window.sessionStorage) || accessFrom(window.localStorage)
  if (!hasAccess) {
    clearAdminAccess()
    return false
  }

  return true
}

export async function confirmAdminAccess() {
  try {
    const response = await fetch('/api/admin/session', { cache: 'no-store' })
    if (!response.ok) {
      clearAdminAccess()
      return false
    }

    const data = await response.json()
    if (data.authenticated) {
      grantAdminAccess()
      return true
    }
  } catch {
    // Keep the caller on the login path if the server session cannot be confirmed.
  }

  clearAdminAccess()
  return false
}

/**
 * Legacy helper name used by older admin pages.
 */
export function useAdminAccess() {
  return hasAdminAccess()
}

export function useRequireAdminAccess(redirectTo = '/admin/login') {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    confirmAdminAccess().then((ownerAccess) => {
      if (cancelled) return

      setHasAccess(ownerAccess)
      setChecking(false)

      if (!ownerAccess) {
        router.push(redirectTo)
      }
    })

    return () => {
      cancelled = true
    }
  }, [redirectTo, router])

  return {
    hasAdminAccess: hasAccess,
    checkingAdminAccess: checking,
  }
}
