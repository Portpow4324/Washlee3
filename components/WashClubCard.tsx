'use client'

import { Gift, Sparkles } from 'lucide-react'

interface WashClubCardProps {
  cardNumber: string
  tier: number
  tierName: string
  creditsBalance: number
  email: string
  userName?: string
}

const TIER_COLORS = {
  1: { bg: 'from-amber-500 to-amber-600', icon: '🥉' }, // Bronze
  2: { bg: 'from-gray-300 to-gray-400', icon: '🥈' }, // Silver
  3: { bg: 'from-yellow-400 to-yellow-500', icon: '🥇' }, // Gold
  4: { bg: 'from-purple-500 to-purple-600', icon: '👑' }, // Platinum
}

export default function WashClubCard({
  cardNumber,
  tier,
  tierName,
  creditsBalance,
  email,
  userName,
}: WashClubCardProps) {
  const tierConfig = TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS[1]

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div
        className={`relative h-64 rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br ${tierConfig.bg} p-8 text-white`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between">
          {/* Top Section */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold opacity-75">WASH CLUB</p>
              <p className="text-sm font-bold">{tierName.toUpperCase()}</p>
            </div>
            <div className="text-4xl">{tierConfig.icon}</div>
          </div>

          {/* Middle Section - Logo and Tier */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold mb-1">⚡</div>
              <p className="text-xs opacity-75">Washlee</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75">CREDITS</p>
              <p className="text-2xl font-bold">{creditsBalance}</p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="space-y-2">
            <p className="text-xs opacity-75 break-all">{cardNumber}</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-75">CARDHOLDER</p>
                <p className="text-sm font-semibold">{userName || email.split('@')[0]}</p>
              </div>
              <Sparkles size={20} className="opacity-75" />
            </div>
          </div>
        </div>
      </div>

      {/* Card Info Below */}
      <div className="mt-6 space-y-3">
        <div className="bg-light rounded-lg p-4">
          <p className="text-xs text-gray font-semibold mb-2">MEMBERSHIP DETAILS</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray">Card Number</p>
              <p className="font-mono text-sm font-bold text-dark">{cardNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray">Tier</p>
              <p className="font-bold text-sm text-primary">{tierName}</p>
            </div>
            <div>
              <p className="text-xs text-gray">Credits Balance</p>
              <p className="font-bold text-sm text-primary">{creditsBalance}</p>
            </div>
            <div>
              <p className="text-xs text-gray">Email</p>
              <p className="text-sm text-dark truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-mint rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Gift size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-dark mb-1">Tier Benefits</p>
              <p className="text-xs text-gray">
                {tier === 1 && 'Earn 1 point per $1, 100pts = $5 off'}
                {tier === 2 && 'Earn 1.25x points per $1, 80pts = $5 off'}
                {tier === 3 && 'Earn 1.5x points per $1, 60pts = $5 off'}
                {tier === 4 && 'Earn 2x points per $1, VIP concierge support'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
