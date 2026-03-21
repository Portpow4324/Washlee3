'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'

interface AdminSessionContextType {
  isAdminSession: boolean
  currentAdminEmail: string | null
  switchToAdminSession: (email: string) => void
  clearAdminSession: () => void
  verifyAdminAccess: () => boolean
}

const AdminSessionContext = createContext<AdminSessionContextType | undefined>(undefined)

const ADMIN_SESSION_KEY = 'admin_session_email'
const ADMIN_SESSION_TIMESTAMP = 'admin_session_timestamp'

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth()
  const [isAdminSession, setIsAdminSession] = useState(false)
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null)

  // Initialize admin session on mount
  useEffect(() => {
    if (user && userData?.is_admin && user.email) {
      const storedEmail = sessionStorage.getItem(ADMIN_SESSION_KEY)
      
      // If no admin session yet, or user switched accounts, set new admin session
      if (!storedEmail || storedEmail !== user.email) {
        console.log('[AdminSession] Setting new admin session for:', user.email)
        sessionStorage.setItem(ADMIN_SESSION_KEY, user.email)
        sessionStorage.setItem(ADMIN_SESSION_TIMESTAMP, Date.now().toString())
        setIsAdminSession(true)
        setCurrentAdminEmail(user.email)
      } else if (storedEmail === user.email) {
        // Verify session is still valid (within 24 hours)
        const timestamp = sessionStorage.getItem(ADMIN_SESSION_TIMESTAMP)
        const isValid = timestamp && (Date.now() - parseInt(timestamp)) < 24 * 60 * 60 * 1000
        
        if (isValid) {
          console.log('[AdminSession] Valid admin session found for:', user.email)
          setIsAdminSession(true)
          setCurrentAdminEmail(user.email)
        } else {
          // Session expired
          console.log('[AdminSession] Admin session expired, clearing...')
          clearAdminSession()
        }
      }
    } else if (user && !userData?.is_admin) {
      // User is logged in but NOT an admin - clear any admin session
      const storedEmail = sessionStorage.getItem(ADMIN_SESSION_KEY)
      if (storedEmail && user.email && storedEmail !== user.email) {
        console.warn('[AdminSession] User is not admin but admin session exists. Clearing.')
        clearAdminSession()
      }
    }
  }, [user, userData])

  const switchToAdminSession = (email: string) => {
    console.log('[AdminSession] Switching to admin session:', email)
    sessionStorage.setItem(ADMIN_SESSION_KEY, email)
    sessionStorage.setItem(ADMIN_SESSION_TIMESTAMP, Date.now().toString())
    setIsAdminSession(true)
    setCurrentAdminEmail(email)
  }

  const clearAdminSession = () => {
    console.log('[AdminSession] Clearing admin session')
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    sessionStorage.removeItem(ADMIN_SESSION_TIMESTAMP)
    setIsAdminSession(false)
    setCurrentAdminEmail(null)
  }

  const verifyAdminAccess = (): boolean => {
    // Check if current user is admin AND has valid admin session
    if (!user || !userData?.is_admin) {
      console.log('[AdminSession] Access denied: User is not admin')
      return false
    }

    const storedEmail = sessionStorage.getItem(ADMIN_SESSION_KEY)
    if (!storedEmail || storedEmail !== user.email) {
      console.warn('[AdminSession] Access denied: Admin session mismatch')
      return false
    }

    const timestamp = sessionStorage.getItem(ADMIN_SESSION_TIMESTAMP)
    const isValid = timestamp && (Date.now() - parseInt(timestamp)) < 24 * 60 * 60 * 1000
    
    if (!isValid) {
      console.warn('[AdminSession] Access denied: Admin session expired')
      clearAdminSession()
      return false
    }

    return true
  }

  return (
    <AdminSessionContext.Provider
      value={{
        isAdminSession,
        currentAdminEmail,
        switchToAdminSession,
        clearAdminSession,
        verifyAdminAccess
      }}
    >
      {children}
    </AdminSessionContext.Provider>
  )
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext)
  if (context === undefined) {
    throw new Error('useAdminSession must be used within AdminSessionProvider')
  }
  return context
}
