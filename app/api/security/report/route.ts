import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { cleanString, isBodyTooLarge } from '@/lib/security/validation'

const MAX_REPORT_BODY_BYTES = 32_000

type ReportType = 'runtime' | 'network' | 'validation' | 'database' | 'authentication' | 'payment' | 'system'
type ReportSeverity = 'low' | 'medium' | 'high' | 'critical'
type AlertSeverity = 'info' | 'warning' | 'critical'

const REPORT_TYPES = new Set<ReportType>([
  'runtime',
  'network',
  'validation',
  'database',
  'authentication',
  'payment',
  'system',
])

const REPORT_SEVERITIES = new Set<ReportSeverity>(['low', 'medium', 'high', 'critical'])

function normalizeType(value: unknown): ReportType {
  return typeof value === 'string' && REPORT_TYPES.has(value as ReportType)
    ? (value as ReportType)
    : 'runtime'
}

function normalizeSeverity(value: unknown): ReportSeverity {
  return typeof value === 'string' && REPORT_SEVERITIES.has(value as ReportSeverity)
    ? (value as ReportSeverity)
    : 'medium'
}

function alertSeverityFor(severity: ReportSeverity): AlertSeverity {
  if (severity === 'critical') return 'critical'
  if (severity === 'high' || severity === 'medium') return 'warning'
  return 'info'
}

function categoryFor(type: ReportType) {
  if (type === 'authentication') return 'security'
  if (type === 'payment') return 'payment'
  if (type === 'database') return 'database'
  if (type === 'network') return 'network'
  return 'client-error'
}

function safePath(value: unknown) {
  const raw = cleanString(value, 500)
  if (!raw) return null

  try {
    return new URL(raw).pathname.slice(0, 300)
  } catch {
    return raw.slice(0, 300)
  }
}

function safeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function POST(request: NextRequest) {
  try {
    if (isBodyTooLarge(request.headers.get('content-length'), MAX_REPORT_BODY_BYTES)) {
      return NextResponse.json({ ok: false, error: 'Request body is too large' }, { status: 413 })
    }

    const parsedBody = await request.json().catch(() => ({}))
    const body = parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)
      ? (parsedBody as Record<string, unknown>)
      : {}
    const context = body.context || null
    const contextRecord = context && typeof context === 'object' && !Array.isArray(context)
      ? (context as Record<string, unknown>)
      : {}

    const type = normalizeType(body.type)
    const severity = normalizeSeverity(body.severity)
    const title = cleanString(body.title, 160) || 'Something went wrong'
    const message = cleanString(body.message, 700) || 'Client error reported'
    const errorId = cleanString(body.id, 120)
    const timestamp = cleanString(body.timestamp, 80)

    const evidence = {
      error_id: errorId || undefined,
      type,
      severity,
      message,
      reported_at: timestamp || new Date().toISOString(),
      path: safePath(contextRecord.url),
      endpoint: cleanString(contextRecord.endpoint, 300) || undefined,
      method: cleanString(contextRecord.method, 20) || undefined,
      status_code: safeNumber(contextRecord.statusCode) || undefined,
      file: cleanString(contextRecord.file, 220) || undefined,
      line: safeNumber(contextRecord.line) || undefined,
      column: safeNumber(contextRecord.column) || undefined,
      component_stack: cleanString(contextRecord.componentStack, 1800) || undefined,
      stack: cleanString(body.stack, 1800) || undefined,
      user_agent: cleanString(request.headers.get('user-agent'), 300) || undefined,
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('security_alerts').insert({
      severity: alertSeverityFor(severity),
      category: categoryFor(type),
      title: `Client report: ${title}`.slice(0, 180),
      evidence,
    })

    if (error) throw error

    return NextResponse.json({ ok: true, stored: true })
  } catch (error) {
    console.error('[security/report] failed:', error)
    return NextResponse.json(
      { ok: false, error: 'Security report failed' },
      { status: 500 }
    )
  }
}
