'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { damageTypes, canFileClaim, getDaysRemainingToFile } from '@/lib/claimsUtils'
import { ChevronLeft, Upload, AlertCircle, CheckCircle } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  completedAt: Date
  total: number
  items: Array<{ name: string; quantity: number }>
}

export default function ClaimPage({ params }: { params: { id: string } }) {
  const [order] = useState<Order>({
    id: params.id,
    orderNumber: `WL-${Date.now()}`,
    status: 'completed',
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    total: 45.99,
    items: [
      { name: 'Shirt', quantity: 3 },
      { name: 'Pants', quantity: 2 },
      { name: 'Sweater', quantity: 1 },
    ],
  })

  const [formData, setFormData] = useState({
    damageType: '',
    severity: 'moderate',
    description: '',
    photos: [] as File[],
  })

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])

  const completedTimestamp = Math.floor(order.completedAt.getTime() / 1000)
  const canFile = canFileClaim({ seconds: completedTimestamp, nanoseconds: 0 } as any)
  const daysRemaining = getDaysRemainingToFile({ seconds: completedTimestamp, nanoseconds: 0 } as any)

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.photos.length > 5) {
      setError('Maximum 5 photos allowed')
      return
    }

    setUploading(true)
    const newPhotos: string[] = []
    for (const file of files) {
      // TODO: Upload to Firebase Storage
      const reader = new FileReader()
      reader.onload = (event) => {
        newPhotos.push(event.target?.result as string)
        if (newPhotos.length === files.length) {
          setSelectedPhotos([...selectedPhotos, ...newPhotos])
          setFormData({ ...formData, photos: [...formData.photos, ...files] })
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index)
    const newFiles = formData.photos.filter((_, i) => i !== index)
    setSelectedPhotos(newPhotos)
    setFormData({ ...formData, photos: newFiles })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.damageType) {
      setError('Please select a damage type')
      return
    }

    if (!formData.description || formData.description.length < 20) {
      setError('Description must be at least 20 characters')
      return
    }

    if (formData.photos.length === 0) {
      setError('Please upload at least one photo')
      return
    }

    // TODO: Submit claim to API
    setSubmitted(true)
  }

  if (!canFile) {
    return (
      <div className="min-h-screen bg-light">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            href={`/dashboard/orders/${params.id}`}
            className="inline-flex items-center gap-2 text-primary hover:text-opacity-80 mb-6"
          >
            <ChevronLeft size={20} />
            Back to Order
          </Link>

          <Card className="bg-red-50 border border-red-200 p-8">
            <div className="flex gap-4">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-xl font-bold text-dark mb-2">Claim Period Expired</h2>
                <p className="text-gray mb-2">
                  Damage claims must be filed within 14 days of order completion.
                </p>
                <p className="text-sm text-gray">
                  This order was completed on {order.completedAt.toLocaleDateString()}.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-light">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="text-center p-12">
            <div className="flex justify-center mb-6">
              <CheckCircle className="text-primary" size={64} />
            </div>
            <h1 className="text-3xl font-bold text-dark mb-2">Claim Submitted</h1>
            <p className="text-gray mb-6">
              Thank you for reporting the damage. We'll review your claim within 24-48 hours and notify you of the resolution.
            </p>

            <div className="bg-mint p-4 rounded-lg mb-8 text-left">
              <h3 className="font-bold text-dark mb-3">Next Steps:</h3>
              <ol className="space-y-2 text-sm text-gray">
                <li>1. Our team reviews your photos and description</li>
                <li>2. We determine the resolution (refund, re-wash, or replacement)</li>
                <li>3. You receive notification of the decision</li>
                <li>4. Resolution is processed within 5 business days</li>
              </ol>
            </div>

            <Link href={`/dashboard/orders/${params.id}`}>
              <Button variant="primary">Back to Order</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/dashboard/orders/${params.id}`}
          className="inline-flex items-center gap-2 text-primary hover:text-opacity-80 mb-6"
        >
          <ChevronLeft size={20} />
          Back to Order
        </Link>

        <h1 className="text-3xl font-bold text-dark mb-2">Report Damage</h1>
        <p className="text-gray mb-8">
          File a claim for {daysRemaining} more days (expires{' '}
          {new Date(order.completedAt.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()})
        </p>

        {error && (
          <Card className="bg-red-50 border border-red-200 mb-6 p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </Card>
        )}

        <Card className="p-6 mb-6">
          <h2 className="font-bold text-dark mb-4">Order Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray">Order Number</p>
              <p className="font-mono text-dark">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray">Order Total</p>
              <p className="font-bold text-dark">${order.total.toFixed(2)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray mb-2">Items</p>
              <div className="space-y-1">
                {order.items.map((item) => (
                  <p key={item.name} className="text-dark">
                    {item.name} ({item.quantity}x)
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h2 className="font-bold text-dark mb-4">Damage Details</h2>

            {/* Damage Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark mb-2">What was damaged?</label>
              <select
                value={formData.damageType}
                onChange={(e) => setFormData({ ...formData, damageType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select damage type...</option>
                {damageTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark mb-3">How severe is the damage?</label>
              <div className="space-y-2">
                {(['minor', 'moderate', 'severe'] as const).map((level) => (
                  <label key={level} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="severity"
                      value={level}
                      checked={formData.severity === level}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-dark capitalize">
                      {level === 'minor' ? 'Minor (small stain, minor wear)' : level === 'moderate' ? 'Moderate (tear, significant stain)' : 'Severe (unusable, destroyed)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark mb-2">
                Describe what happened (minimum 20 characters)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please provide details about the damage, when you noticed it, and which items were affected..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="font-bold text-dark mb-4">Photo Evidence</h2>
            <p className="text-sm text-gray mb-4">
              Upload clear photos of the damage. We need at least 1 photo, up to 5.
            </p>

            {/* Photo Upload */}
            <div className="mb-4">
              <label className="block border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition">
                <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="font-medium text-dark">Click to upload photos</p>
                <p className="text-xs text-gray">PNG, JPG up to 5MB each</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  disabled={uploading || selectedPhotos.length >= 5}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo Preview */}
            {selectedPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {selectedPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Damage photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray mt-4">
              {selectedPhotos.length}/5 photos uploaded
            </p>
          </Card>

          <div className="flex gap-3">
            <Link href={`/dashboard/orders/${params.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Submit Claim'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
