'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  CreditCard,
  DollarSign,
  ExternalLink,
  Gift,
  LineChart,
  LogOut,
  MessageSquare,
  MonitorCheck,
  RefreshCw,
  Shield,
  ShoppingCart,
  Smartphone,
  type LucideIcon,
  Users,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import { clearAdminAccess, confirmAdminAccess } from '@/lib/useAdminAccess'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  activeUsers: number
  newSignups: number
  pendingApplications: number
  refundRate: number
  averageOrderValue: number
  topProEarnings: number
}

type MonitoringSummary = {
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
  funnel?: Record<string, number>
  alerts?: Array<{
    id: string
    severity: 'info' | 'warning' | 'critical'
    category: string
    title: string
    created_at: string
  }>
  monitorRuns?: Array<{
    id: string
    check_name: string
    target: string
    status: 'ok' | 'warning' | 'critical'
    created_at: string
  }>
  ai?: { enabled: boolean; message: string }
}

type ActionItem = {
  label: string
  detail: string
  href: string
  icon: LucideIcon
}

const actionGroups: Array<{ title: string; items: ActionItem[] }> = [
  {
    title: 'Operate',
    items: [
      { label: 'Orders', detail: 'Manage jobs, status and disputes', href: '/admin/orders', icon: ShoppingCart },
      { label: 'Users', detail: 'Customers, pros and admin users', href: '/admin/users', icon: Users },
      { label: 'Pro Applications', detail: 'Review pending providers', href: '/admin/pro-applications', icon: Briefcase },
    ],
  },
  {
    title: 'Grow',
    items: [
      { label: 'Analytics', detail: 'Revenue and platform performance', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Marketing', detail: 'Campaigns and promotions', href: '/admin/marketing/campaigns', icon: LineChart },
      { label: 'Wash Club', detail: 'Membership and loyalty', href: '/admin/wash-club', icon: Gift },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Monitoring', detail: 'Website, mobile, uptime and alerts', href: '/admin/monitoring', icon: MonitorCheck },
      { label: 'Security', detail: 'Errors, access and debug logs', href: '/admin/security', icon: Shield },
      { label: 'Pricing Rules', detail: 'Rates, zones and service settings', href: '/admin/pricing/rules', icon: DollarSign },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Inquiries', detail: 'Customer messages and requests', href: '/admin/inquiries', icon: Bell },
      { label: 'Support Tickets', detail: 'Open issues and follow-up', href: '/admin/support-tickets', icon: MessageSquare },
      { label: 'Subscriptions', detail: 'Plans and billing state', href: '/admin/subscriptions', icon: CreditCard },
    ],
  },
]

function formatCurrency(value = 0) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatTime(value?: string | null) {
  if (!value) return 'No events yet'
  return new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function conversionPercent(done = 0, started = 0) {
  if (started <= 0) return 0
  return Math.round((done / started) * 100)
}

function healthScore(summary: MonitoringSummary | null) {
  const overview = summary?.overview
  let score = 100
  score -= (overview?.criticalAlerts || 0) * 25
  score -= (overview?.openAlerts || 0) * 8
  score -= Math.min(20, (overview?.authFailuresToday || 0) * 5)
  if (summary?.setupRequired) score -= 30
  return Math.max(0, Math.min(100, score))
}

function statusCopy(score: number) {
  if (score >= 90) return 'Healthy'
  if (score >= 70) return 'Watch'
  return 'Needs attention'
}

function StatTile({
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

function ActionGroup({ title, items }: { title: string; items: ActionItem[] }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-950">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 transition hover:border-[#48C9B0] hover:bg-[#f4fffb]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-gray-950">{item.label}</span>
                <span className="block truncate text-xs text-gray-500">{item.detail}</span>
              </span>
            </span>
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-gray-400" />
          </a>
        ))}
      </div>
    </section>
  )
}

