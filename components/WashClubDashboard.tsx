'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { authenticatedFetch } from '@/lib/firebaseAuthClient'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import {
  Gift,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  Info,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import {
  WASH_CLUB_TIERS,
  getMembershipInfo,
  getPointsToNextTier,
  formatCredits,
  formatCreditValue,
} from '@/lib/washClub'

interface WashClubMembership {
  userId: string
  tier: number
  totalSpend: number
  creditsBalance: number
  creditsEarned: number
  creditsRedeemed: number
  joinDate: any
  lastUpdated: any
  status: 'active' | 'inactive' | 'suspended'
}

export default function WashClubDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [membership, setMembership] = useState<WashClubMembership | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading || !user) return

    const fetchMembership = async () => {
      try {
        const response = await authenticatedFetch('/api/wash-club/membership')
        if (!response.ok) throw new Error('Failed to fetch membership')
        const data = await response.json()
        setMembership(data.membership)
      } catch (err) {
        console.error('Error fetching membership:', err)
        setError('Failed to load membership info')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembership()
  }, [user, authLoading])

  if (authLoading || isLoading) return <Spinner />
  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    )
  }

  const membershipInfo = getMembershipInfo(membership)
  const tier = WASH_CLUB_TIERS[membershipInfo.tier]
  const nextTierInfo = getPointsToNextTier(membershipInfo.tier, membership?.totalSpend || 0)

  return (
    <div className="space-y-6">
      {/* Membership Tier Overview */}
      <Card className="bg-gradient-to-r from-primary to-accent p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm font-medium opacity-90">Wash Club Tier</div>
            <h2 className="text-3xl font-bold flex items-center gap-2 mt-2">
              <Sparkles size={28} />
              {tier.name}
            </h2>
          </div>
          <Award size={40} className="opacity-80" />
        </div>
        <p className="text-sm opacity-90 mt-4">{tier.description}</p>
      </Card>

      {/* Credits Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card hoverable>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={24} className="text-primary" />
              <span className="font-semibold text-dark">Available Credits</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-primary mt-3">
            {membership?.creditsBalance?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray mt-2">
            {formatCreditValue(membership?.creditsBalance || 0)} in value
          </div>
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={24} className="text-accent" />
              <span className="font-semibold text-dark">Lifetime Earnings</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-accent mt-3">
            {membership?.creditsEarned?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray mt-2">
            Total credits earned: {membership?.creditsRedeemed?.toFixed(2) || '0.00'} redeemed
          </div>
        </Card>
      </div>

      {/* Spending & Tier Progress */}
      <Card hoverable>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={24} className="text-primary" />
          <h3 className="text-lg font-semibold text-dark">Annual Spend & Tier Progress</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-dark">Current Spend</span>
              <span className="text-sm font-bold text-primary">
                ${membership?.totalSpend?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="w-full bg-light rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (membership?.totalSpend || 0) /
                      WASH_CLUB_TIERS[4].minSpend * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          {nextTierInfo.nextTier && (
            <div className="p-3 bg-mint rounded-lg border border-accent/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-dark">
                    {nextTierInfo.message}
                  </div>
                  <div className="text-xs text-gray mt-1">
                    Next tier: {WASH_CLUB_TIERS[nextTierInfo.nextTier].name} (${WASH_CLUB_TIERS[nextTierInfo.nextTier].minSpend} annual spend)
                  </div>
                </div>
                <ChevronRight size={20} className="text-primary" />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Tier Benefits */}
      <Card hoverable>
        <div className="flex items-center gap-2 mb-4">
          <Gift size={24} className="text-primary" />
          <h3 className="text-lg font-semibold text-dark">{tier.name} Tier Benefits</h3>
        </div>

        <div className="space-y-2">
          {tier.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm">
              <span className="text-primary font-bold">✓</span>
              <span className="text-dark">{benefit}</span>
            </div>
          ))}
        </div>

        {nextTierInfo.nextTier && (
          <Link href="/wash-club">
            <Button
              variant="outline"
              className="mt-4 w-full"
            >
              See All Tiers & Benefits
              <ChevronRight size={16} />
            </Button>
          </Link>
        )}
      </Card>

      {/* Redemption Info */}
      <Card className="border-l-4 border-l-accent bg-mint/30">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-accent flex-shrink-0 mt-0.5" />
          <div className="text-sm text-dark">
            <p className="font-semibold mb-1">How Credits Work</p>
            <ul className="space-y-1 text-xs text-gray">
              <li>• Earn {(tier.creditEarnRate * 100).toFixed(0)}% credits on every order at your tier level</li>
              <li>• Redeem credits for discounts on future orders (1 credit = $0.01)</li>
              <li>• Credits expire after {membership?.status === 'active' ? '12 months' : 'N/A'} of inactivity</li>
              <li>• {tier.perksPercentage > 0 ? `Get ${tier.perksPercentage}% off` : 'Unlock'} all orders with {tier.name} membership</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
