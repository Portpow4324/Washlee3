'use client'

import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle, ArrowLeft, X, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { createCustomerProfile } from '@/lib/userManagement'
import { sendWelcomeEmail } from '@/lib/emailService'
import { AUSTRALIAN_STATES } from '@/lib/australianValidation'
import WashClubSignupModal from '@/components/WashClubSignupModal'

export default function SignupCustomer() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showWashClubModal, setShowWashClubModal] = useState(false)
  const [newUserId, setNewUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    state: '',
    password: '',
    confirmPassword: '',
    personalUse: '',
    marketingTexts: false,
    accountTexts: false,
    selectedPlan: 'none',
    verificationCode: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Password validation helpers
  const validatePassword = (pwd: string) => ({
    hasLength: pwd.length >= 8,
    hasNumber: /\d/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  })

  const passwordRules = validatePassword(formData.password)
  const isPasswordValid = Object.values(passwordRules).every(Boolean)

  // No email verification state needed - Supabase handles it built-in

  const steps = [
    {
      title: 'Create Your Account',
      description: 'Get started with your email and password',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Email*</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Password*</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-primary"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-dark">Passwords must include:</p>
              <div className="space-y-1">
                {[
                  { key: 'hasLength', label: '8+ Characters' },
                  { key: 'hasNumber', label: '1 Number' },
                  { key: 'hasLower', label: '1 Lowercase Letter' },
                  { key: 'hasUpper', label: '1 Uppercase Letter' },
                  { key: 'hasSpecial', label: '1 Special Character' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    {passwordRules[key as keyof typeof passwordRules] ? (
                      <CheckCircle size={16} className="text-primary flex-shrink-0" />
                    ) : (
                      <X size={16} className="text-gray flex-shrink-0" />
                    )}
                    <span className={`text-sm ${passwordRules[key as keyof typeof passwordRules] ? 'text-primary' : 'text-gray'}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Confirm Password*</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Introduce yourself',
      description: 'Who do we have the pleasure of serving?',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">First Name*</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Last Name*</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Phone Number <span className="text-gray">(Optional but recommended)</span></label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+61 (2) 1234 5678"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray mt-1">We recommend providing a phone number for delivery confirmations</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">State*</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                required
              >
                <option value="">Choose a state...</option>
                {AUSTRALIAN_STATES.map(state => (
                  <option key={state.code} value={state.code}>{state.name} ({state.code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Verify Your Email',
      description: 'Enter the code we sent to your email',
      content: (
        <div className="space-y-4">
          <div className="bg-mint rounded-lg p-8 border-2 border-primary text-center">
            <div className="text-5xl mb-4">📧</div>
            <p className="text-lg font-semibold text-dark mb-2">Check Your Email</p>
            <p className="text-sm text-gray mb-6">We've sent a 6-digit verification code to:</p>
            <p className="font-mono bg-white p-3 rounded border border-primary text-primary font-semibold mb-6 text-sm">{formData.email}</p>
            
            {/* Verification Code Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-dark text-left">Enter Verification Code</label>
              <input
                type="text"
                maxLength={6}
                value={formData.verificationCode}
                onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value.toUpperCase() })}
                placeholder="000000"
                className="w-full px-4 py-3 border-2 border-primary rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray">Code expires in 24 hours</p>
            </div>

            {/* Resend Option */}
            <div className="mt-6 pt-6 border-t border-gray/30">
              <p className="text-sm text-gray mb-3">Didn't receive the code?</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('[Resend] Requesting new verification code for:', formData.email)
                    const response = await fetch('/api/auth/resend-verification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: formData.email })
                    })
                    if (response.ok) {
                      setError('')
                      alert('New verification code sent! Check your email.')
                    } else {
                      alert('Failed to resend code. Please try again.')
                    }
                  } catch (err) {
                    console.error('[Resend Error]', err)
                    alert('Error resending code')
                  }
                }}
                className="text-primary font-semibold hover:underline text-sm"
              >
                Resend Code
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Usage Type',
      description: 'Are you using Washlee for personal use or business?*',
      content: (
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border-2 cursor-pointer transition"
            style={{ borderColor: formData.personalUse === 'personal' ? '#48C9B0' : '#6b7b78', backgroundColor: formData.personalUse === 'personal' ? '#E8FFFB' : 'transparent' }}
            onClick={() => {
              console.log('[Usage Type] Selected: personal')
              setFormData({ ...formData, personalUse: 'personal' })
            }}
          >
            <input
              type="radio"
              name="usage"
              value="personal"
              checked={formData.personalUse === 'personal'}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <span className="font-semibold text-dark">Personal</span>
          </label>
          <label className="flex items-center gap-3 p-4 border-2 cursor-pointer transition"
            style={{ borderColor: formData.personalUse === 'business' ? '#48C9B0' : '#6b7b78', backgroundColor: formData.personalUse === 'business' ? '#E8FFFB' : 'transparent' }}
            onClick={() => {
              console.log('[Usage Type] Selected: business')
              setFormData({ ...formData, personalUse: 'business' })
            }}
          >
            <input
              type="radio"
              name="usage"
              value="business"
              checked={formData.personalUse === 'business'}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <span className="font-semibold text-dark">Business</span>
          </label>
        </div>
      ),
    },
    {
      title: 'Subscribe to a Plan?',
      description: 'Would you like to explore subscription plans to save on orders?',
      content: (
        <div className="space-y-6">
          <div className="bg-mint rounded-lg p-6 border-2 border-primary">
            <p className="text-lg font-semibold text-dark mb-4">Ready to get started?</p>
            <p className="text-dark mb-6">We offer flexible subscription plans that can help you save on laundry costs. You can always pay per order, or choose a plan that works best for you.</p>
          </div>
        </div>
      ),
    },
  ]

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.email && formData.password && formData.confirmPassword && isPasswordValid && formData.password === formData.confirmPassword
      case 1:
        return formData.firstName.trim() && formData.lastName.trim() && formData.state
      case 2:
        // Step 2 is verification - requires 6-digit code
        return formData.verificationCode && formData.verificationCode.length === 6
      case 3:
        return formData.personalUse
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = async (planSelection?: string) => {
    console.log('[handleNext] ==========================================')
    console.log('[handleNext] currentStep:', currentStep)
    console.log('[handleNext] isStepValid():', isStepValid())
    console.log('[handleNext] personalUse:', formData.personalUse)
    console.log('[handleNext] steps.length:', steps.length)
    console.log('[handleNext] ==========================================')
    
    if (isStepValid()) {
      if (currentStep === 1) {
        // After step 1 (Introduce yourself), create account and send email before moving to step 2 (Check Email)
        console.log('[handleNext] Step 1 detected - creating account before moving to step 2 (Check Email)')
        await handleCreateAccount()
      } else if (currentStep === 2) {
        // Step 2 is verification code - verify it before moving to step 3
        console.log('[handleNext] Step 2 (Verification Code) detected - verifying code...')
        await handleVerifyCode(formData.verificationCode)
      } else if (currentStep === 4) {
        // At final step (Subscribe to Plan) - just save plan selection and complete signup
        const finalPlanData = planSelection !== undefined ? planSelection : formData.selectedPlan
        console.log('[handleNext] Step 4 (final) detected')
        console.log('[handleNext] SelectedPlan:', finalPlanData)
        // Just move to next step to complete signup
        setCurrentStep(currentStep + 1)
      } else if (currentStep < steps.length - 1) {
        console.log('[handleNext] Moving from step', currentStep, 'to', currentStep + 1)
        setCurrentStep(currentStep + 1)
      }
    } else {
      console.log('[handleNext] Step not valid, showing error')
      setError('Please complete this step')
    }
  }

  const handleSendVerificationEmail = async () => {
    // Supabase will send verification email automatically during signup
    // Just proceed to next step
    setCurrentStep(currentStep + 1)
  }

  const handleVerifyCode = async (code: string) => {
    console.log('[VerifyCode] Verifying code:', code)
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: code
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[VerifyCode] Verification failed:', data.error)
        setError(data.error || 'Invalid verification code')
        setIsLoading(false)
        return
      }

      console.log('[VerifyCode] ✓ Code verified successfully!')
      setIsLoading(false)
      setCurrentStep(currentStep + 1)
    } catch (error) {
      console.error('[VerifyCode] Error:', error)
      setError('Failed to verify code. Please try again.')
      setIsLoading(false)
    }
  }

  const resendVerificationEmail = async (email: string) => {
    console.log('[Signup] Requesting to resend verification email for:', email)
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('[Signup] Resend error:', data.error)
        alert(`Error: ${data.error}`)
        return
      }

      console.log('[Signup] ✅ Verification email resent successfully')
      alert('Verification email sent! Please check your inbox.')
    } catch (err: any) {
      console.error('[Signup] Resend exception:', err)
      alert('Failed to resend verification email. Please try again.')
    }
  }

  const handleCreateAccount = async (planSelection?: string) => {
    setError('')
    setIsLoading(true)

    const signupStartTime = performance.now()
    console.log('[Signup] Starting customer account creation at', new Date().toISOString())

    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Missing required information.')
        setIsLoading(false)
        return
      }

      // Create account via our API route which saves to database
      const authStartTime = performance.now()
      console.log('[Signup] Creating account via /api/auth/signup...')
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
        })
      })

      console.log('[Signup] API response status:', apiResponse.status)
      console.log('[Signup] API response ok:', apiResponse.ok)
      
      if (!apiResponse.ok) {
        console.log('[Signup] Attempting to parse error response...')
        let errorData: any = { error: 'Unknown error' }
        try {
          const responseText = await apiResponse.text()
          console.log('[Signup] Response text:', responseText)
          if (responseText) {
            try {
              errorData = JSON.parse(responseText)
              console.log('[Signup] Parsed error data:', errorData)
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
        
        console.error('[Signup] API error:', errorData)
        
        // Handle duplicate email error
        if (errorData.code === 'DUPLICATE_EMAIL' || apiResponse.status === 409) {
          setError('This email is already registered. Would you like to log in instead?')
          setIsLoading(false)
          
          // Offer to resend verification email
          const shouldResend = confirm('Your email is already registered. Would you like us to resend the verification email?')
          if (shouldResend) {
            await resendVerificationEmail(formData.email)
          }
          return
        }
        
        // Handle rate limit error
        if (errorData.code === 'RATE_LIMIT' || apiResponse.status === 429) {
          setError('Too many signup attempts. Please wait 60 seconds and try again.')
          setIsLoading(false)
          return
        }
        
        throw new Error(errorData.error || 'Failed to create account')
      }

      const apiData = await apiResponse.json()
      console.log('[Signup] API response data:', apiData)
      
      const authDuration = performance.now() - authStartTime
      const uid = apiData.user?.id
      if (!uid) throw new Error('Failed to get user ID from API response')
      console.log(`[Signup] Account created via API: ${Math.round(authDuration)}ms`, uid)
      
      // Save user ID for later profile creation
      setNewUserId(uid)
      
      // Send verification email
      console.log('[Signup] ==========================================')
      console.log('[Signup] SENDING VERIFICATION EMAIL!')
      console.log('[Signup] Email:', formData.email)
      console.log('[Signup] FirstName:', formData.firstName)
      console.log('[Signup] ==========================================')
      
      const emailStartTime = performance.now()
      try {
        // Generate a verification code to include in the email
        const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        console.log('[Signup] VerificationCode:', verificationCode)
        
        console.log('[Signup] Calling /api/auth/send-confirmation...')
        const verificationResponse = await fetch('/api/auth/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            firstName: formData.firstName,
            verificationCode: verificationCode
          })
        })
        
        console.log('[Signup] Response status:', verificationResponse.status)
        console.log('[Signup] Response ok:', verificationResponse.ok)
        
        if (!verificationResponse.ok) {
          const errorData = await verificationResponse.json()
          console.warn('[Signup] ❌ FAILED to send verification email:', errorData.error)
          console.warn('[Signup] Full error:', errorData)
        } else {
          const emailDuration = performance.now() - emailStartTime
          console.log(`[Signup] ✅ Email sent successfully (${Math.round(emailDuration)}ms)`)
          const successData = await verificationResponse.json()
          console.log('[Signup] Email response data:', successData)
        }
      } catch (emailError) {
        console.warn('[Signup] ❌ Exception calling email endpoint:', emailError)
      }
      
      const totalTime = performance.now() - signupStartTime
      console.log(`[Signup] ✓ Account created and email sent. (${Math.round(totalTime)}ms)`)

      // Move to email verification step (step 2 = "Check Your Email")
      setIsLoading(false)
      setCurrentStep(2)
    } catch (err: any) {
      console.error('[Signup] Error:', err)
      console.error('[Signup] Error message:', err.message)
      setError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  if (isRedirecting || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-dark mb-3">Creating Your Account</h1>
            <p className="text-gray mb-6">Setting up your profile and preparing to redirect you...</p>
            <p className="text-sm text-gray mb-8">This may take a few moments</p>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === steps.length) {
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
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
        <WashClubSignupModal
          isOpen={showWashClubModal}
          onJoin={handleJoinWashClub}
          onSkip={handleSkipWashClub}
        />
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <CheckCircle size={64} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-dark mb-3">Account Created!</h1>
            <p className="text-gray mb-6">Welcome to Washlee. Your account is all set up.</p>
            <p className="text-sm text-gray mb-8">Redirecting you home...</p>
            <Link href="/" className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:shadow-lg transition font-semibold">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4 py-8">
      <button
        onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : router.back()}
        className="absolute top-6 left-6 p-2 hover:bg-white rounded-full transition"
        title="Go back"
      >
        <ArrowLeft size={24} className="text-primary" />
      </button>
      <Link href="/" className="absolute top-6 right-6 px-4 py-2 bg-white text-primary rounded-full font-semibold hover:shadow-lg transition">
        Home
      </Link>
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-dark">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-dark mb-2">{step.title}</h1>
          <p className="text-gray mb-6">{step.description}</p>

          {/* Content */}
          <div className="mb-8">
            {step.content}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep === 4 ? (
              // Custom buttons for subscription step (final step)
              <>
                <button
                  onClick={() => {
                    handleNext('view-plans')
                  }}
                  className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
                >
                  Yes, Show Me Plans
                </button>
                <button
                  onClick={() => {
                    handleNext('none')
                  }}
                  className="flex-1 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-mint transition"
                >
                  No, Create Account
                </button>
              </>
            ) : (
              // Standard previous/next buttons
              <>
                <button
                  onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : router.back()}
                  className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Back
                </button>
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="flex-1"
                  disabled={!isStepValid() || isLoading}
                >
                  {isLoading ? <Spinner /> : (currentStep === steps.length - 1 ? 'Create Account' : 'Next')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= currentStep ? 'bg-primary w-4' : 'bg-gray w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
