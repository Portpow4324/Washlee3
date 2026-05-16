'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgeDollarSign,
  BarChart3,
  Briefcase,
  ClipboardList,
  DollarSign,
  Gift,
  Headphones,
  Inbox,
  Info,
  Key,
  LayoutDashboard,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Users,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react'
import Spinner from '@/components/Spinner'
import { clearAdminAccess, useRequireAdminAccess } from '@/lib/useAdminAccess'

type AnalyticsData = {
  totalRevenue?: number
  totalOrders?: number
  activeUsers?: number
  newSignups?: number
  pendingApplications?: number
  averageOrderValue?: number
}

type AdminOrder = {
  id: string
  status: string
  total_price?: number
  price?: number
  created_at: string
  tracking_code?: string | null
  customer_name?: string | null
  user_email?: string | null
  pro_name?: string | null
  employee_name?: string | null
  assigned_pro_name?: string | null
  users?: { name?: string | null; email?: string | null } | Array<{ name?: string | null; email?: string | null }> | null
}

type ProApplication = {
  id: string
  status: string
}

type SupportTicket = {
  id: string
  status?: string | null
  submitted_at?: string | null
  message?: string | null
}

type MonitoringSummary = {
  ok?: boolean
  degraded?: boolean
  queryErrors?: string[]
  overview?: {
    openAlerts?: number
    criticalAlerts?: number
    authFailuresToday?: number
    activeSessions?: number
  }
  alerts?: Array<{
    id: string
    severity: 'info' | 'warning' | 'critical'
    category: string
    title: string
    created_at?: string
  }>
}

type DashboardState = {
  analytics: AnalyticsData | null
  orders: AdminOrder[]
  monitoring: MonitoringSummary | null
  applications: ProApplication[]
  tickets: SupportTicket[]
}

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
}

type AlertItem = {
  title: string
  detail: string
  href: string
  tone: 'red' | 'amber' | 'blue' | 'green'
  icon: LucideIcon
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/admin' || pathname === '/admin/dashboard',
  },
  { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Employee codes', href: '/admin/employee-codes', icon: Key },
  { label: 'Applications', href: '/admin/pro-applications', icon: Briefcase },
  { label: 'Payouts', href: '/admin/payouts', icon: BadgeDollarSign },
  { label: 'Tickets', href: '/admin/support-tickets', icon: Headphones },
  { label: 'Inquiries', href: '/admin/inquiries', icon: Inbox },
  { label: 'Wash Club', href: '/admin/wash-club', icon: Gift },
  { label: 'Pricing rules', href: '/admin/pricing/rules', icon: DollarSign },
  { label: 'Campaigns', href: '/admin/marketing/campaigns', icon: Megaphone },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Monitoring', href: '/admin/monitoring', icon: Activity },
  { label: 'Security', href: '/admin/security', icon: ShieldCheck },
]

const initialState: DashboardState = {
  analytics: null,
  orders: [],
  monitoring: null,
  applications: [],
  tickets: [],
}

const activeStatuses = new Set(['pending', 'confirmed', 'picked_up', 'picked up', 'washing', 'in_transit', 'in-transit', 'collecting', 'delivering', 'in_progress'])
const closedStatuses = new Set(['closed', 'resolved', 'completed', 'done', 'cancelled', 'canceled'])

function formatCurrency(value = 0, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits,
  }).format(value)
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function normalizeStatus(status?: string | null) {
  return String(status || '').trim().toLowerCase().replace(/[_-]/g, ' ')
}

