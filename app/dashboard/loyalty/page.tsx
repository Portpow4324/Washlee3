'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Zap, Award, Gift, TrendingUp, Copy, Share2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import { getTierInfo, getAvailableRewards, pointsToNextTier, getTierDiscount, formatPoints } from '@/lib/loyaltyLogic'

interface LoyaltyMember {
  customerId: string
  points: number
  tier: 'silver' | 'gold' | 'platinum'
  totalSpent: number
  totalOrders: number
  pointsHistory: any[]
  referrals: any[]
}

interface RewardOption {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'credit' | 'discount' | 'free-order' | 'donation'
  value: number
  valueCurrency?: string
}

export default function LoyaltyPage() {
  const { user, userData } = useAuth()
  const [member, setMember] = useState<LoyaltyMember | null>(null)
  const [rewards, setRewards] = useState<RewardOption[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchMember = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/loyalty/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_member',
            customerId: user.uid
          })
        })

        if (response.ok) {
          const data = await response.json()
          setMember(data.member)
        } else {
          // Initialize if doesn't exist
          await fetch('/api/loyalty/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'initialize',
              customerId: user.uid,
              email: user.email
            })
          })
          setMember({
            customerId: user.uid,
            points: 0,
            tier: 'silver',
            totalSpent: 0,
            totalOrders: 0,
            pointsHistory: [],
            referrals: []
          })
        }

        setRewards(getAvailableRewards())
      } catch (error) {
        console.error('Error fetching loyalty member:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMember()
  }, [user])

  const handleRedeemReward = async (reward: RewardOption) => {
    if (!member || member.points < reward.pointsCost) return

    setRedeeming(reward.id)
    try {
      const response = await fetch('/api/loyalty/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem_points',
          customerId: user!.uid,
          points: reward.pointsCost,
          description: `Redeemed ${reward.name}`
        })
      })

      if (response.ok) {
        // Refresh member data
        const memberResponse = await fetch('/api/loyalty/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_member',
            customerId: user!.uid
          })
        })

        if (memberResponse.ok) {
          const data = await memberResponse.json()
          setMember(data.member)
        }

        alert(`Successfully redeemed ${reward.name}!`)
      }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      alert('Failed to redeem reward')
    } finally {
      setRedeeming(null)
    }
  }

  const handleCopyReferral = () => {
    // TODO: Get actual referral code from member data
    const referralLink = `${window.location.origin}/auth/signup?ref=MEMBER123`
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!member) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Failed to load loyalty data</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const tierInfo = getTierInfo(member.tier)
  const pointsToNext = pointsToNextTier(member.points, member.tier)
  const discount = getTierDiscount(member.tier)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-primary" size={32} />
              <h1 className="text-4xl font-bold text-dark">Washlee WASH Club</h1>
            </div>
            <p className="text-gray-600 text-lg">Earn points on every order and unlock exclusive rewards</p>
          </div>

          {/* Tier Card */}
          <div className="bg-white rounded-xl border-2 border-primary p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="text-5xl mb-4">{tierInfo.icon}</div>
                <h2 className="text-3xl font-bold text-dark mb-2">{tierInfo.name} Member</h2>
                <p className="text-gray-600 mb-4">
                  {discount > 0 ? `Enjoy ${discount}% discount on all orders` : 'Start earning points to upgrade your tier'}
                </p>

                {member.tier !== 'platinum' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Points to next tier</p>
                    <p className="text-2xl font-bold text-primary mb-3">{pointsToNext.toLocaleString()}</p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, ((member.points) / (member.points + pointsToNext)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-mint p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Current Points</p>
                  <p className="text-3xl font-bold text-primary">{member.points.toLocaleString()}</p>
                </div>
                <div className="bg-mint p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-primary">${member.totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-mint p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Orders</p>
                  <p className="text-3xl font-bold text-primary">{member.totalOrders}</p>
                </div>
                <div className="bg-mint p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Discount</p>
                  <p className="text-3xl font-bold text-primary">{discount}%</p>
                </div>
              </div>
            </div>

            {/* Tier Benefits */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Your Benefits</h3>
              <ul className="space-y-2">
                {tierInfo.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Available Rewards */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-dark mb-6">Redeem Your Points</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => {
                const canRedeem = member.points >= reward.pointsCost
                return (
                  <div key={reward.id} className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-primary transition-all">
                    <Gift className="text-primary mb-3" size={24} />
                    <h3 className="font-bold text-lg text-dark mb-2">{reward.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{reward.description}</p>

                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-600">Points Required</p>
                      <p className="text-2xl font-bold text-primary">{reward.pointsCost.toLocaleString()}</p>
                    </div>

                    <button
                      onClick={() => handleRedeemReward(reward)}
                      disabled={!canRedeem || redeeming === reward.id}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                        canRedeem
                          ? 'bg-primary text-white hover:bg-[#3aad9a] active:scale-95'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {redeeming === reward.id ? <Spinner /> : 'Redeem'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Referral Program */}
          <div className="bg-white rounded-xl border-2 border-primary p-8 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="text-primary" size={28} />
              <h2 className="text-2xl font-bold text-dark">Refer a Friend</h2>
            </div>

            <p className="text-gray-600 mb-6">Share your unique referral link and earn 200 points when they complete their first order!</p>

            <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3 mb-6">
              <input
                type="text"
                value={`${window.location.origin}/auth/signup?ref=MEMBER123`}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded"
              />
              <button
                onClick={handleCopyReferral}
                className="p-2 bg-primary text-white rounded hover:bg-[#3aad9a] transition-all"
              >
                {copied ? '✓' : <Copy size={20} />}
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-mint p-4 rounded-lg text-center">
                <TrendingUp className="text-primary mx-auto mb-2" size={24} />
                <p className="text-sm text-gray-600 mb-1">Referrals</p>
                <p className="text-2xl font-bold text-primary">{member.referrals.length}</p>
              </div>
              <div className="bg-mint p-4 rounded-lg text-center">
                <Award className="text-primary mx-auto mb-2" size={24} />
                <p className="text-sm text-gray-600 mb-1">Converted</p>
                <p className="text-2xl font-bold text-primary">
                  {member.referrals.filter(r => r.status === 'first-order').length}
                </p>
              </div>
              <div className="bg-mint p-4 rounded-lg text-center">
                <Gift className="text-primary mx-auto mb-2" size={24} />
                <p className="text-sm text-gray-600 mb-1">Points Earned</p>
                <p className="text-2xl font-bold text-primary">
                  {member.referrals.reduce((sum: number, r: any) => sum + (r.pointsEarned || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Points History */}
          {member.pointsHistory.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-dark mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {member.pointsHistory.slice(-10).reverse().map((transaction: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-lg font-bold ${transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
