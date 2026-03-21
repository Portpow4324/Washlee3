import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseAdminClient: SupabaseClient | null = null

/**
 * Server-side Supabase client with service role access
 * Use for admin operations, server-side queries, and database writes
 * NEVER expose this key to the client
 */
function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
    }

    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminClient
}

export const supabaseAdmin = new Proxy({} as any, {
  get: (_target, prop) => {
    const client = getSupabaseAdmin()
    return (client as any)[prop]
  },
})

export default getSupabaseAdmin

export { getSupabaseAdmin }
