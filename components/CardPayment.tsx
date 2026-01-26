'use client'

import { useState, useEffect } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import Spinner from './Spinner'

interface CardPaymentProps {
  clientSecret: string
  orderId: string
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

export function CardPayment({
  clientSecret,
  orderId,
  amount,
  onSuccess,
  onError
}: CardPaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (stripe && elements) {
      setIsLoaded(true)
    }
  }, [stripe, elements])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      onError('Payment system not ready')
      return
    }

    setIsProcessing(true)
    console.log('Starting payment confirmation...')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required'
      })

      console.log('Payment response:', { error, status: paymentIntent?.status })

      if (error) {
        console.error('Payment error:', error.message)
        onError(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id)
        onSuccess(paymentIntent.id)
      } else {
        console.warn('Payment status:', paymentIntent?.status)
        onError('Payment not completed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment error'
      console.error('Payment error caught:', errorMessage, err)
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto'
            }
          }}
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Order ID:</span>
          <span className="font-mono text-sm">{orderId}</span>
        </div>
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total Amount:</span>
          <span className="text-[#48C9B0]">${(amount / 100).toFixed(2)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
          isProcessing || !stripe
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#48C9B0] hover:bg-[#3aad9a] active:scale-95'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner />
            Processing Payment...
          </div>
        ) : (
          `Pay $${(amount / 100).toFixed(2)}`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secure and encrypted with Stripe
      </p>
    </form>
  )
}
