'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ReviewCard } from '@/components/ReviewCard'
import { Review, calculateProRating } from '@/lib/reviewUtils'
import { ChevronLeft, MapPin, Phone, Star } from 'lucide-react'
import Link from 'next/link'

export default function ProProfilePage() {
  const params = useParams()
  const proId = params.id as string

  const [pro, setPro] = useState<any>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterRating, setFilterRating] = useState<number | null>(null)

  // Fetch pro details and reviews
  useEffect(() => {
    async function fetchData() {
      try {
        // In production, fetch from /api/pro/[id]
        // For now, use mock data
        setPro({
          id: proId,
          name: 'John Smith',
          email: 'john@example.com',
          phone: '(02) 1234 5678',
          location: 'Sydney, NSW',
          serviceArea: 'Sydney Metro',
          specializations: ['delicates', 'suede', 'stain-removal'],
          yearsExperience: 5,
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          verified: true,
        })

        const res = await fetch(`/api/reviews?proId=${proId}`)
        if (res.ok) {
          const data = await res.json()
          setReviews(data)
        }
      } catch (err) {
        setError('Failed to load pro profile')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (proId) fetchData()
  }, [proId])

  async function handleReviewHelpful(reviewId: string) {
    try {
      const res = await fetch(`/api/reviews/moderation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          action: 'helpful',
        }),
      })

      if (res.ok) {
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId ? { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 } : r
          )
        )
      }
    } catch (err) {
      console.error('Failed to mark review as helpful:', err)
    }
  }

  async function handleReviewFlag(reviewId: string, reason: string) {
    try {
      const res = await fetch(`/api/reviews/moderation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          action: 'flag',
          reason,
        }),
      })

      if (res.ok) {
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId ? { ...r, flagged: true } : r
          )
        )
      }
    } catch (err) {
      console.error('Failed to flag review:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block px-6 py-3 bg-[#48C9B0] text-white rounded-lg">
            Loading profile...
          </div>
        </div>
      </div>
    )
  }

  if (!pro) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pro not found</h1>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-[#48C9B0] text-white rounded-lg hover:bg-[#3ab09c] transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const averageRating = reviews.length > 0 ? calculateProRating(reviews) : 0
  const approvedReviews = reviews.filter(r => r.status === 'approved')
  const filteredReviews = filterRating
    ? approvedReviews.filter(r => Math.floor(r.rating) === filterRating)
    : approvedReviews

  const ratingDistribution = {
    5: approvedReviews.filter(r => r.rating === 5).length,
    4: approvedReviews.filter(r => r.rating === 4).length,
    3: approvedReviews.filter(r => r.rating === 3).length,
    2: approvedReviews.filter(r => r.rating === 2).length,
    1: approvedReviews.filter(r => r.rating === 1).length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[#48C9B0] hover:text-[#3ab09c] transition-colors mb-6"
        >
          <ChevronLeft size={20} />
          Back
        </Link>

        {/* Pro Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex gap-6 mb-6">
            <img
              src={pro.avatar}
              alt={pro.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{pro.name}</h1>
                {pro.verified && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(Math.round(averageRating))}
                    {'☆'.repeat(5 - Math.round(averageRating))}
                  </div>
                  <span className="font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                  <span className="text-gray-600">({approvedReviews.length} reviews)</span>
                </div>
              </div>
              <div className="space-y-2 text-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#48C9B0]" />
                  <span>{pro.location} • {pro.serviceArea}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-[#48C9B0]" />
                  <span>{pro.phone}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">{pro.yearsExperience} years experience</span>
                </div>
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-3">Specializations</p>
            <div className="flex flex-wrap gap-2">
              {pro.specializations.map((spec: string) => (
                <span
                  key={spec}
                  className="px-3 py-1 bg-[#E8FFFB] text-[#48C9B0] text-sm rounded-full font-semibold"
                >
                  {spec.charAt(0).toUpperCase() + spec.slice(1).replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

          {approvedReviews.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Star size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No reviews yet</p>
            </div>
          ) : (
            <>
              {/* Rating Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
                <div className="grid grid-cols-2 gap-8">
                  {/* Average Rating */}
                  <div className="text-center">
                    <div className="text-5xl font-bold text-[#48C9B0] mb-2">{averageRating.toFixed(1)}</div>
                    <div className="flex justify-center text-yellow-400 mb-2">
                      {Array(5)
                        .fill(null)
                        .map((_, i) => (
                          <span key={i}>{i < Math.round(averageRating) ? '★' : '☆'}</span>
                        ))}
                    </div>
                    <p className="text-gray-600">based on {approvedReviews.length} reviews</p>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 w-12">{rating}★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{
                              width: `${(ratingDistribution[rating as keyof typeof ratingDistribution] / approvedReviews.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {ratingDistribution[rating as keyof typeof ratingDistribution]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 mb-6 pb-6 border-b border-gray-200 overflow-x-auto">
                <button
                  onClick={() => setFilterRating(null)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors whitespace-nowrap ${
                    filterRating === null
                      ? 'bg-[#48C9B0] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({approvedReviews.length})
                </button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(rating)}
                    className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors whitespace-nowrap ${
                      filterRating === rating
                        ? 'bg-[#48C9B0] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {rating}★ ({ratingDistribution[rating as keyof typeof ratingDistribution]})
                  </button>
                ))}
              </div>

              {/* Reviews List */}
              <div>
                {filteredReviews.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">No reviews with {filterRating} stars</p>
                  </div>
                ) : (
                  filteredReviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onHelpful={handleReviewHelpful}
                      onFlag={handleReviewFlag}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
