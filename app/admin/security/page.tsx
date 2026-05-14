'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  Search,
  RefreshCw,
  Info,
  ChevronDown,
  ArrowLeft,
  Activity,
  Shield,
  UserX,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import {
  ErrorDetails,
  getErrors,
  resolveError,
  deleteError,
  clearResolvedErrors,
  exportErrors,
  getErrorStats,
  searchErrors,
} from '@/lib/adminErrorLogger'
import { findResolution } from '@/lib/issueResolutions'

type FilterType = 'all' | 'critical' | 'high' | 'unresolved'
const AUTO_REFRESH_INTERVAL_MS = 30_000

type ErrorStats = {
  totalCount: number
  unresolvedCount: number
  criticalCount: number
  highCount: number
  byType: Record<string, number>
}

type SecuritySummary = {
  ok: boolean
  setupRequired?: boolean
  error?: string
  generatedAt?: string
  overview?: {
    authFailuresToday: number
    adminPathViewsToday: number
    activeSessions: number
    openAlerts: number
    criticalAlerts: number
    lastEventAt?: string | null
  }
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
}

function formatDateTime(value?: string | null) {
  if (!value) return 'No recent events'

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function signalTone(value: number, criticalValue = 1) {
  if (value >= criticalValue) return 'text-red-700 bg-red-50 border-red-200'
  if (value > 0) return 'text-orange-700 bg-orange-50 border-orange-200'
  return 'text-green-700 bg-green-50 border-green-200'
}

export default function AdminSecurityDashboard() {
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [errors, setErrors] = useState<ErrorDetails[]>([])
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastAutoRefreshAt, setLastAutoRefreshAt] = useState<string | null>(null)
  const [scanMessage, setScanMessage] = useState('')

  const refreshErrors = useCallback(() => {
    try {
      let allErrors = getErrors()

      // Apply search filter
      if (searchQuery) {
        allErrors = searchErrors(searchQuery)
      }

      // Apply severity filter
      if (filter === 'critical') {
        allErrors = allErrors.filter(e => e.severity === 'critical')
      } else if (filter === 'high') {
        allErrors = allErrors.filter(e => e.severity === 'high' || e.severity === 'critical')
      } else if (filter === 'unresolved') {
        allErrors = allErrors.filter(e => !e.resolved)
      }

      setErrors(allErrors)
      setStats(getErrorStats())
      setLoading(false)
    } catch (error) {
      console.error('Error loading errors:', error)
      setLoading(false)
    }
  }, [filter, searchQuery])

  const loadSecuritySummary = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/summary', { cache: 'no-store' })
      if (!response.ok) throw new Error(`Security summary failed: ${response.status}`)
      setSecuritySummary(await response.json())
    } catch (error) {
      setSecuritySummary({
        ok: false,
        error: error instanceof Error ? error.message : 'Security summary failed',
      })
    }
  }, [])

  const handleReloadScan = async () => {
    setReloading(true)
    setScanMessage('')

    try {
      refreshErrors()
      const monitorResponse = await fetch('/api/analytics/monitor', {
        method: 'POST',
        cache: 'no-store',
      })

      if (!monitorResponse.ok) {
        throw new Error(`Monitor checks failed: ${monitorResponse.status}`)
      }

      await loadSecuritySummary()
      setLastAutoRefreshAt(new Date().toISOString())
      setScanMessage('Reloaded errors, login signals, admin activity, and monitor alerts.')
    } catch (error) {
      await loadSecuritySummary()
      setLastAutoRefreshAt(new Date().toISOString())
      setScanMessage(error instanceof Error ? error.message : 'Reload scan failed')
    } finally {
      setReloading(false)
    }
  }

  // Load errors and security signals on mount, then keep the local error list fresh.
  useEffect(() => {
    if (!hasAdminAccess) return

    let cancelled = false

    const refreshLiveData = async () => {
      refreshErrors()
      await loadSecuritySummary()
      if (!cancelled) setLastAutoRefreshAt(new Date().toISOString())
    }

    refreshLiveData()

    if (!autoRefresh) {
      return () => {
        cancelled = true
      }
    }

    const errorsInterval = setInterval(refreshErrors, 5000)
    const summaryInterval = setInterval(refreshLiveData, AUTO_REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(errorsInterval)
      clearInterval(summaryInterval)
    }
  }, [autoRefresh, hasAdminAccess, loadSecuritySummary, refreshErrors])

  const handleResolveError = (errorId: string, notes?: string) => {
    resolveError(errorId, 'admin', notes)
    refreshErrors()
  }

  const handleDeleteError = (errorId: string) => {
    if (!window.confirm('Delete this error log entry? This cannot be undone.')) return
    deleteError(errorId)
    refreshErrors()
  }

  const handleClearResolved = () => {
    if (confirm('Clear all resolved errors?')) {
      clearResolvedErrors()
      refreshErrors()
    }
  }

  const handleExport = () => {
    const json = exportErrors()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `errors-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const toggleErrorExpanded = (errorId: string) => {
    const newExpanded = new Set(expandedErrors)
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId)
    } else {
      newExpanded.add(errorId)
    }
    setExpandedErrors(newExpanded)
  }

  if (checkingAdminAccess || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-6 hover:text-primary"
          >
            <ArrowLeft size={14} />
            Control center
          </Link>

          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-1">Security &amp; debugging</h1>
              <p className="text-sm text-gray-600">
                Live application errors, access signals, monitoring alerts, and known-issue resolution guides.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAutoRefresh((enabled) => !enabled)}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  autoRefresh
                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <RefreshCw size={16} />
                Auto refresh {autoRefresh ? 'on (30s)' : 'off'}
              </button>

              <button
                onClick={handleReloadScan}
                disabled={reloading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-primary/50"
              >
                <RefreshCw size={16} className={reloading ? 'animate-spin' : ''} />
                {reloading ? 'Reloading...' : 'Reload scan'}
              </button>
            </div>
          </div>

          {(scanMessage || securitySummary?.error) && (
            <div className={`mb-6 rounded-lg border px-4 py-3 text-sm font-semibold ${
              securitySummary?.error ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-green-200 bg-green-50 text-green-800'
            }`}>
              {scanMessage || securitySummary?.error}
            </div>
          )}

          {/* Security Signals */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
            <div className={`rounded-lg border p-5 ${signalTone(securitySummary?.overview?.criticalAlerts || 0)}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Critical alerts</p>
                <Shield size={20} />
              </div>
              <p className="mt-3 text-3xl font-bold">{securitySummary?.overview?.criticalAlerts || 0}</p>
              <p className="mt-1 text-xs opacity-80">Open monitor alerts marked critical</p>
            </div>

            <div className={`rounded-lg border p-5 ${signalTone(securitySummary?.overview?.authFailuresToday || 0, 5)}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Failed logins today</p>
                <UserX size={20} />
              </div>
              <p className="mt-3 text-3xl font-bold">{securitySummary?.overview?.authFailuresToday || 0}</p>
              <p className="mt-1 text-xs opacity-80">Customer and account login failure events</p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 text-blue-800">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Admin views today</p>
                <Activity size={20} />
              </div>
              <p className="mt-3 text-3xl font-bold">{securitySummary?.overview?.adminPathViewsToday || 0}</p>
              <p className="mt-1 text-xs opacity-80">Visits to /admin routes from analytics</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 text-gray-800">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Last signal</p>
                <RefreshCw size={20} />
              </div>
              <p className="mt-3 text-lg font-bold">{formatDateTime(securitySummary?.overview?.lastEventAt)}</p>
              <p className="mt-1 text-xs text-gray-500">
                Reloaded {formatDateTime(lastAutoRefreshAt || securitySummary?.generatedAt)}
              </p>
            </div>
          </div>

          {securitySummary?.alerts && securitySummary.alerts.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900">Open Security Alerts</h2>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                  {securitySummary.alerts.length} open
                </span>
              </div>
              <div className="space-y-3">
                {securitySummary.alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="font-semibold text-gray-950">{alert.title}</p>
                      <p className="text-sm text-gray-500">
                        {alert.category} / {formatDateTime(alert.created_at)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      alert.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : alert.severity === 'warning'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {/* Total Errors */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold text-sm">Total Errors</h3>
                  <AlertCircle className="text-blue-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCount}</p>
                <p className="text-xs text-gray-500 mt-2">All recorded errors</p>
              </div>

              {/* Critical Errors */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold text-sm">Critical</h3>
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-red-600">{stats.criticalCount}</p>
                <p className="text-xs text-gray-500 mt-2">Requires immediate attention</p>
              </div>

              {/* High Priority */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold text-sm">High Priority</h3>
                  <AlertCircle className="text-orange-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-orange-600">{stats.highCount}</p>
                <p className="text-xs text-gray-500 mt-2">Should be resolved soon</p>
              </div>

              {/* Unresolved */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold text-sm">Unresolved</h3>
                  <XCircle className="text-yellow-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-yellow-600">{stats.unresolvedCount}</p>
                <p className="text-xs text-gray-500 mt-2">Pending resolution</p>
              </div>
            </div>
          )}

          {/* Error Type Breakdown */}
          {stats?.byType && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Error Types</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm font-semibold mb-2 capitalize">{type}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters & Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search errors by ID, title, or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Filter & Actions */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Errors</option>
                  <option value="unresolved">Unresolved Only</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Priority+</option>
                </select>

                <button
                  onClick={handleReloadScan}
                  disabled={reloading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <RefreshCw size={18} className={reloading ? 'animate-spin' : ''} />
                  Reload scan
                </button>

                <button
                  onClick={handleExport}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download size={18} />
                  Export JSON
                </button>

                <button
                  onClick={handleClearResolved}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                >
                  <Trash2 size={18} />
                  Clear Resolved
                </button>
              </div>
            </div>
          </div>

          {/* Error List */}
          <div className="space-y-4">
            {errors.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
                <p className="text-gray-600 text-lg">No errors to display</p>
                <p className="text-gray-500 text-sm">Great job! Your system is running smoothly.</p>
              </div>
            ) : (
              errors.map((error) => {
                const isExpanded = expandedErrors.has(error.id)
                const resolution = findResolution(error.title, error.message)

                return (
                  <div key={error.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Error Header */}
                    <div
                      onClick={() => toggleErrorExpanded(error.id)}
                      className="p-6 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 flex items-start gap-4">
                          {/* Severity Badge */}
                          <div className="mt-1">
                            {error.severity === 'critical' && (
                              <AlertTriangle className="text-red-600" size={24} />
                            )}
                            {error.severity === 'high' && (
                              <AlertCircle className="text-orange-600" size={24} />
                            )}
                            {error.severity === 'medium' && (
                              <Info className="text-yellow-600" size={24} />
                            )}
                            {error.severity === 'low' && (
                              <Info className="text-blue-600" size={24} />
                            )}
                          </div>

                          {/* Error Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {error.title}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                error.severity === 'critical'
                                  ? 'bg-red-100 text-red-800'
                                  : error.severity === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : error.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {error.severity.toUpperCase()}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                error.type === 'runtime'
                                  ? 'bg-purple-100 text-purple-800'
                                  : error.type === 'network'
                                  ? 'bg-blue-100 text-blue-800'
                                  : error.type === 'validation'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : error.type === 'database'
                                  ? 'bg-red-100 text-red-800'
                                  : error.type === 'authentication'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : error.type === 'payment'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {error.type}
                              </span>
                              {error.resolved && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  RESOLVED
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-2">{error.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>ID: {error.id}</span>
                              <span>{new Date(error.timestamp).toLocaleString()}</span>
                              {error.context?.userId && <span>User: {error.context.userId}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Expand Indicator */}
                        <ChevronDown
                          size={24}
                          className={`text-gray-400 transition-transform flex-shrink-0 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Error Details (Expanded) */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-6">
                        {/* Message & Stack */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Message</h4>
                            <code className="block bg-white p-3 rounded border border-gray-200 text-sm text-gray-700 overflow-x-auto">
                              {error.message}
                            </code>
                          </div>

                          {error.stack && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Stack Trace</h4>
                              <code className="block bg-white p-3 rounded border border-gray-200 text-xs text-gray-700 overflow-x-auto max-h-48 overflow-y-auto">
                                {error.stack}
                              </code>
                            </div>
                          )}
                        </div>

                        {/* Context */}
                        {error.context && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Context</h4>
                            <div className="bg-white p-3 rounded border border-gray-200 text-sm space-y-2">
                              {error.context.url && (
                                <div>
                                  <span className="text-gray-600">URL:</span> {error.context.url}
                                </div>
                              )}
                              {error.context.method && (
                                <div>
                                  <span className="text-gray-600">Method:</span> {error.context.method}
                                </div>
                              )}
                              {error.context.statusCode && (
                                <div>
                                  <span className="text-gray-600">Status:</span> {error.context.statusCode}
                                </div>
                              )}
                              {error.context.endpoint && (
                                <div>
                                  <span className="text-gray-600">Endpoint:</span> {error.context.endpoint}
                                </div>
                              )}
                              {error.context.file && (
                                <div>
                                  <span className="text-gray-600">File:</span> {error.context.file}:{error.context.line}:{error.context.column}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Auto-Suggested Resolution */}
                        {resolution && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                              <CheckCircle size={18} />
                              Suggested Solution
                            </h4>
                            <p className="text-blue-800 mb-3">{resolution.description}</p>
                            <Link
                              href={`/admin/security/${resolution.id}`}
                              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold text-sm"
                            >
                              View Full Resolution Guide
                            </Link>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          {!error.resolved && (
                            <button
                              onClick={() => handleResolveError(error.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold text-sm"
                            >
                              Mark Resolved
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteError(error.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-semibold text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
