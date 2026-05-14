'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  Briefcase,
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle,
  Eye,
  X,
  Trash2,
  ArrowRight,
} from 'lucide-react'

interface JobData {
  id: string
  order_id: string
  pro_id: string | null
  status: string
  earnings_amount?: number
  posted_at?: string
}

interface OrderDetails {
  totalPrice: number
  weight: number
  items?: { service_type?: string; delivery_speed?: string }
}

export default function EmployeeJobsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'available' | 'accepted'>('all')
  const [jobs, setJobs] = useState<JobData[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set())
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetails>>({})
  const [isClearingAll, setIsClearingAll] = useState(false)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return

    setHasCheckedAuth(true)

    if (!user) {
      router.push('/auth/employee-signin')
    }
  }, [user, loading, router, hasCheckedAuth])

  useEffect(() => {
    if (!user?.id) return

    const fetchJobs = async () => {
      try {
        setJobsLoading(true)

        const response = await fetch(`/api/employee/available-jobs?employeeId=${user.id}&limit=50`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          console.error('Error fetching jobs:', result.error)
          setJobs([])
          return
        }

        const jobsData: JobData[] = result.data || []
        setJobs(jobsData)

        const userJobs = jobsData.filter((j) => j.pro_id === user.id)
        setAcceptedJobs(new Set(userJobs.map((j) => j.id)))

        const details: Record<string, OrderDetails> = {}
        const { data: sessionData } = await supabase.auth.getSession()
        const authHeaders = sessionData.session?.access_token
          ? { Authorization: `Bearer ${sessionData.session.access_token}` }
          : undefined

        for (const job of jobsData) {
          if (!job.order_id) continue
          try {
            const orderResponse = await fetch(`/api/orders/details?orderId=${job.order_id}`, {
              headers: authHeaders,
            })
            if (orderResponse.ok) {
              const orderData = await orderResponse.json()
              details[job.order_id] = {
                totalPrice: orderData.totalPrice || 0,
                weight: orderData.weight || 0,
                items: orderData.items,
              }
            }
          } catch (err) {
            console.error('Error fetching order details for', job.order_id, err)
          }
        }
        setOrderDetails(details)
      } catch (err) {
        console.error('Error:', err)
        setJobs([])
      } finally {
        setJobsLoading(false)
      }
    }

    fetchJobs()
    const refreshInterval = setInterval(fetchJobs, 10000)
    return () => clearInterval(refreshInterval)
  }, [user?.id])

  const getJobDetails = (job: JobData) => {
    const orderData = orderDetails[job.order_id]

    if (orderData) {
      const items = orderData.items || {}
      return {
        weight: orderData.weight,
        service_type: items.service_type || 'standard',
        delivery_speed: items.delivery_speed || 'standard',
        estimatedPrice: orderData.totalPrice,
        hasRealData: true,
      }
    }

    // No order data yet — return a clear placeholder rather than a fake estimate.
    return {
      weight: 0,
      service_type: 'standard',
      delivery_speed: 'standard',
      estimatedPrice: 0,
      hasRealData: false,
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.order_id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    const isAccepted = acceptedJobs.has(job.id)
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'available' && !isAccepted) ||
      (filterType === 'accepted' && isAccepted)
    return matchesSearch && matchesFilter
  })

  const handleAcceptJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/employee/available-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          employeeId: user?.id,
          action: 'accept',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const newAccepted = new Set(acceptedJobs)
        if (newAccepted.has(jobId)) {
          newAccepted.delete(jobId)
        } else {
          newAccepted.add(jobId)
        }
        setAcceptedJobs(newAccepted)

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, pro_id: user?.id || null, status: result.data?.status || 'accepted' }
              : job
          )
        )
      } else {
        const data = await response.json()
        alert('Failed to accept job: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error accepting job:', error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleDenyJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/employee/deny-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, employeeId: user?.id }),
      })

      if (response.ok) {
        const jobToRemove = jobs.find((j) => j.id === jobId)
        setJobs((prev) => prev.filter((job) => job.id !== jobId))
        if (jobToRemove?.order_id) {
          const newOrderDetails = { ...orderDetails }
          delete newOrderDetails[jobToRemove.order_id]
          setOrderDetails(newOrderDetails)
        }
      } else {
        const data = await response.json()
        alert('Failed to deny job: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error denying job:', error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleClearAllJobs = async () => {
    try {
      setIsClearingAll(true)
      setJobs([])
      setOrderDetails({})
      setAcceptedJobs(new Set())
      setShowClearAllConfirm(false)
    } catch (error) {
      console.error('Error clearing jobs:', error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsClearingAll(false)
    }
  }

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-soft-mint flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading available jobs…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const acceptedTotal = filteredJobs
    .filter((j) => acceptedJobs.has(j.id))
    .reduce((sum, j) => sum + getJobDetails(j).estimatedPrice, 0)

  return (
    <div className="min-h-screen bg-soft-mint flex flex-col">
      <main className="flex-1 container-page py-10 space-y-6">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-dark inline-flex items-center gap-2">
              <Briefcase size={28} className="text-primary-deep" />
              Available jobs
            </h1>
            <p className="text-gray text-sm mt-1">
              {filteredJobs.length} showing · {jobs.length} total in your area
            </p>
          </div>
          {jobs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearAllConfirm(true)}
              disabled={isClearingAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-60"
            >
              <Trash2 size={14} />
              {isClearingAll ? 'Clearing…' : 'Clear list'}
            </button>
          )}
        </header>

        {/* Search & filter */}
        <div className="surface-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={16} />
              <input
                type="text"
                placeholder="Search by order ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
              />
            </div>
            <div className="flex items-center gap-2 sm:w-auto">
              <Filter size={16} className="text-gray-soft flex-shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="input-field min-h-[48px]"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="accepted">My jobs</option>
              </select>
            </div>
          </div>
        </div>

        {jobsLoading ? (
          <div className="surface-card p-12 text-center text-gray">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent mx-auto mb-3" />
            <p className="text-sm">Loading jobs…</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-3">
              <Briefcase size={20} className="text-primary-deep" />
            </div>
            <h2 className="text-lg font-bold text-dark mb-1">No jobs right now</h2>
            <p className="text-sm text-gray">Check back in a few minutes — new orders come through often.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredJobs.map((job) => {
              const isAccepted = acceptedJobs.has(job.id)
              const details = getJobDetails(job)
              return (
                <article
                  key={job.id}
                  className={`surface-card p-5 sm:p-6 ${
                    isAccepted ? 'border-primary bg-mint/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-mono text-sm font-semibold text-dark">
                        {job.order_id?.slice(0, 8) || '—'}
                      </p>
                      <p className="text-xs text-gray-soft mt-0.5">Order reference</p>
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-mint text-primary-deep text-[11px] font-semibold">
                          <CheckCircle size={12} />
                          Accepted
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-deep">
                        {details.hasRealData
                          ? `$${details.estimatedPrice.toFixed(2)}`
                          : 'Open job'}
                      </p>
                      <p className="text-xs text-gray-soft mt-0.5">
                        {details.hasRealData ? 'Order total' : 'Tap to view details'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-line pt-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Package size={14} className="text-primary-deep flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-gray-soft uppercase tracking-wider">Weight</p>
                        <p className="font-semibold text-dark">
                          {details.weight ? `${details.weight}kg` : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} className="text-primary-deep flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-gray-soft uppercase tracking-wider">Status</p>
                        <p className="font-semibold text-dark capitalize">
                          {job.status?.replace(/_/g, ' ') || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-mint text-primary-deep text-[11px] font-semibold capitalize">
                      {details.service_type}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold capitalize">
                      {details.delivery_speed} delivery
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/employee/orders/${job.order_id}`}
                      className="btn-outline text-sm flex-1"
                    >
                      <Eye size={14} />
                      View details
                    </Link>
                    {!isAccepted && (
                      <button
                        type="button"
                        onClick={() => handleDenyJob(job.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-red-700 border border-red-200 hover:bg-red-50 transition min-h-[40px]"
                      >
                        <X size={14} />
                        Deny
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAcceptJob(job.id)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition min-h-[40px] ${
                        isAccepted
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-primary text-white hover:bg-primary-deep shadow-soft'
                      }`}
                    >
                      {isAccepted ? <CheckCircle size={14} /> : <ArrowRight size={14} />}
                      {isAccepted ? 'Accepted' : 'Accept job'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Footer stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="surface-card p-5 text-center">
            <p className="text-xs text-gray-soft uppercase tracking-wider font-semibold">My accepted</p>
            <p className="text-2xl font-bold text-dark mt-1">{acceptedJobs.size}</p>
          </div>
          <div className="surface-card p-5 text-center">
            <p className="text-xs text-gray-soft uppercase tracking-wider font-semibold">Accepted order total</p>
            <p className="text-2xl font-bold text-primary-deep mt-1">
              ${acceptedTotal.toFixed(2)}
            </p>
            <p className="text-[11px] text-gray-soft mt-0.5">
              Final commission shown in earnings
            </p>
          </div>
          <div className="surface-card p-5 text-center">
            <p className="text-xs text-gray-soft uppercase tracking-wider font-semibold">Open in feed</p>
            <p className="text-2xl font-bold text-dark mt-1">{filteredJobs.length}</p>
          </div>
        </div>
      </main>

      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-dark mb-2">Clear the job list?</h2>
            <p className="text-sm text-gray mb-5">
              This only hides jobs from your local view. Server data isn&rsquo;t changed.
            </p>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-5">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">{jobs.length}</span> job(s) will be hidden.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                disabled={isClearingAll}
                className="btn-outline flex-1 disabled:opacity-50"
              >
                Keep them
              </button>
              <button
                type="button"
                onClick={handleClearAllJobs}
                disabled={isClearingAll}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-amber-600 hover:bg-amber-700 transition min-h-[48px] disabled:opacity-50"
              >
                {isClearingAll ? 'Clearing…' : 'Clear list'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
