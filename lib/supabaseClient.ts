'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time issues
let supabaseClientInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
    }

    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey)
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
