'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, Check } from 'lucide-react'
import Spinner from './Spinner'

interface SavedPaymentMethod {
  id: string
  type: 'card'
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

interface PaymentMethodsListProps {
  customerId: string
  onSelect?: (methodId: string) => void
  onAddNew?: () => void
}

export function PaymentMethodsList({
  customerId,
  onSelect,
  onAddNew
}: PaymentMethodsListProps) {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentMethods()
  }, [customerId])

  async function fetchPaymentMethods() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_payment_methods',
          customerId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMethods(data.methods || [])
        if (data.methods?.length > 0) {
          const defaultMethod = data.methods.find((m: SavedPaymentMethod) => m.isDefault)
          setSelectedId(defaultMethod?.id || data.methods[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(methodId: string) {
    try {
      setDeletingId(methodId)
      // TODO: Implement delete endpoint
      // For now, just remove from list
      setMethods(methods.filter(m => m.id !== methodId))
      if (selectedId === methodId && methods.length > 1) {
        const remaining = methods.filter(m => m.id !== methodId)
        setSelectedId(remaining[0].id)
        if (onSelect) onSelect(remaining[0].id)
      }
    } catch (error) {
      console.error('Error deleting payment method:', error)
    } finally {
      setDeletingId(null)
    }
  }

  function handleSelect(methodId: string) {
    setSelectedId(methodId)
    if (onSelect) onSelect(methodId)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {methods.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-600 mb-4">No saved payment methods</p>
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#48C9B0] text-white rounded-lg hover:bg-[#3aad9a] transition-all"
          >
            <Plus size={18} />
            Add Payment Method
          </button>
        </div>
      ) : (
        <>
          {methods.map((method) => (
            <div
              key={method.id}
              onClick={() => handleSelect(method.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedId === method.id
                  ? 'border-[#48C9B0] bg-[#E8FFFB]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {selectedId === method.id && (
                      <div className="w-5 h-5 rounded-full bg-[#48C9B0] flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 capitalize">
                      {method.card.brand} •••• {method.card.last4}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Expires {String(method.card.expMonth).padStart(2, '0')}/
                      {String(method.card.expYear).slice(-2)}
                    </div>
                    {method.isDefault && (
                      <div className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">
                        Default
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(method.id)
                  }}
                  disabled={deletingId === method.id || methods.length === 1}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-300 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={onAddNew}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#48C9B0] hover:text-[#48C9B0] rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Another Payment Method
          </button>
        </>
      )}
    </div>
  )
}
