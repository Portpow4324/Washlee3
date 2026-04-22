'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Link from 'next/link'
import { MapPin, Briefcase, AlertCircle } from 'lucide-react'

interface Job {
  id: string
  order_id: string
  status: string
  posted_at: string
}

interface OrderData {
  id: string
  user_id: string
  total_price: number
  pickup_address: string
  delivery_address: string
  weight?: string
  scheduled_pickup_date: string
}

export default function JobsPage() {
  const { user, userData, loading } = useAuth()
  const [jobs, setJobs] = useState<(Job & OrderData)[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading || !user) return

    if (userData?.user_type !== 'pro') {
      setJobsLoading(false)
      return
    }

    const loadJobs = async () => {
      try {
        setJobsLoading(true)
        
        // Call API endpoint with service role to bypass RLS
        const response = await fetch(`/api/employee/available-jobs?employeeId=${user.id}`)
        const apiData = await response.json()
        
        if (!response.ok || !apiData.success) {
          console.error('Jobs fetch error:', apiData.error)
          setError('Failed to load available jobs')
          setJobsLoading(false)
          return
        }
        
        const jobsData = apiData.data || []
        
        // Fetch order details for each job
        if (jobsData && jobsData.length > 0) {
          const orderIds = jobsData.map((job: any) => job.order_id)
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select(`
              id,
              user_id,
              total_price,
              pickup_address,
              delivery_address,
              items,
              scheduled_pickup_date,
              status
            `)
            .in('id', orderIds)
            .not('status', 'eq', 'cancelled')

          if (ordersError) {
            console.error('Orders error:', ordersError)
            setError('Failed to load job details')
            setJobsLoading(false)
            return
          }

          // Combine job and order data, parsing weight from items JSON
          const combined = jobsData.map((job: any) => {
            const order = ordersData?.find((o: any) => o.id === job.order_id)
            const weight = order?.items ? (JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items))?.weight || 0) : 0
            return {
              ...job,
              ...order,
              weight,
            }
          })

          setJobs(combined)
        } else {
          setJobs([])
        }

        setJobsLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('Error loading jobs')
        setJobsLoading(false)
      }
    }

    loadJobs()
  }, [user, userData, loading])

  const handleAcceptJob = async (jobId: string) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('pro_jobs')
        .update({ pro_id: user.id, status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', jobId)

      if (error) {
        alert('Failed to accept job')
        return
      }

      setJobs(jobs.filter(j => j.id !== jobId))
      alert('Job accepted! You can view it in "My Orders".')
    } catch (err) {
      console.error('Error:', err)
      alert('Error accepting job')
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#1f2d2b] mb-8">Available Jobs</h1>

          {jobsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#48C9B0] mx-auto mb-4"></div>
              <p className="text-[#6b7b78]">Finding jobs...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg p-6 border border-gray-200 hover:border-[#48C9B0] transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-[#1f2d2b] text-lg">Order #{job.order_id?.slice(0, 8)}</h3>
                    </div>
                    {job.total_price && (
                      <p className="text-[#48C9B0] font-bold text-lg">${job.total_price.toFixed(2)}</p>
                    )}
                  </div>

                  <div className="space-y-2 mb-6 text-sm text-[#6b7b78]">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-[#1f2d2b]">Pickup: {job.pickup_address}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-[#1f2d2b]">Delivery: {job.delivery_address}</span>
                    </p>
                    {job.weight && (
                      <p className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {job.weight}kg
                      </p>
                    )}
                    {job.scheduled_pickup_date && (
                      <p className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {new Date(job.scheduled_pickup_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleAcceptJob(job.id)}
                    className="w-full bg-[#48C9B0] hover:bg-[#7FE3D3] text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Accept Job
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-[#6b7b78] mb-4">No available jobs right now</p>
              <p className="text-[#6b7b78] text-sm mb-6">Check back later or adjust your service area</p>
              <Link href="/pro/dashboard" className="text-[#48C9B0] hover:text-[#7FE3D3] font-semibold">
                → Back to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
