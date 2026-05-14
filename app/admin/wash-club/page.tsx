'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Search, Gift, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface WashClubMember {
  id: string
  user_id: string
  card_number: string
  tier: number
  credits_balance: number
  earned_credits: number
  redeemed_credits: number
  total_spend: number
  status: string
  email?: string
  join_date: string
}

export default function WashClubPage() {
  const [members, setMembers] = useState<WashClubMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'spend' | 'credits' | 'join'>('join')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/collections?name=washClub', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to load wash club members')
        return
      }

      const transformed: WashClubMember[] = (result.data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        card_number: item.card_number,
        tier: item.tier || 1,
        credits_balance: item.credits_balance || 0,
        earned_credits: item.earned_credits || 0,
        redeemed_credits: item.redeemed_credits || 0,
        total_spend: item.total_spend || 0,
        status: item.status,
        email: item.users?.email,
        join_date: item.join_date
      }))

      setMembers(transformed)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'bg-blue-100 text-blue-700'
      case 2:
        return 'bg-purple-100 text-purple-700'
      case 3:
        return 'bg-amber-100 text-amber-700'
      case 4:
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTierName = (tier: number) => {
    const names = ['', 'Bronze', 'Silver', 'Gold', 'Platinum']
    return names[tier] || `Tier ${tier}`
  }

  const filtered = members
    .filter(m => {
      const matchesSearch =
        m.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTier = filterTier === 'all' || m.tier.toString() === filterTier
      return matchesSearch && matchesTier
    })
    .sort((a, b) => {
      if (sortBy === 'spend') return b.total_spend - a.total_spend
      if (sortBy === 'credits') return b.credits_balance - a.credits_balance
      return new Date(b.join_date).getTime() - new Date(a.join_date).getTime()
    })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
        return 'bg-gray-100 text-gray-700'
      case 'suspended':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-3 hover:text-primary"
          >
            <ArrowLeft size={14} />
            Control center
          </Link>
          <h1 className="text-3xl font-bold text-gray-950 inline-flex items-center gap-2">
            <Gift size={26} className="text-primary-deep" />
            Wash Club members
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Free loyalty program. Members earn points and credits on every order — there is no paid membership.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-lg border border-primary/15 bg-mint/40 p-4 mb-6 flex gap-2 text-sm text-dark">
          <Sparkles size={16} className="flex-shrink-0 mt-0.5 text-primary-deep" />
          <span>
            Wash Club is free to join — there are no membership fees or paid tiers. Tier names (Bronze / Silver / Gold / Platinum) reflect cumulative spend only.
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray" />
            <input
              type="text"
              placeholder="Search by card number or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Tiers</option>
            <option value="1">Bronze</option>
            <option value="2">Silver</option>
            <option value="3">Gold</option>
            <option value="4">Platinum</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'spend' | 'credits' | 'join')}
            className="px-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="join">Sort: Join Date</option>
            <option value="spend">Sort: Total Spend</option>
            <option value="credits">Sort: Credits Balance</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray">
            <p>No wash club members found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-light border-b border-gray/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Card #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Tier</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Credits</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Total Spend</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gray/10 hover:bg-light transition"
                  >
                    <td className="px-6 py-4 text-sm text-dark">{member.email}</td>
                    <td className="px-6 py-4 text-sm font-mono text-dark">{member.card_number}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTierColor(member.tier)}`}>
                        {getTierName(member.tier)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-dark font-semibold">${member.credits_balance.toFixed(2)}</span>
                        <span className="text-xs text-gray">Earned: ${member.earned_credits.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark font-semibold">
                      ${member.total_spend.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray">
                      {new Date(member.join_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Total Members</p>
            <p className="text-3xl font-bold text-dark">{members.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Total Credits</p>
            <p className="text-3xl font-bold text-dark">
              ${members.reduce((sum, m) => sum + m.credits_balance, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Total Spend</p>
            <p className="text-3xl font-bold text-dark">
              ${members.reduce((sum, m) => sum + m.total_spend, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Active Members</p>
            <p className="text-3xl font-bold text-dark">
              {members.filter(m => m.status === 'active').length}
            </p>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}
