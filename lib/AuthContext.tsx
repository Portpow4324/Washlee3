'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface UserData {
  id: string
  email: string
  name?: string
  first_name?: string
  last_name?: string
  phone?: string
  address?: string
  subscription?: {
    plan?: string
  }
  user_type: 'customer' | 'pro' | 'admin'
  is_admin?: boolean
  is_employee?: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  isAuthenticated: boolean
  signup: (email: string, password: string, name: string, phone: string, userType: 'customer' | 'pro') => Promise<{ success: boolean; error?: string }>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const previousUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (unsubscribeRef.current) {
      return
    }

    // First, check if there's an existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[Auth] Initial session check:', { hasSession: !!session, email: session?.user?.email })
        
        if (session?.user) {
          setUser(session.user)
          const metadata = session.user.user_metadata || {}
          const firstName = metadata.first_name || ''
          const lastName = metadata.last_name || ''
          const displayName = `${firstName} ${lastName}`.trim() || session.user.email?.split('@')[0] || 'User'
          
          setUserData({
            id: session.user.id,
            email: session.user.email || metadata.email || '',
            first_name: firstName,
            last_name: lastName,
            name: displayName,
            phone: metadata.phone || '',
            address: metadata.address || '',
            user_type: metadata.user_type || 'customer',
            is_admin: metadata.is_admin === true,
            is_employee: metadata.is_employee === true,
            created_at: metadata.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            subscription: metadata.subscription || undefined
          } as UserData)
        }
      } catch (error) {
        console.error('[Auth] Error checking initial session:', error)
      }
    }

    checkSession()

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      const currentUserIdentifier = session?.user?.email || 'logged out'
      
      if (previousUserRef.current !== currentUserIdentifier) {
        if (session?.user?.email) {
          console.log('[Auth] State changed: authenticated as', session.user.email)
        } else {
          console.log('[Auth] State changed: logged out')
        }
        previousUserRef.current = currentUserIdentifier
      }

      try {
        if (session?.user) {
          setUser(session.user)
          console.log('[Auth] User authenticated:', session.user.email)

          // Get all user data from auth user_metadata (set during signup)
          const metadata = session.user.user_metadata || {}
          const firstName = metadata.first_name || ''
          const lastName = metadata.last_name || ''
          const displayName = `${firstName} ${lastName}`.trim() || session.user.email?.split('@')[0] || 'User'
          
          console.log('[Auth] ✓ Display name:', displayName)
          console.log('[Auth] Metadata keys:', Object.keys(metadata))
          
          setUserData({
            id: session.user.id,
            email: session.user.email || metadata.email || '',
            first_name: firstName,
            last_name: lastName,
            name: displayName,
            phone: metadata.phone || '',
            address: metadata.address || '',
            user_type: metadata.user_type || 'customer',
            is_admin: metadata.is_admin === true,
            is_employee: metadata.is_employee === true,
            created_at: metadata.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            subscription: metadata.subscription || undefined
          } as UserData)
          setLoading(false)
        } else {
          // User logged out
          setUser(null)
          setUserData(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('[Auth] Error in auth state change:', error)
        setLoading(false)
      }
    })

    unsubscribeRef.current = () => {
      subscription?.unsubscribe()
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    userType: 'customer' | 'pro'
  ) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone, userType }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const value: AuthContextType = {
    user,
    userData,
    loading,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
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
