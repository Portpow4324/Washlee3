import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const mobileCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export function mobileJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...mobileCorsHeaders,
      ...init?.headers,
    },
  })
}

export function mobileOptions() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders })
}

export function getMobileClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return {
    auth: createClient(supabaseUrl, anonKey),
    admin: createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  }
}

export async function getMobileUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return { user: null, error: 'Missing authorization token' }

  const { auth } = getMobileClients()
  const { data, error } = await auth.auth.getUser(token)
  if (error || !data.user) return { user: null, error: 'Invalid or expired token' }

  return { user: data.user, error: null }
}

export function readString(source: Record<string, unknown> | null | undefined, keys: string[], fallback = '') {
  if (!source) return fallback
  for (const key of keys) {
    const value = source[key]
    if (value === null || value === undefined) continue
    const text = String(value).trim()
    if (text) return text
  }
  return fallback
}

export function readNumber(source: Record<string, unknown> | null | undefined, keys: string[], fallback = 0) {
  if (!source) return fallback
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return fallback
}

export function parseJsonRecord(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {}
    } catch {
      return {}
    }
  }
  return {}
}

export async function insertNotification(admin: SupabaseClient, payload: {
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
}) {
  const { error } = await admin
    .from('notifications')
    .insert({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.warn('[MobileBackend] Notification insert failed:', error.message)
  }
}
