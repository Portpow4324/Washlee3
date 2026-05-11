'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  type LucideIcon,
  MonitorCheck,
  RefreshCw,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { confirmAdminAccess } from '@/lib/useAdminAccess'

type Summary = {
  ok: boolean
  setupRequired?: boolean
  error?: string
  generatedAt?: string
  overview?: {
    visitorsToday: number
    eventsToday: number
    activeSessions: number
    authFailuresToday: number
    adminPathViewsToday: number
    webEventsToday?: number
    mobileEventsToday?: number
    openAlerts?: number
    criticalAlerts?: number
    lastEventAt?: string | null
  }
  topPages?: Array<{ label: string; count: number }>
  topScreens?: Array<{ label: string; count: number }>
  sources?: Array<{ label: string; count: number }>
  referrers?: Array<{ label: string; count: number }>
  devices?: Array<{ label: string; count: number }>
  funnel?: Record<string, number>
  alerts?: Array<{
    id: string
    severity: 'info' | 'warning' | 'critical'
    category: string
    title: string
    evidence: Record<string, unknown>
    created_at: string
  }>
  monitorRuns?: Array<{
    id: string
    check_name: string
    target: string
    status: 'ok' | 'warning' | 'critical'
    status_code?: number
    latency_ms?: number
    created_at: string
  }>
  ai?: { enabled: boolean; message: string }
}

const funnelSteps = [
  ['page_view', 'Page views'],
  ['signup_started', 'Signup started'],
  ['signup_completed', 'Signup completed'],
  ['booking_started', 'Booking started'],
  ['booking_completed', 'Booking completed'],
] as const

function healthScore(summary: Summary | null) {
  const overview = summary?.overview
  let score = 100
  score -= (overview?.criticalAlerts || 0) * 25
  score -= (overview?.openAlerts || 0) * 8
  score -= Math.min(20, (overview?.authFailuresToday || 0) * 5)
  if (summary?.setupRequired) score -= 30
  return Math.max(0, Math.min(100, score))
}

function conversionPercent(done = 0, started = 0) {
  if (started <= 0) return 0
  return Math.round((done / started) * 100)
}

function timeLabel(value?: string | null) {
  if (!value) return 'No events yet'
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function severityClass(severity: string) {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-700'
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-blue-200 bg-blue-50 text-blue-700'
}

function scoreClass(score: number) {
  if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string | number
  detail: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <Icon className="h-5 w-5 text-[#48C9B0]" />
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-950">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{detail}</p>
    </div>
  )
}

