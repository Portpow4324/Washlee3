'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { MapPin, DollarSign, Clock, User, CheckCircle, AlertCircle } from 'lucide-react'

interface Job {
  id: string
  customerName?: string
  location?: string
  estimatedPay: number
  status: string
  distance?: number
  itemCount?: number
  pickupTime?: string
  description?: string
  items?: string[]
}

export default function ProJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptedJobs, setAcceptedJobs] = useState<string[]>([])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        
        // Try to fetch from Firestore
        const jobsRef = collection(db, 'jobs')
        const q = query(jobsRef, where('status', '==', 'available'))
        const snapshot = await getDocs(q)
        
        const fetchedJobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[]
        
        setJobs(fetchedJobs)
      } catch (error) {
        console.error('Error fetching jobs:', error)
        
        // Use demo data
        setJobs([
          {
            id: 'JOB-2024-101',
            customerName: 'Sarah Mitchell',
            location: 'Downtown District, Apt 204',
            estimatedPay: 45.00,
            status: 'available',
            distance: 2.3,
            itemCount: 6,
            pickupTime: '09:00 AM - 12:00 PM',
            description: 'Regular dry cleaning for business attire. Pickup from apartment, delivery to office.',
            items: ['2 Shirts', '3 Pants', '1 Jacket']
          },
          {
            id: 'JOB-2024-102',
            customerName: 'John Davis',
            location: 'West Side Plaza, Suite 100',
            estimatedPay: 52.50,
            status: 'available',
            distance: 5.1,
            itemCount: 8,
            pickupTime: '02:00 PM - 05:00 PM',
            description: 'Bulk laundry including sheets and comforters. Pickup from office, delivery to home.',
            items: ['5 Shirts', '2 Pants', 'Bedding Set', 'Comforter']
          },
          {
            id: 'JOB-2024-103',
            customerName: 'Emily Rodriguez',
            location: 'Midtown Shopping Center',
            estimatedPay: 38.00,
            status: 'available',
            distance: 3.7,
            itemCount: 5,
            pickupTime: '10:00 AM - 02:00 PM',
            description: 'Delicate items requiring special care. Premium service available.',
            items: ['3 Blouses', '2 Dresses', 'Silk Scarf']
          },
          {
            id: 'JOB-2024-104',
            customerName: 'Michael Chen',
            location: 'North Avenue, House',
            estimatedPay: 65.00,
            status: 'available',
            distance: 4.2,
            itemCount: 12,
            pickupTime: '08:00 AM - 11:00 AM',
            description: 'Large load with mixed items. Standard washing and drying.',
            items: ['8 Shirts', '4 Pants', 'Towels', 'Socks']
          },
          {
            id: 'JOB-2024-105',
            customerName: 'Lisa Thompson',
            location: 'East Park Lane',
            estimatedPay: 48.00,
            status: 'available',
            distance: 2.8,
            itemCount: 7,
            pickupTime: '01:00 PM - 04:00 PM',
            description: 'Standard load with express delivery requested.',
            items: ['4 Shirts', '3 Pants', 'Underwear Set']
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const handleAcceptJob = async (jobId: string) => {
    try {
      if (!user) return
      
      // Update job status
      const jobRef = doc(db, 'jobs', jobId)
      await updateDoc(jobRef, {
        status: 'accepted',
        acceptedBy: user.uid,
        acceptedAt: new Date()
      })
      
      // Add to user's accepted jobs
      setAcceptedJobs([...acceptedJobs, jobId])
      
      // Remove from available jobs
      setJobs(jobs.filter(j => j.id !== jobId))
    } catch (error) {
      console.error('Error accepting job:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-dark">Available Jobs</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">Available Jobs</h1>
        <p className="text-gray">Browse and accept orders from customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-gray font-medium">Available Jobs</p>
          <p className="text-3xl font-bold text-dark mt-1">{jobs.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-gray font-medium">Total Earnings Available</p>
          <p className="text-3xl font-bold text-dark mt-1">${jobs.reduce((sum, j) => sum + j.estimatedPay, 0).toFixed(2)}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10">
          <p className="text-sm text-gray font-medium">Avg. Distance</p>
          <p className="text-3xl font-bold text-dark mt-1">{jobs.length > 0 ? (jobs.reduce((sum, j) => sum + (j.distance || 0), 0) / jobs.length).toFixed(1) : 0} mi</p>
        </Card>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 gap-4">
        {jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray mb-4" />
            <p className="text-gray font-semibold">No available jobs</p>
            <p className="text-sm text-gray mt-1">Check back soon for new opportunities</p>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Job Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <User size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-dark">{job.customerName}</p>
                        <p className="text-xs text-gray font-mono">{job.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Job Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray">Location</p>
                        <p className="text-sm font-semibold text-dark">{job.location}</p>
                        {job.distance && <p className="text-xs text-gray mt-1">{job.distance} mi away</p>}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <DollarSign size={16} className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray">Est. Pay</p>
                        <p className="text-sm font-bold text-primary">${job.estimatedPay.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock size={16} className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray">Pickup Time</p>
                        <p className="text-sm font-semibold text-dark">{job.pickupTime}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray">Items</p>
                        <p className="text-sm font-semibold text-dark">{job.itemCount} items</p>
                      </div>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="mb-4 p-3 bg-light rounded-lg">
                    <p className="text-sm text-dark">{job.description}</p>
                  </div>

                  {/* Items List */}
                  <div>
                    <p className="text-xs font-bold text-gray uppercase mb-2">Items to Clean</p>
                    <div className="flex flex-wrap gap-2">
                      {job.items?.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Accept Button */}
                <div className="flex-shrink-0">
                  <Button
                    variant="primary"
                    onClick={() => handleAcceptJob(job.id)}
                    className="whitespace-nowrap"
                  >
                    Accept Job
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
