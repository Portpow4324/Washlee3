'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Info,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import Button from '@/components/Button'
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

export default function AdminSecurityDashboard() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [errors, setErrors] = useState<ErrorDetails[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedError, setSelectedError] = useState<ErrorDetails | null>(null)
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [hasOwnerAccess, setHasOwnerAccess] = useState(false)

  // Check admin access
  useEffect(() => {
    const ownerAccess = sessionStorage.getItem('ownerAccess') === 'true'
    setHasOwnerAccess(ownerAccess)

    if (authLoading) return

    if (ownerAccess) return

    if (!user) {
      console.log('[AdminSecurity] Not logged in, redirecting to login')
      router.push('/auth/login')
      return
    }

    if (!userData?.isAdmin) {
      console.error('[AdminSecurity] User is not admin. Current user:', user.email)
      router.push('/')
      return
    }
  }, [user, userData, authLoading, router])

  // Load errors on mount and refresh
  useEffect(() => {
    refreshErrors()
    const interval = setInterval(refreshErrors, 5000)
    return () => clearInterval(interval)
  }, [filter, searchQuery])

  const refreshErrors = () => {
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
  }

  const handleResolveError = (errorId: string, notes?: string) => {
    resolveError(errorId, 'admin', notes)
    refreshErrors()
  }

  const handleDeleteError = (errorId: string) => {
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

  if (authLoading || (loading && !hasOwnerAccess)) {
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
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-[#3aad9a] mb-6 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Admin
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Security & Debugging</h1>
            <p className="text-gray-600">Monitor errors, issues, and system health</p>
          </div>

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
                {Object.entries(stats.byType).map(([type, count]: any) => (
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
                  onClick={refreshErrors}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  Refresh
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
