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

          // Wrap query in timeout to prevent hanging
          const queryTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Customer query timeout - RLS or database issue')), 5000)
          )

          try {
            // Get user data from Supabase (try customers table first, then employees)
            const customerPromise = supabase
              .from('customers')
              .select('*')
              .eq('id', session.user.id)
              .limit(1)

            const { data: customerData, error: customerError } = await Promise.race([
              customerPromise,
              queryTimeout as any
            ]) as any

            if (customerError) {
              console.error('[Auth] ❌ Customer query error:', customerError.message)
            } else {
              console.log('[Auth] ✓ Customer query succeeded, records found:', customerData?.length || 0)
            }

            if (!customerError && customerData && customerData.length > 0) {
              const customer = customerData[0]
              console.log('[Auth] ✓ Found customer profile:', customer.email)
              setUserData({
                ...customer,
                name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'User',
                user_type: 'customer'
              } as UserData)
              setLoading(false)
              return
            }

            // If not a customer, try employees table
            console.log('[Auth] No customer found, trying employees table...')
            const employeePromise = supabase
              .from('employees')
              .select('*')
              .eq('id', session.user.id)
              .limit(1)

            const { data: employeeData, error: employeeError } = await Promise.race([
              employeePromise,
              queryTimeout as any
            ]) as any

            if (employeeError) {
              console.error('[Auth] ❌ Employee query error:', employeeError.message)
            } else {
              console.log('[Auth] ✓ Employee query succeeded, records found:', employeeData?.length || 0)
            }

            if (!employeeError && employeeData && employeeData.length > 0) {
              const employee = employeeData[0]
              console.log('[Auth] ✓ Found employee profile:', employee.email)
              setUserData({
                ...employee,
                name: `${employee.first_name || employee.name || ''} ${employee.last_name || ''}`.trim() || 'Pro',
                user_type: 'pro'
              } as UserData)
              setLoading(false)
              return
            }

            // If neither table has data, create a profile for them
            console.log('[Auth] User profile not found in customers or employees table')
            console.log('[Auth] Attempting to create profile automatically...')
            
            try {
              // Extract name from email or use default
              const nameParts = session.user.email?.split('@')[0].split('.') || ['User']
              const firstName = nameParts[0] || 'User'
              const lastName = nameParts[1] || ''
              
              // Try to create a customer profile
              const { data: newCustomer, error: createError } = await supabase
                .from('customers')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  first_name: firstName,
                  last_name: lastName,
                })
                .select()
              
              if (!createError && newCustomer && newCustomer.length > 0) {
                console.log('[Auth] ✓ Created customer profile automatically')
                setUserData({
                  ...newCustomer[0],
                  name: `${firstName} ${lastName}`.trim(),
                  user_type: 'customer'
                } as UserData)
                setLoading(false)
                return
              } else if (createError) {
                console.warn('[Auth] ⚠️ Failed to auto-create customer profile:', createError.message)
              }
            } catch (autoCreateError) {
              console.warn('[Auth] ⚠️ Error auto-creating profile:', autoCreateError)
            }
          
          // Fall back to just using auth user data
          console.log('[Auth] Using auth user data without database profile')
          const emailParts = session.user.email?.split('@')[0].split('.') || ['User']
          const fallbackFirstName = emailParts[0] || 'User'
          const fallbackLastName = emailParts[1] || ''
          setUserData({
            id: session.user.id,
            email: session.user.email || '',
            first_name: fallbackFirstName,
            last_name: fallbackLastName,
            name: `${fallbackFirstName} ${fallbackLastName}`.trim(),
            user_type: 'customer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserData)
          setLoading(false)
          } catch (timeoutError) {
            console.error('[Auth] ❌ Timeout while querying customer/employee data:', timeoutError)
            // Fall back to auth user data
            const emailParts = session.user.email?.split('@')[0].split('.') || ['User']
            const fallbackFirstName = emailParts[0] || 'User'
            const fallbackLastName = emailParts[1] || ''
            setUserData({
              id: session.user.id,
              email: session.user.email || '',
              first_name: fallbackFirstName,
              last_name: fallbackLastName,
              name: `${fallbackFirstName} ${fallbackLastName}`.trim(),
              user_type: 'customer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as UserData)
            setLoading(false)
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
