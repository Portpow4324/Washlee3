'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { MapPin, Phone, Clock, CheckCircle, Package, Truck, Home, AlertCircle, MessageCircle } from 'lucide-react'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface OrderData {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  status: string
  pickupTime: string
  pickupAddress: string
  deliveryAddress: string
  estimatedWeight: number
  detergent: string
  waterTemperature: string
  foldingPreference: string
  specialCare: string
  subtotal: number
  createdAt: any
  deliverySpeed: string
  proName?: string
  proPhone?: string
  proRating?: number
  pickupTimeActual?: string
  deliveryTimeEstimate?: string
}

const statusSteps = [
  { id: 'pending', label: 'Order Placed', icon: Package },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { id: 'picked_up', label: 'Picked Up', icon: Truck },
  { id: 'in_washing', label: 'In Washing', icon: Package },
  { id: 'ready_for_delivery', label: 'Ready', icon: CheckCircle },
  { id: 'delivered', label: 'Delivered', icon: Home },
]

export default function OrderTracking() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'tracking' | 'details' | 'pro'>('tracking')

  const orderId = params.id as string

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!orderId || !user) return

    setLoading(true)
    console.log('[Tracking] Fetching order:', orderId, 'for user:', user.uid)
    
    // Orders are stored at users/{uid}/orders/{orderId}
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid, 'orders', orderId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          console.log('[Tracking] Order found:', data)
          setOrder({ id: docSnap.id, ...data } as OrderData)
          setError('')
        } else {
          console.log('[Tracking] Order not found at path: users/', user.uid, '/orders/', orderId)
          setError('Order not found. Please check your order number.')
        }
        setLoading(false)
      },
      (err: any) => {
        console.error('[Tracking] Error fetching order:', err)
        setError('Failed to load order')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [orderId, user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray">Loading your order...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{error || 'Order not found'}</p>
              <Button size="sm" onClick={() => router.push('/dashboard/customer')} className="mt-4">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.id === order.status)

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">Order Tracking</h1>
          <p className="text-gray">Order ID: {order.id}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray">
          <button
            onClick={() => setTab('tracking')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              tab === 'tracking'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray hover:text-dark'
            }`}
          >
            Tracking
          </button>
          <button
            onClick={() => setTab('details')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              tab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray hover:text-dark'
            }`}
          >
            Order Details
          </button>
          {order.status !== 'pending' && (
            <button
              onClick={() => setTab('pro')}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                tab === 'pro'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray hover:text-dark'
              }`}
            >
              Your Pro
            </button>
          )}
        </div>

        {/* Tracking Tab */}
        {tab === 'tracking' && (
          <div>
            {/* Status Timeline */}
            <div className="mb-12">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-12 bottom-0 w-1 bg-gradient-to-b from-primary to-mint"></div>

                {/* Timeline Steps */}
                <div className="space-y-8">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index <= currentStepIndex
                    const isCurrent = index === currentStepIndex

                    return (
                      <div key={step.id} className="flex gap-6">
                        {/* Circle */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center relative z-10 ${
                          isCompleted
                            ? 'bg-primary text-white'
                            : 'bg-light border-2 border-gray text-gray'
                        }`}>
                          <Icon size={24} />
                        </div>

                        {/* Content */}
                        <div className={`flex-1 py-2 ${isCurrent ? 'border-l-4 border-primary pl-4' : ''}`}>
                          <p className={`font-semibold ${isCurrent ? 'text-primary' : 'text-dark'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-gray mt-1">In progress</p>
                          )}
                          {isCompleted && index < currentStepIndex && (
                            <p className="text-sm text-green-600 mt-1">✓ Completed</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Current Status Card */}
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold text-dark mb-4">
                {order.status === 'pending' && '📋 Order Pending'}
                {order.status === 'confirmed' && '✓ Order Confirmed'}
                {order.status === 'picked_up' && '🚗 Pickup Complete'}
                {order.status === 'in_washing' && '🧺 In Washing'}
                {order.status === 'ready_for_delivery' && '📦 Ready for Delivery'}
                {order.status === 'delivered' && '✅ Delivered'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray mb-1">Scheduled Pickup</p>
                  <p className="text-lg font-semibold text-dark">{order.pickupTime}</p>
                </div>
                {order.deliveryTimeEstimate && (
                  <div>
                    <p className="text-sm text-gray mb-1">Estimated Delivery</p>
                    <p className="text-lg font-semibold text-dark">{order.deliveryTimeEstimate}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Map Placeholder */}
            {order.status !== 'pending' && order.status !== 'delivered' && (
              <Card className="p-8 mb-8 bg-gradient-to-br from-mint to-accent">
                <div className="aspect-video rounded-lg bg-light flex items-center justify-center">
                  <div className="text-center">
                    <MapPin size={48} className="text-primary mx-auto mb-2" />
                    <p className="text-gray font-semibold">Real-time map integration coming soon</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Details Tab */}
        {tab === 'details' && (
          <div className="space-y-6">
            {/* Laundry Preferences */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-dark mb-6">Laundry Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray mb-1">Detergent Type</p>
                  <p className="font-semibold text-dark capitalize">{order.detergent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray mb-1">Water Temperature</p>
                  <p className="font-semibold text-dark capitalize">{order.waterTemperature}</p>
                </div>
                <div>
                  <p className="text-sm text-gray mb-1">Folding Preference</p>
                  <p className="font-semibold text-dark capitalize">{order.foldingPreference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray mb-1">Weight</p>
                  <p className="font-semibold text-dark">{order.estimatedWeight} kg</p>
                </div>
              </div>
              {order.specialCare && (
                <div className="mt-6 p-4 bg-light rounded-lg">
                  <p className="text-sm text-gray mb-2">Special Care Instructions</p>
                  <p className="text-dark">{order.specialCare}</p>
                </div>
              )}
            </Card>

            {/* Addresses */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-dark mb-6">Addresses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin size={20} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray mb-1">Pickup Address</p>
                      <p className="font-semibold text-dark">{order.pickupAddress}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <Home size={20} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray mb-1">Delivery Address</p>
                      <p className="font-semibold text-dark">{order.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing Summary */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-dark mb-6">Pricing Summary</h3>
              <div className="space-y-3 mb-6 pb-6 border-b border-gray">
                <div className="flex justify-between">
                  <span className="text-gray">{order.estimatedWeight} kg @ $3.00/kg:</span>
                  <span className="font-semibold text-dark">${(order.estimatedWeight * 3.0).toFixed(2)}</span>
                </div>
                {order.deliverySpeed === 'same-day' && (
                  <div className="flex justify-between">
                    <span className="text-gray">Same-day Delivery:</span>
                    <span className="font-semibold text-dark">+$5.00</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-dark">Total:</span>
                  <span className="text-primary">${order.subtotal?.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-sm text-gray">Payment method: Credit Card ending in 4242</p>
            </Card>
          </div>
        )}

        {/* Pro Tab */}
        {tab === 'pro' && order.status !== 'pending' && (
          <div>
            {order.proName ? (
              <Card className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-dark">{order.proName}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < Math.floor(order.proRating || 0) ? 'text-yellow-400' : 'text-gray'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray">{order.proRating || 4.9} rating</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-light rounded-lg">
                    <Phone size={20} className="text-primary" />
                    <div>
                      <p className="text-sm text-gray">Phone</p>
                      <p className="font-semibold text-dark">{order.proPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:shadow-lg transition font-semibold">
                    <MessageCircle size={20} />
                    Message Your Pro
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray rounded-lg text-dark hover:bg-light transition font-semibold">
                    <Phone size={20} />
                    Call Your Pro
                  </button>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Clock size={48} className="text-gray mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-dark mb-2">Pro Not Yet Assigned</h3>
                <p className="text-gray">Your Washlee Pro will be assigned shortly</p>
              </Card>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 flex gap-4">
          <Button onClick={() => router.push('/dashboard/customer')} size="lg" className="flex-1">
            Back to Dashboard
          </Button>
          {order.status !== 'delivered' && (
            <button className="flex-1 px-6 py-3 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition">
              Cancel Order
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
