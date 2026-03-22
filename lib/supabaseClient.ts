'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time issues
let supabaseClientInstance: SupabaseClient | null = null
let initializationAttempted = false
let initializationError: Error | null = null

function getSupabaseClient(): SupabaseClient {
  // If we already tried and failed, throw the same error
  if (initializationAttempted && initializationError) {
    throw initializationError
  }

  if (!supabaseClientInstance) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        const error = new Error(
          `Missing Supabase credentials. Check that NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}" and NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey ? '***' : 'undefined'}" are set in environment variables.`
        )
        initializationError = error
        initializationAttempted = true
        throw error
      }

      supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey)
      initializationAttempted = true
    } catch (error) {
      if (error instanceof Error) {
        initializationError = error
      }
      throw error
    }
  }

  return supabaseClientInstance
}

// Create a Proxy for backwards compatibility
export const supabase = new Proxy({} as any, {
  get: (_target, prop) => {
    const client = getSupabaseClient()
    return (client as any)[prop]
  },
})

/**
 * Authenticated fetch wrapper for Supabase
 * Automatically includes session token in Authorization header
 */
export async function authenticatedSupabaseFetch(
  url: string,
  options: RequestInit = {}
) {
  try {
    const session = (await supabase.auth.getSession()).data.session
    
    if (!session) {
      throw new Error('No active session')
    }

    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${session.access_token}`)
    headers.set('Content-Type', 'application/json')

    return fetch(url, {
      ...options,
      headers,
    })
  } catch (error) {
    console.error('[SUPABASE] Auth error:', error)
    throw error
  }
}

export default supabase
