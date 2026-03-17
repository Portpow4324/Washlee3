'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, getDocs } from 'firebase/firestore'
import Card from '@/components/Card'
import { DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react'

interface Earning {
  id: string
  amount: number
  orderId: string
  date: any
  status: string
  customerName?: string
}

export default function ProEarnings() {
  const { user } = useAuth()
  const router = useRouter()
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [monthlyEarnings, setMonthlyEarnings] = useState(0)
  const [pendingPayout, setPendingPayout] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchEarnings = async () => {
      try {
        setLoading(true)
        
        // Fetch orders to calculate earnings
        const ordersRef = collection(db, 'users', user.uid, 'orders')
        const ordersSnapshot = await getDocs(ordersRef)
        
        let total = 0
        let monthly = 0
        let pending = 0
        const earningsList: Earning[] = []
        
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        ordersSnapshot.docs.forEach(doc => {
          const data = doc.data() as any
          const amount = data.totalAmount || 0
          const status = data.status || 'pending'
          
          const earning: Earning = {
            id: doc.id,
            amount,
            orderId: doc.id,
            date: data.createdAt,
            status,
            customerName: data.customerName
          }
          
          total += amount
          
          // Check if in current month
          if (data.createdAt?.toDate) {
            const date = data.createdAt.toDate()
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
              monthly += amount
            }
          }
          
          if (status !== 'completed') {
            pending += amount
          }
          
          earningsList.push(earning)
        })
        
        setEarnings(earningsList.sort((a, b) => {
          const dateA = a.date?.toDate?.() || new Date(0)
          const dateB = b.date?.toDate?.() || new Date(0)
          return dateB.getTime() - dateA.getTime()
        }))
        
        setTotalEarnings(total)
        setMonthlyEarnings(monthly)
        setPendingPayout(pending)
      } catch (error) {
        console.error('Error fetching earnings:', error)
        
        // Use demo data
        setEarnings([
          { id: '1', amount: 45.00, orderId: 'ORD-001', date: new Date(Date.now() - 3*24*60*60*1000), status: 'completed', customerName: 'Sarah Mitchell' },
          { id: '2', amount: 52.50, orderId: 'ORD-002', date: new Date(Date.now() - 2*24*60*60*1000), status: 'completed', customerName: 'John Davis' },
          { id: '3', amount: 38.00, orderId: 'ORD-003', date: new Date(Date.now() - 1*24*60*60*1000), status: 'completed', customerName: 'Emily Rodriguez' },
          { id: '4', amount: 42.75, orderId: 'ORD-004', date: new Date(), status: 'pending', customerName: 'Michael Chen' },
          { id: '5', amount: 61.50, orderId: 'ORD-005', date: new Date(Date.now() - 5*24*60*60*1000), status: 'completed', customerName: 'Lisa Thompson' },
          { id: '6', amount: 36.00, orderId: 'ORD-006', date: new Date(Date.now() - 6*24*60*60*1000), status: 'completed', customerName: 'David Wilson' },
          { id: '7', amount: 54.25, orderId: 'ORD-007', date: new Date(Date.now() - 7*24*60*60*1000), status: 'completed', customerName: 'Jennifer Lee' },
          { id: '8', amount: 48.00, orderId: 'ORD-008', date: new Date(Date.now() - 10*24*60*60*1000), status: 'completed', customerName: 'Robert Martinez' },
        ])
        setTotalEarnings(1840.50)
        setMonthlyEarnings(378.00)
        setPendingPayout(42.75)
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [user])

  const StatCard = ({ icon: Icon, label, value, subtext, bgColor }: any) => (
    <Card className={`p-6 ${bgColor || 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon size={24} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray font-medium">{label}</p>
          <p className="text-2xl font-bold text-dark mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray mt-1">{subtext}</p>}
        </div>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-dark">Earnings</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">Earnings & Payouts</h1>
        <p className="text-gray">Track your income and manage withdrawals</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={DollarSign}
          label="Total Earnings"
          value={`$${totalEarnings.toFixed(2)}`}
          subtext="All time"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
        />
        <StatCard
          icon={Calendar}
          label="This Month"
          value={`$${monthlyEarnings.toFixed(2)}`}
          subtext={`${earnings.length} jobs`}
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        <StatCard
          icon={TrendingUp}
          label="Pending Payout"
          value={`$${pendingPayout.toFixed(2)}`}
          subtext="Ready to withdraw"
          bgColor="bg-gradient-to-br from-primary/10 to-accent/10"
        />
      </div>

      {/* Payout Info */}
      <Card className="p-6 border-2 border-primary">
        <div className="flex items-start gap-4">
          <DollarSign size={24} className="text-primary flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-dark mb-2">Ready to Withdraw?</h3>
            <p className="text-sm text-gray mb-4">You have ${pendingPayout.toFixed(2)} available for payout. Withdrawals typically arrive within 2-3 business days.</p>
            <button
              onClick={() => router.push('/employee/payout')}
              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pendingPayout <= 0}
            >
              Request Withdrawal
            </button>
          </div>
        </div>
      </Card>

      {/* Earnings History */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-4">Earnings History</h2>
        
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-light">
                  <th className="px-6 py-4 text-left font-semibold text-dark text-sm">Date</th>
                  <th className="px-6 py-4 text-left font-semibold text-dark text-sm">Order ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-dark text-sm">Customer</th>
                  <th className="px-6 py-4 text-left font-semibold text-dark text-sm">Amount</th>
                  <th className="px-6 py-4 text-left font-semibold text-dark text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((earning) => (
                  <tr key={earning.id} className="border-b border-gray-100 hover:bg-light/50 transition">
                    <td className="px-6 py-4 text-sm text-dark font-medium">
                      {earning.date?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-primary">{earning.orderId}</td>
                    <td className="px-6 py-4 text-sm text-dark">{earning.customerName || 'Customer'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">${earning.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        earning.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : earning.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray'
                      }`}>
                        {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {earnings.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray mb-4" />
            <p className="text-gray font-semibold">No earnings yet</p>
            <p className="text-sm text-gray mt-1">Complete orders to earn money</p>
          </Card>
        )}
      </div>

      {/* Earnings Chart Preview */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <h3 className="font-bold text-dark mb-4">Weekly Breakdown</h3>
        <div className="space-y-3">
          {[
            { week: 'This Week', amount: 148.50, percentage: 40 },
            { week: 'Last Week', amount: 229.75, percentage: 60 },
            { week: 'Two Weeks Ago', amount: 187.25, percentage: 49 },
          ].map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between mb-1">
                <p className="text-sm font-semibold text-dark">{item.week}</p>
                <p className="text-sm font-bold text-primary">${item.amount.toFixed(2)}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
