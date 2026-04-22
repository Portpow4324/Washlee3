'use client'

import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'

interface RemoveOrderWarningModalProps {
  isOpen: boolean
  orderAmount: number
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  error?: string
}

export default function RemoveOrderWarningModal({
  isOpen,
  orderAmount,
  onConfirm,
  onCancel,
  isLoading = false,
  error = '',
}: RemoveOrderWarningModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 relative" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle size={48} className="text-red-600" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Remove Order from List?
        </h2>

        {/* Warning Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 mb-3">
            <strong>⚠️ Important:</strong> If you remove this order from your list, you may not be able to request a refund afterward.
          </p>

          <div className="bg-white rounded p-3 mt-3 border border-red-100">
            <p className="text-sm font-semibold text-gray-900 mb-1">Order Amount</p>
            <p className="text-lg font-bold text-gray-900">${orderAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            This action will <strong>permanently delete this order</strong> from your dashboard. This cannot be undone.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Cancel Button */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Keep Order
          </button>

          {/* Delete Button */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Removing...
              </>
            ) : (
              'Yes, Remove It'
            )}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            📌 <strong>Pro Tip:</strong> If you need a refund, request it before removing the order from your list.
          </p>
        </div>
      </div>
    </div>
  )
}
