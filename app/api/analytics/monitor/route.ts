import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type MonitorStatus = 'ok' | 'warning' | 'critical'

const DEFAULT_SITE_URL = 'https://washlee3-llqy.onrender.com'
const CHECK_PATHS = ['/', '/pricing', '/auth/signup', '/booking']

async function fetchWithTimeout(url: string, timeoutMs = 10000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'user-agent': 'Washlee-Monitor/1.0' },
    })
    return {
      statusCode: response.status,
      latencyMs: Date.now() - startedAt,
      ok: response.ok,
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function createAlertOnce(params: {
  severity: 'info' | 'warning' | 'critical'
  category: string
  title: string
  evidence: Record<string, unknown>
}) {
  const supabase = getSupabaseAdmin()
  const { data: existing } = await supabase
    .from('security_alerts')
    .select('id')
    .eq('status', 'open')
    .eq('title', params.title)
    .limit(1)
    .maybeSingle()

  if (existing?.id) return

  await supabase.from('security_alerts').insert({
    severity: params.severity,
    category: params.category,
    title: params.title,
    evidence: params.evidence,
  })
}

async function resolveAlert(title: string) {
  const supabase = getSupabaseAdmin()
  await supabase
    .from('security_alerts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('status', 'open')
    .eq('title', title)
}

async function recordRun(params: {
  checkName: string
  target: string
  status: MonitorStatus
  statusCode?: number
  latencyMs?: number
  evidence?: Record<string, unknown>
}) {
  const supabase = getSupabaseAdmin()
  await supabase.from('monitor_runs').insert({
    check_name: params.checkName,
    target: params.target,
    status: params.status,
    status_code: params.statusCode,
    latency_ms: params.latencyMs,
    evidence: params.evidence || {},
  })
}

async function runChecks() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || DEFAULT_SITE_URL
  const results = []

  for (const path of CHECK_PATHS) {
    const target = new URL(path, siteUrl).toString()
    try {
      const result = await fetchWithTimeout(target)
      const status: MonitorStatus = result.ok ? 'ok' : result.statusCode >= 500 ? 'critical' : 'warning'
      await recordRun({
        checkName: 'route_uptime',
        target,
        status,
        statusCode: result.statusCode,
        latencyMs: result.latencyMs,
      })
      if (status !== 'ok') {
        await createAlertOnce({
          severity: status,
          category: 'uptime',
          title: `Route check failed: ${path}`,
          evidence: { target, statusCode: result.statusCode, latencyMs: result.latencyMs },
        })
      }
      results.push({ target, ...result, status })
    } catch (error) {
      await recordRun({
        checkName: 'route_uptime',
        target,
        status: 'critical',
        evidence: { error: error instanceof Error ? error.message : 'request failed' },
      })
      await createAlertOnce({
        severity: 'critical',
        category: 'uptime',
        title: `Route check failed: ${path}`,
        evidence: { target, error: error instanceof Error ? error.message : 'request failed' },
      })
      results.push({ target, ok: false, status: 'critical' })
    }
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    await recordRun({
      checkName: 'config_google_maps_key',
      target: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      status: 'warning',
      evidence: { issue: 'Google Maps script will load with key=undefined' },
    })
    await createAlertOnce({
      severity: 'warning',
      category: 'configuration',
      title: 'Google Maps key is missing',
      evidence: { env: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', publicSymptom: 'maps.googleapis.com key=undefined' },
    })
  } else {
    await recordRun({
      checkName: 'config_google_maps_key',
      target: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      status: 'ok',
    })
  }

  await resolveAlert('Admin login should move to server-side verification')

  if (!process.env.ADMIN_PASSWORD) {
    await createAlertOnce({
      severity: 'critical',
      category: 'security',
      title: 'Server-side admin password is not configured',
      evidence: { requiredEnv: 'ADMIN_PASSWORD' },
    })
  } else {
    await recordRun({
      checkName: 'config_admin_password',
      target: 'ADMIN_PASSWORD',
      status: 'ok',
    })
    await resolveAlert('Server-side admin password is not configured')
  }

  if (process.env.NEXT_PUBLIC_OWNER_PASSWORD) {
    await createAlertOnce({
      severity: 'critical',
      category: 'security',
      title: 'Public admin password environment variable is still configured',
      evidence: { removeEnv: 'NEXT_PUBLIC_OWNER_PASSWORD', replaceWith: 'ADMIN_PASSWORD' },
    })
  } else {
    await resolveAlert('Public admin password environment variable is still configured')
  }

  await createAlertOnce({
    severity: 'warning',
    category: 'mobile',
    title: 'Mobile API base URL should be verified before App Store release',
    evidence: { expected: siteUrl, currentFinding: 'Local mobile config previously pointed at https://washlee.com/api.' },
  })

  return results
}

export async function GET() {
  try {
    const results = await runChecks()
    return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), results })
  } catch (error) {
    console.error('[analytics/monitor] failed:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Monitor failed' },
      { status: 500 }
    )
  }
}

export const POST = GET
