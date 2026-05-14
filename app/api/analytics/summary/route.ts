import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type CountMap = Record<string, number>

type AnalyticsEvent = {
  session_id?: string | null
  event_name?: string | null
  source?: string | null
  path?: string | null
  screen?: string | null
  referrer?: string | null
  device_type?: string | null
  created_at?: string | null
}

type AnalyticsSession = {
  session_id?: string | null
}

type QueryResult<T> = {
  data: T[]
  error: string | null
}

const SUMMARY_QUERY_TIMEOUT_MS = 3_500

function increment(map: CountMap, key: string | null | undefined) {
  const safeKey = key || 'unknown'
  map[safeKey] = (map[safeKey] || 0) + 1
}

function topEntries(map: CountMap, limit = 8) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }))
}

function hostnameFromReferrer(referrer: string | null | undefined) {
  if (!referrer) return 'direct'
  try {
    return new URL(referrer).hostname || 'direct'
  } catch {
    return 'unknown'
  }
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return String(error)
}

async function runSummaryQuery<T>(
  label: string,
  query: (signal: AbortSignal) => PromiseLike<{ data: T[] | null; error: { message?: string } | null }>
): Promise<QueryResult<T>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SUMMARY_QUERY_TIMEOUT_MS)

  try {
    const result = await query(controller.signal)
    if (result.error) {
      return { data: [], error: `${label}: ${result.error.message || 'query failed'}` }
    }

    return { data: Array.isArray(result.data) ? result.data : [], error: null }
  } catch (error) {
    return { data: [], error: `${label}: ${errorMessage(error)}` }
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const today = startOfToday()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const activeSince = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    const [todayEventsResult, recentEventsResult, activeSessionsResult, alertsResult, monitorRunsResult] =
      await Promise.all([
        runSummaryQuery<AnalyticsEvent>('today events', (signal) =>
          supabase.from('analytics_events').select('*').gte('created_at', today).order('created_at', { ascending: false }).limit(1000).abortSignal(signal)
        ),
        runSummaryQuery<AnalyticsEvent>('recent events', (signal) =>
          supabase.from('analytics_events').select('*').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(5000).abortSignal(signal)
        ),
        runSummaryQuery<AnalyticsSession>('active sessions', (signal) =>
          supabase.from('analytics_sessions').select('*').gte('last_seen_at', activeSince).order('last_seen_at', { ascending: false }).limit(500).abortSignal(signal)
        ),
        runSummaryQuery<Record<string, any>>('security alerts', (signal) =>
          supabase.from('security_alerts').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(20).abortSignal(signal)
        ),
        runSummaryQuery<Record<string, any>>('monitor runs', (signal) =>
          supabase.from('monitor_runs').select('*').order('created_at', { ascending: false }).limit(20).abortSignal(signal)
        ),
      ])

    const queryErrors = [todayEventsResult, recentEventsResult, activeSessionsResult, alertsResult, monitorRunsResult]
      .map((result) => result.error)
      .filter(Boolean)

    if (queryErrors.length > 0) {
      console.warn('[analytics/summary] partial data:', queryErrors.join('; '))
    }

    const todayEvents = todayEventsResult.data
    const recentEvents = recentEventsResult.data
    const activeSessions = activeSessionsResult.data
    const alerts = alertsResult.data
    const monitorRuns = monitorRunsResult.data

    const todayEventRows = Array.isArray(todayEvents) ? (todayEvents as AnalyticsEvent[]) : []
    const recentEventRows = Array.isArray(recentEvents) ? (recentEvents as AnalyticsEvent[]) : []
    const activeSessionRows = Array.isArray(activeSessions) ? (activeSessions as AnalyticsSession[]) : []
    const alertRows = Array.isArray(alerts) ? alerts : []
    const monitorRunRows = Array.isArray(monitorRuns) ? monitorRuns : []

    const topPages: CountMap = {}
    const topScreens: CountMap = {}
    const sources: CountMap = {}
    const referrers: CountMap = {}
    const devices: CountMap = {}
    const funnel: CountMap = {
      page_view: 0,
      signup_started: 0,
      signup_completed: 0,
      booking_started: 0,
      booking_completed: 0,
    }

    for (const event of recentEventRows) {
      if (event.source === 'web') increment(topPages, event.path || '/')
      if (event.source === 'ios' || event.source === 'android') increment(topScreens, event.screen || event.path)
      increment(sources, event.source)
      increment(referrers, hostnameFromReferrer(event.referrer))
      increment(devices, event.device_type)
      const eventName = event.event_name
      if (eventName && Object.prototype.hasOwnProperty.call(funnel, eventName)) {
        funnel[eventName] += 1
      }
    }

    const authFailuresToday = todayEventRows.filter((event) => event.event_name === 'login_failed').length
    const adminPathViewsToday = todayEventRows.filter((event) => String(event.path || '').startsWith('/admin')).length
    const webEventsToday = todayEventRows.filter((event) => event.source === 'web').length
    const mobileEventsToday = todayEventRows.filter((event) => event.source === 'ios' || event.source === 'android').length
    const openAlerts = alertRows.length
    const criticalAlerts = alertRows.filter((alert) => alert.severity === 'critical').length
    const lastEventAt = recentEventRows[0]?.created_at || null

    return NextResponse.json({
      ok: queryErrors.length === 0,
      degraded: queryErrors.length > 0,
      queryErrors,
      generatedAt: new Date().toISOString(),
      overview: {
        visitorsToday: new Set(todayEventRows.map((event) => event.session_id)).size,
        eventsToday: todayEventRows.length,
        activeSessions: activeSessionRows.length,
        authFailuresToday,
        adminPathViewsToday,
        webEventsToday,
        mobileEventsToday,
        openAlerts,
        criticalAlerts,
        lastEventAt,
      },
      topPages: topEntries(topPages),
      topScreens: topEntries(topScreens),
      sources: topEntries(sources),
      referrers: topEntries(referrers),
      devices: topEntries(devices),
      funnel,
      alerts: alertRows,
      monitorRuns: monitorRunRows,
      ai: {
        enabled: false,
        message: 'API disabled: mock mode. Add an OpenAI API key later for incident summaries and recommendations.',
      },
    })
  } catch (error) {
    console.error('[analytics/summary] failed:', error)
    return NextResponse.json({
      ok: false,
      setupRequired: true,
      error: error instanceof Error ? error.message : 'Monitoring summary failed',
      ai: {
        enabled: false,
        message: 'API disabled: mock mode.',
      },
    }, { status: 200 })
  }
}
