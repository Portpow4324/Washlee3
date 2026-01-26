'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { MapPin, Phone, Clock, CheckCircle, User, MessageSquare, AlertCircle } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function TrackingContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') || 'demo-order'

  const [trackingData, setTrackingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch tracking data
  useEffect(() => {
    async function fetchTracking() {
      try {
        const res = await fetch(`/api/tracking/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setTrackingData(data)
        } else {
          setError('Order not found')
        }
      } catch (err) {
        setError('Failed to load tracking information')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchTracking()
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchTracking, 30000)
      return () => clearInterval(interval)
    }
  }, [orderId])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-light flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block px-6 py-3 bg-primary text-white rounded-lg">
              Loading tracking information...
            </div>
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
            </Card>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const statusSteps = trackingData.timeline || []
  const currentStatus = trackingData.status
  const pro = trackingData.pro

  return (
    <>
      <Header />

      <div className="min-h-screen bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-dark mb-2">Order Tracking</h1>
          <p className="text-gray mb-8">Order #{trackingData.orderId} • {new Date().toLocaleDateString()}</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tracking Map & Progress */}
            <div className="lg:col-span-2">
              {/* Map Placeholder */}
              <Card className="mb-6 h-96 bg-gradient-to-br from-mint to-accent flex items-center justify-center text-gray">
                <div className="text-center">
                  <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold opacity-75">Real-time Map</p>
                  <p className="text-sm opacity-50">Location tracking integrated</p>
                  {pro?.location && (
                    <p className="text-xs opacity-50 mt-2">Pro is on the way</p>
                  )}
                </div>
              </Card>

              {/* Progress Timeline */}
              <Card>
                <h2 className="text-2xl font-bold text-dark mb-8">Order Progress</h2>

                <div className="space-y-8">
                  {statusSteps.map((step: any, index: number) => (
                    <div key={step.step} className="relative">
                      {/* Timeline Line */}
                      {index !== statusSteps.length - 1 && (
                        <div
                          className={`absolute left-4 top-12 w-1 h-12 ${
                            step.completed ? 'bg-primary' : 'bg-gray'
                          }`}
                        />
                      )}

                      {/* Step */}
                      <div className="flex gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            step.completed
                              ? 'bg-primary text-white'
                              : 'bg-light border-2 border-gray text-gray'
                          }`}
                        >
                          {step.completed ? (
                            <CheckCircle size={20} />
                          ) : (
                            <div className="w-2 h-2 bg-gray rounded-full" />
                          )}
                        </div>

                        <div className="flex-1 pb-4">
                          <h3 className={`font-bold text-lg ${step.completed ? 'text-dark' : 'text-gray'}`}>
                            {step.label}
                          </h3>
                          {step.completed && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <Clock size={14} />
                              <span className="text-gray">Completed</span>
                            </div>
                          )}
                          {!step.completed && step.step === currentStatus && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <Clock size={14} />
                              <span className="text-primary font-semibold">In Progress</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div>
              {/* Order Details */}
              <Card className="mb-6">
                <h3 className="font-bold text-lg text-dark mb-4">Order Details</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray mb-1">Order ID</p>
                    <p className="font-semibold text-dark">#{trackingData.orderId}</p>
                  </div>
                  <div>
                    <p className="text-gray mb-1">Pickup Date</p>
                    <p className="font-semibold text-dark">
                      {trackingData.pickupDate ? new Date(trackingData.pickupDate).toLocaleDateString() : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray mb-1">Delivery Date</p>
                    <p className="font-semibold text-dark">
                      {trackingData.deliveryDate ? new Date(trackingData.deliveryDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray mb-1">Status</p>
                    <p className="font-semibold text-dark bg-light px-3 py-1 rounded-full inline-block capitalize">
                      {currentStatus}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Pro Information */}
              {pro ? (
                <Card className="mb-6">
                  <h3 className="font-bold text-lg text-dark mb-4">Your Washlee Pro</h3>

                  <div className="flex items-center gap-3 mb-4">
                    {pro.avatar ? (
                      <img src={pro.avatar} alt={pro.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        {pro.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-dark">{pro.name}</p>
                        {pro.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓ Verified</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-sm ${i < Math.round(pro.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-gray ml-1">{pro.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <a href={`tel:${pro.phone}`} className="flex items-center gap-3 p-3 bg-light rounded-lg hover:bg-gray transition text-dark">
                      <Phone size={18} className="text-primary" />
                      <span className="text-sm font-semibold">Call Pro</span>
                    </a>
                    <button className="w-full flex items-center gap-3 p-3 bg-light rounded-lg hover:bg-gray transition text-dark">
                      <MessageSquare size={18} className="text-primary" />
                      <span className="text-sm font-semibold">Message</span>
                    </button>
                  </div>
                </Card>
              ) : (
                <Card className="mb-6">
                  <p className="text-gray text-sm">Pro will be assigned shortly</p>
                </Card>
              )}

              {/* Help */}
              <Card>
                <h3 className="font-bold text-lg text-dark mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-light rounded-lg hover:bg-gray transition text-dark text-sm font-semibold">
                    Report an Issue
                  </button>
                  <button className="w-full text-left p-3 bg-light rounded-lg hover:bg-gray transition text-dark text-sm font-semibold">
                    Contact Support
                  </button>
                  <button className="w-full text-left p-3 bg-light rounded-lg hover:bg-gray transition text-dark text-sm font-semibold">
                    View FAQ
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

export default function OrderTracking() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <TrackingContent />
    </Suspense>
  )
}
