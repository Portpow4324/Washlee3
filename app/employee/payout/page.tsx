'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Footer from '@/components/Footer'
import { DollarSign, ArrowLeft, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'

interface PayoutData {
  amount: string
  accountHolder: string
  accountNumber: string
  bsb: string
  bankName: string
  accountType: string
}

const MIN_PAYOUT = 50

export default function EmployeePayoutPage() {
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
        const response = await fetch(`/api/employee/balance?employeeId=${user.id}`)
        const result = await response.json()

        if (result.success) {
          setAvailableBalance(result.data.availableBalance)
          setPendingPayouts(0)
          setPayoutId(user.id)

          if (userData?.name) {
            setFormData((prev) => ({ ...prev, accountHolder: userData.name || '' }))
          }
        }
      } catch (error) {
        console.error('Error fetching balance data:', error)
        setSubmitError('Failed to load balance information.')
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [user, loading, router, hasCheckedAuth, userData?.name])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess(false)

    if (!user || !payoutId) {
      setSubmitError('Not authenticated.')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setSubmitError('Please enter a valid amount.')
      return
    }
    if (parseFloat(formData.amount) > availableBalance - pendingPayouts) {
      setSubmitError('Insufficient balance for this payout.')
      return
    }
    if (parseFloat(formData.amount) < MIN_PAYOUT) {
      setSubmitError(`Minimum payout amount is $${MIN_PAYOUT}.`)
      return
    }
    if (!formData.accountHolder || !formData.accountNumber || !formData.bsb || !formData.bankName) {
      setSubmitError('Please fill in all bank details.')
      return
    }

    setIsSubmitting(true)
    try {
      const payoutResponse = await fetch('/api/employee/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
          amount: parseFloat(formData.amount),
          accountType: formData.accountType,
          accountDetails: {
            accountHolder: formData.accountHolder,
            accountNumber: formData.accountNumber,
            bsb: formData.bsb,
            bankName: formData.bankName,
          },
        }),
      })

      if (!payoutResponse.ok) {
        const error = await payoutResponse.json()
        throw new Error(error.error || 'Failed to submit payout request')
      }

      setSubmitSuccess(true)
      setFormData({
        amount: '',
        accountHolder: userData?.name || '',
        accountNumber: '',
        bsb: '',
        bankName: '',
        accountType: 'savings',
      })

      const balanceResponse = await fetch(`/api/employee/balance?employeeId=${user.id}`)
      const balanceResult = await balanceResponse.json()
      if (balanceResult.success) {
        setAvailableBalance(balanceResult.data.availableBalance)
      }
      setTimeout(() => router.push('/employee/earnings'), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit payout request'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasCheckedAuth || loading) {
    return (
      <div className="min-h-screen bg-soft-mint flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  const availableForPayout = availableBalance - pendingPayouts

  return (
    <div className="min-h-screen bg-soft-mint flex flex-col">
      <main className="flex-1 container-page py-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-6 hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="max-w-2xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-dark inline-flex items-center gap-2">
              <DollarSign size={28} className="text-primary-deep" />
              Request payout
            </h1>
            <p className="text-gray text-sm mt-1">
              Move available earnings to your AU bank account.
            </p>
          </header>

          {submitSuccess && (
            <div className="surface-card p-5 mb-6 bg-mint border-primary/20">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-primary-deep flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-dark mb-0.5">Payout request submitted</p>
                  <p className="text-sm text-gray">
                    We&rsquo;ll redirect you to earnings shortly. Funds typically arrive in 1–3 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="surface-card p-5 mb-6 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-0.5">Couldn&rsquo;t request payout</p>
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Balance overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="surface-card p-5">
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-soft">
                Available
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                ${availableBalance.toFixed(2)}
              </p>
            </div>
            <div className="surface-card p-5">
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-soft">
                Pending
              </p>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                ${pendingPayouts.toFixed(2)}
              </p>
            </div>
            <div className="surface-card p-5 bg-mint/40 border-primary/15">
              <p className="text-[11px] uppercase tracking-wider font-bold text-primary-deep">
                Ready to withdraw
              </p>
              <p className="text-2xl font-bold text-dark mt-1">
                ${availableForPayout.toFixed(2)}
              </p>
            </div>
          </div>

          {dataLoading ? (
            <div className="surface-card p-12 text-center text-gray">
              <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent mx-auto mb-3" />
              <p className="text-sm">Loading your balance…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="surface-card p-6 sm:p-8 space-y-5">
              <div>
                <label htmlFor="amount" className="label-field">
                  Payout amount (AUD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft font-semibold">
                    $
                  </span>
                  <input
                    id="amount"
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min={MIN_PAYOUT}
                    max={availableForPayout}
                    className="input-field pl-9"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-gray-soft mt-1.5">
                  Available: ${availableForPayout.toFixed(2)} · Minimum: ${MIN_PAYOUT}
                </p>
              </div>

              <div className="border-t border-line pt-5">
                <h3 className="text-base font-bold text-dark mb-4">Bank account</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="accountHolder" className="label-field">
                      Account holder name
                    </label>
                    <input
                      id="accountHolder"
                      type="text"
                      name="accountHolder"
                      value={formData.accountHolder}
                      onChange={handleInputChange}
                      placeholder="As shown on your bank account"
                      className="input-field"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bsb" className="label-field">
                        BSB
                      </label>
                      <input
                        id="bsb"
                        type="text"
                        name="bsb"
                        value={formData.bsb}
                        onChange={handleInputChange}
                        placeholder="e.g. 012 345"
                        pattern="\d{6}"
                        inputMode="numeric"
                        className="input-field"
                        disabled={isSubmitting}
                        required
                      />
                      <p className="text-xs text-gray-soft mt-1">6-digit Australian BSB.</p>
                    </div>
                    <div>
                      <label htmlFor="accountNumber" className="label-field">
                        Account number
                      </label>
                      <input
                        id="accountNumber"
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. 123456789"
                        inputMode="numeric"
                        className="input-field"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bankName" className="label-field">
                        Bank
                      </label>
                      <input
                        id="bankName"
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        placeholder="e.g. Commonwealth Bank"
                        className="input-field"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="accountType" className="label-field">
                        Account type
                      </label>
                      <select
                        id="accountType"
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleInputChange}
                        className="input-field"
                        disabled={isSubmitting}
                      >
                        <option value="savings">Savings</option>
                        <option value="transaction">Transaction / everyday</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-mint/40 border border-primary/15 p-4 text-sm text-dark space-y-1.5">
                <p>
                  <strong>Processing:</strong> Payouts typically arrive within 1–3 Australian business days.
                </p>
                <p className="text-xs text-gray">
                  Bank details are stored securely. You can update them in <span className="font-semibold">Settings</span>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="btn-outline flex-1 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.amount || availableForPayout <= 0}
                  className="btn-primary flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting…' : 'Request payout'}
                  {!isSubmitting && <ArrowRight size={16} />}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
