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

    const { error: sessionError } = await supabase
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

    if (sessionError) throw sessionError

    await supabase.rpc('increment_analytics_session_count', { p_session_id: sessionId }).then(
      () => undefined,
      async () => {
        const { data } = await supabase
          .from('analytics_sessions')
          .select('event_count')
          .eq('session_id', sessionId)
          .single()

        await supabase
          .from('analytics_sessions')
          .update({ event_count: (data?.event_count || 0) + 1, last_seen_at: now })
          .eq('session_id', sessionId)
      }
    )

    const { error: eventError } = await supabase.from('analytics_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_name: eventName,
      source,
      path,
      screen,
      referrer,
      device_type: deviceType,
      safe_metadata: safeMetadata,
    })

    if (eventError) throw eventError

    return NextResponse.json({ ok: true, stored: true })
  } catch (error) {
    console.error('[analytics/track] failed:', error)
    return NextResponse.json(
      { ok: false, error: 'Tracking failed' },
      { status: 500 }
    )
  }
}
