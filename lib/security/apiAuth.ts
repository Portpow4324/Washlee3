import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/security/adminSession'

function getAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase auth client is not configured')
  }

  return createClient(supabaseUrl, anonKey)
}

export async function getBearerUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')

  if (!token) return null

  const supabase = getAuthClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) return null
  return data.user
}

export async function hasAdminSession(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}