function FunnelStep({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="font-bold text-gray-950">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-[#48C9B0]" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [monitoring, setMonitoring] = useState<MonitoringSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasOwnerAccess, setHasOwnerAccess] = useState(false)

  const loadDashboard = useCallback(async () => {
    setRefreshing(true)
    try {
      const [analyticsResponse, monitoringResponse] = await Promise.all([
        fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_dashboard_summary',
            adminId: 'password-admin',
          }),
        }),
        fetch('/api/analytics/summary', { cache: 'no-store' }),
      ])

      if (analyticsResponse.ok) {
        const data = await analyticsResponse.json()
        setAnalytics(data.analytics)
      }

      if (monitoringResponse.ok) {
        setMonitoring(await monitoringResponse.json())
      }
    } catch (error) {
      console.error('Error fetching admin dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined)
    clearAdminAccess()
    router.push('/admin/login')
    router.refresh()
  }

  useEffect(() => {
    let cancelled = false

    confirmAdminAccess().then((ownerAccess) => {
      if (cancelled) return
      setHasOwnerAccess(ownerAccess)

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

    loadDashboard()
    const timer = window.setInterval(loadDashboard, 60_000)
    return () => window.clearInterval(timer)
  }, [hasOwnerAccess, loadDashboard])

  const overview = monitoring?.overview || {
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

  const funnel = monitoring?.funnel || {}
  const pageViews = funnel.page_view || 0
  const signupStarted = funnel.signup_started || 0
  const signupCompleted = funnel.signup_completed || 0
  const bookingStarted = funnel.booking_started || 0
  const bookingCompleted = funnel.booking_completed || 0
  const maxFunnel = Math.max(pageViews, signupStarted, signupCompleted, bookingStarted, bookingCompleted, 1)
  const score = healthScore(monitoring)
  const bookingConversion = conversionPercent(bookingCompleted, bookingStarted)

  const attentionItems = useMemo(
    () => [
      {
        label: 'Open alerts',
        value: overview.openAlerts || 0,
        detail: (overview.openAlerts || 0) > 0 ? 'Review monitoring alerts' : 'No open alerts',
      },
      {
        label: 'Login failures',
        value: overview.authFailuresToday,
        detail: overview.authFailuresToday > 0 ? 'Watch auth attempts today' : 'No failed logins today',
      },
      {
        label: 'Pending pros',
        value: analytics?.pendingApplications || 0,
        detail: (analytics?.pendingApplications || 0) > 0 ? 'Applications waiting' : 'No pending applications',
      },
      {
        label: 'Booking conversion',
        value: `${bookingConversion}%`,
        detail: bookingStarted > 0 ? 'Started to completed bookings' : 'Waiting for booking events',
      },
    ],
    [analytics?.pendingApplications, bookingConversion, bookingStarted, overview.authFailuresToday, overview.openAlerts]
  )

  if (!hasOwnerAccess && loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <Spinner />
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!hasOwnerAccess) return null

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#48C9B0]">Washlee Admin</p>
              <h1 className="text-4xl font-bold text-gray-950">Control Center</h1>
              <p className="mt-2 text-gray-600">Website, mobile app, orders and alerts in one place.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadDashboard}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <a
                href="/admin/monitoring"
                className="inline-flex items-center gap-2 rounded-lg bg-[#48C9B0] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#3aad9a]"
              >
                <MonitorCheck className="h-4 w-4" />
                Monitoring
              </a>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          {monitoring?.setupRequired && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              Monitoring setup needs attention: {monitoring.error || 'Supabase monitoring tables are not available.'}
            </div>
          )}

          <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_2fr]">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Business Health</p>
                  <p className="mt-2 text-5xl font-bold text-gray-950">{score}</p>
                  <p className="mt-1 text-sm font-bold text-[#2b8f7d]">{statusCopy(score)}</p>
                </div>
                <div className="rounded-lg bg-[#ecfbf8] p-3 text-[#2b8f7d]">
                  <Bot className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm text-gray-600">
                <p>{monitoring?.ai?.message || 'API disabled: mock mode.'}</p>
                <p>Last event: {formatTime(overview.lastEventAt)}</p>
                <a
                  href="http://127.0.0.1:8787"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-[#2b8f7d] hover:underline"
                >
                  Open local AI agent
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {attentionItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-600">{item.label}</p>
                  <p className="mt-3 text-3xl font-bold text-gray-950">{item.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Revenue" value={formatCurrency(analytics?.totalRevenue || 0)} detail="Platform total" icon={DollarSign} />
            <StatTile label="Orders" value={(analytics?.totalOrders || 0).toLocaleString()} detail="All tracked orders" icon={ShoppingCart} />
            <StatTile label="Visitors Today" value={overview.visitorsToday} detail={`${overview.eventsToday} event(s) today`} icon={Users} />
            <StatTile label="Mobile Events" value={overview.mobileEventsToday || 0} detail={`${overview.webEventsToday || 0} web event(s)`} icon={Smartphone} />
          </section>

          <section className="mb-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Live Funnel</h2>
                  <p className="text-sm text-gray-500">Landing to signup to booking, web and mobile combined.</p>
                </div>
                <span className="rounded-full border border-gray-200 px-3 py-1 text-sm font-bold text-gray-700">
                  {bookingConversion}% booking conversion
                </span>
              </div>
              <div className="space-y-4">
                <FunnelStep label="Page views" count={pageViews} max={maxFunnel} />
                <FunnelStep label="Signup started" count={signupStarted} max={maxFunnel} />
                <FunnelStep label="Signup completed" count={signupCompleted} max={maxFunnel} />
                <FunnelStep label="Booking started" count={bookingStarted} max={maxFunnel} />
                <FunnelStep label="Booking completed" count={bookingCompleted} max={maxFunnel} />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-950">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Open Alerts
              </h2>
              <div className="space-y-3">
                {(monitoring?.alerts || []).length === 0 && <p className="text-sm text-gray-500">No open security or config alerts.</p>}
                {(monitoring?.alerts || []).slice(0, 4).map((alert) => (
                  <a
                    key={alert.id}
                    href="/admin/monitoring"
                    className="block rounded-lg border border-gray-200 p-3 transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    <p className="text-sm font-bold text-gray-950">{alert.title}</p>
                    <p className="mt-1 text-xs uppercase text-gray-500">{alert.severity} · {alert.category}</p>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-6 lg:grid-cols-4">
            {actionGroups.map((group) => (
              <ActionGroup key={group.title} title={group.title} items={group.items} />
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-950">
                <Activity className="h-5 w-5 text-[#48C9B0]" />
                Top Website Pages
              </h2>
              <div className="space-y-3">
                {(monitoring?.topPages || []).length === 0 && <p className="text-sm text-gray-500">No page traffic yet.</p>}
                {(monitoring?.topPages || []).slice(0, 6).map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <span className="truncate text-sm font-semibold text-gray-700">{row.label}</span>
                    <span className="text-sm font-bold text-gray-950">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-950">
                <Smartphone className="h-5 w-5 text-[#48C9B0]" />
                Top Mobile Screens
              </h2>
              <div className="space-y-3">
                {(monitoring?.topScreens || []).length === 0 && <p className="text-sm text-gray-500">No mobile screen events yet.</p>}
                {(monitoring?.topScreens || []).slice(0, 6).map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <span className="truncate text-sm font-semibold text-gray-700">{row.label}</span>
                    <span className="text-sm font-bold text-gray-950">{row.count}</span>
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
