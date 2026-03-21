'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'
import Card from '@/components/Card'
import EmployeeHeader from '@/components/EmployeeHeader'
import Footer from '@/components/Footer'
import { DollarSign, Package, TrendingUp, Clock, AlertCircle, CheckCircle, Briefcase, Target, Award } from 'lucide-react'

interface Order {
  id: string
  customer: string
  status: string
  weight: string
  pickup: string
  earnings: string
  address: string
  orderId?: string
}

interface Stats {
  todayEarnings: number
  activeOrders: number
  totalRating: number
  availableJobs: number
}

export default function EmployeeDashboard() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [stats, setStats] = useState<Stats>({
    todayEarnings: 0,
    activeOrders: 0,
    totalRating: 4.9,
    availableJobs: 0
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return
    
    setHasCheckedAuth(true)
    
    // Check if user is authenticated
    if (!user) {
      router.push('/auth/employee-signin')
      return
    }

    // Check if employee mode is active
    const employeeMode = localStorage.getItem('employeeMode')
    if (!employeeMode) {
      // Set employee mode flag when accessing employee dashboard
      localStorage.setItem('employeeMode', 'true')
      sessionStorage.setItem('employeeMode', 'true')
    }

    // Fetch real data from Supabase
    const fetchData = async () => {
      try {
        const response = await fetch('/api/orders')
        const result = await response.json()
        const orders = result.data || []
        
        const fetchedOrders: Order[] = orders.slice(0, 3).map((order: any) => {
          const pickupDate = order.pickup_time ? new Date(order.pickup_time) : new Date()
          return {
            id: order.id,
            customer: order.customer_id || 'Unknown',
            status: order.status || 'pending-pickup',
            weight: `${order.weight || 0} kg`,
            pickup: pickupDate.toLocaleDateString() === new Date().toLocaleDateString() ? 'Today ' + pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : pickupDate.toLocaleDateString(),
            earnings: `$${((order.weight || 0) * 3).toFixed(2)}`,
            address: order.delivery_address || 'N/A'
          }
        })
        
        setRecentOrders(fetchedOrders)
        
        // Calculate stats
        const activeCount = fetchedOrders.filter(o => o.status === 'in-progress').length
        const todayEarnings = fetchedOrders.filter(o => o.status === 'completed').reduce((sum, o) => {
          const amount = parseFloat(o.earnings.replace('$', ''))
          return sum + amount
        }, 0)
        
        setStats({
          todayEarnings,
          activeOrders: activeCount,
          totalRating: 4.9,
          availableJobs: 15
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        // Keep default values on error
      } finally {
        setDataLoading(false)
      }
    }
    
    fetchData()
  }, [user, loading, router, hasCheckedAuth])

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-dark font-semibold">Loading your dashboard...</p>
          <p className="text-gray text-sm mt-2">Fetching your orders and jobs</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Build stats array from real data
  const statsArray = [
    {
      label: 'Today\'s Earnings',
      value: `$${stats.todayEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      change: '+12%'
    },
    {
      label: 'Active Orders',
      value: stats.activeOrders.toString(),
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      change: '+2 new'
    },
    {
      label: 'Total Rating',
      value: '4.9',
      icon: Award,
      color: 'from-yellow-500 to-orange-500',
      change: '142 reviews'
    },
    {
      label: 'Available Jobs',
      value: stats.availableJobs.toString(),
      icon: Briefcase,
      color: 'from-purple-500 to-pink-500',
      change: '+5 nearby'
    }
  ]

  const displayOrders = dataLoading ? [] : recentOrders.length > 0 ? recentOrders : [
    {
      id: 'ORD-1001',
      customer: 'Sarah Mitchell',
      status: 'in-progress',
      weight: '6 kg',
      pickup: 'Today 4:00 PM',
      earnings: '$18.00',
      address: '123 Main St'
    },
    {
      id: 'ORD-1002',
      customer: 'John Davis',
      status: 'pending-pickup',
      weight: '8 kg',
      pickup: 'Today 6:00 PM',
      earnings: '$24.00',
      address: '456 Oak Ave'
    },
    {
      id: 'ORD-1003',
      customer: 'Emma Johnson',
      status: 'completed',
      weight: '5 kg',
      pickup: 'Yesterday',
      earnings: '$15.00',
      address: '789 Pine Rd'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400'
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-400'
      case 'pending-pickup':
        return 'bg-yellow-500/20 text-yellow-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'in-progress':
        return Clock
      case 'pending-pickup':
        return AlertCircle
      default:
        return Package
    }
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <EmployeeHeader />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-dark">
            Welcome back, {userData?.name || user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-gray text-lg">Here's your performance summary for today</p>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsArray.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-mint hover:shadow-md border-primary/20">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-gray text-sm font-semibold">{stat.label}</p>
                  <p className="text-3xl font-bold text-dark">{stat.value}</p>
                  <p className="text-xs text-primary font-semibold">{stat.change}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package size={28} className="text-primary" />
              Recent Orders
            </h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/employee/orders')}>
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {displayOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              return (
                <Card
                  key={order.id}
                  className="bg-white border-l-4 hover:shadow-md transition cursor-pointer"
                  hoverable
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${getStatusColor(order.status)}`}>
                        <StatusIcon size={20} />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-dark">{order.id}</p>
                          <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                            {order.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-gray text-sm">{order.customer} • {order.weight}</p>
                        <p className="text-gray text-xs">{order.address}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-primary text-lg">{order.earnings}</p>
                      <p className="text-gray text-xs">{order.pickup}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
            <TrendingUp size={28} className="text-primary" />
            Quick Actions
          </h2>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/employee/jobs')}
              className="w-full justify-start gap-3 bg-gradient-to-r from-primary to-accent hover:shadow-lg"
              size="lg"
            >
              <Briefcase size={20} />
              <div className="text-left">
                <p className="font-semibold">Find Jobs</p>
                <p className="text-xs opacity-90">15 available nearby</p>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/employee/earnings')}
              variant="outline"
              className="w-full justify-start gap-3"
              size="lg"
            >
              <DollarSign size={20} />
              <div className="text-left">
                <p className="font-semibold">View Earnings</p>
                <p className="text-xs opacity-90">This week's breakdown</p>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/employee/settings')}
              variant="outline"
              className="w-full justify-start gap-3"
              size="lg"
            >
              <Target size={20} />
              <div className="text-left">
                <p className="font-semibold">Update Profile</p>
                <p className="text-xs opacity-90">Availability & docs</p>
              </div>
            </Button>
          </div>

          {/* Performance Card */}
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/40">
            <div className="space-y-3">
              <h3 className="font-bold text-dark flex items-center gap-2">
                <Award size={20} className="text-primary" />
                Your Performance
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray">Completion Rate</span>
                  <span className="text-primary font-semibold">98%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary to-accent rounded-full h-2" style={{ width: '95%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray">On-Time Delivery</span>
                  <span className="text-primary font-semibold">95%</span>
                </div>
                <div className="w-full bg-gray rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary to-accent rounded-full h-2" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}
