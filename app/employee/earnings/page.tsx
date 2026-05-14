'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Download,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

interface ProEarningsRecord {
  id: string
  pro_id: string
  order_id: string
  earnings_amount: number
  status: string
  created_at: string
}

type Timeframe = 'week' | 'month' | 'all'

export default function EmployeeEarningsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [timeframe, setTimeframe] = useState<Timeframe>('week')
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
          setEarnings((data as ProEarningsRecord[]) || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setEarningsLoading(false)
      }
    }

    fetchEarnings()
  }, [user?.id])

  const handleDownloadStatement = async () => {
    try {
      const response = await fetch(`/api/employee/earnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user?.id,
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          endDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const csv =
          'Date,Description,Amount,Status\n' +
          (data.data || [])
            .map(
              (row: { created_at: string; order_id: string; earnings: number; status: string }) =>
                `${row.created_at},${row.order_id},+$${row.earnings},${row.status}`
            )
            .join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `washlee-earnings-${new Date().toISOString().split('T')[0]}.csv`
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

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-soft-mint flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading earnings…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const now = new Date()
  const getEarningsForTimeframe = (tf: Timeframe) => {
    let startDate = new Date()
    if (tf === 'week') startDate.setDate(now.getDate() - 7)
    else if (tf === 'month') startDate.setMonth(now.getMonth() - 1)
    else startDate = new Date(0)

    const filtered = earnings.filter((e) => new Date(e.created_at) >= startDate)
    const total = filtered.reduce((sum, e) => sum + (e.earnings_amount || 0), 0)
    const pending = filtered
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + (e.earnings_amount || 0), 0)
    const paid = filtered
      .filter((e) => e.status === 'completed' || e.status === 'paid')
      .reduce((sum, e) => sum + (e.earnings_amount || 0), 0)

    return {
      total: total.toFixed(2),
      orders: filtered.length,
      pending: pending.toFixed(2),
      paid: paid.toFixed(2),
      totalNum: total,
      pendingNum: pending,
      paidNum: paid,
    }
  }

  const currentData = getEarningsForTimeframe(timeframe)
  const transactions = earnings.slice(0, 10)

  const stats = [
    {
      label: 'Total earnings',
      value: `$${currentData.total}`,
      icon: DollarSign,
      hint: timeframe === 'week' ? 'This week' : timeframe === 'month' ? 'This month' : 'All time',
    },
    {
      label: 'Completed jobs',
      value: currentData.orders.toString(),
      icon: TrendingUp,
      hint: 'Commission earned',
    },
    {
      label: 'Pending payout',
      value: `$${currentData.pending}`,
      icon: Calendar,
      hint: 'Settles in next cycle',
    },
    {
      label: 'Paid out',
      value: `$${currentData.paid}`,
      icon: CreditCard,
      hint: 'Already in your bank',
    },
  ]

  const paidPct = currentData.totalNum
    ? Math.round((currentData.paidNum / currentData.totalNum) * 100)
    : 0
  const pendingPct = 100 - paidPct

  return (
    <div className="min-h-screen bg-soft-mint flex flex-col">
      <main className="flex-1 container-page py-10 space-y-6">
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-dark inline-flex items-center gap-2">
              <DollarSign size={28} className="text-primary-deep" />
              Earnings
            </h1>
            <p className="text-gray text-sm mt-1">
              Commission per completed order. Payouts go out weekly.
            </p>
          </div>

          <div role="tablist" className="inline-flex bg-white border border-line rounded-full p-1">
            {(['week', 'month', 'all'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                role="tab"
                aria-selected={timeframe === tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                  timeframe === tf ? 'bg-primary text-white shadow-soft' : 'text-gray'
                }`}
              >
                {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All time'}
              </button>
            ))}
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="surface-card p-5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[11px] uppercase tracking-wider font-bold text-gray-soft">
                  {s.label}
                </p>
                <div className="w-9 h-9 rounded-xl bg-mint flex items-center justify-center">
                  <s.icon size={16} className="text-primary-deep" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-dark">{s.value}</p>
              <p className="text-[11px] text-gray-soft mt-1">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Breakdown + payout */}
          <section className="lg:col-span-2 space-y-4">
            <div className="surface-card p-6 sm:p-7">
              <h2 className="text-xl font-bold text-dark mb-5">Breakdown</h2>
              {currentData.totalNum === 0 ? (
                <div className="rounded-2xl bg-mint/40 border border-primary/15 p-5 text-sm text-gray">
                  No earnings in this period yet — completed jobs will appear here.
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray font-semibold">Paid out</span>
                      <span className="text-dark font-bold">${currentData.paid}</span>
                    </div>
                    <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray font-semibold">Pending payout</span>
                      <span className="text-dark font-bold">${currentData.pending}</span>
                    </div>
                    <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                        style={{ width: `${pendingPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-line pt-4 mt-5 text-sm text-gray space-y-1">
                <p>
                  You&rsquo;ve earned{' '}
                  <span className="text-primary-deep font-bold">${currentData.total}</span>{' '}
                  {timeframe === 'week'
                    ? 'this week'
                    : timeframe === 'month'
                      ? 'this month'
                      : 'in total'}
                  .
                </p>
                <p>
                  Pending earnings settle to your AU bank account in the next weekly payout.
                </p>
              </div>
            </div>

            <div className="surface-card p-6 sm:p-7 bg-gradient-to-br from-mint to-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-dark">Payout method</h3>
                  <p className="text-sm text-gray">Weekly direct deposit, AU bank account.</p>
                </div>
                <CreditCard size={22} className="text-primary-deep" />
              </div>
              <p className="text-xs text-gray mb-4">
                Bank details are managed in <span className="font-semibold">Settings</span>.
                We never display your full account number here.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/employee/payout')}
                  className="btn-primary text-sm flex-1"
                >
                  Request payout
                  <ArrowRight size={14} />
                </button>
                <Link
                  href="/employee/settings"
                  className="btn-outline text-sm flex-1"
                >
                  Update bank details
                </Link>
              </div>
            </div>
          </section>

          {/* Transactions */}
          <aside className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark">Recent transactions</h2>
              <button
                type="button"
                onClick={handleDownloadStatement}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-primary-deep hover:bg-mint transition"
              >
                <Download size={14} />
                CSV
              </button>
            </div>

            <div className="surface-card p-0 overflow-hidden">
              {earningsLoading ? (
                <div className="p-6 text-center text-gray text-sm">Loading…</div>
              ) : transactions.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-mint mb-2">
                    <Calendar size={16} className="text-primary-deep" />
                  </div>
                  <p className="text-sm text-gray">No transactions yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {transactions.map((txn) => {
                    const paid = txn.status === 'completed' || txn.status === 'paid'
                    return (
                      <li key={txn.id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-dark truncate">
                            Order {txn.order_id?.slice(0, 8) || '—'}
                          </p>
                          <p className="text-xs text-gray-soft">
                            {new Date(txn.created_at).toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-emerald-700">
                            +${(txn.earnings_amount || 0).toFixed(2)}
                          </p>
                          <p
                            className={`text-[11px] font-semibold ${
                              paid ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {paid ? 'Paid' : 'Pending'}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="surface-card p-5 bg-mint/40 border-primary/15">
              <p className="text-sm text-dark flex items-start gap-2">
                <AlertCircle size={16} className="text-primary-deep flex-shrink-0 mt-0.5" />
                <span>
                  As an independent contractor, you&rsquo;re responsible for your own tax (including GST/BAS where applicable). Keep your records — we provide CSV exports any time.
                </span>
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