function ListBlock({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="text-sm text-gray-500">No data yet</p>}
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="truncate text-sm font-semibold text-gray-700">{row.label}</span>
            <span className="text-sm font-bold text-gray-950">{row.count}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function FunnelBar({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-950">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-[#48C9B0]" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export default function MonitoringDashboard() {
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [runningChecks, setRunningChecks] = useState(false)
  const [hasOwnerAccess, setHasOwnerAccess] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analytics/summary', { cache: 'no-store' })
      setSummary(await response.json())
    } finally {
      setLoading(false)
    }
  }, [])

  const runChecks = async () => {
    setRunningChecks(true)
    try {
      await fetch('/api/analytics/monitor', { method: 'POST' })
      await loadSummary()
    } finally {
      setRunningChecks(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    confirmAdminAccess().then((ownerAccess) => {
      if (cancelled) return
      setHasOwnerAccess(ownerAccess)
      setAuthChecked(true)

      if (!ownerAccess) {
        router.push('/admin/login')
      }
    })

    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!hasOwnerAccess) return

    loadSummary()
    const timer = window.setInterval(loadSummary, 60_000)
    return () => window.clearInterval(timer)
  }, [hasOwnerAccess, loadSummary])

  if (!authChecked || !hasOwnerAccess) return null

  const overview = summary?.overview || {
    visitorsToday: 0,
    eventsToday: 0,
    activeSessions: 0,
    authFailuresToday: 0,
    adminPathViewsToday: 0,
    webEventsToday: 0,
    mobileEventsToday: 0,
    openAlerts: 0,
    criticalAlerts: 0,
    lastEventAt: null,
  }

  const funnel = summary?.funnel || {}
  const maxFunnel = Math.max(...funnelSteps.map(([key]) => funnel[key] || 0), 1)
  const signupConversion = conversionPercent(funnel.signup_completed || 0, funnel.signup_started || 0)
  const bookingConversion = conversionPercent(funnel.booking_completed || 0, funnel.booking_started || 0)
  const alerts = summary?.alerts || []
  const monitorRuns = summary?.monitorRuns || []
  const score = healthScore(summary)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#48C9B0]">Washlee Monitor</p>
              <h1 className="text-4xl font-bold text-gray-950">Monitoring Command Center</h1>
              <p className="mt-2 text-gray-600">Live website traffic, mobile app screens, funnel health, uptime and passive security alerts.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadSummary}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={runChecks}
                disabled={runningChecks}
                className="inline-flex items-center gap-2 rounded-lg bg-[#48C9B0] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#3aad9a] disabled:opacity-60"
              >
                <MonitorCheck className="h-4 w-4" />
                Run Checks
              </button>
              <a
                href="http://127.0.0.1:8787"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-gray-800"
              >
                <Bot className="h-4 w-4" />
                Local Agent
              </a>
            </div>
          </div>

          {summary?.setupRequired && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-semibold">
                  Monitoring setup needs attention. {summary.error || 'Apply the Supabase migration before production tracking.'}
                </p>
              </div>
            </div>
          )}

          <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_2fr]">
            <div className={`rounded-lg border p-6 shadow-sm ${scoreClass(score)}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold opacity-80">Monitoring Health</p>
                  <p className="mt-2 text-5xl font-bold">{score}</p>
                  <p className="mt-1 text-sm font-bold">{score >= 90 ? 'Healthy' : score >= 70 ? 'Watch closely' : 'Needs attention'}</p>
                </div>
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="mt-5 space-y-2 text-sm">
                <p>{summary?.ai?.message || 'API disabled: mock mode.'}</p>
                <p>Last event: {timeLabel(overview.lastEventAt)}</p>
                <a href="/admin" className="inline-flex items-center gap-2 font-bold hover:underline">
                  Back to control center
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Visitors Today" value={overview.visitorsToday} detail={`${overview.eventsToday} total event(s)`} icon={Users} />
              <StatCard label="Active Sessions" value={overview.activeSessions} detail="Seen in last 30 minutes" icon={Clock} />
              <StatCard label="Web Events" value={overview.webEventsToday || 0} detail="Website tracking" icon={Globe} />
              <StatCard label="Mobile Events" value={overview.mobileEventsToday || 0} detail="iOS/Android tracking" icon={Smartphone} />
            </div>
          </section>

          <section className="mb-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
                    <TrendingUp className="h-5 w-5 text-[#48C9B0]" />
                    Funnel Health
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Track the journey from visit to booking across website and mobile.</p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-sm font-bold text-gray-700">{signupConversion}% signup</span>
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-sm font-bold text-gray-700">{bookingConversion}% booking</span>
                </div>
              </div>
              <div className="space-y-4">
                {funnelSteps.map(([key, label]) => (
                  <FunnelBar key={key} label={label} count={funnel[key] || 0} max={maxFunnel} />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-950">
                <Bot className="h-5 w-5 text-[#48C9B0]" />
                AI Agent Status
              </h2>
              <p className="text-sm leading-6 text-gray-700">
                {summary?.ai?.message || 'API disabled: mock mode.'}
              </p>
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                Passive mode only. The agent can summarize and recommend, but it does not block users, send emails, delete data, or change production.
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <ListBlock title="Top Web Pages" rows={summary?.topPages || []} />
            <ListBlock title="Mobile Screens" rows={summary?.topScreens || []} />
            <ListBlock title="Traffic Sources" rows={summary?.referrers || []} />
            <ListBlock title="Device Types" rows={summary?.devices || []} />
            <ListBlock title="Platforms" rows={summary?.sources || []} />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-950">
                <Shield className="h-5 w-5 text-amber-500" />
                Security And Config Alerts
              </h2>
              <div className="space-y-3">
                {alerts.length === 0 && <p className="text-sm text-gray-500">No open alerts.</p>}
                {alerts.map((alert) => (
                  <div key={alert.id} className={`rounded-lg border p-4 ${severityClass(alert.severity)}`}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-bold">{alert.title}</p>
                      <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold">{alert.severity}</span>
                    </div>
                    <p className="mt-1 text-xs uppercase">{alert.category}</p>
                    {Object.keys(alert.evidence || {}).length > 0 && (
                      <pre className="mt-3 max-h-24 overflow-auto rounded bg-white/70 p-2 text-xs">
                        {JSON.stringify(alert.evidence, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-950">
                <BarChart3 className="h-5 w-5 text-[#48C9B0]" />
                Uptime And Config Checks
              </h2>
              <div className="space-y-3">
                {monitorRuns.length === 0 && <p className="text-sm text-gray-500">No checks run yet.</p>}
                {monitorRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-950">{run.check_name}</p>
                      <p className="truncate text-xs text-gray-500">{run.target}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {run.status_code && <span className="text-xs font-semibold text-gray-500">{run.status_code}</span>}
                      <span className={`rounded-full border px-2 py-1 text-xs font-bold ${severityClass(run.status)}`}>
                        {run.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
