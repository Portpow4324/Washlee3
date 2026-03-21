/**
 * Supabase Client Factory
 * =====================
 * Lazy initialization of Supabase clients to avoid build-time credential errors
 * Clients are only created when actually needed at runtime
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service role client (for admin operations)
let serviceRoleClient: SupabaseClient | null = null

export function getServiceRoleClient(): SupabaseClient {
  if (!serviceRoleClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(
        `Missing Supabase credentials: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`
      )
    }

    serviceRoleClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return serviceRoleClient
}

// Anonymous client (for public operations)
let anonClient: SupabaseClient | null = null

export function getAnonClient(): SupabaseClient {
  if (!anonClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error(
        `Missing Supabase credentials: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`
      )
    }

    anonClient = createClient(url, key)
  }

  return anonClient
}
