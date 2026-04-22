'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
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
              // Check if this is a pro account - if so, redirect to pro signup
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
            }        // Fallback: Try to get current user session
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

        // Check if email is confirmed
        if (!user.email_confirmed_at) {
          console.warn('[EmailConfirmed] Email not confirmed for:', user.email)
          setStatus('error')
          setError('Your email address has not been confirmed yet. Please check your inbox.')
          setIsLoading(false)
          return
        }

        console.log('[EmailConfirmed] ✓ Email confirmed for:', user.email)

        // Pre-populate email and any existing user data
        setEmail(user.email || '')

        // Check if user metadata already has profile data
        const existingFirstName = user.user_metadata?.first_name || ''
        const existingLastName = user.user_metadata?.last_name || ''
        const existingPhone = user.user_metadata?.phone || ''
        const existingState = user.user_metadata?.state || ''
        const userType = user.user_metadata?.user_type || 'customer'

        // If pro account, redirect to pro signup form (fresh start)
        if (userType === 'pro') {
          console.log('[EmailConfirmed] Pro account detected - redirecting to pro signup form')
          // Clear localStorage to start fresh
          localStorage.removeItem('verifiedEmail')
          localStorage.removeItem('selectedUsageType')
          // Redirect to pro signup form
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
      } catch (err: any) {
        console.error('[EmailConfirmed] Error checking auth:', err)
        setStatus('error')
        setError(err.message || 'An error occurred. Please try again.')
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

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
      const updateData: any = {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          state: state,
          user_type: usageType,
          email_confirmed_at: new Date().toISOString(),
          profile_completed: true,
        }
      }

      // Update password separately if provided
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
        .upsert({
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
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        console.warn('[EmailConfirmed] Warning updating users table:', upsertError.message)
        // Don't fail - auth metadata was updated successfully
      }

      console.log('[EmailConfirmed] ✓ Profile setup complete')
      setStatus('success')

      // Redirect to appropriate dashboard after 2 seconds
      setTimeout(() => {
        if (usageType === 'pro') {
          router.push('/dashboard/pro')
        } else {
          router.push('/dashboard/customer')
        }
      }, 2000)
    } catch (err: any) {
      console.error('[EmailConfirmed] Error saving profile:', err)
      setError(err.message || 'Failed to save profile. Please try again.')
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4 py-8">
      <Link href="/" className="absolute top-6 right-6 px-4 py-2 bg-white text-primary rounded-full font-semibold hover:shadow-lg transition">
        Home
      </Link>

      <div className="w-full max-w-md">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center">
            <Spinner />
            <h1 className="text-2xl font-bold text-dark mt-6 mb-2">Verifying Email...</h1>
            <p className="text-gray">Please wait while we confirm your email address.</p>
          </div>
        )}

        {/* Form State */}
        {status === 'form' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-dark">Complete Your Profile 🎉</h1>
              <p className="text-gray mt-2">Enter your details to finish setting up your account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Display (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Email Address</label>
                <div className="px-4 py-3 bg-light rounded-lg text-gray font-medium">
                  {email}
                </div>
              </div>

              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray mt-1">We'll use this to confirm pickups and deliveries</p>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">State/Territory</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select Your State/Territory</option>
                  
                  {/* USA States */}
                  <optgroup label="United States">
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
                  </optgroup>

                  {/* Australian States and Territories */}
                  <optgroup label="Australia">
                    <option value="NSW">New South Wales</option>
                    <option value="VIC">Victoria</option>
                    <option value="QLD">Queensland</option>
                    <option value="WA-AU">Western Australia</option>
                    <option value="SA">South Australia</option>
                    <option value="TAS">Tasmania</option>
                    <option value="ACT">Australian Capital Territory</option>
                    <option value="NT">Northern Territory</option>
                  </optgroup>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Password (Optional - to change password)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (leave blank to keep current)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray hover:text-dark"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-xs text-gray mt-1">Password will be encrypted and securely stored</p>
              </div>

              {/* Confirm Password */}
              {password && (
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-gray hover:text-dark"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              )}

              {/* Usage Type */}
              <div>
                <label className="block text-sm font-medium text-dark mb-3">How will you use Washlee?</label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition" style={{borderColor: usageType === 'customer' ? '#48C9B0' : '#e0e0e0'}}>
                    <input
                      type="radio"
                      name="usageType"
                      value="customer"
                      checked={usageType === 'customer'}
                      onChange={(e) => setUsageType(e.target.value as 'customer' | 'pro')}
                      className="w-4 h-4 mr-4"
                    />
                    <div>
                      <p className="font-semibold text-dark">👕 Customer</p>
                      <p className="text-xs text-gray">I want to send my laundry to be cleaned</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition" style={{borderColor: usageType === 'pro' ? '#48C9B0' : '#e0e0e0'}}>
                    <input
                      type="radio"
                      name="usageType"
                      value="pro"
                      checked={usageType === 'pro'}
                      onChange={(e) => setUsageType(e.target.value as 'customer' | 'pro')}
                      className="w-4 h-4 mr-4"
                    />
                    <div>
                      <p className="font-semibold text-dark">💼 Pro/Service Provider</p>
                      <p className="text-xs text-gray">I want to offer laundry services and earn money</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSaving}
                variant="primary"
                className="w-full mt-8 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="inline-block">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-dark mb-2">Profile Complete!</h1>
            <p className="text-gray mb-6">
              Welcome {firstName}! Your profile is set up and you're ready to go.
            </p>
            <p className="text-sm text-gray">Redirecting to your dashboard...</p>
            <Spinner />
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-dark mb-2">Something Went Wrong</h1>
            <p className="text-gray mb-8">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/login')}
                variant="primary"
                className="w-full"
              >
                Back to Login
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EmailConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint to-white">
        <div className="text-center">
          <Spinner />
          <p className="text-gray mt-4">Loading...</p>
        </div>
      </div>
    }>
      <EmailConfirmedContent />
    </Suspense>
  )
}
