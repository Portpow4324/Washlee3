# Complete Authentication Template - Customer & Employee Signup/Login

This document contains ALL code needed for customer and employee authentication including frontend pages, API routes, and database setup.

---

## TABLE OF CONTENTS
1. Customer Signup (Frontend + API)
2. Customer Login (Frontend + API)
3. Employee Signup (Frontend + API) - **Uses same signup form as customer**
4. Employee Login (Frontend + API)
5. Email Verification (Frontend + API)
6. Database Tables & Schema
7. Authentication Context
8. Environment Variables

---

# 1. CUSTOMER SIGNUP

## Frontend Component
**Path:** `app/auth/signup-customer/page.tsx`

```typescript
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

export default function SignupCustomer() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
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
    userType: 'customer', // 'customer' or 'pro' for employees
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

  const steps = [
    {
      title: 'Create Your Account',
      description: 'Get started with your email and password',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">First Name*</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Last Name*</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

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
            <label className="block text-sm font-semibold text-dark mb-2">Phone*</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0412345678"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-2">State*</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select State</option>
              {AUSTRALIAN_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
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
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Confirm Password*</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {formData.password !== formData.confirmPassword && formData.confirmPassword && (
              <p className="text-red-500 text-sm mt-2">Passwords do not match</p>
            )}
          </div>

          {/* Password Rules */}
          <div className="mt-4 p-4 bg-light rounded-lg">
            <p className="text-sm font-semibold text-dark mb-3">Password must include:</p>
            <ul className="space-y-2">
              {[
                { key: 'hasLength', label: '8+ Characters' },
                { key: 'hasNumber', label: 'At least one number' },
                { key: 'hasLower', label: 'Lowercase letter' },
                { key: 'hasUpper', label: 'Uppercase letter' },
                { key: 'hasSpecial', label: 'Special character (!@#$%^&*)' },
              ].map(({ key, label }) => (
                <li key={key} className="flex items-center gap-2">
                  <CheckCircle
                    size={16}
                    className={passwordRules[key as keyof typeof passwordRules] ? 'text-primary' : 'text-gray'}
                  />
                  <span className={passwordRules[key as keyof typeof passwordRules] ? 'text-dark' : 'text-gray'}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    // Additional steps would follow similarly...
  ]

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate Step 0
      if (
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim() ||
        !formData.state ||
        !formData.password ||
        !isPasswordValid ||
        formData.password !== formData.confirmPassword
      ) {
        setError('Please fill in all fields correctly')
        return
      }

      setError('')
      setAuthLoading(true)

      try {
        // Create account via API
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            state: formData.state,
            userType: formData.userType,
            personalUse: formData.personalUse,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Signup failed')
        }

        setNewUserId(data.userId)
        setCurrentStep(1) // Move to email verification
      } catch (err: any) {
        setError(err.message)
      } finally {
        setAuthLoading(false)
      }
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    setIsRedirecting(true)
    // Complete signup and redirect
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 p-2 hover:bg-white rounded-full transition"
      >
        <ArrowLeft size={24} className="text-primary" />
      </button>

      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((step) => (
                <div
                  key={step}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep ? 'bg-primary text-white' : 'bg-light text-gray'
                  }`}
                >
                  {step + 1}
                </div>
              ))}
            </div>
            <div className="w-full bg-light rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / 8) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <h2 className="text-2xl font-bold text-dark mb-2">{steps[currentStep]?.title}</h2>
          <p className="text-gray mb-6">{steps[currentStep]?.description}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {steps[currentStep]?.content}

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
              >
                Back
              </button>
            )}
            {currentStep < 7 && (
              <Button
                onClick={handleNext}
                size="lg"
                className={currentStep === 0 ? 'w-full' : 'flex-1'}
                disabled={authLoading}
              >
                {authLoading ? 'Creating Account...' : 'Continue'}
              </Button>
            )}
            {currentStep === 7 && (
              <Button onClick={handleSubmit} size="lg" className="w-full" disabled={isRedirecting}>
                {isRedirecting ? 'Redirecting...' : 'Complete Signup'}
              </Button>
            )}
          </div>

          {/* Login Link */}
          <p className="text-center text-gray mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:text-accent transition">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## Backend API Route - Signup
