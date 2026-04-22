'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Footer from '@/components/Footer'
import { Briefcase, MapPin, DollarSign, Clock, CheckCircle, Search, Filter, Package, Eye } from 'lucide-react'
import Link from 'next/link'

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
  items?: any
}

export default function EmployeeJobs() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
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

  // Fetch available jobs
  useEffect(() => {
    if (!user?.id) return

    const fetchJobs = async () => {
      try {
        setJobsLoading(true)
        
        // Use the API endpoint instead of direct Supabase query
        const response = await fetch(`/api/employee/available-jobs?employeeId=${user.id}&limit=50`)
        const result = await response.json()
        
        if (!response.ok || !result.success) {
          console.error('Error fetching jobs:', result.error)
          setJobs([])
          return
        }

        const jobsData = result.data || []
        setJobs(jobsData)
        
        // Load user's accepted jobs
        const userJobs = jobsData.filter((j: JobData) => j.pro_id === user.id)
        setAcceptedJobs(new Set(userJobs.map((j: JobData) => j.id)))
        
        // Fetch order details for each job
        const details: Record<string, OrderDetails> = {}
        for (const job of jobsData) {
          if (!job.order_id) {
            console.warn('Job missing order_id:', job.id)
            continue
          }
          
          try {
            const orderResponse = await fetch(`/api/orders/details?orderId=${job.order_id}`)
            if (orderResponse.ok) {
              const orderData = await orderResponse.json()
              details[job.order_id] = {
                totalPrice: orderData.totalPrice || 0,
                weight: orderData.weight || 0,
                items: orderData.items
              }
            } else {
              console.warn('Failed to fetch order details for', job.order_id)
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
    
    // Auto-refresh jobs every 10 seconds to keep dashboard in sync
    const refreshInterval = setInterval(fetchJobs, 10000)
    
    return () => clearInterval(refreshInterval)
  }, [user?.id])

  const getJobDetails = (job: JobData) => {
    const orderData = orderDetails[job.order_id]
    
    if (orderData) {
      // Get service info from items
      // service_type = laundry service (e.g., "standard", "premium")
      // delivery_speed = delivery speed (e.g., "express", "standard", "next-day")
      const items = orderData.items || {}
      const laundryService = items.service_type || 'standard'
      const deliverySpeed = items.delivery_speed || 'standard'
      
      return { 
        weight: orderData.weight, 
        service_type: laundryService,
        delivery_speed: deliverySpeed,
        estimatedPrice: orderData.totalPrice
      }
    }
    
    // Fallback to estimate if order data not available
    const estimatedWeight = 5
    const pricePerKg = 4.80
    const estimatedPrice = estimatedWeight * pricePerKg
    
    return { 
      weight: estimatedWeight, 
      service_type: 'standard',
      delivery_speed: 'standard',
      estimatedPrice: estimatedPrice
    }
  }

  const getJobAddress = (address: any) => {
    return 'Address not provided'
  }

  const filteredJobs = jobs.filter((job: JobData) => {
    const matchesSearch = 
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.order_id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    const isAccepted = acceptedJobs.has(job.id)
    const matchesFilter = filterType === 'all' || (filterType === 'available' && !isAccepted) || (filterType === 'accepted' && isAccepted)
    return matchesSearch && matchesFilter
  })

  const handleAcceptJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/employee/available-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          employeeId: user?.id,
          action: 'accept'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Update local state for immediate UI feedback
        const newAccepted = new Set(acceptedJobs)
        if (newAccepted.has(jobId)) {
          newAccepted.delete(jobId)
        } else {
          newAccepted.add(jobId)
        }
        setAcceptedJobs(newAccepted)
        
        // Update the jobs array with the new status
        setJobs(jobs.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                pro_id: user?.id || null, 
                status: result.data?.status || 'accepted'
              }
            : job
        ))
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
        body: JSON.stringify({
          jobId: jobId,
          employeeId: user?.id
        })
      })
      
      if (response.ok) {
        // Remove the job from display
        setJobs(jobs.filter(job => job.id !== jobId))
        // Remove order details for this job
        const jobToRemove = jobs.find(j => j.id === jobId)
        if (jobToRemove && jobToRemove.order_id) {
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
      // Clear all jobs from display
      setJobs([])
      setOrderDetails({})
      setAcceptedJobs(new Set())
      setShowClearAllConfirm(false)
      console.log('All jobs cleared from display')
    } catch (error) {
      console.error('Error clearing jobs:', error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsClearingAll(false)
    }
  }

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-dark font-semibold">Loading available jobs...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-dark flex items-center gap-3">
              <Briefcase size={36} className="text-primary" />
              Available Jobs
            </h1>
            <p className="text-gray text-lg">{filteredJobs.length} jobs available • {jobs.length} total</p>
          </div>
          {jobs.length > 0 && (
            <button
              onClick={() => setShowClearAllConfirm(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={isClearingAll}
            >
              {isClearingAll ? 'Clearing...' : 'Clear All'}
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 text-gray" size={20} />
            <input
              type="text"
              placeholder="Search by customer name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 text-dark rounded-lg focus:outline-none focus:border-primary transition"
            >
              <option value="all">All Jobs</option>
              <option value="available">Available</option>
              <option value="accepted">My Jobs</option>
            </select>
          </div>
        </div>

        {jobsLoading ? (
          <Card className="bg-mint border-primary/20 text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray text-lg">Loading jobs...</p>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card className="bg-mint border-primary/20 text-center py-12">
            <Briefcase size={48} className="text-gray mx-auto mb-4 opacity-50" />
            <p className="text-gray text-lg">No jobs found</p>
            <p className="text-gray text-sm mt-2">Check back soon for more opportunities!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => {
              const isAccepted = acceptedJobs.has(job.id)
              const details = getJobDetails(job)
              return (
                <Card
                  key={job.id}
                  className={`bg-white border-gray-200 hover:border-primary/50 transition ${
                    isAccepted ? 'ring-2 ring-green-500/30' : ''
                  }`}
                  hoverable
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-dark">{job.order_id.slice(0, 8)}</p>
                          {isAccepted && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-600 text-xs font-semibold rounded border border-green-500/30 flex items-center gap-1">
                              <CheckCircle size={12} />
                              Accepted
                            </span>
                          )}
                        </div>
                        <p className="text-gray text-sm">Order {job.order_id.slice(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${details.estimatedPrice.toFixed(2)}</p>
                        <p className="text-gray text-xs">Est. 2 hours</p>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-2 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-primary" />
                          <div className="text-sm">
                            <p className="text-gray text-xs">Weight</p>
                            <p className="text-dark font-semibold">{details.weight}kg</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-primary" />
                          <div className="text-sm">
                            <p className="text-gray text-xs">Status</p>
                            <p className="text-dark font-semibold capitalize">{job.status}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-primary mt-1 flex-shrink-0" />
                        <div className="text-sm flex-1">
                          <p className="text-gray text-xs">Order ID</p>
                          <p className="text-dark font-semibold text-xs">{job.order_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Service Type */}
                    <div className="space-y-2 border-t border-gray-200 pt-4">
                      <p className="text-gray text-xs font-semibold uppercase">Service Details</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded font-semibold capitalize">
                          {details.service_type} Laundry
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-semibold capitalize">
                          {details.delivery_speed} Delivery
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex gap-2">
                      <Link
                        href={`/employee/orders/${job.order_id}`}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        View Details
                      </Link>
                      {!isAccepted && (
                        <button
                          onClick={() => handleDenyJob(job.id)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                        >
                          Deny
                        </button>
                      )}
                      <Button
                        onClick={() => handleAcceptJob(job.id)}
                        className={`flex-1 ${
                          isAccepted
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gradient-to-r from-primary to-accent'
                        }`}
                        size="lg"
                      >
                        {isAccepted ? '✓ Accepted' : 'Accept Job'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/40 text-center">
            <p className="text-gray text-sm uppercase font-semibold">Your Accepted Jobs</p>
            <p className="text-3xl font-bold text-primary mt-2">{acceptedJobs.size}</p>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/40 text-center">
            <p className="text-gray text-sm uppercase font-semibold">Potential Earnings</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ${filteredJobs.filter(j => acceptedJobs.has(j.id)).reduce((sum: number, j) => sum + getJobDetails(j).estimatedPrice, 0).toFixed(2)}
            </p>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-center">
            <p className="text-gray text-sm uppercase font-semibold">Available Opportunities</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{filteredJobs.length}</p>
          </Card>
        </div>
      </main>

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-dark mb-2">Clear All Jobs?</h2>
              <p className="text-gray mb-6">
                This will remove all available jobs from the display. This action is temporary and is intended for clearing old job listings.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-700">
                  <span className="font-semibold">{jobs.length}</span>
                  {' '}job(s) will be removed from display
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearAllConfirm(false)}
                  disabled={isClearingAll}
                  className="flex-1 px-4 py-2 border border-gray-300 text-dark rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Keep Jobs
                </button>
                <button
                  onClick={handleClearAllJobs}
                  disabled={isClearingAll}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClearingAll ? 'Clearing...' : 'Yes, Clear All'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  )
}

