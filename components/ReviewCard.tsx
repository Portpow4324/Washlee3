'use client'

import { Review, getStarDisplay } from '@/lib/reviewUtils'
import { ThumbsUp, Flag } from 'lucide-react'
import { useState } from 'react'

interface ReviewCardProps {
  review: Review
  onHelpful?: (reviewId: string) => void
  onFlag?: (reviewId: string, reason: string) => void
}

export function ReviewCard({ review, onHelpful, onFlag }: ReviewCardProps) {
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleFlag() {
    if (!flagReason.trim()) return

    try {
      setIsSubmitting(true)
      if (onFlag) {
        onFlag(review.id, flagReason)
        setShowFlagForm(false)
        setFlagReason('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex text-yellow-400">{getStarDisplay(review.rating)}</div>
            <span className="font-bold text-gray-900">{review.rating.toFixed(1)}</span>
          </div>
          {review.verifiedPurchase && (
            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">
              ✓ Verified Purchase
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {review.createdAt instanceof Date
            ? review.createdAt.toLocaleDateString()
            : new Date((review.createdAt as any).toMillis?.() || 0).toLocaleDateString()}
        </span>
      </div>

      {/* Category Ratings */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-600 mb-1">Speed</p>
          <p className="text-sm font-semibold text-gray-900">{review.categoryRatings.speed}/5</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Quality</p>
          <p className="text-sm font-semibold text-gray-900">{review.categoryRatings.quality}/5</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Professionalism</p>
          <p className="text-sm font-semibold text-gray-900">{review.categoryRatings.professionalism}/5</p>
        </div>
      </div>

      {/* Review Text */}
      {review.text && (
        <p className="text-gray-700 mb-4">
          {review.text}
        </p>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {review.photos.map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt="Review photo"
              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onHelpful && onHelpful(review.id)}
          className="flex items-center gap-2 text-gray-600 hover:text-[#48C9B0] transition-colors text-sm"
        >
          <ThumbsUp size={16} />
          Helpful ({review.helpfulVotes})
        </button>

        <button
          onClick={() => setShowFlagForm(!showFlagForm)}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm"
        >
          <Flag size={16} />
          Report
        </button>
      </div>

      {/* Flag Form */}
      {showFlagForm && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-2">Why are you reporting this review?</p>
          <textarea
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Please explain..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#48C9B0] mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleFlag}
              disabled={!flagReason.trim() || isSubmitting}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Reporting...' : 'Report'}
            </button>
            <button
              onClick={() => {
                setShowFlagForm(false)
                setFlagReason('')
              }}
              className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
