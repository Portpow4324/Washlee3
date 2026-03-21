/**
 * Lazy Supabase Server Client Factory
 * ===================================
 * Use this instead of direct createClient calls to avoid build-time errors
 * when environment variables are not available.
 * 
 * Usage:
 *   import { createSupabaseServerClient } from '@/lib/supabaseServerLazy'
 *   const supabase = createSupabaseServerClient()
 *   const { data } = await supabase.from('table').select('*')
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClientInstance: SupabaseClient | null = null

export function createSupabaseServerClient(): SupabaseClient {
  if (!supabaseClientInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      throw new Error(
        `Missing Supabase credentials: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL' : ''} ${!anonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`
      )
    }

    supabaseClientInstance = createClient(url, anonKey)
  }

  return supabaseClientInstance
}

export function getSupabaseServerClient(): SupabaseClient {
  return createSupabaseServerClient()
}
