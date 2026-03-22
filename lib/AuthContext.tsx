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

          // Get user data from Supabase (try customers table first, then employees)
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', session.user.id)
            .limit(1)

          if (customerError) {
            console.error('[Auth] Customer query error:', customerError.message)
          } else {
            console.log('[Auth] Customer query result:', customerData)
          }

          if (!customerError && customerData && customerData.length > 0) {
            const customer = customerData[0]
            console.log('[Auth] Found customer profile:', customer.email)
            setUserData({
              ...customer,
              name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'User',
              user_type: 'customer'
            } as UserData)
            setLoading(false)
            return
          }

          // If not a customer, try employees table
          console.log('[Auth] Not a customer, trying employees table...')
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('*')
            .eq('id', session.user.id)
            .limit(1)

          if (employeeError) {
            console.error('[Auth] Employee query error:', employeeError.message)
          } else {
            console.log('[Auth] Employee query result:', employeeData)
          }

          if (!employeeError && employeeData && employeeData.length > 0) {
            const employee = employeeData[0]
            console.log('[Auth] Found employee profile:', employee.email)
            setUserData({
              ...employee,
              name: `${employee.first_name || employee.name || ''} ${employee.last_name || ''}`.trim() || 'Pro',
              user_type: 'pro'
            } as UserData)
            setLoading(false)
            return
          }

          // If neither table has data, just continue with auth user
          console.log('[Auth] User profile not found in customers or employees table - continuing with auth user')
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
