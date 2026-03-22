'use client'

import { supabase } from './supabaseClient'
import type { User } from '@supabase/supabase-js'

/**
 * Supabase Authentication Client
 * Replaces firebaseAuthClient.ts for Firebase migration
 */

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('[AUTH] Error getting current user:', error.message)
      return null
    }

    return user || null
  } catch (error) {
    console.error('[AUTH] Unexpected error getting user:', error)
    return null
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('[AUTH] Error getting session:', error.message)
      return null
    }

    return session
  } catch (error) {
    console.error('[AUTH] Unexpected error getting session:', error)
    return null
  }
}

/**
 * Create authenticated request headers for API calls
 */
export async function getAuthHeaders(): Promise<HeadersInit | null> {
  try {
    const session = await getCurrentSession()

    if (!session) {
      console.warn('[AUTH] No active session for headers')
      return null
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  } catch (error) {
    console.error('[AUTH] Error creating auth headers:', error)
    return null
  }
}

/**
 * Sign up new user with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('[AUTH] Sign up error:', error.message)
      return { error: error.message, data: null }
    }

    console.log('[AUTH] User signed up successfully:', data.user?.id)
    return { error: null, data }
  } catch (error: any) {
    console.error('[AUTH] Unexpected sign up error:', error)
    return { error: error.message, data: null }
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[AUTH] Sign in error:', error.message)
      return { error: error.message, data: null }
    }

    console.log('[AUTH] User signed in successfully:', data.user?.id)
    return { error: null, data }
  } catch (error: any) {
    console.error('[AUTH] Unexpected sign in error:', error)
    return { error: error.message, data: null }
  }
}

/**
 * Sign in with OAuth provider (Google, etc.)
 */
export async function signInWithOAuth(provider: 'google' | 'github') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('[AUTH] OAuth sign in error:', error.message)
      return { error: error.message, data: null }
    }

    return { error: null, data }
  } catch (error: any) {
    console.error('[AUTH] Unexpected OAuth error:', error)
    return { error: error.message, data: null }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[AUTH] Sign out error:', error.message)
      return { error: error.message }
    }

    console.log('[AUTH] User signed out successfully')
    return { error: null }
  } catch (error: any) {
    console.error('[AUTH] Unexpected sign out error:', error)
    return { error: error.message }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      console.error('[AUTH] Password reset email error:', error.message)
      return { error: error.message }
    }

    console.log('[AUTH] Password reset email sent to:', email)
    return { error: null }
  } catch (error: any) {
    console.error('[AUTH] Unexpected password reset error:', error)
    return { error: error.message }
  }
}

/**
 * Update user password with current session
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('[AUTH] Update password error:', error.message)
      return { error: error.message }
    }

    console.log('[AUTH] Password updated successfully')
    return { error: null }
  } catch (error: any) {
    console.error('[AUTH] Unexpected update password error:', error)
    return { error: error.message }
  }
}

/**
 * Update user email
 */
export async function updateEmail(newEmail: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (error) {
      console.error('[AUTH] Update email error:', error.message)
      return { error: error.message }
    }

    console.log('[AUTH] Email update initiated for:', newEmail)
    return { error: null }
  } catch (error: any) {
    console.error('[AUTH] Unexpected update email error:', error)
    return { error: error.message }
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Watch for auth state changes (for real-time updates)
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
    callback(session?.user || null)
  })

  return subscription
}

export default supabase
