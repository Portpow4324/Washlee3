'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Truck, MapPin, Clock, DollarSign, LogOut, Gift, FileText, Settings, AlertCircle } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

interface Order {
  id: string
  status: string
  pickupTime: string
  estimatedWeight: number
  subtotal: number
  deliverySpeed: string
  deliveryAddress: string
  createdAt: any
}

export default function CustomerDashboard() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return
      
      try {
        setOrdersLoading(true)
        const ordersRef = collection(db, 'orders')
        const q = query(ordersRef, where('userId', '==', user.uid))
        const querySnapshot = await getDocs(q)
        
        const fetchedOrders: Order[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Order))
        
        setOrders(fetchedOrders.sort((a, b) => b.createdAt - a.createdAt))
        setOrdersError('')
      } catch (err) {
        console.error('Error fetching orders:', err)
        setOrdersError('Failed to load orders')
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-teal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-dark mb-2">Welcome, {userData?.name || 'Customer'}!</h1>
            <p className="text-gray">Manage your laundry orders and account</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card hoverable className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Active Orders</p>
                <p className="text-3xl font-bold text-dark">{orders.filter(o => o.status !== 'delivered').length}</p>
              </div>
              <Truck size={32} className="text-teal" />
            </div>
          </Card>
          <Card hoverable className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-dark">${orders.reduce((sum, o) => sum + (o.subtotal || 0), 0).toFixed(2)}</p>
              </div>
              <DollarSign size={32} className="text-teal" />
            </div>
          </Card>
          <Card hoverable className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Completed Orders</p>
                <p className="text-3xl font-bold text-dark">{orders.filter(o => o.status === 'delivered').length}</p>
              </div>
              <Clock size={32} className="text-teal" />
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="flex border-b border-gray">
            {[
              { id: 'orders', label: 'Orders', icon: Truck },
              { id: 'wash-club', label: 'WASH Club', icon: Gift },
              { id: 'account', label: 'Account', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 px-6 py-4 font-semibold transition flex items-center justify-center gap-2 ${
                  activeTab === id
                    ? 'text-primary border-b-2 border-primary bg-mint bg-opacity-30'
                    : 'text-gray hover:text-dark'
                }`}
              >
                <Icon size={20} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-dark">Your Orders</h2>
                  <Button onClick={() => router.push('/booking')}>Place New Order</Button>
                </div>

                {ordersError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex gap-3">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <p>{ordersError}</p>
                  </div>
                )}

                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 bg-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Truck size={48} className="text-gray mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-dark mb-2">No Orders Yet</h3>
                    <p className="text-gray mb-6">Start by placing your first laundry order</p>
                    <Button onClick={() => router.push('/booking')}>Place an Order</Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const statusColors: Record<string, string> = {
                        pending: 'bg-yellow-50 text-yellow-700',
                        confirmed: 'bg-blue-50 text-blue-700',
                        picked_up: 'bg-purple-50 text-purple-700',
                        in_washing: 'bg-orange-50 text-orange-700',
                        ready_for_delivery: 'bg-green-50 text-green-700',
                        delivered: 'bg-mint text-primary',
                      }
                      
                      const statusLabels: Record<string, string> = {
                        pending: 'Pending',
                        confirmed: 'Confirmed',
                        picked_up: 'Picked Up',
                        in_washing: 'In Washing',
                        ready_for_delivery: 'Ready for Delivery',
                        delivered: 'Delivered',
                      }

                      const createdDate = order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()
                      
                      return (
                        <Card key={order.id} hoverable className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-semibold text-dark">{order.id}</p>
                              <p className="text-sm text-gray">{createdDate}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status] || 'bg-light text-gray'}`}>
                              {statusLabels[order.status] || order.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray">
                            <div>
                              <p className="text-xs text-gray mb-1">Weight</p>
                              <p className="font-semibold text-dark">{order.estimatedWeight} kg</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray mb-1">Pickup</p>
                              <p className="font-semibold text-dark text-sm">{order.pickupTime}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray mb-1">Delivery</p>
                              <p className="font-semibold text-dark capitalize text-sm">{order.deliverySpeed}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray mb-1">Total</p>
                              <p className="font-semibold text-primary">${order.subtotal?.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray text-sm mb-4">
                            <MapPin size={16} />
                            {order.deliveryAddress}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/tracking/${order.id}`)}>
                            Track Order
                          </Button>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* WASH Club Tab */}
            {activeTab === 'wash-club' && (
              <div>
                <h2 className="text-2xl font-bold text-dark mb-6">WASH Club Rewards</h2>
                <Card className="p-8 text-center">
                  <Gift size={48} className="text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-dark mb-2">Join WASH Club</h3>
                  <p className="text-gray mb-6">Earn points on every wash and unlock exclusive rewards!</p>
                  <Button>Learn More</Button>
                </Card>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div>
                <h2 className="text-2xl font-bold text-dark mb-6">Account Information</h2>
                <Card className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-gray mb-2">Full Name</p>
                      <p className="text-lg font-semibold text-dark">{userData?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Email</p>
                      <p className="text-lg font-semibold text-dark">{userData?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Phone</p>
                      <p className="text-lg font-semibold text-dark">{userData?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Account Type</p>
                      <p className="text-lg font-semibold text-dark capitalize">{userData?.userType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Member Since</p>
                      <p className="text-lg font-semibold text-dark">
                        {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Account Created</p>
                      <p className="text-lg font-semibold text-dark">
                        {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-dark mb-6">Notification Settings</h2>
                <div className="space-y-4">
                  <Card className="p-6">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>
                        <p className="font-semibold text-dark">Marketing Texts</p>
                        <p className="text-sm text-gray">Receive promotional offers</p>
                      </span>
                      <input type="checkbox" defaultChecked={userData?.marketingTexts} className="w-5 h-5" />
                    </label>
                  </Card>
                  <Card className="p-6">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>
                        <p className="font-semibold text-dark">Account Notifications</p>
                        <p className="text-sm text-gray">Important account updates</p>
                      </span>
                      <input type="checkbox" defaultChecked={userData?.accountTexts} className="w-5 h-5" />
                    </label>
                  </Card>
                </div>
                <Button className="mt-8">Save Preferences</Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
