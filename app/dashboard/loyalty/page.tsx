'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Gift, TrendingUp, Award } from 'lucide-react'
import Card from '@/components/Card'
import { supabase } from '@/lib/supabaseClient'

export default function LoyaltyPage() {
  const { user, userData } = useAuth()
  const [loyaltyData, setLoyaltyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('loyalty_members')
          .select('*')
          .eq('customer_id', user.id)
          .single()

        if (data && !error) {
          setLoyaltyData(data)
        }
      } catch (err) {
        console.error('Error fetching loyalty data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLoyaltyData()
  }, [user])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#48C9B0] mx-auto mb-4"></div>
            <p className="text-[#6b7b78]">Loading loyalty data...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const points = loyaltyData?.loyalty_points || 0
  const tier = loyaltyData?.tier || 'Silver'
  const totalSpent = loyaltyData?.total_spent || 0

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1f2d2b] mb-4">Loyalty Program</h1>
            <p className="text-lg text-[#6b7b78]">Earn rewards with every wash and enjoy exclusive benefits</p>
          </div>

          {/* Loyalty Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card hoverable className="text-center p-8">
              <Gift className="w-12 h-12 text-[#48C9B0] mx-auto mb-4" />
              <p className="text-[#6b7b78] mb-2">Loyalty Points</p>
              <p className="text-4xl font-bold text-[#1f2d2b]">{points}</p>
            </Card>
            <Card hoverable className="text-center p-8">
              <Award className="w-12 h-12 text-[#48C9B0] mx-auto mb-4" />
              <p className="text-[#6b7b78] mb-2">Current Tier</p>
              <p className="text-4xl font-bold text-[#1f2d2b]">{tier}</p>
            </Card>
            <Card hoverable className="text-center p-8">
              <TrendingUp className="w-12 h-12 text-[#48C9B0] mx-auto mb-4" />
              <p className="text-[#6b7b78] mb-2">Total Spent</p>
              <p className="text-4xl font-bold text-[#1f2d2b]">${totalSpent}</p>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold text-[#1f2d2b] mb-6">How Our Loyalty Program Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E8FFFB] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-[#48C9B0]">1</span>
                </div>
                <h3 className="font-bold text-[#1f2d2b] mb-2">Earn Points</h3>
                <p className="text-[#6b7b78]">Earn 1 point per dollar spent on laundry services</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E8FFFB] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-[#48C9B0]">2</span>
                </div>
                <h3 className="font-bold text-[#1f2d2b] mb-2">Reach Tiers</h3>
                <p className="text-[#6b7b78]">Unlock Silver, Gold, and Platinum tiers for better rewards</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E8FFFB] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-[#48C9B0]">3</span>
                </div>
                <h3 className="font-bold text-[#1f2d2b] mb-2">Redeem Rewards</h3>
                <p className="text-[#6b7b78]">Redeem points for discounts and exclusive perks</p>
              </div>
            </div>
          </Card>

          {/* Tier Benefits */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-[#1f2d2b] mb-6">Tier Benefits</h2>
            <div className="space-y-4">
              {[
                { tier: 'Silver', points: '0-499', discount: '5%', perks: 'Basic rewards' },
                { tier: 'Gold', points: '500-1,499', discount: '10%', perks: 'Priority support + Free express delivery' },
                { tier: 'Platinum', points: '1,500+', discount: '15%', perks: 'VIP support + Free services' },
              ].map((level) => (
                <div key={level.tier} className="flex items-center justify-between p-4 bg-gradient-to-r from-[#E8FFFB] to-transparent rounded-lg">
                  <div>
                    <p className="font-bold text-[#1f2d2b]">{level.tier}</p>
                    <p className="text-sm text-[#6b7b78]">{level.points} points</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#48C9B0]">{level.discount} discount</p>
                    <p className="text-sm text-[#6b7b78]">{level.perks}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Back Link */}
          <div className="mt-12 text-center">
            <Link href="/dashboard" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