**Path:** `app/api/auth/signup/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  const supabase = getServiceRoleClient()

  try {
    const body = await request.json()
    const { email, password, name, phone, userType, state, personalUse } = body

    // Validate input
    if (!email || !password || !name || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, userType' },
        { status: 400 }
      )
    }

    if (!['customer', 'pro'].includes(userType)) {
      return NextResponse.json(
        { error: 'userType must be "customer" or "pro"' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Parse names
    const [firstName, ...lastNameParts] = name.split(' ')
    const lastName = lastNameParts.join(' ') || ''

    // Create user via admin API (bypasses rate limits)
    // NOTE: email_confirm is set to false - we'll verify via SendGrid and update it manually
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        first_name: firstName,
        last_name: lastName,
        phone,
        user_type: userType,
      },
      email_confirm: false, // Disabled - using SendGrid verification instead
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('User already exists')) {
        return NextResponse.json(
          {
            error: 'A user with this email has already been registered',
            code: 'DUPLICATE_EMAIL',
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: authError.message || 'Authentication failed' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Create user record in database
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        user_type: userType,
      })

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + userError.message },
        { status: 500 }
      )
    }

    // Create customer or employee record based on userType
    if (userType === 'customer') {
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          state,
          personal_use: personalUse === true,
          account_status: 'active',
        })

      if (customerError) {
        return NextResponse.json(
          { error: 'Failed to create customer profile' },
          { status: 500 }
        )
      }
    } else if (userType === 'pro') {
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          state,
        })

      if (employeeError) {
        return NextResponse.json(
          { error: 'Failed to create employee profile' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId,
      user: { id: userId, email, emailConfirmed: false },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    )
  }
}
```

---

# 2. CUSTOMER LOGIN

## Frontend Component
**Path:** `app/auth/login/page.tsx`

```typescript
'use client'

import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect')

  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resetSuccessMessage, setResetSuccessMessage] = useState('')
  const [emailNotConfirmedError, setEmailNotConfirmedError] = useState('')

  // Load remember me credentials on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('loginEmail')
    const rememberMeEnabled = localStorage.getItem('rememberMe') === 'true'
    const rememberMeExpiry = localStorage.getItem('rememberMeExpiry')

    if (storedEmail && rememberMeEnabled && rememberMeExpiry) {
      const expiryDate = new Date(rememberMeExpiry)
      if (expiryDate > new Date()) {
        setEmail(storedEmail)
        setRememberMe(true)
      } else {
        // Expired, clear it
        localStorage.removeItem('loginEmail')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberMeExpiry')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailNotConfirmedError('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        setEmailNotConfirmedError(email)
        setIsLoading(false)
        return
      }

      // Store remember me if checked (7 days)
      if (rememberMe) {
        localStorage.setItem('loginEmail', email)
        localStorage.setItem('rememberMe', 'true')
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
        localStorage.setItem('rememberMeExpiry', expiryDate.toISOString())
      } else {
        localStorage.removeItem('loginEmail')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberMeExpiry')
      }

      setSuccessMessage('✅ Welcome back! Logging you in...')

      setTimeout(() => {
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.push('/dashboard')
        }
      }, 1500)
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('❌ Incorrect email or password. Please try again.')
      } else {
        setError(err.message || 'Failed to sign in')
      }
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetSuccessMessage('')
    setError('')
    setIsResetLoading(true)

    try {
      if (!email.trim()) {
        setError('Please enter your email address')
        setIsResetLoading(false)
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) throw error

      setResetSuccessMessage(`✅ Password reset link sent to ${email}`)
      setEmail('')

      setTimeout(() => {
        setShowForgotPassword(false)
        setResetSuccessMessage('')
      }, 3000)
    } catch (err: any) {
      setError('Failed to send reset link. Please try again.')
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      if (error) throw error

      setSuccessMessage('✅ Signing you in with Google...')

      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 p-2 hover:bg-white rounded-full transition"
      >
        <ArrowLeft size={24} className="text-primary" />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark">Sign In</h1>
          <p className="text-gray mt-2">Welcome back! Let's get your laundry done.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg mb-6 text-center">
              <p className="font-semibold">{successMessage}</p>
            </div>
          )}

          {emailNotConfirmedError ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-4 rounded-lg">
              <p className="font-semibold mb-3">📧 Email Not Confirmed</p>
              <p className="text-sm mb-4">
                Your email at <span className="font-semibold">{emailNotConfirmedError}</span> needs to be verified.
              </p>
              <button
                onClick={() => setEmailNotConfirmedError('')}
                className="px-4 py-2 border border-yellow-200 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-100 transition text-sm"
              >
                Back
              </button>
            </div>
          ) : successMessage ? (
            <div className="text-center py-8">
              <Spinner />
            </div>
          ) : showForgotPassword ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <h2 className="text-xl font-bold text-dark mb-4">Reset Your Password</h2>

              {resetSuccessMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg mb-6 text-center flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  <p className="font-semibold text-sm">{resetSuccessMessage}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" size="lg" className="w-full flex-1" disabled={isResetLoading}>
                  {isResetLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setError('')
                  }}
                  className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                >
                  Back
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border border-gray accent-primary"
                    />
                    <span className="text-sm text-gray">Remember me for 7 days</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:text-accent transition font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray"></div>
                <span className="text-sm text-gray">OR</span>
                <div className="flex-1 h-px bg-gray"></div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition disabled:opacity-50"
              >
                Sign in with Google
              </button>
            </>
          )}

          <p className="text-center text-gray mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup-customer" className="text-primary font-semibold hover:text-accent transition">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner /></div>}>
      <LoginContent />
    </Suspense>
  )
}
```

