'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
