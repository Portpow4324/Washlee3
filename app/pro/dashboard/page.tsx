'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { 
  Briefcase, DollarSign, Star, TrendingUp, MapPin, Clock, CheckCircle, AlertCircle, Settings, Eye
} from 'lucide-react'

interface Job {
  id: string
  status: string
  customer_name: string
  total_price: number
  created_at: string
  scheduled_pickup_date?: string
  delivery_address?: string
  weight?: number
  users?: { phone: string; email: string } | null
}

interface ProStats {
  activeJobs: number
  completedToday: number
  totalEarnings: number
  rating: number
  acceptanceRate: number
}

export default function ProDashboard() {
  const { user, userData, loading } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<ProStats>({
    activeJobs: 0,
    completedToday: 0,
    totalEarnings: 0,
    rating: 4.9,
    acceptanceRate: 98
  })
  const [jobsLoading, setJobsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading || !user) {
      return
    }

    if (userData?.user_type !== 'pro') {
      console.log('[ProDashboard] User is not a pro')
      setJobsLoading(false)
      return
    }

    const loadJobs = async () => {
      try {
        setJobsLoading(true)
        console.log('[ProDashboard] Fetching jobs for pro:', user.id)

        const { data: jobsData, error: jobsError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            total_price,
            created_at,
            scheduled_pickup_date,
            delivery_address,
            weight,
            user_id
          `)
          .eq('pro_id', user.id)
          .in('status', ['confirmed', 'in-transit', 'in_washing', 'pending-pickup'])
          .order('created_at', { ascending: false })
          .limit(20)

        if (jobsError) {
          console.error('[ProDashboard] Error:', jobsError)
          setError('Failed to load jobs')
          setJobsLoading(false)
          return
        }

        const transformedJobs: Job[] = (jobsData || []).map((job: any) => ({
          id: job.id,
          status: job.status,
          customer_name: 'Customer',
          total_price: job.total_price || 0,
          created_at: job.created_at,
          scheduled_pickup_date: job.scheduled_pickup_date,
          delivery_address: job.delivery_address,
          weight: job.weight,
          users: null
        }))

        setJobs(transformedJobs)

        const activeCount = transformedJobs.filter(j => 
          ['in-transit', 'in_washing', 'pending-pickup'].includes(j.status)
        ).length
        const todayCompleted = transformedJobs.filter(j => 
          j.status === 'completed' && new Date(j.created_at).toDateString() === new Date().toDateString()
        ).length
        const totalEarnings = transformedJobs.reduce((sum, job) => sum + (job.total_price || 0), 0)

        setStats({
          activeJobs: activeCount,
          completedToday: todayCompleted,
          totalEarnings,
          rating: 4.9,
          acceptanceRate: 98
        })

        setJobsLoading(false)
      } catch (err) {
        console.error('[ProDashboard] Error:', err)
        setError('Error loading jobs')
        setJobsLoading(false)
      }
    }

    loadJobs()

    const subscription = supabase
      .channel(`pro:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `pro_id=eq.${user.id}` },
        () => loadJobs()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, userData, loading])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in-transit':
      case 'in_washing':
        return 'bg-blue-100 text-blue-700'
      case 'pending-pickup':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending-pickup':
        return <AlertCircle className="w-4 h-4" />
      case 'in-transit':
      case 'in_washing':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Briefcase className="w-4 h-4" />
    }
  }

  const statsList = [
    { label: 'Active Jobs', value: stats.activeJobs.toString(), icon: Briefcase },
    { label: 'Today Completed', value: stats.completedToday.toString(), icon: CheckCircle },
    { label: 'Total Earnings', value: '$' + stats.totalEarnings.toFixed(2), icon: DollarSign },
    { label: 'Rating', value: '⭐ ' + stats.rating + '/5', icon: Star },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-gray font-semibold">Loading your jobs...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (userData?.user_type !== 'pro') {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center border border-red-200">
            <p className="text-red-600 font-semibold mb-4">⚠️ Access Denied</p>
            <p className="text-gray text-sm">You need to be a Washlee Pro to access this page.</p>
            <Link href="/pro" className="inline-block mt-6 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition">
              Become a Pro
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <div className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-bold text-dark mb-2">Welcome back, {userData?.name || 'Pro'}</h1>
            <p className="text-xl text-gray">Manage your jobs and earnings</p>
          </div>
          <Link
            href="/dashboard/settings"
            className="p-3 bg-primary hover:bg-accent text-white rounded-full transition shadow-lg hover:shadow-xl"
            title="Account Settings"
          >
            <Settings size={24} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statsList.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg p-6 border border-gray/10 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray text-sm font-semibold mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-dark">{stat.value}</p>
                  </div>
                  <div className="p-3 bg-mint rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-dark">Active Jobs</h2>
                <span className="text-sm text-gray">{jobs.length} jobs</span>
              </div>

              <div className="space-y-3">
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                  </div>
                ) : jobs.length > 0 ? (
                  jobs.slice(0, 10).map((job) => (
                    <Link
                      key={job.id}
                      href={`/pro/jobs/${job.id}`}
                      className="flex items-center justify-between p-4 bg-light rounded-lg border border-gray/10 hover:border-primary/30 hover:bg-mint/20 transition group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-dark">Order #{job.id.slice(0, 8).toUpperCase()}</h3>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                            {getStatusIcon(job.status)}
                            {job.status.replace(/-/g, ' ').replace(/_/g, ' ')}
                          </div>
                        </div>
                        <p className="text-sm text-gray">
                          <span className="font-semibold">{job.customer_name}</span>
                          {job.weight && ` • ${job.weight}kg`}
                          {job.scheduled_pickup_date && ` • ${new Date(job.scheduled_pickup_date).toLocaleDateString('en-AU')}`}
                        </p>
                        {job.delivery_address && (
                          <p className="text-xs text-gray mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.delivery_address}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-dark text-lg">${job.total_price.toFixed(2)}</p>
                        <button className="mt-2 p-2 bg-primary text-white rounded-lg opacity-0 group-hover:opacity-100 transition">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray font-semibold mb-4">No active jobs</p>
                    <p className="text-sm text-gray">Check back soon for new assignments</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20 p-6">
              <h3 className="font-bold text-dark mb-4">This Week</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray uppercase mb-1">Jobs Completed</p>
                  <p className="text-2xl font-bold text-dark">—</p>
                </div>
                <div className="border-t border-primary/20 pt-3">
                  <p className="text-xs text-gray uppercase mb-1">Weekly Earnings</p>
                  <p className="text-2xl font-bold text-primary">—</p>
                </div>
                <div className="border-t border-primary/20 pt-3">
                  <p className="text-xs text-gray uppercase mb-1">Acceptance Rate</p>
                  <p className="text-2xl font-bold text-dark">—</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray/10 p-6">
              <h3 className="font-bold text-dark mb-3">Account</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray">Email:</span> <span className="text-dark font-semibold truncate">{user.email}</span></p>
                <p><span className="text-gray">Status:</span> <span className="text-green-600 font-semibold">Active</span></p>
                <p><span className="text-gray">Since:</span> <span className="text-dark font-semibold">{new Date(user.created_at || '').toLocaleDateString('en-AU')}</span></p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray/10 p-6">
              <h3 className="font-bold text-dark mb-4">Resources</h3>
              <div className="space-y-2">
                <Link href="/pro/guides" className="block text-primary hover:text-accent font-semibold text-sm">
                  Pro Guides →
                </Link>
                <Link href="/support" className="block text-primary hover:text-accent font-semibold text-sm">
                  Support Center →
                </Link>
                <Link href="/pro/earnings" className="block text-primary hover:text-accent font-semibold text-sm">
                  Earnings Details →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
