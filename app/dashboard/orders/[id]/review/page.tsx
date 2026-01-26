'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Review, validateReview } from '@/lib/reviewUtils'
import { ChevronLeft, Upload } from 'lucide-react'

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    rating: 5,
    text: '',
    categoryRatings: {
      speed: 5,
      quality: 5,
      professionalism: 5,
    },
    photos: [] as string[],
  })

  const [photoPreview, setPhotoPreview] = useState<string[]>([])

  // Fetch order details
  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) throw new Error('Failed to fetch order')
        const data = await res.json()
        setOrder(data)
      } catch (err) {
        setError('Failed to load order details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) fetchOrder()
  }, [orderId])

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    // In production, upload to Firebase Storage
    // For now, create object URLs for preview
    const newPreviews = Array.from(files).map(file => URL.createObjectURL(file))
    setPhotoPreview(prev => [...prev, ...newPreviews].slice(0, 5)) // Max 5 photos

    // TODO: Upload to Firebase Storage and get download URLs
    // setFormData(prev => ({
    //   ...prev,
    //   photos: [...prev.photos, ...downloadUrls]
    // }))
  }

  function removePhoto(index: number) {
    setPhotoPreview(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validate review
      const reviewData: Omit<Review, 'id' | 'createdAt' | 'status'> = {
        orderId,
        customerId: '', // Will be set from auth context in real implementation
        proId: order.assignedPro?.id || '',
        rating: formData.rating,
        text: formData.text,
        categoryRatings: formData.categoryRatings,
        photos: formData.photos,
        helpfulVotes: 0,
        verifiedPurchase: true,
      }

      const validation = validateReview(reviewData)
      if (!validation.valid) {
        setError(validation.errors[0] || 'Review validation failed')
        return
      }

      // Submit review
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit review')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/dashboard/orders/${orderId}`)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block px-6 py-3 bg-[#48C9B0] text-white rounded-lg">
            Loading order...
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h1>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-[#48C9B0] text-white rounded-lg hover:bg-[#3ab09c] transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#48C9B0] hover:text-[#3ab09c] transition-colors mb-4"
          >
            <ChevronLeft size={20} />
            Back to order
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate your service</h1>
          <p className="text-gray-600">Order {order.orderNumber} • {order.assignedPro?.name || 'Washlee Pro'}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">✓ Review submitted successfully!</p>
            <p className="text-green-700 text-sm">Redirecting...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Overall Rating */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Overall Rating *
            </label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                  className={`text-4xl transition-transform hover:scale-110 ${
                    star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">{formData.rating} out of 5</p>
          </div>

          {/* Category Ratings */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Ratings *</h3>
            
            {[
              { key: 'speed', label: 'Speed', description: 'How quickly was the service completed?' },
              { key: 'quality', label: 'Quality', description: 'How well were your clothes cleaned?' },
              { key: 'professionalism', label: 'Professionalism', description: 'How professional was the service?' },
            ].map(category => (
              <div key={category.key} className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{category.label}</p>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  <span className="text-lg font-bold text-[#48C9B0]">
                    {formData.categoryRatings[category.key as keyof typeof formData.categoryRatings]}/5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.categoryRatings[category.key as keyof typeof formData.categoryRatings]}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      categoryRatings: {
                        ...prev.categoryRatings,
                        [category.key]: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#48C9B0]"
                />
              </div>
            ))}
          </div>

          {/* Review Text */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-2">
              Your Review
            </label>
            <p className="text-sm text-gray-600 mb-3">Share your experience with other customers</p>
            <textarea
              value={formData.text}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, text: e.target.value }))
              }
              placeholder="Tell us about your experience... (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#48C9B0] focus:ring-1 focus:ring-[#48C9B0]"
              rows={5}
            />
            <p className="text-xs text-gray-500 mt-2">{formData.text.length} characters</p>
          </div>

          {/* Photo Upload */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-2">
              Photos
            </label>
            <p className="text-sm text-gray-600 mb-3">Upload up to 5 photos (optional)</p>
            
            {photoPreview.length < 5 && (
              <label className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-4">
                <div className="text-center">
                  <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900">Click to upload</p>
                  <p className="text-xs text-gray-600">or drag and drop</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}

            {photoPreview.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoPreview.map((preview, i) => (
                  <div key={i} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${i}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || formData.rating === 0}
            className="w-full px-6 py-3 bg-[#48C9B0] text-white font-semibold rounded-lg hover:bg-[#3ab09c] disabled:bg-gray-400 transition-colors"
          >
            {submitting ? 'Submitting review...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