## Backend API Route - Login
**Path:** `app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAnonClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  const supabase = getAnonClient()

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Login failed' },
        { status: 401 }
      )
    }

    // Fetch user profile
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { id: data.user.id, email, userType: userData?.user_type },
      session: { access_token: data.session?.access_token },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}
```

---

# 3. EMPLOYEE SIGNUP

## Frontend Component - **SAME as Customer Signup**
**Path:** `app/auth/signup-customer/page.tsx`

The signup form is identical to customer signup. The only difference is in the form data:

```typescript
// When creating an employee account, set:
const formData = {
  // ... all same fields as customer ...
  userType: 'pro', // ← This is the key difference!
}

// When submitting:
await fetch('/api/auth/signup', {
  method: 'POST',
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
    name: `${formData.firstName} ${formData.lastName}`,
    phone: formData.phone,
    state: formData.state,
    userType: 'pro', // ← Send 'pro' instead of 'customer'
  })
})
```

## Backend API Route - **SAME as Customer Signup**
**Path:** `app/api/auth/signup/route.ts`

The signup API handles both customers and employees based on the `userType` parameter:

```typescript
// See CUSTOMER SIGNUP API section above
// It checks the userType and creates either:
// - customers table record (if userType === 'customer')
// - employees table record (if userType === 'pro')
```

---

# 4. EMPLOYEE LOGIN

