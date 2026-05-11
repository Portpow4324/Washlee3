import { NextRequest } from 'next/server'
import {
  getMobileClients,
  getMobileUser,
  mobileJson,
  mobileOptions,
  readString,
} from '@/lib/mobileBackend'

function normalizePlatform(value: unknown) {
  const platform = String(value || '').toLowerCase()
  if (platform === 'ios' || platform === 'android' || platform === 'web') return platform
  return 'unknown'
}

export async function OPTIONS() {
  return mobileOptions()
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request)
    if (authError || !user) return mobileJson({ success: false, error: authError }, { status: 401 })

    const body = await request.json()
    const userId = readString(body, ['userId', 'user_id'], user.id)
    const token = readString(body, ['token', 'fcmToken', 'deviceToken'])
    const platform = normalizePlatform(body.platform)
    const deviceId = readString(body, ['deviceId', 'device_id'])
    const appVersion = readString(body, ['appVersion', 'app_version'])

    if (userId !== user.id) return mobileJson({ success: false, error: 'Forbidden' }, { status: 403 })
    if (!token) return mobileJson({ success: false, error: 'Missing device token' }, { status: 400 })

    const { admin } = getMobileClients()
    const now = new Date().toISOString()
    const { data, error } = await admin
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          device_id: deviceId || null,
          app_version: appVersion || null,
          is_active: true,
          last_seen_at: now,
          updated_at: now,
        },
        { onConflict: 'token' }
      )
      .select()
      .single()

    if (error) {
      console.error('[Mobile Device Tokens] Upsert failed:', error.message)
      return mobileJson({ success: false, error: 'Failed to register device token' }, { status: 500 })
    }

    return mobileJson({ success: true, data })
  } catch (error) {
    console.error('[Mobile Device Tokens] Unexpected error:', error)
    return mobileJson({ success: false, error: 'Failed to register device token' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request)
    if (authError || !user) return mobileJson({ success: false, error: authError }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const token = readString(body, ['token', 'fcmToken', 'deviceToken']) ||
      new URL(request.url).searchParams.get('token') ||
      ''

    if (!token) return mobileJson({ success: false, error: 'Missing device token' }, { status: 400 })

    const { admin } = getMobileClients()
    const { error } = await admin
      .from('device_tokens')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('token', token)
      .eq('user_id', user.id)

    if (error) {
      console.error('[Mobile Device Tokens] Deactivate failed:', error.message)
      return mobileJson({ success: false, error: 'Failed to unregister device token' }, { status: 500 })
    }

    return mobileJson({ success: true })
  } catch (error) {
    console.error('[Mobile Device Tokens] Unexpected deactivate error:', error)
    return mobileJson({ success: false, error: 'Failed to unregister device token' }, { status: 500 })
  }
}
