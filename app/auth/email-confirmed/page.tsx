'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  User,
  Briefcase,
} from 'lucide-react'
import Link from 'next/link'

function EmailConfirmedContent() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [usageType, setUsageType] = useState<'customer' | 'pro'>('customer')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get verified email and usage type from localStorage (set during code verification)
        const verifiedEmail = localStorage.getItem('verifiedEmail')
        const selectedUsageType = localStorage.getItem('selectedUsageType') || 'customer'

        if (verifiedEmail) {
          // Pro account → redirect to pro signup form
          if (selectedUsageType === 'pro') {
            console.log('[EmailConfirmed] Pro account selected - redirecting to pro signup form')
            localStorage.removeItem('verifiedEmail')
            localStorage.removeItem('selectedUsageType')
            setTimeout(() => {
              router.push('/auth/pro-signup-form')
            }, 500)
            return
          }

          setEmail(verifiedEmail)
          setUsageType(selectedUsageType as 'customer' | 'pro')
          setStatus('form')
          setIsLoading(false)
          return
        }

        // Fallback: get current user session
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('[EmailConfirmed] Supabase error:', userError.message)
          setStatus('error')
          setError(userError.message || 'Authentication service error. Please try again.')
          setIsLoading(false)
          return
        }

        if (!user) {
          console.error('[EmailConfirmed] No authenticated user found')
          setStatus('error')
          setError('No verified email found. Please verify your email first.')
          setIsLoading(false)
          return
        }

        if (!user.email_confirmed_at) {
          console.warn('[EmailConfirmed] Email not confirmed for:', user.email)
          setStatus('error')
          setError('Your email address has not been confirmed yet. Please check your inbox.')
          setIsLoading(false)
          return
        }

        console.log('[EmailConfirmed] ✓ Email confirmed for:', user.email)

        setEmail(user.email || '')

        const existingFirstName = user.user_metadata?.first_name || ''
        const existingLastName = user.user_metadata?.last_name || ''
        const existingPhone = user.user_metadata?.phone || ''
        const existingState = user.user_metadata?.state || ''
        const userType = user.user_metadata?.user_type || 'customer'

        if (userType === 'pro') {
          console.log('[EmailConfirmed] Pro account detected - redirecting to pro signup form')
          localStorage.removeItem('verifiedEmail')
          localStorage.removeItem('selectedUsageType')
          setTimeout(() => {
            router.push('/auth/pro-signup-form')
          }, 500)
          return
        }

        setFirstName(existingFirstName)
        setLastName(existingLastName)
        setPhone(existingPhone)
        setState(existingState)
        setUsageType(userType)

        setStatus('form')
        setIsLoading(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred. Please try again.'
        console.error('[EmailConfirmed] Error checking auth:', err)
        setStatus('error')
        setError(message)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      // Validate inputs
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name')
        setIsSaving(false)
        return
      }

      if (!phone.trim()) {
        setError('Please enter your phone number')
        setIsSaving(false)
        return
      }

      if (!state.trim()) {
        setError('Please select your state')
        setIsSaving(false)
        return
      }

      if (password && passwordConfirm && password !== passwordConfirm) {
        setError('Passwords do not match')
        setIsSaving(false)
        return
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Authentication error. Please log in again.')
        setIsSaving(false)
        return
      }

      // Update user metadata with profile info
      console.log('[EmailConfirmed] Updating user profile...')
      const updateData: { data: Record<string, unknown>; password?: string } = {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          state: state,
          user_type: usageType,
          email_confirmed_at: new Date().toISOString(),
          profile_completed: true,
        },
      }

      if (password.trim()) {
        updateData.password = password
        console.log('[EmailConfirmed] Password will be updated (encrypted)')
      }

      const { error: updateError } = await supabase.auth.updateUser(updateData)

      if (updateError) {
        console.error('[EmailConfirmed] Error updating user:', updateError)
        throw updateError
      }

      // Upsert user profile in users table
      console.log('[EmailConfirmed] Creating/updating users table record...')
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(
          {
            id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            state: state,
            user_type: usageType,
            email_confirmed_at: new Date().toISOString(),
            profile_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (upsertError) {
        console.warn('[EmailConfirmed] Warning updating users table:', upsertError.message)
        // Don't fail - auth metadata was updated successfully
      }

      console.log('[EmailConfirmed] ✓ Profile setup complete')
      setStatus('success')

      // Redirect after 2 seconds
      setTimeout(() => {
        if (usageType === 'pro') {
          router.push('/dashboard/pro')
        } else {
          router.push('/dashboard/customer')
        }
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile. Please try again.'
      console.error('[EmailConfirmed] Error saving profile:', err)
      setError(message)
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-soft-hero flex flex-col">
      <header className="container-page py-5 flex items-center justify-between">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-primary-deep font-semibold hover:text-primary transition"
        >
          <ArrowLeft size={18} />
          Sign in
        </Link>
        <Link href="/" className="text-sm font-semibold text-gray hover:text-primary-deep transition">
          Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-md animate-slide-up">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="surface-card p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-4">
                <Mail size={20} className="text-primary-deep" />
              </div>
              <h1 className="text-xl font-bold text-dark mb-1">Verifying email…</h1>
              <p className="text-sm text-gray">Hang tight while we confirm your account.</p>
              <div className="mt-5 flex justify-center">
                <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </div>
          )}

          {/* Form State */}
          {status === 'form' && (
            <div className="surface-card p-6 sm:p-8">
              <div className="text-center mb-7">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-mint mb-4">
                  <CheckCircle className="w-6 h-6 text-primary-deep" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-1">Complete your profile</h1>
                <p className="text-sm text-gray">A few details and you&rsquo;re ready to book your first pickup.</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 flex gap-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email (read-only) */}
                <div>
                  <label className="label-field">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="input-field pl-12 bg-light text-gray cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="label-field">First name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                      <input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Alex"
                        className="input-field pl-12"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="label-field">Last name</label>
                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nguyen"
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="label-field">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="04xx xxx xxx"
                      className="input-field pl-12"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-soft mt-1.5">We use this to confirm pickups and deliveries.</p>
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="label-field">State or territory</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft pointer-events-none" size={18} />
                    <select
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="input-field pl-12 appearance-none"
                      required
                    >
                      <option value="">Select your state or territory</option>
                      <option value="VIC">Victoria</option>
                      <option value="NSW">New South Wales</option>
                      <option value="QLD">Queensland</option>
                      <option value="WA">Western Australia</option>
                      <option value="SA">South Australia</option>
                      <option value="TAS">Tasmania</option>
                      <option value="ACT">Australian Capital Territory</option>
                      <option value="NT">Northern Territory</option>
                    </select>
                  </div>
                </div>

                {/* Password (optional) */}
                <div>
                  <label htmlFor="password" className="label-field">
                    Password <span className="text-gray-soft font-normal">(optional — leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-12 pr-12"
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
                </div>

                {/* Confirm password — only if password set */}
                {password && (
                  <div>
                    <label htmlFor="passwordConfirm" className="label-field">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                      <input
                        id="passwordConfirm"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Re-enter your password"
                        className="input-field pl-12"
                      />
                    </div>
                    {passwordConfirm && password !== passwordConfirm && (
                      <p className="text-xs text-red-600 mt-1.5">Passwords don&rsquo;t match.</p>
                    )}
                  </div>
                )}

                {/* Usage type */}
                <div>
                  <label className="label-field">How will you use Washlee?</label>
                  <div className="space-y-2.5">
                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
                        usageType === 'customer'
                          ? 'border-primary bg-mint'
                          : 'border-line hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="usageType"
                        value="customer"
                        checked={usageType === 'customer'}
                        onChange={() => setUsageType('customer')}
                        className="w-4 h-4 mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="font-semibold text-dark">Customer</p>
                        <p className="text-xs text-gray">Send laundry to be picked up, washed, and delivered.</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
                        usageType === 'pro'
                          ? 'border-primary bg-mint'
                          : 'border-line hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="usageType"
                        value="pro"
                        checked={usageType === 'pro'}
                        onChange={() => setUsageType('pro')}
                        className="w-4 h-4 mt-0.5 accent-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <Briefcase size={14} className="text-primary-deep" />
                          <p className="font-semibold text-dark">Apply as a Washlee Pro</p>
                        </div>
                        <p className="text-xs text-gray mt-0.5">
                          Independent contractor — paid commission per completed order. We&rsquo;ll take you through the Pro application next.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving…' : 'Complete setup'}
                  {!isSaving && <ArrowRight size={16} />}
                </button>
              </form>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="surface-card p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-mint mb-4">
                <CheckCircle className="w-8 h-8 text-primary-deep" />
              </div>
              <h1 className="text-2xl font-bold text-dark mb-1">Profile complete</h1>
              <p className="text-sm text-gray mb-5">
                Welcome{firstName ? `, ${firstName}` : ''}. We&rsquo;re taking you to your dashboard…
              </p>
              <div className="flex justify-center">
                <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="surface-card p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-dark mb-2">Something went wrong</h1>
              <p className="text-sm text-gray mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="btn-primary w-full"
                >
                  Back to sign in
                  <ArrowRight size={16} />
                </button>
                <Link href="/" className="btn-outline w-full">
                  Back to home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function EmailConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-soft-hero text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <EmailConfirmedContent />
    </Suspense>
  )
}