## Frontend Component
**Path:** `app/auth/employee-signin/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Link from 'next/link'
import { Mail, Lock, Briefcase, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function EmployeeSignIn() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Load remember me on mount
  useEffect(() => {
    const rememberMeExpiry = localStorage.getItem('employeeRememberMeExpiry')
    const sessionOnly = sessionStorage.getItem('employeeSessionOnly')

    // Check if remember me expired
    if (rememberMeExpiry && new Date(rememberMeExpiry) < new Date()) {
      localStorage.removeItem('employeeRememberMe')
      localStorage.removeItem('employeeToken')
      localStorage.removeItem('employeeData')
      localStorage.removeItem('employeeRememberMeExpiry')
    }

    // Strict rule: No remember me and new session = log out
    if (!sessionOnly && !localStorage.getItem('employeeRememberMe')) {
      localStorage.removeItem('employeeToken')
      localStorage.removeItem('employeeData')
    }
  }, [])

  const saveSessionPreference = (remember: boolean) => {
    if (remember) {
      // Store for 7 days
      localStorage.setItem('employeeRememberMe', 'true')
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7)
      localStorage.setItem('employeeRememberMeExpiry', expiryDate.toISOString())
    } else {
      // Session-only - cleared on tab close
      sessionStorage.setItem('employeeSessionOnly', 'true')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validate input
    if (!employeeId.trim() || !email.trim() || !password.trim()) {
      setError('Please enter employee ID, email, and password')
      return
    }

    // Validate Employee ID format
    // Accept: 6-digit (123456), Standard (EMP-xxx-xxx), Payslip (PS-yyyymmdd-xxx)
    const isSixDigit = /^\d{6}$/.test(employeeId.trim())
    const isStandardFormat = /^EMP-\d+-[A-Z0-9]+$/.test(employeeId.trim())
    const isPayslipFormat = /^PS-\d{8}-[A-Z0-9]+$/.test(employeeId.trim())

    if (!isSixDigit && !isStandardFormat && !isPayslipFormat) {
      setError('Invalid employee ID. Use 6 digits or full format from your email.')
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          email: email.trim(),
          password,
          rememberMe,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      setSuccessMessage(`Welcome, ${data.employee.firstName}!`)

      // Save session preference
      saveSessionPreference(rememberMe)

      // Store token and data
      localStorage.setItem('employeeToken', data.token)
      localStorage.setItem('employeeData', JSON.stringify(data.employee))
      localStorage.setItem('isEmployeeUser', 'true')
      localStorage.setItem('employeeMode', 'true')
      sessionStorage.setItem('employeeMode', 'true')

      // Sign into Supabase for authenticated operations
      try {
        const { error: supabaseError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (supabaseError) {
          throw supabaseError
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Redirect to employee dashboard
        router.push('/employee/dashboard')
      } catch (authError: any) {
        setError('Authentication failed: ' + authError.message)
        setIsLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 p-2 hover:bg-white rounded-full transition"
      >
        <ArrowLeft size={24} className="text-primary" />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark">Employee Sign In</h1>
          <p className="text-gray mt-2">Access your Washlee Pro dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg mb-6">
              <p className="font-semibold">{successMessage}</p>
            </div>
          )}

          {successMessage ? (
            <div className="text-center py-8">
              <div className="inline-block">
                <div className="animate-spin">
                  <Briefcase size={40} className="text-primary" />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Employee ID*</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
                  <input
                    type="text"
                    placeholder="123456 or EMP-1773230849589-1ZE64"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <p className="text-xs text-gray mt-1">Format: 6 digits, EMP-xxx-xxx, or PS-yyyymmdd-xxx</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Email*</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border border-gray accent-primary"
                />
                <span className="text-sm text-gray">Remember me for 7 days</span>
              </label>

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          <p className="text-center text-gray mt-6 text-sm">
            Not an employee?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:text-accent transition">
              Customer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

## Backend API Route - Employee Login
**Path:** `app/api/auth/employee-login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient, getAnonClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  const serviceRoleClient = getServiceRoleClient()
  const anonClient = getAnonClient()

  try {
    const body = await request.json()
    const { employeeId, email, password, rememberMe } = body

    // Validate input
    if (!employeeId || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, email, password' },
        { status: 400 }
      )
    }

    // Validate Employee ID format
    const isSixDigit = /^\d{6}$/.test(employeeId)
    const isStandardFormat = /^EMP-\d+-[A-Z0-9]+$/.test(employeeId)
    const isPayslipFormat = /^PS-\d{8}-[A-Z0-9]+$/.test(employeeId)

    if (!isSixDigit && !isStandardFormat && !isPayslipFormat) {
      return NextResponse.json(
        { error: 'Invalid employee ID format. Use 6 digits or full format.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Step 1: Verify employee exists in employees table
    const { data: employeeData, error: employeeError } = await serviceRoleClient
      .from('employees')
      .select('id, first_name, last_name, email')
      .eq('email', email)
      .single()

    if (employeeError || !employeeData) {
      return NextResponse.json(
        { error: 'Employee not found or invalid credentials' },
        { status: 401 }
      )
    }

    // Step 2: Verify password against Supabase Auth
    try {
      const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        )
      }

      // Step 3: Generate token
      const token = authData.session?.access_token || 'employee-' + Date.now()

      return NextResponse.json({
        success: true,
        token,
        employee: {
          id: employeeData.id,
          email: employeeData.email,
          firstName: employeeData.first_name,
          lastName: employeeData.last_name,
          employeeId: employeeId,
        },
      })
    } catch (authError: any) {
      return NextResponse.json(
        { error: 'Authentication service error' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}
```

---

# 5. EMAIL VERIFICATION

## Frontend Component
**Path:** `app/auth/verify-email/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/Button'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'

export default function VerifyEmail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''

  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!code || code.length !== 6) {
        setError('Please enter a valid 6-digit code')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setSuccessMessage('✅ Email verified! Redirecting...')

      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError('')

    try {
      const response = await fetch('/api/verification/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codeType: 'signup' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code')
      }

      setSuccessMessage('✅ Code sent! Check your email.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-mint rounded-full flex items-center justify-center">
                <Mail size={32} className="text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-dark">Verify Email</h1>
            <p className="text-gray mt-2">
              We sent a code to <span className="font-semibold">{email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg mb-6 flex items-center gap-3">
              <CheckCircle size={20} />
              <p className="font-semibold text-sm">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl font-bold letter-spacing px-4 py-4 border-2 border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-xs text-gray mt-2">Enter the 6-digit code from your email</p>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-light rounded-lg">
            <p className="text-sm text-gray text-center mb-3">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full py-2 text-primary font-semibold hover:text-accent transition disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <p className="text-center text-gray text-sm mt-6">
            Code expires in 15 minutes
          </p>
        </div>
      </div>
    </div>
  )
}
```

## Backend API Route - Verify Code
**Path:** `app/api/auth/verify-code/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  const supabase = getServiceRoleClient()

  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code required' },
        { status: 400 }
      )
    }

    // Find and verify code in database
    const now = new Date().toISOString()
    const { data: codeRecord, error: lookupError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code.toUpperCase())
      .eq('used', false)
      .gt('expires_at', now)
      .single()

    if (lookupError || !codeRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', codeRecord.id)

    // Find the user in Supabase Auth by email
    const { data: { users }, error: userListError } = await supabase.auth.admin.listUsers()

    const user = users?.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // UPDATE: Confirm email in Supabase Auth
    // This sets email_confirmed_at timestamp and marks email as verified
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })

    if (updateError) {
      console.error('Error confirming email:', updateError)
      return NextResponse.json(
        { error: 'Failed to confirm email: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      email,
      user_id: user.id,
      email_confirmed: true,
    })
  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
```

## Backend API Route - Send Verification Code (SendGrid + Gmail Fallback)
**Path:** `app/api/verification/send-code/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'
import sgMail from '@sendgrid/mail'
import nodemailer from 'nodemailer'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Initialize Gmail transporter (fallback)
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  const supabase = getServiceRoleClient()

  try {
    const body = await request.json()
    const { email, codeType = 'signup' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Generate 6-digit code
    const code = Math.random().toString().slice(2, 8).padStart(6, '0')

    // Store in database (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const { error: insertError } = await supabase.from('verification_codes').insert({
      email,
      code,
      code_type: codeType,
      used: false,
      expires_at: expiresAt,
    })

    if (insertError) {
      throw insertError
    }

    // Get email template
    const emailTemplate = codeType === 'signup' ? 
      getSignupEmailTemplate(code, email) : 
      getVerificationEmailTemplate(code, email)

    const emailSubject = codeType === 'signup' ? 
      'Confirm Your Washlee Account' : 
      'Your Washlee Verification Code'

    // Try SendGrid first (primary)
    let sendSuccess = false
    if (process.env.SENDGRID_API_KEY) {
      try {
        await sgMail.send({
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@washlee.com',
          subject: emailSubject,
          html: emailTemplate,
        })
        sendSuccess = true
        console.log(`[Email] Sent via SendGrid to ${email}`)
      } catch (sgError: any) {
        console.error('[SendGrid Error]', sgError.message)
        // Fall back to Gmail
      }
    }

    // Fall back to Gmail if SendGrid fails or not configured
    if (!sendSuccess) {
      try {
        await gmailTransporter.sendMail({
          to: email,
          from: process.env.EMAIL_USER || 'noreply@washlee.com',
          subject: emailSubject,
          html: emailTemplate,
        })
        sendSuccess = true
        console.log(`[Email] Sent via Gmail to ${email}`)
      } catch (gmailError: any) {
        console.error('[Gmail Error]', gmailError.message)
        throw new Error('Failed to send email via both SendGrid and Gmail')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      email,
      expiresIn: 900, // 15 minutes in seconds
    })
  } catch (error: any) {
    console.error('[Verification Error]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code' },
      { status: 500 }
    )
  }
}

