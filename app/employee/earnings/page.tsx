'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Footer from '@/components/Footer'
import { DollarSign, TrendingUp, Calendar, CreditCard, Download } from 'lucide-react'

interface ProEarningsRecord {
  id: string
  pro_id: string
  order_id: string
  earnings_amount: number
  status: string
  created_at: string
  order?: {
    id: string
    total_price: number
    created_at: string
  }
}

export default function EmployeeEarnings() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [timeframe, setTimeframe] = useState('week')
  const [earnings, setEarnings] = useState<ProEarningsRecord[]>([])
  const [earningsLoading, setEarningsLoading] = useState(true)

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return
    
    setHasCheckedAuth(true)
    
    if (!user) {
      router.push('/auth/employee-signin')
    }
  }, [user, loading, router, hasCheckedAuth])

  // Fetch real earnings data
  useEffect(() => {
    if (!user?.id) return

    const fetchEarnings = async () => {
      try {
        setEarningsLoading(true)
        const { data, error } = await supabase
          .from('pro_earnings')
          .select('*, orders(id, total_price, created_at)')
          .eq('pro_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching earnings:', error)
        } else {
          setEarnings(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setEarningsLoading(false)
      }
    }

    fetchEarnings()
  }, [user?.id])

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-dark font-semibold">Loading earnings...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Calculate earnings by timeframe
  const now = new Date()
  const getEarningsForTimeframe = (tf: string) => {
    let startDate = new Date()
    
    if (tf === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else if (tf === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else {
      startDate = new Date(0)
    }

    const filtered = earnings.filter(e => new Date(e.created_at) >= startDate)
    const total = filtered.reduce((sum, e) => sum + (e.earnings_amount || 0), 0)
    const pending = filtered.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.earnings_amount || 0), 0)
    const paid = filtered.filter(e => e.status === 'completed').reduce((sum, e) => sum + (e.earnings_amount || 0), 0)

    return {
      total: total.toFixed(2),
      orders: filtered.length,
      pending: pending.toFixed(2),
      paid: paid.toFixed(2)
    }
  }

  const currentData = getEarningsForTimeframe(timeframe)

  const transactions = earnings.slice(0, 7).map(e => ({
    id: e.id,
    date: new Date(e.created_at).toLocaleDateString(),
    description: `Order ${e.order_id}`,
    amount: `+$${e.earnings_amount.toFixed(2)}`,
    type: 'credit',
    status: e.status
  }))

  const stats = [
    {
      label: 'Total Earnings (This Week)',
      value: `$${currentData.total}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      change: 'Gross earnings'
    },
    {
      label: 'Completed Orders',
      value: currentData.orders.toString(),
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      change: 'This period'
    },
    {
      label: 'Pending Payments',
      value: `$${currentData.pending}`,
      icon: Calendar,
      color: 'from-yellow-500 to-orange-500',
      change: 'Processing'
    },
    {
      label: 'Paid Out',
      value: `$${currentData.paid}`,
      icon: CreditCard,
      color: 'from-purple-500 to-pink-500',
      change: 'Direct deposit'
    },
  ]

  const handleDownloadStatement = async () => {
    try {
      const response = await fetch(`/api/employee/earnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user?.id,
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          endDate: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Create CSV
        const csv = 'Date,Description,Amount,Status\n' + data.data
          .map((row: any) => `${row.created_at},${row.order_id},+$${row.earnings},${row.status}`)
          .join('\n')
        
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `earnings-statement-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Failed to download statement')
      }
    } catch (error) {
      console.error('Error downloading statement:', error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-dark flex items-center gap-3">
            <DollarSign size={36} className="text-primary" />
            Your Earnings
          </h1>
          <p className="text-gray text-lg">Track your income and manage payouts</p>
        </div>

        {/* Timeframe Toggle */}
        <div className="flex gap-2">
          {['week', 'month', 'all'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                timeframe === tf
                  ? 'bg-primary text-dark'
                  : 'bg-gray-200 text-gray hover:bg-gray-300'
              }`}
            >
              {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-mint border-primary/20 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-gray text-sm font-semibold">{stat.label}</p>
                  <p className="text-3xl font-bold text-dark">{stat.value}</p>
                  <p className="text-xs text-gray font-semibold">{stat.change}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}>
                  <Icon size={24} className="text-primary" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Earnings Chart & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Earnings Breakdown */}
          <Card className="bg-white border-gray-200">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-dark">Earnings Breakdown</h2>

              {/* Visual Breakdown */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray font-semibold">Paid Out</p>
                    <p className="text-dark font-bold">{currentData.paid}</p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray font-semibold">Pending Payment</p>
                    <p className="text-dark font-bold">{currentData.pending}</p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
              </div>

              {/* Summary Text */}
              <div className="border-t border-white/10 pt-4 space-y-2">
                <p className="text-sm text-gray">
                  You've earned <span className="text-primary font-bold">{currentData.total}</span> {timeframe === 'week' ? 'this week' : timeframe === 'month' ? 'this month' : 'in total'}.
                </p>
                <p className="text-sm text-gray">
                  <span className="text-primary font-bold">{currentData.pending}</span> is pending and will be paid out within 1-3 business days.
                </p>
              </div>
            </div>
          </Card>

          {/* Payout Settings */}
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/40">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-dark">Payout Method</h3>
                  <p className="text-gray text-sm">Direct Deposit to Bank Account</p>
                </div>
                <CreditCard size={28} className="text-primary" />
              </div>
              <div className="border-t border-white/20 pt-4">
                <p className="text-sm text-gray mb-3">Account ending in: <span className="text-dark font-semibold">****5678</span></p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => router.push('/employee/payout')}
                    size="sm"
                  >
                    Request Payout
                  </Button>
                  <Button variant="outline" size="sm">
                    Update Method
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark">Transactions</h2>
            <Button 
              onClick={handleDownloadStatement}
              variant="ghost" 
              size="sm" 
              className="gap-2"
            >
              <Download size={16} />
              Export
            </Button>
          </div>

          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 p-0">
            <div className="divide-y divide-gray-700">
              {transactions.map((txn) => (
                <div key={txn.id} className="px-4 py-4 hover:bg-gray-800/30 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{txn.description}</p>
                      <p className="text-gray text-xs">{txn.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm ${txn.type === 'credit' ? 'text-green-400' : 'text-gray'}`}>
                        {txn.amount}
                      </p>
                      <p className={`text-xs ${
                        txn.status === 'completed'
                          ? 'text-green-400'
                          : 'text-yellow-400'
                      }`}>
                        {txn.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tax Info */}
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/40 space-y-3">
            <p className="text-sm text-blue-200">
              💡 <span className="font-semibold">Tax Info:</span> 1099s are sent in January for the previous year. Keep records for tax purposes.
            </p>
          </Card>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}
