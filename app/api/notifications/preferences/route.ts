import { NextRequest, NextResponse } from 'next/server'
import { getBearerUser } from '@/lib/security/apiAuth'
import { isUuid } from '@/lib/security/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const DEFAULT_PREFERENCES = {
  new_jobs: true,
  order_reminders: true,
  earnings_payouts: true,
  customer_messages: true,
  marketing: false,
}

type PreferenceKey = keyof typeof DEFAULT_PREFERENCES
type PreferenceMap = Record<PreferenceKey, boolean>

function isMissingTableError(message: string) {
  return /does not exist|schema cache|relation .* not found/i.test(message)
}

function cleanPreferences(value: unknown): Partial<PreferenceMap> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const input = value as Record<string, unknown>
  const output: Partial<PreferenceMap> = {}
  for (const key of Object.keys(DEFAULT_PREFERENCES) as PreferenceKey[]) {
    if (typeof input[key] === 'boolean') output[key] = input[key]
  }

  return output
}

function mergePreferences(value: unknown): PreferenceMap {
  return {
    ...DEFAULT_PREFERENCES,
    ...cleanPreferences(value),
  }
}

function getUserId(request: NextRequest, bodyUserId?: unknown) {
  const queryUserId = request.nextUrl.searchParams.get('userId')
  const userId = typeof bodyUserId === 'string' ? bodyUserId : queryUserId || ''
  return userId.trim()
}

async function requireOwnUser(request: NextRequest, userId: string) {
  if (!userId || !isUuid(userId)) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Valid userId is required' },
        { status: 400 },
      ),
      userId: '',
    }
  }

  const user = await getBearerUser(request)
  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      ),
      userId: '',
    }
  }

  if (user.id !== userId) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 },
      ),
      userId: '',
    }
  }

  return { response: null, userId }
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireOwnUser(request, getUserId(request))
    if (access.response) return access.response

    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('preferences, updated_at')
      .eq('user_id', access.userId)
      .maybeSingle()

    if (error) {
      if (isMissingTableError(error.message)) {
        return NextResponse.json({
          success: true,
          preferences: DEFAULT_PREFERENCES,
          isDefault: true,
          warning:
            'notification_preferences table is not available. Apply the latest Supabase migration to persist changes.',
        })
      }

      throw error
    }

    return NextResponse.json({
      success: true,
      preferences: mergePreferences(data?.preferences),
      updatedAt: data?.updated_at || null,
      isDefault: !data,
    })
  } catch (error) {
    console.error('[Notification Preferences] GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load notification preferences',
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const access = await requireOwnUser(request, getUserId(request, body.userId))
    if (access.response) return access.response

    const preferences = mergePreferences(body.preferences)
    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert(
        {
          user_id: access.userId,
          preferences,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      )
      .select('preferences, updated_at')
      .single()

    if (error) {
      if (isMissingTableError(error.message)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Notification preferences table is not available. Apply the latest Supabase migration first.',
          },
          { status: 503 },
        )
      }

      throw error
    }

    return NextResponse.json({
      success: true,
      preferences: mergePreferences(data?.preferences),
      updatedAt: data?.updated_at || now,
    })
  } catch (error) {
    console.error('[Notification Preferences] PATCH error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save notification preferences',
      },
      { status: 500 },
    )
  }
}
