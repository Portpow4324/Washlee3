'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { MapPin, Phone, Clock, CheckCircle, User, MessageSquare, AlertCircle } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

function TrackingPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [trackingData, setTrackingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Get current user
  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('[Tracking] Auth state changed. User:', currentUser?.email || 'none')
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Fetch tracking data
  useEffect(() => {
    async function fetchTracking() {
      try {
        if (!orderId) {
          setError('No order ID provided')
          setLoading(false)
          return
        }

        // Wait for auth to be ready
        if (authLoading) {
          console.log('[Tracking] Waiting for auth...')
          return
        }

        if (!user) {
          console.log('[Tracking] No user authenticated')
          setError('Please sign in to view your order')
          setLoading(false)
          return
        }

        console.log('[Tracking] Fetching order:', orderId)
        const idToken = await user.getIdToken(true)
        console.log('[Tracking] Got ID token')

        // Fetch order from API
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          }
        })
        
        if (res.ok) {
          const data = await res.json()
          console.log('[Tracking] Order fetched successfully')
          setTrackingData(data)
          setError('')
        } else {
          console.log('[Tracking] Fetch returned status:', res.status)
          setError('Order not found. Please check your order number.')
        }
      } catch (err) {
        console.error('[Tracking] Error fetching:', err)
        setError('Failed to load tracking information')
      } finally {
        setLoading(false)
      }
    }

    if (orderId && !authLoading && user) {
      fetchTracking()
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchTracking, 30000)
      return () => clearInterval(interval)
    }
  }, [orderId, user, authLoading])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-light flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg">
            <Spinner />
            <p className="mt-4 text-dark font-semibold">Loading tracking information...</p>
            <p className="mt-2 text-sm text-gray">Please wait while we fetch your order status</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error || !trackingData) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-light">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={24} className="text-red-600" />
                <h2 className="text-2xl font-bold text-dark">Unable to Find Order</h2>
              </div>
              <p className="text-gray mb-4">{error || 'Please check your order number and try again.'}</p>
              <div className="bg-yellow-50 p-4 rounded-lg text-sm text-gray">
                <p><strong>Order ID:</strong> {orderId || 'Not provided'}</p>
              </div>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const statusSteps = trackingData.timeline || []
  const currentStatus = trackingData.status
  const createdDate = trackingData.createdAt 
    ? new Date(trackingData.createdAt.seconds ? trackingData.createdAt.seconds * 1000 : trackingData.createdAt).toLocaleDateString()
    : new Date().toLocaleDateString()

  return (
    <>
      <Header />

      <div className="min-h-screen bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-dark mb-2">Order Tracking</h1>
          <p className="text-gray mb-8">Order #{trackingData.orderId} • {createdDate}</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tracking Map & Progress */}
            <div className="lg:col-span-2">
              {/* Map Placeholder */}
              <Card className="mb-6 h-96 bg-gradient-to-br from-mint to-accent flex items-center justify-center text-gray">
                <div className="text-center">
                  <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold opacity-75">Real-time Tracking</p>
                  <p className="text-sm opacity-50">Status: <strong>{currentStatus}</strong></p>
                  <p className="text-xs opacity-50 mt-2">Google Maps integration coming soon</p>
                </div>
              </Card>

              {/* Progress Timeline */}
              <Card>
                <h2 className="text-2xl font-bold text-dark mb-8">Order Progress</h2>

                <div className="space-y-8">
                  {statusSteps.length > 0 ? (
                    statusSteps.map((step: any, index: number) => (
                      <div key={index} className="relative">
                        {/* Timeline Line */}
                        {index !== statusSteps.length - 1 && (
                          <div className="absolute left-4 top-12 w-1 h-12 bg-primary" />
                        )}

                        {/* Step */}
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-white">
                            <CheckCircle size={20} />
                          </div>

                          <div className="flex-1 pb-4">
                            <h3 className="font-bold text-lg text-dark">{step.status}</h3>
                            <p className="text-gray text-sm">{step.message}</p>
                            {step.timestamp && (
                              <div className="flex items-center gap-2 text-sm mt-1">
                                <Clock size={14} />
                                <span className="text-gray">
                                  {new Date(
                                    step.timestamp.seconds ? step.timestamp.seconds * 1000 : step.timestamp
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray">Order confirmed and processing...</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="mb-6">
                <h3 className="font-bold text-lg text-dark mb-4">Order Summary</h3>
                
                <div className="space-y-3 pb-4 border-b border-gray mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray">Order ID</span>
                    <span className="font-semibold text-dark text-sm break-all">{trackingData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Plan</span>
                    <span className="font-semibold text-dark capitalize">{trackingData.plan || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Amount</span>
                    <span className="font-semibold text-dark">${trackingData.amount ? parseFloat(trackingData.amount).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Status</span>
                    <span className="font-semibold text-primary capitalize">{trackingData.status}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray">
                  <div className="flex gap-2">
                    <CheckCircle size={16} className="text-primary flex-shrink-0" />
                    <span>Payment confirmed</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle size={16} className="text-primary flex-shrink-0" />
                    <span>Order processing</span>
                  </div>
                  <div className="flex gap-2">
                    <Clock size={16} className="text-gray flex-shrink-0" />
                    <span>En route to location</span>
                  </div>
                </div>
              </Card>

              {/* Contact Support */}
              <Card>
                <h3 className="font-bold text-lg text-dark mb-4">Need Help?</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <MessageSquare size={20} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-dark text-sm">Message Support</p>
                      <p className="text-xs text-gray">Get help from our team</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Phone size={20} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-dark text-sm">Call Us</p>
                      <p className="text-xs text-gray">1-800-WASHLEE</p>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition text-sm">
                    Contact Support
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackingPageContent />
    </Suspense>
  )
}