function titleStatus(status: string) {
  const words = normalizeStatus(status).split(' ').filter(Boolean)
  if (words.length === 0) return 'Pending'
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function statusClass(status: string) {
  const normalized = normalizeStatus(status)
  if (['delivered', 'completed'].includes(normalized)) return 'bg-emerald-100 text-emerald-800'
  if (['in transit', 'washing', 'picked up', 'collecting', 'delivering', 'in progress'].includes(normalized)) return 'bg-blue-100 text-blue-800'
  if (['confirmed'].includes(normalized)) return 'bg-mint text-primary-deep'
  if (['pending', 'pending payment'].includes(normalized)) return 'bg-amber-100 text-amber-800'
  if (['cancelled', 'canceled', 'failed'].includes(normalized)) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

function getCustomerName(order: AdminOrder) {
  if (order.customer_name) return order.customer_name
  const users = order.users
  if (Array.isArray(users)) return users[0]?.name || users[0]?.email || 'Customer'
  return users?.name || users?.email || order.user_email || 'Customer'
}

function getProName(order: AdminOrder) {
  return order.pro_name || order.assigned_pro_name || order.employee_name || '--'
}

function orderTotal(order: AdminOrder) {
  return Number(order.total_price ?? order.price ?? 0)
}

function orderDisplayId(order: AdminOrder) {
  const seed = order.tracking_code || order.id || ''
  const short = seed.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()
  return short ? `#WL-${short}` : '#WL'
}

function isOrderActive(order: AdminOrder) {
  return activeStatuses.has(normalizeStatus(order.status))
}

function isTicketOpen(ticket: SupportTicket) {
  return !closedStatuses.has(normalizeStatus(ticket.status || 'open'))
}

async function fetchJson<T>(input: string, init: RequestInit = {}, timeoutMs = 7000): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(input, {
      ...init,
      cache: init.cache || 'no-store',
      signal: controller.signal,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : `Request failed: ${response.status}`
      throw new Error(message)
    }
    return data as T
  } finally {
    window.clearTimeout(timeout)
  }
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e5ebea] bg-white p-3.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6b7b78]">{label}</p>
      <p className="mt-2 text-[22px] font-bold leading-none text-[#1f2d2b]">{value}</p>
      <div className="mt-1.5 text-[10px] font-semibold leading-none text-[#1f8473]">{detail}</div>
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d8dedc] bg-white p-10 text-center text-[12px] font-semibold text-[#6b7b78]">
      {children}
    </div>
  )
}

function alertToneClasses(tone: AlertItem['tone']) {
  if (tone === 'red') return 'text-red-700'
  if (tone === 'amber') return 'text-amber-700'
  if (tone === 'green') return 'text-emerald-700'
  return 'text-blue-700'
}

