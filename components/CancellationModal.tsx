'use client'

import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'

interface CancellationModalProps {
  orderId: string
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onSubmit: (reason: string, notes: string) => Promise<void>
}

const CANCELLATION_REASONS = [
  { value: 'change_of_mind', label: 'Changed my mind' },
  { value: 'found_alternative', label: 'Found alternative service' },
  { value: 'scheduling_conflict', label: 'Scheduling conflict' },
  { value: 'damaged_items', label: 'Damage to items (requesting refund)' },
  { value: 'quality_issues', label: 'Quality or service issues' },
  { value: 'other', label: 'Other reason' },
]

export default function CancellationModal({
  orderId,
  isOpen,
  isLoading,
  onClose,
  onSubmit,
}: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedReason) {
      setError('Please select a cancellation reason')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await onSubmit(selectedReason, notes)
      // Reset form on success
      setSelectedReason('')
      setNotes('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1f2d2b]">Cancel Order</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Cancelling this order will result in a refund. A support representative will contact you to process the refund.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">
              Reason for cancellation *
            </label>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <label key={reason.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    disabled={submitting}
                    className="w-4 h-4 text-[#48C9B0] cursor-pointer"
                  />
                  <span className="text-sm text-[#1f2d2b]">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              placeholder="Please provide any additional information about your cancellation..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#48C9B0] resize-none"
              rows={4}
            />
            <p className="text-xs text-[#6b7b78] mt-1">
              {selectedReason === 'damaged_items' && 'Please describe the damage in detail so we can process your refund quickly.'}
              {selectedReason === 'quality_issues' && 'Please describe the quality issues you experienced.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-semibold text-[#1f2d2b] hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedReason}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
