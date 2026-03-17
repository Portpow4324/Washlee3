'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

interface UserData {
  uid: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
  createdAt: string
  userType: 'customer' | 'pro' | 'employee'
  isAdmin?: boolean
  isEmployee?: boolean
  employeeId?: string
  employeeStatus?: 'active' | 'inactive' | 'suspended'
  approvalDate?: string
  personalUse?: string
  marketingTexts?: boolean
  accountTexts?: boolean
  hasMultipleRoles?: boolean
  linkedEmployeeId?: string
  linkedCustomerId?: string
  currentPlan?: 'none' | 'starter' | 'professional' | 'washly'
  businessAccountType?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  subscriptionStatus?: string
  subscription?: {
    plan: 'free' | 'pro' | 'washly'
    status: 'active' | 'paused' | 'cancelled'
    startDate: string
    renewalDate?: string
  }
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  isAuthenticated: boolean
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

    // Check if we're in a new tab that opened from admin
    if (typeof window !== 'undefined') {
      const previousAuthUserId = sessionStorage.getItem('authUserId')
      if (previousAuthUserId) {
        console.log('[Auth] Auth session found in sessionStorage, user was authenticated in another tab')
      }
    }

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Only log significant state changes
      const currentUserIdentifier = firebaseUser?.email || 'logged out'
      if (previousUserRef.current !== currentUserIdentifier) {
        if (firebaseUser) {
          console.log('[Auth] State changed: authenticated as', firebaseUser.email)
        }
        previousUserRef.current = currentUserIdentifier
      }
      
      // Add small delay to ensure auth persistence is loaded from storage
      // This is especially important when opening new tabs
      if (!firebaseUser && typeof window !== 'undefined') {
        const storedUserId = sessionStorage.getItem('authUserId')
        if (storedUserId) {
          console.log('[Auth] Waiting for auth persistence to load from storage...')
          // Wait a moment for Firebase to load persisted auth state
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      try {
        if (firebaseUser) {
          // Store user UID in sessionStorage for cross-tab persistence
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('authUserId', firebaseUser.uid)
            sessionStorage.setItem('authUserEmail', firebaseUser.email || '')
          }
          
          // Force token refresh to get latest custom claims
          let idTokenResult;
          try {
            idTokenResult = await firebaseUser.getIdTokenResult(true)
          } catch (error) {
            idTokenResult = await firebaseUser.getIdTokenResult(false)
          }
          
          setUser(firebaseUser)

          // Get admin status from custom claims (from ID token)
          const isAdminFromClaims = idTokenResult?.claims?.admin === true

          // Get fresh user data from Firestore - prioritize speed
          try {
            const userRef = doc(db, 'users', firebaseUser.uid)
            let userSnap
            let retries = 0
            const maxRetries = 3
            
            try {
              userSnap = await getDoc(userRef)
              
              // If document doesn't exist yet (race condition from signup), retry a few times
              if (!userSnap.exists() && retries < maxRetries) {
                while (!userSnap.exists() && retries < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 300)) // Wait 300ms before retry
                  userSnap = await getDoc(userRef)
                  retries++
                }
              }
            } catch (offlineError: any) {
              if (offlineError?.code === 'failed-precondition' || offlineError?.message?.includes('offline')) {
                console.log('[Auth] Firestore offline, using basic user data')
                // Offline - create minimal user data
                const minimalUserData: UserData = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
                  phone: firebaseUser.phoneNumber || '',
                  createdAt: new Date().toISOString(),
                  userType: 'customer',
                  isAdmin: isAdminFromClaims,
                }
                setUserData(minimalUserData)
                setLoading(false)
                return
              }
              throw offlineError
            }

            if (userSnap.exists()) {
              const userData = userSnap.data() as UserData
              
              // Use custom claims if available, fallback to Firestore
              const finalUserData = {
                ...userData,
                isAdmin: isAdminFromClaims || userData.isAdmin,
              }
              
              setUserData(finalUserData)
              setLoading(false) // Only set loading=false when userData is ready
            } else {
              
              // AUTO-CREATE user document for new users
              const newUserData: UserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
                phone: firebaseUser.phoneNumber || '',
                createdAt: new Date().toISOString(),
                userType: 'customer',
                isAdmin: isAdminFromClaims,
                marketingTexts: true,
                accountTexts: true,
              }

              try {
                // Create the user document in Firestore
                const userRef = doc(db, 'users', firebaseUser.uid)
                await setDoc(userRef, newUserData)
                
                setUserData(newUserData)
              } catch (createError: any) {
                console.error('[Auth] Failed to create user document:', createError)
                // If offline, still proceed with basic user data
                if (createError?.code === 'failed-precondition' || createError?.message?.includes('offline')) {
                  setUserData(newUserData)
                } else if (isAdminFromClaims) {
                  setUserData(newUserData)
                } else {
                  setUserData(null)
                }
              }
              setLoading(false)
            }
          } catch (error: any) {
            // Handle offline state gracefully
            if (error?.code === 'failed-precondition' || error?.message?.includes('offline')) {
              setUserData({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                createdAt: new Date().toISOString(),
                userType: 'customer',
                isAdmin: isAdminFromClaims,
              })
            } else if (isAdminFromClaims) {
              // If Firestore fails but user has admin claims, still allow access
              setUserData({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin',
                createdAt: new Date().toISOString(),
                userType: 'customer',
                isAdmin: true,
              })
            } else {
              setUserData(null)
            }
            setLoading(false)
          }
        } else {
          // Clear sessionStorage when user logs out
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('authUserId')
            sessionStorage.removeItem('authUserEmail')
          }
          setUser(null)
          setUserData(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('[Auth] Unexpected error:', error)
        setLoading(false)
      }
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
      unsubscribeRef.current = null
    }
  }, [])

  const value: AuthContextType = {
    user,
    userData,
    loading,
    isAuthenticated: !!user,
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

