'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { Gift, Star, TrendingUp, Zap, Crown } from 'lucide-react'

interface WashClubStatus {
  isEnrolled: boolean
  enrollmentDate?: string
  cardsCollected: number
  totalWashes: number
  nextReward?: string
}

export default function WashClubPage() {
  const { user, loading: authLoading } = useAuth()
  const [clubStatus, setClubStatus] = useState<WashClubStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return

    const loadClubStatus = async () => {
      try {
        setIsLoading(true)
        // TODO: Fetch wash club enrollment status from database
        // For now, show default status
        setClubStatus({
          isEnrolled: false,
          cardsCollected: 0,
          totalWashes: 0,
        })
      } catch (err) {
        console.error('Error loading wash club status:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadClubStatus()
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-[#48C9B0] to-[#7FE3D3] rounded-full">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-[#1f2d2b]">Wash Club</h1>
            </div>
            <p className="text-[#6b7b78] text-lg">
              Earn rewards with every wash and unlock exclusive benefits
            </p>
          </div>

          {/* Status Section */}
          {clubStatus?.isEnrolled ? (
            <Card className="p-8 mb-8 bg-gradient-to-br from-[#E8FFFB] to-white border-2 border-[#48C9B0]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[#6b7b78] font-semibold mb-2">Status</p>
                  <p className="text-3xl font-bold text-[#1f2d2b]">
                    Active Member
                  </p>
                  {clubStatus.enrollmentDate && (
                    <p className="text-[#6b7b78] text-sm mt-2">
                      Member since {new Date(clubStatus.enrollmentDate).toLocaleDateString('en-AU')}
                    </p>
                  )}
                </div>
                <Crown className="w-12 h-12 text-[#48C9B0]" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-[#48C9B0]">{clubStatus.cardsCollected}</p>
                  <p className="text-[#6b7b78] text-sm mt-2">Cards Collected</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-[#48C9B0]">{clubStatus.totalWashes}</p>
                  <p className="text-[#6b7b78] text-sm mt-2">Total Washes</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-[#48C9B0]">
                    {Math.floor((clubStatus.cardsCollected / 10) * 100)}%
                  </p>
                  <p className="text-[#6b7b78] text-sm mt-2">To Next Reward</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 mb-8 bg-gradient-to-br from-[#E8FFFB] to-white border-2 border-[#48C9B0]">
              <div className="text-center mb-8">
                <Gift className="w-16 h-16 text-[#48C9B0] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#1f2d2b] mb-2">
                  Join Wash Club Today
                </h2>
                <p className="text-[#6b7b78] mb-6">
                  Get exclusive rewards and benefits with every wash
                </p>
                <Button className="px-8 py-3 text-lg">
                  Enroll Now
                </Button>
              </div>
            </Card>
          )}

          {/* How It Works */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#1f2d2b] mb-6">How Wash Club Works</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#48C9B0] text-white font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#1f2d2b] mb-1">Collect Cards</h3>
                  <p className="text-[#6b7b78]">
                    Earn one card with every 2kg of laundry (approx 1 bag)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#48C9B0] text-white font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#1f2d2b] mb-1">Unlock Rewards</h3>
                  <p className="text-[#6b7b78]">
                    Collect 10 cards to unlock exclusive rewards and discounts
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#48C9B0] text-white font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#1f2d2b] mb-1">Redeem Perks</h3>
                  <p className="text-[#6b7b78]">
                    Get discounts, free services, and VIP benefits as a member
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Rewards Tiers */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#1f2d2b] mb-6">Reward Tiers</h2>
            <div className="space-y-4">
              <div className="border-2 border-[#48C9B0] rounded-lg p-4 bg-[#E8FFFB]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#1f2d2b]">Silver Member</h3>
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-[#6b7b78] text-sm mb-3">First 10 cards collected</p>
                <div className="space-y-1 text-sm">
                  <p>✓ 5% discount on all services</p>
                  <p>✓ Free hang dry service ($16.50 value)</p>
                  <p>✓ Early access to new services</p>
                </div>
              </div>

              <div className="border-2 border-[#48C9B0] rounded-lg p-4 bg-[#E8FFFB]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#1f2d2b]">Gold Member</h3>
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
                <p className="text-[#6b7b78] text-sm mb-3">20+ cards collected</p>
                <div className="space-y-1 text-sm">
                  <p>✓ 10% discount on all services</p>
                  <p>✓ Free hang dry + delicates service ($38.50 value)</p>
                  <p>✓ Priority customer support</p>
                  <p>✓ Exclusive member-only deals</p>
                </div>
              </div>

              <div className="border-2 border-[#48C9B0] rounded-lg p-4 bg-gradient-to-r from-[#E8FFFB] to-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#1f2d2b] flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#48C9B0]" />
                    Platinum Member
                  </h3>
                  <Zap className="w-5 h-5 text-[#48C9B0]" />
                </div>
                <p className="text-[#6b7b78] text-sm mb-3">50+ cards collected</p>
                <div className="space-y-1 text-sm">
                  <p>✓ 15% discount on all services</p>
                  <p>✓ Free premium services package ($100+ value)</p>
                  <p>✓ VIP customer support 24/7</p>
                  <p>✓ Exclusive events and early access</p>
                  <p>✓ Complimentary monthly services</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Back Link */}
          <div className="text-center">
            <Link href="/dashboard" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
