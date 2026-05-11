'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { MapPin, Phone, Mail, Package, DollarSign, Calendar, Clock, Navigation, ArrowLeft, Loader } from 'lucide-react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import EmployeeOrderMap from '@/components/EmployeeOrderMap'

interface OrderData {
  id: string
  status: string
  totalPrice: number
  weight: number
  items: any
  pickupAddress: string
  deliveryAddress: string
  serviceAddress?: string
  scheduledPickupDate: string
  scheduledDeliveryDate?: string
  deliveryTimeSlot?: string
  pickupTimeStatus?: string
  createdAt?: string
  updatedAt?: string
  job?: {
    id: string
    status: string
    postedAt?: string
    acceptedAt?: string
    updatedAt?: string
  } | null
  customer?: {
    first_name?: string
    last_name?: string
    phone: string
    email: string
  }
  pro?: {
    first_name?: string
    last_name?: string
    phone: string
    email: string
  }
}

export default function EmployeeOrderDetails() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [orderLoading, setOrderLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  const orderId = params?.orderId as string

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return

    setHasCheckedAuth(true)

    if (!user) {
      router.push('/auth/employee-signin')
      return
    }
  }, [user, loading, router, hasCheckedAuth])

  // Fetch order details
  useEffect(() => {
    if (!orderId) {
      setError('Order ID not provided')
      setOrderLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        setOrderLoading(true)
        const { data: sessionData } = await supabase.auth.getSession()
        const response = await fetch(`/api/orders/details?orderId=${orderId}`, {
          headers: sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : undefined,
        })
        
        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Failed to load order')
          setOrderLoading(false)
          return
        }

        const data = await response.json()
        setOrder(data)
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Failed to load order details')
      } finally {
        setOrderLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray font-semibold">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-accent mb-6 transition"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <Card className="bg-red-50 border border-red-200">
          <div className="text-center">
            <p className="text-red-600 font-semibold">⚠️ Error</p>
            <p className="text-gray mt-2">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-accent mb-6 transition"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <Card className="bg-yellow-50 border border-yellow-200">
          <div className="text-center">
            <p className="text-yellow-600 font-semibold">Order not found</p>
          </div>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'in-transit':
      case 'in_washing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-700'
      case 'pending-payment':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const parseItems = (items: any) => {
    if (typeof items === 'string') {
      try {
        return JSON.parse(items)
      } catch (e) {
        return items
      }
    }
    return items || {}
  }

  const itemsData = parseItems(order.items)
  const deliveryDate = order.scheduledDeliveryDate || itemsData?.deliveryDate
  const deliveryWindow = order.deliveryTimeSlot || itemsData?.deliveryTimeSlot

  const formatDate = (value?: string) => {
    if (!value) return 'Not provided'
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-AU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (value?: string) => {
    if (!value) return 'Not provided'
    return new Date(value).toLocaleString('en-AU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Head>
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
          async
          defer
        ></script>
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-accent mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-4xl font-bold text-white">Order Details</h1>
          <p className="text-gray mt-2">Order #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(order.status)}`}>
          {order.status.replace(/-/g, ' ').toUpperCase()}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="bg-slate-800 border border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Customer Information</h3>
              <Mail size={20} className="text-primary" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray text-sm uppercase">Name</p>
                <p className="text-white font-semibold">
                  {order.customer?.first_name || order.customer?.last_name
                    ? `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim()
                    : 'Not provided'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray text-sm uppercase flex items-center gap-1">
                    <Phone size={14} /> Phone
                  </p>
                  <p className="text-white font-semibold">{order.customer?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray text-sm uppercase">Email</p>
                  <p className="text-white font-semibold text-sm break-all">{order.customer?.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Pickup & Delivery Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pickup Address */}
            <Card className="bg-slate-800 border border-slate-700">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Pickup Location</h3>
                  <p className="text-gray text-sm">Customer's address</p>
                </div>
              </div>
              <p className="text-white text-sm leading-relaxed">{order.pickupAddress || 'Not provided'}</p>
              {order.scheduledPickupDate && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-gray text-sm uppercase flex items-center gap-2">
                    <Calendar size={14} /> Scheduled Pickup
                  </p>
                  <p className="text-white font-semibold">
                    {formatDate(order.scheduledPickupDate)}
                  </p>
                  <p className="text-gray text-xs mt-1">Pickup time: pro to confirm with customer</p>
                </div>
              )}
            </Card>

            {/* Service Address */}
            <Card className="bg-slate-800 border border-slate-700">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Navigation size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Service Address</h3>
                  <p className="text-gray text-sm">Where to perform laundry services</p>
                </div>
              </div>
              <p className="text-white text-sm leading-relaxed">{order.serviceAddress || 'Not provided'}</p>
              {(deliveryDate || deliveryWindow) && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-gray text-sm uppercase flex items-center gap-2">
                    <Calendar size={14} /> Scheduled Delivery
                  </p>
                  <p className="text-white font-semibold">
                    {deliveryDate ? formatDate(deliveryDate) : 'Date not provided'}
                    {deliveryWindow ? `, ${deliveryWindow}` : ''}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Laundry Details */}
          <Card className="bg-slate-800 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Laundry Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray text-sm uppercase">Weight</p>
                <p className="text-white font-bold text-2xl">{order.weight} kg</p>
              </div>
              <div>
                <p className="text-gray text-sm uppercase">Service Type</p>
                <p className="text-white font-semibold capitalize">
                  {itemsData?.service_type || 'Standard'}
                </p>
              </div>
              <div>
                <p className="text-gray text-sm uppercase">Delivery Speed</p>
                <p className="text-white font-semibold capitalize">
                  {itemsData?.delivery_speed || 'Standard'}
                </p>
              </div>
              {itemsData?.special_requests && (
                <div className="col-span-1 md:col-span-2">
                  <p className="text-gray text-sm uppercase">Special Requests</p>
                  <p className="text-white text-sm">{itemsData.special_requests}</p>
                </div>
              )}
            </div>

            {/* Items List */}
            {itemsData?.items && Array.isArray(itemsData.items) && itemsData.items.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-gray text-sm uppercase mb-3">Items</p>
                <div className="space-y-2">
                  {itemsData.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm bg-slate-900 p-2 rounded">
                      <span className="text-white">
                        {item.name || item.type || `Item ${idx + 1}`}
                        {item.quantity && ` (x${item.quantity})`}
                      </span>
                      {item.price && <span className="text-primary font-semibold">${item.price}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Map - Google Maps will be displayed here */}
          <Card className="bg-slate-800 border border-slate-700 p-0 overflow-hidden">
            <EmployeeOrderMap
              pickupAddress={order.pickupAddress || ''}
              deliveryAddress={order.deliveryAddress}
              mapId="employee-order-map"
              height="400px"
            />
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Pricing Summary */}
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/30 rounded-lg">
                <DollarSign size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm text-gray uppercase">Total Amount</h3>
                <p className="text-3xl font-bold text-primary">${order.totalPrice.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          {/* Quick Info */}
          <Card className="bg-slate-800 border border-slate-700 space-y-4">
            <div>
              <p className="text-gray text-sm uppercase">Order ID</p>
              <p className="text-white font-mono text-sm break-all">{order.id}</p>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <p className="text-gray text-sm uppercase flex items-center gap-2">
                <Clock size={14} /> Created
              </p>
              <p className="text-white font-semibold text-sm">{formatDateTime(order.createdAt)}</p>
            </div>
            {order.updatedAt && (
              <div className="border-t border-slate-700 pt-4">
                <p className="text-gray text-sm uppercase flex items-center gap-2">
                  <Clock size={14} /> Last Updated
                </p>
                <p className="text-white font-semibold text-sm">{formatDateTime(order.updatedAt)}</p>
              </div>
            )}
            {order.job?.postedAt && (
              <div className="border-t border-slate-700 pt-4">
                <p className="text-gray text-sm uppercase flex items-center gap-2">
                  <Clock size={14} /> Job Posted
                </p>
                <p className="text-white font-semibold text-sm">{formatDateTime(order.job.postedAt)}</p>
              </div>
            )}
            {order.job?.acceptedAt && (
              <div className="border-t border-slate-700 pt-4">
                <p className="text-gray text-sm uppercase flex items-center gap-2">
                  <Clock size={14} /> Accepted
                </p>
                <p className="text-white font-semibold text-sm">{formatDateTime(order.job.acceptedAt)}</p>
              </div>
            )}
            <div className="border-t border-slate-700 pt-4">
              <p className="text-gray text-sm uppercase">Status</p>
              <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                {order.status.replace(/-/g, ' ')}
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => {
                // Mark as picked up or start delivery
                console.log('Mark as picked up')
              }}
            >
              Start Pickup
            </Button>
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => router.back()}
            >
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