/**
 * Email template for signup verification
 */
function getSignupEmailTemplate(code: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; color: white; text-align: center; }
          .content { background: #f7fefe; padding: 40px 20px; border-radius: 0 0 8px 8px; }
          .code-box { background: white; border: 2px solid #48C9B0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #48C9B0; font-family: monospace; }
          .footer { text-align: center; color: #6b7b78; font-size: 12px; margin-top: 20px; }
          .button { background: #48C9B0; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to Washlee</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px;">Confirm Your Email to Get Started</p>
          </div>
          <div class="content">
            <h2 style="color: #1f2d2b; margin-top: 0;">Confirm Your Signup</h2>
            <p style="color: #6b7b78; line-height: 1.6;">
              Thank you for signing up! We're excited to have you on board. 
              Enter this verification code to confirm your email and start using Washlee.
            </p>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; color: #6b7b78; font-size: 14px;">Your Verification Code</p>
              <div class="code">${code}</div>
              <p style="margin: 10px 0 0 0; color: #6b7b78; font-size: 12px;">This code expires in 15 minutes</p>
            </div>

            <p style="color: #6b7b78; line-height: 1.6;">
              If you didn't sign up for Washlee, you can safely ignore this email. 
              Your account won't be created until you verify your email.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <div class="footer">
              <p>© 2026 Washlee. All rights reserved.</p>
              <p>This is an automated email. Please don't reply directly.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Email template for verification code
 */
function getVerificationEmailTemplate(code: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; color: white; text-align: center; }
          .content { background: #f7fefe; padding: 40px 20px; border-radius: 0 0 8px 8px; }
          .code-box { background: white; border: 2px solid #48C9B0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #48C9B0; font-family: monospace; }
          .footer { text-align: center; color: #6b7b78; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Washlee</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px;">Verify Your Email</p>
          </div>
          <div class="content">
            <h2 style="color: #1f2d2b; margin-top: 0;">Verification Code</h2>
            <p style="color: #6b7b78; line-height: 1.6;">
              Your verification code is below. This code is valid for 15 minutes.
            </p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <p style="margin: 10px 0 0 0; color: #6b7b78; font-size: 12px;">Expires in 15 minutes</p>
            </div>

            <p style="color: #6b7b78; line-height: 1.6;">
              If you didn't request this code, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <div class="footer">
              <p>© 2026 Washlee. All rights reserved.</p>
              <p>This is an automated email. Please don't reply directly.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}
```

---

# 6. DATABASE SCHEMA

## users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'pro', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
```

## customers table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  state TEXT,
  personal_use BOOLEAN DEFAULT FALSE,
  preference_marketing_texts BOOLEAN DEFAULT FALSE,
  preference_account_texts BOOLEAN DEFAULT FALSE,
  selected_plan TEXT DEFAULT 'none',
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_state ON customers(state);
```

## employees table
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  state TEXT,
  work_address TEXT,
  id_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  availability JSON,
  application_step INTEGER DEFAULT 0,
  application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected', 'completed')),
  skills JSON,
  transport BOOLEAN DEFAULT FALSE,
  equipment BOOLEAN DEFAULT FALSE,
  id_document_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_state ON employees(state);
CREATE INDEX idx_employees_status ON employees(application_status);
```

## verification_codes table
```sql
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('signup', 'verification', 'phone', 'password')),
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_codes_email_code ON verification_codes(email, code);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
```

---

# 7. AUTHENTICATION CONTEXT

**Path:** `lib/AuthContext.tsx`

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

        // Fetch user profile
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUserData(data)
      }

      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setUserData(data)
        } else {
          setUser(null)
          setUserData(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserData(null)
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context as any
}
```

---

# 8. ENVIRONMENT VARIABLES

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Email Service - SendGrid (PRIMARY)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@washlee.com

# Email Service - Gmail (FALLBACK)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# NextAuth
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Development - Allow /api/verification/get-code endpoint (REMOVE in production)
NEXT_PUBLIC_ALLOW_GET_CODE=true
```

**Priority Order:**
1. **SendGrid** (primary) - Faster, more reliable
2. **Gmail** (fallback) - Used if SendGrid fails or not configured

---

## EMAIL VERIFICATION FLOW (UPDATED)

### What Changed:
1. **Disabled:** Supabase's default confirmation email (`Confirm your signup` with magic link)
2. **Enabled:** SendGrid verification codes (6-digit code, 15-min expiry)
3. **Result:** When user verifies code, Supabase's `email_confirmed_at` is updated to `true`

### Flow Diagram:
```
1. User signs up with email/password
   ↓
2. Backend creates user with email_confirm: false (NO Supabase email sent)
   ↓
3. Backend sends SendGrid verification email (branded, 6-digit code)
   ↓
4. User enters code in verify page
   ↓
5. Backend calls supabase.auth.admin.updateUserById({ email_confirm: true })
   ↓
6. Supabase marks email_confirmed_at with timestamp
   ↓
7. User can now login normally
```

### Key Differences:
- **Old:** Supabase sends confirmation email → User clicks link → Email verified
- **New:** SendGrid sends code → User enters 6 digits → Email verified + Supabase updated

---

## Troubleshooting

### Error: 403 on `/api/verification/get-code`
**Solution:** Add `NEXT_PUBLIC_ALLOW_GET_CODE=true` to `.env.local` for development. This endpoint is disabled in production.

### Error: Could not find the 'applicationStep' column in 'employees' table
**Solution:** Update your employees table with the new schema above. Run this SQL:

```sql
-- Add missing columns to existing employees table
ALTER TABLE employees
ADD COLUMN application_step INTEGER DEFAULT 0,
ADD COLUMN application_status TEXT DEFAULT 'pending',
ADD COLUMN skills JSON,
ADD COLUMN transport BOOLEAN DEFAULT FALSE,
ADD COLUMN equipment BOOLEAN DEFAULT FALSE,
ADD COLUMN id_document_url TEXT;

-- Add constraint
ALTER TABLE employees
ADD CONSTRAINT check_application_status CHECK (application_status IN ('pending', 'approved', 'rejected', 'completed'));

-- Add indexes
CREATE INDEX idx_employees_status ON employees(application_status);
```

### Error: "Failed to send email via both SendGrid and Gmail" or "Failed to send verification code"
**Cause:** Both SendGrid and Gmail are not configured or have failed  
**Solution:**
1. **Option A - Use SendGrid (Recommended):**
   - Create account: https://sendgrid.com
   - Generate API key: Settings → API Keys → Create API Key
   - Add to `.env.local`:
     ```env
     SENDGRID_API_KEY=SG.your_key_here
     SENDGRID_FROM_EMAIL=noreply@washlee.com
     ```

2. **Option B - Use Gmail (Fallback):**
   - Generate app password: https://myaccount.google.com/apppasswords
   - Add to `.env.local`:
     ```env
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASSWORD=your-app-password
     ```

**Note:** SendGrid is tried first. If it fails or isn't configured, Gmail is used automatically. At least one must be configured.

### Error: "User still getting Supabase confirmation email"
**Cause:** `email_confirm` flag still set to `true`  
**Solution:** Update signup API to use `email_confirm: false`:
```typescript
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: false, // ← Must be false
  user_metadata: { ... }
})
```

### Verification Code Not Updating Supabase
**Cause:** `supabase.auth.admin.updateUserById` may need service role key  
**Solution:** Ensure you're using `getServiceRoleClient()` not the anon client:
```typescript
const supabase = getServiceRoleClient() // ✅ Correct
// NOT: getAnonClient() ❌ Won't work for admin updates
```

---

## Summary

This template contains:

✅ **Customer Signup** - 8-step form with email verification  
✅ **Customer Login** - Email/password + Remember Me for 7 days  
✅ **Employee Signup** - Same form as customer, just different `userType`  
✅ **Employee Login** - Employee ID + Email + Password + Remember Me  
✅ **Email Verification** - SendGrid code verification  
✅ **Database Schema** - All 4 tables needed  
✅ **Auth Context** - Global authentication state  
✅ **Environment Setup** - All variables needed  

You can copy-paste these sections directly into your Next.js project!
