import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { isBodyTooLarge } from '@/lib/security/validation'
import {
  browserFromUserAgent,
  deviceTypeFromUserAgent,
  normalizeEventName,
  normalizeSource,
  sanitizeMetadata,
  sanitizeText,
} from '@/lib/analytics/privacy'

const MAX_ANALYTICS_BODY_BYTES = 32_000
const TRACKING_QUERY_TIMEOUT_MS = 2_500
const TRACKING_COUNTER_TIMEOUT_MS = 1_500

async function runTrackingQuery<T>(
  query: (signal: AbortSignal) => PromiseLike<T>,
  timeoutMs = TRACKING_QUERY_TIMEOUT_MS
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await query(controller.signal)
  } finally {
    clearTimeout(timeout)
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return String(error)
}

export async function POST(request: NextRequest) {
  try {
    if (isBodyTooLarge(request.headers.get('content-length'), MAX_ANALYTICS_BODY_BYTES)) {
      return NextResponse.json({ ok: false, error: 'Request body is too large' }, { status: 413 })
    }

    const body = await request.json().catch(() => ({}))
    const userAgent = request.headers.get('user-agent')
    const source = normalizeSource(body.source)
    const sessionId = sanitizeText(body.sessionId, 120)

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'sessionId is required' }, { status: 400 })
    }

    const eventName = normalizeEventName(body.eventName)
    const path = sanitizeText(body.path, 300)
    const screen = sanitizeText(body.screen, 160)
    const referrer = sanitizeText(body.referrer, 500)
    const rawUserId = sanitizeText(body.userId, 80)
    const userId = rawUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawUserId)
      ? rawUserId
      : null
    const deviceType = sanitizeText(body.deviceType, 80) || deviceTypeFromUserAgent(userAgent)
    const browser = browserFromUserAgent(userAgent)
    const safeMetadata = sanitizeMetadata(body.metadata)

    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    const { error: sessionError } = await runTrackingQuery((signal) =>
      supabase
        .from('analytics_sessions')
        .upsert(
          {
            session_id: sessionId,
            source,
            landing_page: path,
            referrer,
            device_type: deviceType,
            browser,
            user_id: userId,
            last_seen_at: now,
            safe_metadata: { platform: source },
          },
          { onConflict: 'session_id' }
        )
        .abortSignal(signal)
    )

    if (sessionError) throw sessionError

    await runTrackingQuery(
      (signal) => supabase.rpc('increment_analytics_session_count', { p_session_id: sessionId }).abortSignal(signal),
      TRACKING_COUNTER_TIMEOUT_MS
    ).catch((error) => {
      console.warn('[analytics/track] session counter skipped:', errorMessage(error))
    })

    const { error: eventError } = await runTrackingQuery((signal) =>
      supabase.from('analytics_events').insert({
        session_id: sessionId,
        user_id: userId,
        event_name: eventName,
        source,
        path,
        screen,
        referrer,
        device_type: deviceType,
        safe_metadata: safeMetadata,
      }).abortSignal(signal)
    )

    if (eventError) throw eventError

    return NextResponse.json({ ok: true, stored: true })
  } catch (error) {
    console.warn('[analytics/track] skipped:', errorMessage(error))
    return NextResponse.json(
      { ok: true, stored: false, degraded: true },
      { status: 202 }
    )
  }
}
