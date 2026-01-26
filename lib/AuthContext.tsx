'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

interface UserData {
  uid: string
  email: string
  name: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
  createdAt: string
  userType: 'customer' | 'pro'
  isAdmin?: boolean
  personalUse?: string
  marketingTexts?: boolean
  accountTexts?: boolean
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

  useEffect(() => {
    if (unsubscribeRef.current) {
      return
    }

    console.log('[Auth] Setting up auth listener...')

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] State changed:', firebaseUser?.email || 'logged out')

      try {
        if (firebaseUser) {
          console.log('[Auth] User authenticated:', firebaseUser.email)
          
          // Force token refresh to get latest custom claims
          let idTokenResult;
          try {
            idTokenResult = await firebaseUser.getIdTokenResult(true)
            console.log('[Auth] Token refreshed, custom claims:', idTokenResult.claims)
          } catch (error) {
            console.log('[Auth] Could not refresh token:', error)
            idTokenResult = await firebaseUser.getIdTokenResult(false)
          }
          
          setUser(firebaseUser)

          // Get admin status from custom claims (from ID token)
          const isAdminFromClaims = idTokenResult?.claims?.admin === true
          console.log('[Auth] Admin from claims:', isAdminFromClaims)

          // Get fresh user data from Firestore - prioritize speed
          try {
            const userRef = doc(db, 'users', firebaseUser.uid)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
              const userData = userSnap.data() as UserData
              console.log('[Auth] User data loaded:', userData.name)
              
              // Use custom claims if available, fallback to Firestore
              const finalUserData = {
                ...userData,
                isAdmin: isAdminFromClaims || userData.isAdmin,
              }
              
              console.log('[Auth] Admin status:', finalUserData.isAdmin, '(claims:', isAdminFromClaims, ')')
              setUserData(finalUserData)
              setLoading(false) // Only set loading=false when userData is ready
            } else {
              console.log('[Auth] No user document found in Firestore')
              // Still set userData if they have admin claims
              if (isAdminFromClaims) {
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
          } catch (error) {
            console.error('[Auth] Error fetching user data:', error)
            // If Firestore fails but user has admin claims, still allow access
            if (isAdminFromClaims) {
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
          console.log('[Auth] User logged out - clearing state')
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
      console.log('[Auth] Cleaning up auth listener')
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
