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
              console.log('[Auth] User data loaded:', { name: userData.name, firstName: userData.firstName, lastName: userData.lastName })
              
              // Use custom claims if available, fallback to Firestore
              const finalUserData = {
                ...userData,
                isAdmin: isAdminFromClaims || userData.isAdmin,
              }
              
              console.log('[Auth] Admin status:', finalUserData.isAdmin, '(claims:', isAdminFromClaims, ')')
              setUserData(finalUserData)
              setLoading(false) // Only set loading=false when userData is ready
            } else {
              console.log('[Auth] No user document found - creating one for:', firebaseUser.email)
              
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
                console.log('[Auth] User document created successfully')
                
                setUserData(newUserData)
              } catch (createError: any) {
                console.error('[Auth] Failed to create user document:', createError)
                // If offline, still proceed with basic user data
                if (createError?.code === 'failed-precondition' || createError?.message?.includes('offline')) {
                  console.log('[Auth] Running offline - proceeding with basic user data')
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
            console.error('[Auth] Error fetching/creating user data:', error)
            console.error('[Auth] Error code:', error?.code)
            
            // Handle offline state gracefully
            if (error?.code === 'failed-precondition' || error?.message?.includes('offline')) {
              console.log('[Auth] Offline - allowing basic access')
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