function AdminRail({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname() || '/admin'

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col overflow-y-auto bg-[#0f1f1d] py-3.5 text-white md:flex">
        <div className="mb-4 flex justify-center">
          <Link href="/admin" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#48c9b0] text-white shadow-sm" aria-label="Washlee admin dashboard">
            <WashingMachine size={20} strokeWidth={2.2} />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.match ? item.match(pathname) : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-1 py-2.5 text-center font-medium transition ${
                  active
                    ? 'bg-[#7fe3cf]/10 text-[#7fe3cf]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} strokeWidth={2.2} />
                <span className="text-[8px] leading-tight">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="mt-2 flex flex-col items-center justify-center gap-1 border-t border-white/10 px-1 py-2.5 text-center font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <Key size={20} strokeWidth={2.2} />
          <span className="text-[8px] leading-tight">Logout</span>
        </button>
      </aside>

      <div className="border-b border-white/10 bg-[#0b221d] px-4 py-3 text-white md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-3 font-bold">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#4acbb8]">
              <WashingMachine size={24} />
            </span>
            Washlee Admin
          </Link>
          <button type="button" onClick={onLogout} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold">
            Logout
          </button>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const active = item.match ? item.match(pathname) : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
                  active ? 'bg-[#4acbb8] text-[#0b221d]' : 'bg-white/10 text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}

export default function AdminOpsDashboard() {
  const router = useRouter()
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [dashboard, setDashboard] = useState<DashboardState>(initialState)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string>('')
  const [referenceTimeMs, setReferenceTimeMs] = useState(0)

  const loadDashboard = useCallback(async () => {
    if (!hasAdminAccess) return

    setRefreshing(true)
    setLoadError(null)

    const [analyticsResult, ordersResult, monitoringResult, applicationsResult, ticketsResult] = await Promise.allSettled([
      fetchJson<{ analytics?: AnalyticsData }>('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_dashboard_summary', adminId: 'password-admin' }),
      }),
      fetchJson<{ orders?: AdminOrder[] }>('/api/admin/orders'),
      fetchJson<MonitoringSummary>('/api/analytics/summary'),
      fetchJson<{ data?: ProApplication[] }>('/api/admin/pro-approvals?status=all'),
      fetchJson<{ data?: SupportTicket[] }>('/api/admin/collections?name=supportTickets'),
    ])

    const nextState: DashboardState = {
      analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value.analytics || null : null,
      orders: ordersResult.status === 'fulfilled' ? ordersResult.value.orders || [] : [],
      monitoring: monitoringResult.status === 'fulfilled' ? monitoringResult.value : null,
      applications: applicationsResult.status === 'fulfilled' ? applicationsResult.value.data || [] : [],
      tickets: ticketsResult.status === 'fulfilled' ? ticketsResult.value.data || [] : [],
    }

    const failed = [analyticsResult, ordersResult, monitoringResult, applicationsResult, ticketsResult].filter((result) => result.status === 'rejected')
    if (failed.length > 0) {
      setLoadError('Some live data could not be loaded. The dashboard is showing the data that responded.')
    }

    setDashboard(nextState)
    setReferenceTimeMs(Date.now())
    setLastSync(new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }))
    setLoading(false)
    setRefreshing(false)
  }, [hasAdminAccess])

  useEffect(() => {
    if (!hasAdminAccess) return

    const initial = window.setTimeout(loadDashboard, 0)
    const timer = window.setInterval(loadDashboard, 90_000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [hasAdminAccess, loadDashboard])

  const handleLogout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined)
    clearAdminAccess()
    router.push('/admin/login')
    router.refresh()
  }

  const today = startOfToday()
  const todayOrders = dashboard.orders.filter((order) => new Date(order.created_at) >= today)
  const activeOrders = dashboard.orders.filter(isOrderActive)
  const stuckOrders = referenceTimeMs > 0
    ? activeOrders.filter((order) => referenceTimeMs - new Date(order.created_at).getTime() > 4 * 60 * 60 * 1000)
    : []
  const openTickets = dashboard.tickets.filter(isTicketOpen)
  const pendingApplications = dashboard.applications.filter((application) => normalizeStatus(application.status) === 'pending')
  const approvedPros = dashboard.applications.filter((application) => ['approved', 'active'].includes(normalizeStatus(application.status))).length
  const todayRevenue = todayOrders.reduce((sum, order) => sum + orderTotal(order), 0)
  const liveOrders = activeOrders.length > 0 ? activeOrders.slice(0, 5) : dashboard.orders.slice(0, 5)

  const alerts: AlertItem[] = []

  for (const alert of (dashboard.monitoring?.alerts || []).slice(0, 3)) {
    alerts.push({
      title: alert.title,
      detail: `${titleStatus(alert.severity)} / ${alert.category}`,
      href: '/admin/monitoring',
      tone: alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'amber' : 'blue',
      icon: alert.severity === 'critical' ? AlertCircle : alert.severity === 'warning' ? AlertTriangle : Info,
    })
  }

  if (stuckOrders.length > 0) {
    alerts.push({
      title: 'Stuck order',
      detail: `${orderDisplayId(stuckOrders[0])} has been active over 4h`,
      href: '/admin/orders',
      tone: 'amber',
      icon: AlertTriangle,
    })
  }

  if (openTickets.length > 0) {
    alerts.push({
      title: openTickets.length === 1 ? 'Open ticket' : `${openTickets.length} open tickets`,
      detail: 'Support queue needs review',
      href: '/admin/support-tickets',
      tone: 'red',
      icon: AlertCircle,
    })
  }

  if (pendingApplications.length > 0) {
    alerts.push({
      title: pendingApplications.length === 1 ? 'New application' : `${pendingApplications.length} new applications`,
      detail: 'Pro queue / Melbourne',
      href: '/admin/pro-applications',
      tone: 'blue',
      icon: Info,
    })
  }

  if (alerts.length === 0) {
    alerts.push({
      title: 'Ops calm',
      detail: 'No active tickets or monitoring alerts',
      href: '/admin/monitoring',
      tone: 'green',
      icon: Info,
    })
  }

  const visibleAlerts = alerts.slice(0, 4)

  if (checkingAdminAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f8f6]">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-sm font-semibold text-[#6d7c78]">Loading admin access</p>
        </div>
      </main>
    )
  }

  if (!hasAdminAccess) return null

  return (
    <div className="min-h-screen bg-[#f7faf9] text-[#1f2d2b] md:pl-[88px]">
      <AdminRail onLogout={handleLogout} />

      <header className="border-b border-[#eef1f0] bg-white">
        <div className="flex min-h-[63px] items-center gap-3 px-5 py-3.5 sm:px-[22px]">
          <div>
            <h1 className="text-[16px] font-bold leading-tight text-[#1f2d2b]">Dashboard</h1>
            <p className="mt-1 text-[11px] leading-none text-[#6b7b78]">Today / Melbourne ops</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {lastSync && <p className="hidden text-[11px] font-semibold text-[#6b7b78] sm:block">Synced {lastSync}</p>}
            <button
              type="button"
              onClick={loadDashboard}
              disabled={refreshing}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-[#d8dedc] bg-white text-[#1f2d2b] transition hover:bg-[#f7faf9] disabled:opacity-60"
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#0f4f46] text-[12px] font-semibold text-white">
              WH
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 sm:px-[22px]">
        {loadError && (
          <div className="mb-3.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-semibold text-amber-900">
            {loadError}
          </div>
        )}

        <section className="mb-[18px] grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Orders today" value={loading ? '--' : todayOrders.length} detail={activeOrders.length > 0 ? `${activeOrders.length} live now` : 'No live orders'} />
          <MetricCard label="Revenue today" value={loading ? '--' : formatCurrency(todayRevenue)} detail={dashboard.analytics?.totalRevenue ? `${formatCurrency(dashboard.analytics.totalRevenue)} all time` : 'Awaiting orders'} />
          <MetricCard label="Active pros" value={loading ? '--' : approvedPros} detail={pendingApplications.length > 0 ? `${pendingApplications.length} pending` : 'Queue clear'} />
          <MetricCard label="Open tickets" value={loading ? '--' : openTickets.length} detail={stuckOrders.length > 0 ? <span className="text-red-700">{stuckOrders.length} stuck order(s)</span> : 'Support clear'} />
        </section>

        <section className="grid gap-3.5 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7b78]">Live orders</h2>
              <Link href="/admin/orders" className="text-[11px] font-bold text-[#1f8473] hover:underline">
                View all
              </Link>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-[#e5ebea] bg-white">
              <div className="grid grid-cols-5 gap-3 bg-[#f7faf9] px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6b7b78] max-lg:hidden">
                <span>Order</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Pro</span>
                <span>Total</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner />
                </div>
              ) : liveOrders.length === 0 ? (
                <EmptyState>No live orders yet.</EmptyState>
              ) : (
                <div className="divide-y divide-[#e6eeeb]">
                  {liveOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/tracking/${order.id}`}
                      className="grid gap-2 px-3.5 py-3 text-[12px] font-medium leading-snug transition hover:bg-[#f7faf9] lg:grid-cols-5 lg:items-center"
                    >
                      <div>
                        <p className="font-semibold text-[#1f2d2b]">{orderDisplayId(order)}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6b7b78] lg:hidden">Order</p>
                      </div>
                      <div className="font-medium text-[#1f2d2b]">{getCustomerName(order)}</div>
                      <div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-tight ${statusClass(order.status)}`}>
                          {titleStatus(order.status)}
                        </span>
                      </div>
                      <div className="font-medium text-[#1f2d2b]">{getProName(order)}</div>
                      <div className="font-semibold text-[#1f2d2b]">{formatCurrency(orderTotal(order), 2)}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7b78]">Alerts</h2>
              <Link href="/admin/monitoring" className="text-[11px] font-bold text-[#1f8473] hover:underline">
                Monitor
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {visibleAlerts.map((alert) => {
                const Icon = alert.icon
                return (
                  <Link
                    key={`${alert.title}-${alert.detail}`}
                    href={alert.href}
                    className="flex gap-2.5 rounded-[10px] border border-[#e5ebea] bg-white p-3 transition hover:border-[#7fe3cf]"
                  >
                    <Icon size={18} className={`mt-0.5 shrink-0 ${alertToneClasses(alert.tone)}`} />
                    <span>
                      <span className="block text-[12px] font-semibold leading-tight text-[#1f2d2b]">{alert.title}</span>
                      <span className="mt-0.5 block text-[11px] font-normal leading-snug text-[#6b7b78]">{alert.detail}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
