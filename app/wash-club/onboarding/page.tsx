'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import {
  Gift,
  CheckCircle,
  Mail,
  Check,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { WASH_CLUB_TIERS } from '@/lib/washClub'
import { authenticatedFetch } from '@/lib/firebaseAuthClient'
import WashClubCard from '@/components/WashClubCard'

type OnboardingStep = 'info' | 'email-verify' | 'terms' | 'confirmation'

function WashClubOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const email = searchParams?.get('email') || user?.email || ''

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('info')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cardNumber, setCardNumber] = useState<string>('')

  // Email verification
  const [verificationCode, setVerificationCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [termsScrolled, setTermsScrolled] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signup')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) return <Spinner />

  const sendVerificationEmail = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await authenticatedFetch(
        '/api/wash-club/send-verification-email',
        {
          method: 'POST',
          body: JSON.stringify({ email: user.email }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to send verification email')
      }

      setCodeSent(true)
      setSuccessMessage('Verification code sent to your email')
    } catch (err) {
      setError('Failed to send verification email. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyEmail = async () => {
    setIsLoading(true)
    setCodeError('')
    setError('')
    try {
      const response = await authenticatedFetch(
        '/api/wash-club/verify-email',
        {
          method: 'POST',
          body: JSON.stringify({
            email: user.email,
            code: verificationCode,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid verification code')
      }

      setCurrentStep('terms')
    } catch (err: any) {
      setCodeError(err.message || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    if (
      element.scrollHeight - element.scrollTop <= element.clientHeight + 100
    ) {
      setTermsScrolled(true)
    }
  }

  const acceptTerms = async () => {
    if (!termsAccepted || !privacyAccepted) {
      setError('Please accept both terms and privacy policy')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await authenticatedFetch(
        '/api/wash-club/complete-enrollment',
        {
          method: 'POST',
          body: JSON.stringify({
            termsAccepted: true,
            privacyAccepted: true,
            enrollmentDate: new Date().toISOString(),
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to complete enrollment')
      }

      const data = await response.json()
      setCardNumber(data.membership?.cardNumber || '')
      setCurrentStep('confirmation')
      setSuccessMessage('Welcome to Wash Club!')
    } catch (err) {
      setError('Failed to complete enrollment. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-light py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Step Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {(['info', 'email-verify', 'terms', 'confirmation'] as const).map(
                (step, idx) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        currentStep === step || (['info', 'email-verify', 'terms', 'confirmation'].indexOf(currentStep) > idx)
                          ? 'bg-primary text-white'
                          : 'bg-gray/20 text-gray'
                      }`}
                    >
                      {['info', 'email-verify', 'terms', 'confirmation'].indexOf(currentStep) > idx ? (
                        <Check size={20} />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < 3 && (
                      <div
                        className={`w-16 h-1 mx-2 ${
                          ['info', 'email-verify', 'terms', 'confirmation'].indexOf(currentStep) > idx
                            ? 'bg-primary'
                            : 'bg-gray/20'
                        }`}
                      />
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Step 1: Info */}
          {currentStep === 'info' && (
            <Card className="p-8">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Gift size={32} className="text-primary" />
                  <h1 className="text-3xl font-bold text-dark">
                    Welcome to Wash Club
                  </h1>
                </div>
                <p className="text-gray text-lg">
                  Your exclusive membership for earning rewards on every wash
                </p>
              </div>

              {/* Benefits Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border-l-4 border-l-primary pl-4">
                  <h3 className="font-bold text-dark mb-2">🎁 Earn Rewards</h3>
                  <p className="text-sm text-gray">
                    Get 5-15% credits back on every order depending on your tier
                  </p>
                </div>
                <div className="border-l-4 border-l-accent pl-4">
                  <h3 className="font-bold text-dark mb-2">💰 Save Money</h3>
                  <p className="text-sm text-gray">
                    Redeem credits for discounts on future orders
                  </p>
                </div>
                <div className="border-l-4 border-l-primary pl-4">
                  <h3 className="font-bold text-dark mb-2">📈 Level Up</h3>
                  <p className="text-sm text-gray">
                    Unlock higher tiers with exclusive perks
                  </p>
                </div>
                <div className="border-l-4 border-l-accent pl-4">
                  <h3 className="font-bold text-dark mb-2">⚡ Instant Access</h3>
                  <p className="text-sm text-gray">
                    No fees, no setup. Start earning right away
                  </p>
                </div>
              </div>

              {/* Tier Preview */}
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-6 mb-8">
                <h3 className="font-bold text-dark mb-4">Your Starting Tier</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-bold text-primary">Bronze Member</span>
                  </p>
                  <ul className="text-sm text-gray space-y-1">
                    <li>✓ 5% credits earned on every order</li>
                    <li>✓ 25 bonus credits when you join</li>
                    <li>✓ 1 credit = $0.01 value</li>
                    <li>✓ Upgrade to Silver at $200 annual spend</li>
                  </ul>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg mb-6">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Skip for Now
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setCurrentStep('email-verify')
                    setCodeSent(false)
                  }}
                  className="flex-1"
                >
                  Continue
                  <ChevronRight size={18} />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Email Verification */}
          {currentStep === 'email-verify' && (
            <Card className="p-8">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Mail size={32} className="text-primary" />
                  <h1 className="text-3xl font-bold text-dark">
                    Verify Your Email
                  </h1>
                </div>
                <p className="text-gray">
                  We'll send a verification code to{' '}
                  <span className="font-bold text-dark">{user.email}</span>
                </p>
              </div>

              {successMessage && (
                <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg mb-6">
                  <Check size={20} />
                  <span>{successMessage}</span>
                </div>
              )}

              {codeError && (
                <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg mb-6">
                  <AlertCircle size={20} />
                  <span>{codeError}</span>
                </div>
              )}

              {!codeSent ? (
                <>
                  <p className="text-sm text-gray mb-6">
                    Click the button below and we'll send a verification code to your email. This helps us confirm your email address.
                  </p>
                  <Button
                    onClick={sendVerificationEmail}
                    disabled={isLoading}
                    className="w-full mb-6"
                  >
                    {isLoading ? <Spinner /> : 'Send Verification Code'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-dark mb-2">
                      Enter Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                    />
                    <p className="text-xs text-gray mt-2">
                      Check your email for the verification code
                    </p>
                  </div>

                  <Button
                    onClick={verifyEmail}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full mb-3"
                  >
                    {isLoading ? <Spinner /> : 'Verify Email'}
                  </Button>

                  <Button
                    onClick={() => {
                      setCodeSent(false)
                      setVerificationCode('')
                      setCodeError('')
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Code
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                onClick={() => setCurrentStep('info')}
                className="w-full mt-4"
              >
                Back
              </Button>
            </Card>
          )}

          {/* Step 3: Terms & Agreements */}
          {currentStep === 'terms' && (
            <Card className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-dark mb-2">
                  Terms & Agreements
                </h1>
                <p className="text-gray">
                  Please review and accept our terms before joining Wash Club
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg mb-6">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {/* Terms Content */}
              <div className="bg-light rounded-lg p-6 mb-6 max-h-64 overflow-y-auto border border-gray/20"
                onScroll={handleTermsScroll}
              >
                <h3 className="font-bold text-dark mb-3">Wash Club Terms of Service</h3>
                
                <div className="text-sm text-gray space-y-4">
                  <div>
                    <p className="font-semibold text-dark mb-1">1. Membership</p>
                    <p>Wash Club membership is free to join and cancellable at any time. Bronze tier is automatic upon enrollment.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-dark mb-1">2. Credits & Rewards</p>
                    <p>Members earn credits based on their tier level (5-15% per order). Credits are valued at $0.01 each and can be redeemed on future orders. Maximum redemption is 50% of order total.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-dark mb-1">3. Tier Advancement</p>
                    <p>Tiers are based on annual spending and calculated automatically. Tier changes take effect immediately upon reaching spending thresholds.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-dark mb-1">4. Credit Expiration</p>
                    <p>Unused credits expire after 12 months of account inactivity. We will notify you before expiration.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-dark mb-1">5. Restrictions</p>
                    <p>Credits cannot be transferred, refunded, or exchanged for cash. They are non-transferable and expire as stated above.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-dark mb-1">6. Termination</p>
                    <p>Wash Club reserves the right to terminate membership for abuse or misuse. Upon termination, unused credits are forfeited.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-dark mb-1">7. Changes to Program</p>
                    <p>We may modify Wash Club benefits, tiers, or terms with 30 days notice. Continued use constitutes acceptance.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-light rounded-lg transition">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray text-primary focus:ring-primary"
                  />
                  <span className="text-sm">
                    I agree to the{' '}
                    <span className="font-semibold text-dark">Wash Club Terms of Service</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-light rounded-lg transition">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray text-primary focus:ring-primary"
                  />
                  <span className="text-sm">
                    I agree to the{' '}
                    <span className="font-semibold text-dark">Privacy Policy</span> and
                    understand how my data will be used
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('email-verify')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={acceptTerms}
                  disabled={isLoading || !termsAccepted || !privacyAccepted || !termsScrolled}
                  className="flex-1"
                >
                  {isLoading ? <Spinner /> : 'Accept & Join'}
                </Button>
              </div>

              <p className="text-xs text-gray text-center mt-4">
                {!termsScrolled && 'Please scroll down to review all terms'}
              </p>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 'confirmation' && (
            <Card className="p-8">
              <div className="mb-8 text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-dark mb-2">
                  Welcome to Wash Club! 🎉
                </h1>
                <p className="text-gray text-lg">
                  Your membership is active and ready to use
                </p>
              </div>

              {/* Display the Wash Club Card */}
              <div className="mb-8">
                <WashClubCard
                  cardNumber={cardNumber || 'WASH-XXXX-XXXX-XXXX'}
                  tier={1}
                  tierName="Bronze"
                  creditsBalance={25}
                  email={user?.email || email}
                  userName={user?.displayName || undefined}
                />
              </div>

              {/* Rewards Summary */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-bold text-dark mb-4">Your Bronze Membership</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray">Starting Balance</span>
                    <span className="font-bold text-primary">25 Credits</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray">Earn Rate</span>
                    <span className="font-bold text-primary">5% per order</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray">Credit Value</span>
                    <span className="font-bold text-primary">$0.01 each</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray mb-8">
                Start using your credits on your next order. You can view your card, tier status, and rewards history in your dashboard anytime.
              </p>

              <Link href="/dashboard" className="block">
                <Button className="w-full mb-3">
                  Go to Dashboard
                  <ChevronRight size={18} />
                </Button>
              </Link>

              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function WashClubOnboarding() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <WashClubOnboardingContent />
    </Suspense>
  )
}
