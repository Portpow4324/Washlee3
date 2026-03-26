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

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      const currentUserIdentifier = session?.user?.email || 'logged out'
      
      if (previousUserRef.current !== currentUserIdentifier) {
        if (session?.user?.email) {
          console.log('[Auth] State changed: authenticated as', session.user.email)
        }
        previousUserRef.current = currentUserIdentifier
      }

      try {
        if (session?.user) {
          setUser(session.user)
          console.log('[Auth] Looking up customer record for user ID:', session.user.id)

          // Wrap query in timeout to prevent hanging (increased to 10 seconds)
          const queryTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Customer query timeout - RLS or database issue')), 10000)
          )

          try {
            // Get user data from Supabase (try customers table first, then employees)
            const customerPromise = supabase
              .from('customers')
              .select('*')
              .eq('id', session.user.id)
              .limit(1)
              .single() // Use single() to get one record or error

            const { data: customerData, error: customerError } = await Promise.race([
              customerPromise,
              queryTimeout as any
            ]) as any

            if (!customerError && customerData) {
              console.log('[Auth] ✓ Found customer profile:', customerData.email)
              setUserData({
                ...customerData,
                name: `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() || 'User',
                user_type: 'customer'
              } as UserData)
              setLoading(false)
              return
            }

            console.log('[Auth] ℹ️ No customer found, trying employees table...')
            
            // If not a customer, try employees table
            const employeePromise = supabase
              .from('employees')
              .select('*')
              .eq('id', session.user.id)
              .limit(1)
              .single()

            const { data: employeeData, error: employeeError } = await Promise.race([
              employeePromise,
              queryTimeout as any
            ]) as any

            if (!employeeError && employeeData) {
              console.log('[Auth] ✓ Found employee profile:', employeeData.email)
              setUserData({
                ...employeeData,
                name: `${employeeData.first_name || employeeData.name || ''} ${employeeData.last_name || ''}`.trim() || 'Pro',
                user_type: 'pro'
              } as UserData)
              setLoading(false)
              return
            }

            // Fallback: Create minimal user profile from auth data
            console.log('[Auth] ⚠️ No profile found, creating fallback from auth data...')
            const fallbackName = session.user.user_metadata?.firstName || session.user.email?.split('@')[0] || 'User'
            setUserData({
              id: session.user.id,
              email: session.user.email,
              name: fallbackName,
              user_type: 'customer',
              created_at: new Date().toISOString()
            } as UserData)
            setLoading(false)
            return
          } catch (timeoutError: any) {
            console.error('[Auth] ❌ Query timeout or error:', timeoutError.message)
            // Still set fallback user data so app doesn't hang
            const fallbackName = session.user.user_metadata?.firstName || session.user.email?.split('@')[0] || 'User'
            setUserData({
              id: session.user.id,
              email: session.user.email,
              name: fallbackName,
              user_type: 'customer',
              created_at: new Date().toISOString()
            } as UserData)
            setLoading(false)
            return
          }
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
