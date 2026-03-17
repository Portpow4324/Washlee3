'use client'

import { useState } from 'react'
import { Gift, ChevronRight, X, Check } from 'lucide-react'
import Button from '@/components/Button'
import Link from 'next/link'

interface WashClubSignupModalProps {
  onJoin: () => void
  onSkip: () => void
  isOpen: boolean
}

export default function WashClubSignupModal({
  onJoin,
  onSkip,
  isOpen,
}: WashClubSignupModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Gift size={32} />
            <h2 className="text-2xl font-bold">Join Wash Club</h2>
          </div>
          <p className="opacity-90 text-sm">
            Earn rewards on every order, completely free
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <Check size={20} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-dark">No fees</p>
                <p className="text-sm text-gray">Free to join and use</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check size={20} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-dark">Instant activation</p>
                <p className="text-sm text-gray">Start earning immediately</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check size={20} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-dark">100% digital</p>
                <p className="text-sm text-gray">Track everything in the app</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray mb-8 text-center">
            Joining Wash Club is completely free and takes 30 seconds. Start earning points on your next wash and unlock free rewards faster than you think.
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              No Thanks
            </Button>
            <Button
              onClick={onJoin}
              className="flex-1 flex items-center justify-center gap-2"
            >
              Yes, Join Now
              <ChevronRight size={16} />
            </Button>
          </div>

          <p className="text-xs text-gray text-center mt-4">
            You can skip this for now and join anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  )
}
