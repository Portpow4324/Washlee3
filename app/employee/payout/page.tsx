'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import EmployeeHeader from '@/components/EmployeeHeader'
import Footer from '@/components/Footer'
import { DollarSign, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'

interface PayoutData {
  amount: string
  accountHolder: string
  accountNumber: string
  bsb: string
  bankName: string
  accountType: string
}

export default function EmployeePayout() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [pendingPayouts, setPendingPayouts] = useState(0)
  const [payoutId, setPayoutId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  const [formData, setFormData] = useState<PayoutData>({
    amount: '',
    accountHolder: userData?.name || '',
    accountNumber: '',
    bsb: '',
    bankName: '',
    accountType: 'savings',
  })

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return

    setHasCheckedAuth(true)

    if (!user) {
      router.push('/auth/employee-signin')
      return
    }
    
    localStorage.setItem('employeeMode', 'true')

    const fetchData = async () => {
      try {
        setDataLoading(true)

        // Get employee payout info from API
        const response = await fetch(`/api/payouts?employeeId=${user.id}`)
        const result = await response.json()
        const payoutData = result.data

        if (payoutData) {
          setPayoutId(payoutData.id)
          setAvailableBalance(payoutData.total_earned || 0)
          setPendingPayouts(payoutData.pending_amount || 0)
          
          // Pre-fill form with stored bank info
          if (payoutData.account_holder_name) {
            setFormData(prev => ({
              ...prev,
              accountHolder: payoutData.account_holder_name,
              accountNumber: payoutData.bank_account_number || '',
              bsb: payoutData.bsb || '',
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching payout data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [user, loading, router, hasCheckedAuth])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess(false)

    if (!user || !payoutId) {
      setSubmitError('Not authenticated')
      return
    }

    // Validate form
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setSubmitError('Please enter a valid amount')
      return
    }

    if (parseFloat(formData.amount) > availableBalance - pendingPayouts) {
      setSubmitError('Insufficient balance')
      return
    }

    if (parseFloat(formData.amount) < 50) {
      setSubmitError('Minimum payout amount is $50')
      return
    }

    if (!formData.accountHolder || !formData.accountNumber || !formData.bsb || !formData.bankName) {
      setSubmitError('Please fill in all bank details')
      return
    }

    setIsSubmitting(true)

    try {
      // Update bank account info
      await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateBankAccount',
          payoutId,
          bankInfo: {
            bank_account_number: formData.accountNumber,
            bsb: formData.bsb,
            account_holder_name: formData.accountHolder,
          },
        }),
      })

      // Request payout
      await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'requestPayout',
          payoutId,
          amount: parseFloat(formData.amount),
        }),
      })

      setSubmitSuccess(true)
      setFormData({
        amount: '',
        accountHolder: userData?.name || '',
        accountNumber: '',
        bsb: '',
        bankName: '',
        accountType: 'savings',
      })

      setTimeout(() => {
        router.push('/employee/earnings')
      }, 3000)
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit payout request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasCheckedAuth || loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <p className="text-gray">Loading...</p>
      </div>
    )
  }

  const availableForPayout = availableBalance - pendingPayouts

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <EmployeeHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8 font-semibold"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {submitSuccess && (
          <Card className="mb-8 p-6 bg-green-500/20 border-green-500/50">
            <div className="flex items-start gap-3">
              <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-green-400 mb-1">Payout Request Submitted!</h3>
                <p className="text-sm text-green-300">
                  Your payout request has been submitted. You'll be redirected to your earnings page shortly.
                </p>
              </div>
            </div>
          </Card>
        )}

        {submitError && (
          <Card className="mb-8 p-6 bg-red-500/20 border-red-500/50">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-400 mb-1">Error</h3>
                <p className="text-sm text-red-300">{submitError}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-dark mb-2 flex items-center gap-3">
            <DollarSign size={36} className="text-primary" />
            Request Payout
          </h1>
          <p className="text-gray">Withdraw your earnings via bank transfer</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <Card className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <p className="text-gray text-sm mb-2">Total Earnings</p>
            <p className="text-3xl font-bold text-green-400">${availableBalance.toFixed(2)}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <p className="text-gray text-sm mb-2">Pending Payouts</p>
            <p className="text-3xl font-bold text-yellow-400">${pendingPayouts.toFixed(2)}</p>
          </Card>
        </div>

        {/* Available Balance Alert */}
        <Card className="mb-12 p-6 bg-primary/10 border-primary/30">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-dark mb-1">Available for Payout</h3>
              <p className="text-primary text-2xl font-bold mb-2">${availableForPayout.toFixed(2)}</p>
              <p className="text-sm text-gray">
                Minimum payout: $50 | Maximum: ${availableForPayout.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Payout Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-bold text-dark mb-3">Payout Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray font-semibold">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="50"
                  max={availableForPayout}
                  className="w-full pl-8 pr-4 py-3 bg-white border-2 border-gray rounded-lg focus:outline-none focus:border-primary text-dark placeholder-gray"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-gray mt-2">
                Available: ${availableForPayout.toFixed(2)} | Min: $50
              </p>
            </div>

            {/* Bank Details Section */}
            <div className="border-t border-gray/30 pt-6">
              <h3 className="font-bold text-dark mb-4">Bank Account Details</h3>

              <div className="space-y-4">
                {/* Account Holder */}
                <div>
                  <label className="block text-sm font-medium text-gray mb-2">Account Holder Name *</label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={formData.accountHolder}
                    onChange={handleInputChange}
                    placeholder="Full name as shown on bank account"
                    className="w-full px-4 py-2 bg-dark/50 border-2 border-gray rounded-lg focus:outline-none focus:border-primary text-white placeholder-gray/50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* BSB */}
                <div>
                  <label className="block text-sm font-medium text-gray mb-2">BSB *</label>
                  <input
                    type="text"
                    name="bsb"
                    value={formData.bsb}
                    onChange={handleInputChange}
                    placeholder="e.g., 012345"
                    pattern="\d{6}"
                    className="w-full px-4 py-2 bg-dark/50 border-2 border-gray rounded-lg focus:outline-none focus:border-primary text-white placeholder-gray/50"
                    disabled={isSubmitting}
                    required
                  />
                  <p className="text-xs text-gray mt-1">6-digit BSB code</p>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray mb-2">Account Number *</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 123456789"
                    className="w-full px-4 py-2 bg-dark/50 border-2 border-gray rounded-lg focus:outline-none focus:border-primary text-white placeholder-gray/50"
                    disabled={isSubmitting}
                    required
                  />
                  <p className="text-xs text-gray mt-1">9-digit account number</p>
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-gray mb-2">Bank Name *</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="e.g., Commonwealth Bank"
                    className="w-full px-4 py-2 bg-dark/50 border-2 border-gray rounded-lg focus:outline-none focus:border-primary text-white placeholder-gray/50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-gray mb-2">Account Type</label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white border-2 border-gray rounded-lg focus:outline-none focus:border-primary text-dark"
                    disabled={isSubmitting}
                  >
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="border-t border-gray/30 pt-6 bg-mint p-4 rounded-lg">
              <p className="text-xs text-gray mb-3">
                <strong>Processing:</strong> Payouts are processed automatically and typically arrive within 1-3 business days.
              </p>
              <p className="text-xs text-gray">
                <strong>Security:</strong> Your bank details are encrypted and stored securely.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:border-primary hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.amount || availableForPayout <= 0}
                className="flex-1"
              >
                {isSubmitting ? 'Processing...' : 'Request Payout'}
              </Button>
            </div>
          </form>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
