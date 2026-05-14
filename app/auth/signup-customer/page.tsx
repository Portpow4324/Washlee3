'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail, Lock, Phone, Eye, EyeOff, CheckCircle, X, MapPin, ArrowLeft, ArrowRight, Sparkles, Gift } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { AUSTRALIAN_STATES } from '@/lib/australianValidation'
import { getAttributionMetadata, trackWashleeEvent } from '@/lib/analytics/client'
import WashClubSignupModal from '@/components/WashClubSignupModal'
import OAuthButtons from '@/components/OAuthButtons'

type StepId = 0 | 1 | 2 | 3 | 4

const STEP_TITLES: Record<StepId, { title: string; description: string }> = {
  0: { title: 'Create your account', description: 'Use Google, Apple, or a Washlee email and password.' },
  1: { title: 'Tell us a bit about you', description: 'We need this for pickups and order updates.' },
  2: { title: 'Verify your email', description: 'Enter the 6-digit code we sent to your inbox.' },
  3: { title: 'How will you use Washlee?', description: 'Choose what fits your laundry — you can change this later.' },
  4: { title: 'Join Wash Club?', description: 'Free loyalty rewards — earn points on every order.' },
}

export default function SignupCustomerPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<StepId>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showWashClubModal, setShowWashClubModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    state: '',
    password: '',
    confirmPassword: '',
    personalUse: '',
    selectedPlan: 'none',
    verificationCode: '',
  })

  const trackSignupStep = (step: StepId, extra: Record<string, string | number | boolean> = {}) => {
    trackWashleeEvent('customer_signup_step_completed', {
      metadata: {
        step: step + 1,
        step_title: STEP_TITLES[step].title,
        ...extra,
      },
    })
  }

  const validatePassword = (pwd: string) => ({
    hasLength: pwd.length >= 8,
    hasNumber: /\d/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  })
  const passwordRules = validatePassword(formData.password)
  const isPasswordValid = Object.values(passwordRules).every(Boolean)

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0:
        return Boolean(
          formData.email &&
            formData.password &&
            formData.confirmPassword &&
            isPasswordValid &&
            formData.password === formData.confirmPassword
        )
      case 1:
        return Boolean(formData.firstName.trim() && formData.lastName.trim() && formData.state)
      case 2:
        return Boolean(formData.verificationCode && formData.verificationCode.length === 6)
      case 3:
        return Boolean(formData.personalUse)
      case 4:
        return true
      default:
        return false
    }
  }

  const handleResendVerification = async () => {
    setError('')
    setSuccessMessage('')
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })
      if (response.ok) {
        setSuccessMessage('A fresh code is on its way. Check your inbox.')
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        setError('Could not resend the code. Try again in a moment.')
      }
    } catch (err) {
      console.error('[Resend Error]', err)
      setError('Could not resend the code. Try again in a moment.')
    }
  }

  const handleVerifyCode = async (code: string) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Invalid verification code')
        setIsLoading(false)
        return
      }
      setIsLoading(false)
      trackSignupStep(2)
      setCurrentStep(3)
    } catch (err) {
      console.error('[VerifyCode] Error:', err)
      setError('Failed to verify code. Please try again.')
      setIsLoading(false)
    }
  }

  const handleAutoLogin = async () => {
    setIsLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      if (signInError || !data.user) {
        console.warn('[AutoLogin] Failed:', signInError?.message)
        setIsLoading(false)
        setIsRedirecting(true)
        setTimeout(() => router.push('/'), 1500)
        return
      }
      setIsLoading(false)
      setIsRedirecting(true)
      setTimeout(() => router.push('/'), 1500)
    } catch (err) {
      console.error('[AutoLogin] Error:', err)
      setIsLoading(false)
      setIsRedirecting(true)
      setTimeout(() => router.push('/'), 1500)
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        alert(`Error: ${data.error || 'Could not resend confirmation email.'}`)
        return
      }
      alert('Verification email sent. Please check your inbox.')
    } catch (err) {
      console.error('[Signup] Resend exception:', err)
      alert('Failed to resend verification email. Please try again.')
    }
  }

  const handleCreateAccount = async () => {
    setError('')
    setIsLoading(true)
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Missing required information.')
        setIsLoading(false)
        return
      }

      const fullName = `${formData.firstName} ${formData.lastName}`

      const apiResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: fullName,
          phone: formData.phone || null,
          state: formData.state || null,
          personalUse: formData.personalUse || null,
          userType: 'customer',
          marketingAttribution: getAttributionMetadata(),
        }),
      })

      if (!apiResponse.ok) {
        let errorData: { error?: string; code?: string } = { error: 'Unknown error' }
        try {
          const responseText = await apiResponse.text()
          if (responseText) {
            try {
              errorData = JSON.parse(responseText)
            } catch {
              errorData = { error: responseText || `Server error: ${apiResponse.statusText}` }
            }
          } else {
            errorData = { error: `Server error: ${apiResponse.statusText}` }
          }
        } catch (parseError) {
          console.error('[Signup] Failed to parse error response:', parseError)
          errorData = { error: `Server error: ${apiResponse.statusText}` }
        }

        if (errorData.code === 'DUPLICATE_EMAIL' || apiResponse.status === 409) {
          setError('This email is already registered. Try signing in instead.')
          setIsLoading(false)
          const shouldResend = confirm(
            'Your email is already registered. Resend the verification email?'
          )
          if (shouldResend) {
            await resendVerificationEmail(formData.email)
          }
          return
        }
        if (errorData.code === 'RATE_LIMIT' || apiResponse.status === 429) {
          setError('Too many signup attempts. Please wait 60 seconds and try again.')
          setIsLoading(false)
          return
        }
        throw new Error(errorData.error || 'Failed to create account')
      }

      const apiData = await apiResponse.json()
      const uid = apiData.user?.id
      if (!uid) throw new Error('Failed to get user ID from API response')

      setIsLoading(false)
      trackSignupStep(1)
      setCurrentStep(2)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account'
      console.error('[Signup] Error:', err)
      setError(message)
      setIsLoading(false)
    }
  }

  const handleNext = async (planSelection?: string) => {
    if (!isStepValid()) {
      setError('Please complete this step.')
      return
    }
    setError('')

    if (currentStep === 1) {
      await handleCreateAccount()
      return
    }
    if (currentStep === 2) {
      await handleVerifyCode(formData.verificationCode)
      return
    }
    if (currentStep === 4) {
      const finalPlanData = planSelection !== undefined ? planSelection : formData.selectedPlan
      setFormData((prev) => ({ ...prev, selectedPlan: finalPlanData }))
      trackSignupStep(4, { wash_club_choice: finalPlanData })
      if (finalPlanData === 'wash-club') {
        trackWashleeEvent('wash_club_join_clicked', {
          metadata: { route: '/auth/signup-customer' },
        })
      }
      trackWashleeEvent('customer_signup_completed', {
        metadata: { wash_club_choice: finalPlanData },
      })
      // Move past the last step → triggers final screen.
      setCurrentStep((prev) => (prev + 1) as StepId)
      return
    }
    if (currentStep < 4) {
      trackSignupStep(currentStep)
      setCurrentStep((prev) => (prev + 1) as StepId)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => (prev - 1) as StepId)
      setError('')
    } else {
      router.back()
    }
  }

  // Final completion screen → auto-login then redirect.
  if (currentStep > 4) {
    if (!isRedirecting && !isLoading) {
      handleAutoLogin()
    }

    const handleJoinWashClub = () => {
      setShowWashClubModal(false)
      setIsRedirecting(true)
      router.push(`/wash-club/onboarding?email=${encodeURIComponent(formData.email)}`)
    }

    const handleSkipWashClub = () => {
      setShowWashClubModal(false)
      setIsRedirecting(true)
      router.push('/')
    }

    return (
      <main className="min-h-screen bg-soft-hero flex items-center justify-center px-4 sm:px-6 py-12">
        <WashClubSignupModal
          isOpen={showWashClubModal}
          onJoin={handleJoinWashClub}
          onSkip={handleSkipWashClub}
        />
        <div className="w-full max-w-md surface-card p-8 text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-mint mb-4">
            <CheckCircle className="w-8 h-8 text-primary-deep" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-1">Account created</h1>
          <p className="text-gray text-base mb-6">
            Welcome to Washlee — signing you in and redirecting…
          </p>
          <Link href="/" className="btn-outline w-full">
            Go to home
          </Link>
        </div>
      </main>
    )
  }

  if (isRedirecting || isLoading) {
    return (
      <main className="min-h-screen bg-soft-hero flex items-center justify-center px-4 sm:px-6">
        <div className="surface-card p-8 max-w-sm w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-dark mb-1">
            {isRedirecting ? 'Almost there…' : 'Working on it…'}
          </h1>
          <p className="text-sm text-gray">
            {isRedirecting ? 'Logging you in.' : 'Setting up your account.'}
          </p>
        </div>
      </main>
    )
  }

  const stepMeta = STEP_TITLES[currentStep]
  const progress = ((currentStep + 1) / 5) * 100

  return (
    <main className="min-h-screen bg-soft-hero flex flex-col">
      <header className="container-page py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-primary-deep font-semibold hover:text-primary transition"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <Link href="/" className="text-sm font-semibold text-gray hover:text-primary-deep transition">
          Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-md animate-slide-up">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-dark">Step {currentStep + 1} of 5</span>
              <span className="text-sm text-gray-soft">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Card */}
          <div className="surface-card p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-dark mb-1">{stepMeta.title}</h1>
              <p className="text-sm text-gray">{stepMeta.description}</p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 text-sm text-red-800">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-xl bg-mint border border-primary/20 px-4 py-3 mb-5 text-sm text-dark font-semibold">
                {successMessage}
              </div>
            )}

            {currentStep === 0 && (
              <div className="space-y-4">
                <OAuthButtons
                  intent="signup"
                  redirectTo="/dashboard"
                  onError={setError}
                  onStart={(provider) => {
                    setError('')
                    setSuccessMessage(`Opening ${provider === 'apple' ? 'Apple' : 'Google'} sign up...`)
                  }}
                />

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-line" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-soft">
                    or use email
                  </span>
                  <div className="h-px flex-1 bg-line" />
                </div>

                <div>
                  <label htmlFor="email" className="label-field">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="label-field">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="input-field pl-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-soft hover:text-primary-deep transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { key: 'hasLength' as const, label: '8+ characters' },
                      { key: 'hasNumber' as const, label: '1 number' },
                      { key: 'hasLower' as const, label: '1 lowercase' },
                      { key: 'hasUpper' as const, label: '1 uppercase' },
                      { key: 'hasSpecial' as const, label: '1 special character' },
                    ].map(({ key, label }) => {
                      const ok = passwordRules[key]
                      return (
                        <li key={key} className="flex items-center gap-2 text-xs">
                          {ok ? (
                            <CheckCircle size={14} className="text-primary-deep flex-shrink-0" />
                          ) : (
                            <X size={14} className="text-gray-soft flex-shrink-0" />
                          )}
                          <span className={ok ? 'text-primary-deep font-semibold' : 'text-gray'}>{label}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="label-field">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="input-field pl-12"
                      required
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1.5">Passwords don&rsquo;t match.</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="label-field">First name</label>
                    <input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Alex"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="label-field">Last name</label>
                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Nguyen"
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="label-field">
                    Phone <span className="text-gray-soft font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="04xx xxx xxx"
                      className="input-field pl-12"
                    />
                  </div>
                  <p className="text-xs text-gray mt-1.5">Helpful for delivery confirmations.</p>
                </div>

                <div>
                  <label htmlFor="state" className="label-field">State</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft pointer-events-none" size={18} />
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="input-field pl-12 appearance-none"
                      required
                    >
                      <option value="">Choose a state…</option>
                      {AUSTRALIAN_STATES.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-mint/60 border border-primary/15 p-5 sm:p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-soft mb-3">
                    <Mail size={20} className="text-primary-deep" />
                  </div>
                  <p className="text-sm text-gray mb-1">We sent a 6-digit code to:</p>
                  <p className="font-semibold text-dark break-all">{formData.email}</p>
                </div>

                <div>
                  <label htmlFor="verificationCode" className="label-field">Verification code</label>
                  <input
                    id="verificationCode"
                    type="text"
                    inputMode="text"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={formData.verificationCode}
                    onChange={(e) =>
                      setFormData({ ...formData, verificationCode: e.target.value.toUpperCase() })
                    }
                    placeholder="000000"
                    className="input-field text-center text-2xl font-bold tracking-[0.4em] uppercase"
                    autoFocus
                  />
                  <p className="text-xs text-gray-soft mt-1.5">Code expires in 24 hours.</p>
                </div>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="text-sm text-primary-deep font-semibold hover:underline w-full text-center"
                >
                  Didn&rsquo;t receive it? Resend code
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-3">
                {[
                  { id: 'personal', title: 'Personal use', body: 'Your home laundry — clothes, towels, bedding.' },
                  { id: 'business', title: 'Business use', body: 'Uniforms, hotel linens, gym towels, or salon laundry.' },
                ].map((opt) => {
                  const selected = formData.personalUse === opt.id
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition ${
                        selected ? 'border-primary bg-mint' : 'border-line hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="usage"
                        value={opt.id}
                        checked={selected}
                        onChange={() => setFormData({ ...formData, personalUse: opt.id })}
                        className="w-4 h-4 mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="font-semibold text-dark">{opt.title}</p>
                        <p className="text-sm text-gray">{opt.body}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            {currentStep === 4 && (
              <div className="rounded-2xl border border-primary/20 bg-mint/50 p-5 sm:p-6">
                <span className="pill mb-3">
                  <Sparkles size={14} /> Free to join
                </span>
                <p className="font-bold text-dark text-lg mb-2">Earn rewards on every wash</p>
                <p className="text-sm text-gray mb-4 leading-relaxed">
                  Wash Club is our free loyalty program — earn 1 point per dollar, tier up automatically, and redeem credit at checkout. No membership fee, ever.
                </p>
                <ul className="space-y-2 text-sm">
                  {['Earn on every order', 'Birthday bonuses', 'Members-only perks'].map((line) => (
                    <li key={line} className="flex items-center gap-2 text-dark">
                      <Gift size={14} className="text-primary-deep" /> {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {currentStep === 4 ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleNext('none')}
                    className="btn-outline flex-1"
                  >
                    No thanks
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNext('wash-club')}
                    className="btn-primary flex-1"
                  >
                    Join Wash Club
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-outline flex-1"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNext()}
                    disabled={!isStepValid() || isLoading}
                    className="btn-primary flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {currentStep === 1 ? 'Send code' : currentStep === 2 ? 'Verify' : 'Next'}
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 mt-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= currentStep ? 'bg-primary w-6' : 'bg-line w-2'
                }`}
              />
            ))}
          </div>

          <p className="text-center text-sm text-gray mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary-deep hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
