/**
 * Lazy Supabase Client Factory
 * Initializes Supabase clients only when actually used, not at module load time
 * Prevents build-time credential requirement errors
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedAdminClient: SupabaseClient | null = null
let cachedAnonClient: SupabaseClient | null = null

/**
 * Get or create a Supabase admin client (with service role key)
 * Use for API routes that need full database access
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!cachedAdminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    }

    cachedAdminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return cachedAdminClient
}

/**
 * Get or create a Supabase anonymous client (with anon key)
 * Use for public/client operations
 */
export function getSupabaseAnonClient(): SupabaseClient {
  if (!cachedAnonClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    cachedAnonClient = createClient(url, key)
  }

  return cachedAnonClient
}
