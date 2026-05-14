import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'
import { getBearerUser } from '@/lib/security/apiAuth'

type DbResult = {
  data?: unknown
  error?: {
    message?: string
    details?: string
    code?: string
    hint?: string
  } | null
}

const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'promo',
  'ref',
  'channel',
  'campaign_id',
  'landing_page',
  'first_utm_source',
  'first_utm_medium',
  'first_utm_campaign',
] as const

function readString(source: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return fallback
}

function sanitizeAttribution(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== 'object') return null
  const source = input as Record<string, unknown>
  const result: Record<string, string> = {}

  ATTRIBUTION_KEYS.forEach((key) => {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim().slice(0, 500)
    }
  })

  return Object.keys(result).length > 0 ? result : null
}

function splitName(fullName: string, email: string) {
  const clean = fullName.trim() || email.split('@')[0] || 'Washlee customer'
  const [firstName, ...rest] = clean.split(/\s+/)
  return {
    firstName: firstName || 'Washlee',
    lastName: rest.join(' '),
    fullName: clean,
  }
}

function missingColumnName(error: DbResult['error']) {
  const message = error?.message || ''
  return (
    message.match(/'([^']+)' column/)?.[1] ||
    message.match(/column "([^"]+)"/)?.[1] ||
    null
  )
}

async function upsertWithColumnFallback(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  table: string,
  payload: Record<string, unknown>
) {
  let currentPayload = { ...payload }

  for (let attempt = 0; attempt < 12; attempt++) {
    const result = await supabase
      .from(table)
      .upsert(currentPayload, { onConflict: 'id' })
      .select()

    if (!result.error) return result

    const missingColumn = missingColumnName(result.error)
    if (!missingColumn || !(missingColumn in currentPayload)) {
      return result
    }

    console.warn(`[OAuthProfile] ${table} column missing, retrying without ${missingColumn}`)
    const nextPayload = { ...currentPayload }
    delete nextPayload[missingColumn]
    currentPayload = nextPayload
  }

  return supabase
    .from(table)
    .upsert(currentPayload, { onConflict: 'id' })
    .select()
}

export async function POST(request: NextRequest) {
  try {
    const user = await getBearerUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const requestBody = (body || {}) as Record<string, unknown>
    const metadata = (user.user_metadata || {}) as Record<string, unknown>
    const appMetadata = (user.app_metadata || {}) as Record<string, unknown>
    const email = user.email || readString(metadata, ['email'])

    if (!email) {
      return NextResponse.json({ success: false, error: 'OAuth account did not provide an email address' }, { status: 400 })
    }

    const provider =
      readString(requestBody, ['provider']) ||
      readString(appMetadata, ['provider']) ||
      'oauth'
    const intent = readString(requestBody, ['intent']) || 'login'
    const fullNameFromMetadata = readString(metadata, [
      'full_name',
      'name',
      'display_name',
      'preferred_username',
    ])
    const { firstName, lastName, fullName } = splitName(fullNameFromMetadata, email)
    const phone = readString(metadata, ['phone', 'phone_number'])
    const state = readString(metadata, ['state'])
    const marketingAttribution = sanitizeAttribution(requestBody.marketingAttribution)
    const supabase = getSupabaseAdminClient()

    const { data: existingUser } = await supabase
      .from('users')
      .select('user_type, phone_verified, is_admin, is_employee')
      .eq('id', user.id)
      .maybeSingle()

    const existingUserRecord = (existingUser || {}) as Record<string, unknown>
    const userType = readString(existingUserRecord, ['user_type']) || readString(metadata, ['user_type']) || 'customer'
    const isAdmin = existingUserRecord.is_admin === true || metadata.is_admin === true
    const isEmployee = existingUserRecord.is_employee === true || metadata.is_employee === true
    const phoneVerified =
      typeof existingUserRecord.phone_verified === 'boolean'
        ? existingUserRecord.phone_verified
        : metadata.phone_verified === true
    const shouldCreateCustomerProfile = userType === 'customer' && !isAdmin && !isEmployee

    const updatedMetadata = {
      ...metadata,
      name: fullName,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      state: state || null,
      user_type: userType,
      phone_verified: phoneVerified,
      is_admin: isAdmin,
      is_employee: isEmployee,
      oauth_provider: provider,
      marketing_attribution: marketingAttribution || metadata.marketing_attribution || null,
      created_at: metadata.created_at || new Date().toISOString(),
    }

    const { error: metadataError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: updatedMetadata,
    })

    if (metadataError) {
      console.warn('[OAuthProfile] Failed to update auth metadata:', metadataError.message)
    }

    const usersResult = await upsertWithColumnFallback(supabase, 'users', {
      id: user.id,
      email,
      name: fullName,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      user_type: userType,
      phone: phone || null,
      phone_verified: phoneVerified,
      is_admin: isAdmin,
      is_employee: isEmployee,
      oauth_provider: provider,
      marketing_attribution: marketingAttribution,
      updated_at: new Date().toISOString(),
    })

    if (usersResult.error) {
      console.error('[OAuthProfile] Failed to upsert users record:', usersResult.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Could not create OAuth user profile',
          details: usersResult.error.message,
        },
        { status: 500 }
      )
    }

    if (shouldCreateCustomerProfile) {
      const customersResult = await upsertWithColumnFallback(supabase, 'customers', {
        id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        state: state || null,
        personal_use: 'personal',
        preference_marketing_texts: false,
        preference_account_texts: true,
        selected_plan: 'none',
        account_status: 'active',
        oauth_provider: provider,
        marketing_attribution: marketingAttribution,
        updated_at: new Date().toISOString(),
      })

      if (customersResult.error) {
        console.error('[OAuthProfile] Failed to upsert customers record:', customersResult.error)
        return NextResponse.json(
          {
            success: false,
            error: 'Could not create OAuth customer profile',
            details: customersResult.error.message,
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      customerProfileSynced: shouldCreateCustomerProfile,
      user: {
        id: user.id,
        email,
        firstName,
        lastName,
        provider,
        intent,
        userType,
      },
    })
  } catch (error) {
    console.error('[OAuthProfile] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prepare OAuth profile',
      },
      { status: 500 }
    )
  }
}
