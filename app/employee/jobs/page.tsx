'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Briefcase, MapPin, DollarSign, Clock, CheckCircle, Search, Filter, AlertCircle } from 'lucide-react'

export default function EmployeeJobs() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return
    
    setHasCheckedAuth(true)
    
    if (!user) {
      router.push('/auth/employee-signin')
    }
  }, [user, loading, router, hasCheckedAuth])

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark via-slate-900 to-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading available jobs...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Mock jobs data
  const allJobs = [
    {
      id: 'JOB-2001',
      customer: 'Sarah Mitchell',
      type: 'available',
      weight: '6 kg',
      rate: '$18.00',
      pickup: 'Today 4:00 PM',
      location: '123 Main St',
      distance: '2.3 km',
      services: ['Standard Wash', 'Fold & Hang'],
      rush: true,
      postedTime: '30 mins ago',
      estimatedTime: '2 hours'
    },
    {
      id: 'JOB-2002',
      customer: 'John Davis',
      type: 'available',
      weight: '8 kg',
      rate: '$24.00',
      pickup: 'Tomorrow 2:00 PM',
      location: '456 Oak Ave',
      distance: '1.8 km',
      services: ['Delicate Care', 'Hand Wash'],
      rush: false,
      postedTime: '1 hour ago',
      estimatedTime: '3 hours'
    },
    {
      id: 'JOB-2003',
      customer: 'Emma Johnson',
      type: 'available',
      weight: '5 kg',
      rate: '$15.00',
      pickup: 'Today 6:00 PM',
      location: '789 Pine Rd',
      distance: '3.1 km',
      services: ['Standard Wash', 'Express Dry'],
      rush: false,
      postedTime: '45 mins ago',
      estimatedTime: '2.5 hours'
    },
    {
      id: 'JOB-2004',
      customer: 'Michael Chen',
      type: 'available',
      weight: '7 kg',
      rate: '$21.00',
      pickup: 'Tomorrow 10:00 AM',
      location: '321 Elm St',
      distance: '1.2 km',
      services: ['Standard Wash'],
      rush: true,
      postedTime: '2 hours ago',
      estimatedTime: '2 hours'
    },
    {
      id: 'JOB-2005',
      customer: 'Lisa Anderson',
      type: 'available',
      weight: '4 kg',
      rate: '$12.00',
      pickup: 'Today 5:30 PM',
      location: '654 Birch Ln',
      distance: '2.8 km',
      services: ['Standard Wash'],
      rush: false,
      postedTime: '20 mins ago',
      estimatedTime: '1.5 hours'
    }
  ]

  const filteredJobs = allJobs.filter(job => {
    const matchesSearch = 
      job.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || job.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleAcceptJob = (jobId: string) => {
    const newAccepted = new Set(acceptedJobs)
    if (newAccepted.has(jobId)) {
      newAccepted.delete(jobId)
    } else {
      newAccepted.add(jobId)
    }
    setAcceptedJobs(newAccepted)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <Briefcase size={36} className="text-primary" />
          Available Jobs
        </h1>
        <p className="text-gray text-lg">{filteredJobs.length} jobs available • Earn up to {Math.max(...allJobs.map(j => parseInt(j.rate.replace('$', ''))))} per job</p>
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-primary transition"
          >
            <option value="all">All Jobs</option>
            <option value="available">Available</option>
            <option value="accepted">My Jobs</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.length === 0 ? (
          <Card className="col-span-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 text-center py-12">
            <Briefcase size={48} className="text-gray mx-auto mb-4 opacity-50" />
            <p className="text-gray text-lg">No jobs found</p>
            <p className="text-gray text-sm mt-2">Check back soon for more opportunities!</p>
          </Card>
        ) : (
          filteredJobs.map((job) => {
            const isAccepted = acceptedJobs.has(job.id)
            return (
              <Card
                key={job.id}
                className={`bg-gradient-to-br ${
                  isAccepted
                    ? 'from-green-900/30 to-emerald-900/30 border-green-500/40'
                    : 'from-gray-800/50 to-gray-900/50 border-gray-700 hover:border-primary/50'
                } transition`}
                hoverable
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{job.id}</p>
                        {job.rush && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded border border-red-500/30">
                            Rush Order
                          </span>
                        )}
                        {isAccepted && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded border border-green-500/30 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Accepted
                          </span>
                        )}
                      </div>
                      <p className="text-gray text-sm">{job.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{job.rate}</p>
                      <p className="text-gray text-xs">{job.estimatedTime}</p>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-primary" />
                        <div className="text-sm">
                          <p className="text-gray text-xs">Weight</p>
                          <p className="text-white font-semibold">{job.weight}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary" />
                        <div className="text-sm">
                          <p className="text-gray text-xs">Pickup</p>
                          <p className="text-white font-semibold">{job.pickup.split(' ').slice(-2).join(' ')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-primary mt-1 flex-shrink-0" />
                      <div className="text-sm flex-1">
                        <p className="text-gray text-xs">Location</p>
                        <p className="text-white font-semibold">{job.location}</p>
                        <p className="text-gray text-xs mt-1">{job.distance} away</p>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <p className="text-gray text-xs font-semibold uppercase">Services</p>
                    <div className="flex flex-wrap gap-2">
                      {job.services.map((service) => (
                        <span key={service} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded font-semibold">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Posted Time */}
                  <div className="text-xs text-gray border-t border-white/10 pt-4">
                    Posted {job.postedTime}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleAcceptJob(job.id)}
                    className={`w-full ${
                      isAccepted
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gradient-to-r from-primary to-accent hover:shadow-lg'
                    }`}
                    size="lg"
                  >
                    {isAccepted ? '✓ Job Accepted' : 'Accept This Job'}
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/40 text-center">
          <p className="text-gray text-sm uppercase font-semibold">Your Accepted Jobs</p>
          <p className="text-3xl font-bold text-primary mt-2">{acceptedJobs.size}</p>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/40 text-center">
          <p className="text-gray text-sm uppercase font-semibold">Potential Earnings</p>
          <p className="text-3xl font-bold text-green-400 mt-2">
            ${filteredJobs.filter(j => acceptedJobs.has(j.id)).reduce((sum, j) => sum + parseInt(j.rate.replace('$', '')), 0)}.00
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-center">
          <p className="text-gray text-sm uppercase font-semibold">Available Opportunities</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{filteredJobs.length}</p>
        </Card>
      </div>
    </div>
  )
}

// Import Package icon
import { Package } from 'lucide-react'
