'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { DollarSign, TrendingUp, Calendar, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function ProEarningsPage() {
  const { user } = useAuth()
  const [earnings, setEarnings] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) return

      try {
        // Fetch pro earnings from database
        const { data, error } = await supabase
          .from('pro_earnings')
          .select('*')
          .eq('pro_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setEarnings(data)

          // Calculate stats
          const total = data.reduce((sum, e) => sum + (e.amount || 0), 0)
          const thisMonth = data
            .filter((e) => {
              const date = new Date(e.created_at)
              const now = new Date()
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
            })
            .reduce((sum, e) => sum + (e.amount || 0), 0)
          const pending = data
            .filter((e) => e.status === 'pending')
            .reduce((sum, e) => sum + (e.amount || 0), 0)

          setStats({
            totalEarnings: total,
            thisMonth,
            pending,
          })
        }
      } catch (err) {
        console.error('Error fetching earnings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [user])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#48C9B0] mx-auto mb-4"></div>
            <p className="text-[#6b7b78]">Loading earnings...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-[#1f2d2b] mb-2">Earnings</h1>
            <p className="text-lg text-[#6b7b78]">Track your professional earnings and payouts</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card hoverable className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#6b7b78]">Total Earnings</h3>
                <DollarSign className="w-5 h-5 text-[#48C9B0]" />
              </div>
              <p className="text-4xl font-bold text-[#1f2d2b]">${stats.totalEarnings?.toFixed(2) || '0.00'}</p>
            </Card>

            <Card hoverable className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#6b7b78]">This Month</h3>
                <Calendar className="w-5 h-5 text-[#48C9B0]" />
              </div>
              <p className="text-4xl font-bold text-[#1f2d2b]">${stats.thisMonth?.toFixed(2) || '0.00'}</p>
            </Card>

            <Card hoverable className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#6b7b78]">Pending Payout</h3>
                <Zap className="w-5 h-5 text-[#48C9B0]" />
              </div>
              <p className="text-4xl font-bold text-[#1f2d2b]">${stats.pending?.toFixed(2) || '0.00'}</p>
            </Card>
          </div>

          {/* Earnings List */}
          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold text-[#1f2d2b] mb-6">Recent Earnings</h2>

            {earnings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-[#1f2d2b]">Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-[#1f2d2b]">Order ID</th>
                      <th className="text-left py-4 px-4 font-semibold text-[#1f2d2b]">Amount</th>
                      <th className="text-left py-4 px-4 font-semibold text-[#1f2d2b]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((earning, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-[#1f2d2b]">
                          {new Date(earning.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-[#1f2d2b] font-mono text-sm">{earning.order_id}</td>
                        <td className="py-4 px-4 text-[#1f2d2b] font-semibold">${earning.amount?.toFixed(2)}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              earning.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : earning.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {earning.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#6b7b78] mb-4">No earnings yet</p>
                <Link href="/pro/jobs">
                  <Button>Find Jobs</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Payout Info */}
          <Card className="p-8 bg-[#E8FFFB] border-2 border-[#48C9B0]">
            <h3 className="text-lg font-bold text-[#1f2d2b] mb-4">Payout Information</h3>
            <ul className="space-y-3 text-[#1f2d2b]">
              <li>✓ Payouts are processed weekly on Mondays</li>
              <li>✓ Minimum payout threshold: $50</li>
              <li>✓ Direct bank transfer to your registered account</li>
              <li>✓ Processing time: 2-3 business days</li>
            </ul>
          </Card>

          {/* Back Link */}
          <div className="mt-12 text-center">
            <Link href="/" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
