'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { createCustomerProfile } from '@/lib/userManagement'
import Spinner from '@/components/Spinner'

const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'promo',
  'ref',
  'channel',
  'campaign_id',
  'landing_page',
  'first_utm_source',
  'first_utm_medium',
  'first_utm_campaign',
] as const

function safeRedirectPath(input?: string | null) {
  if (!input) return '/dashboard'
  if (!input.startsWith('/') || input.startsWith('//')) return '/dashboard'
  if (input.startsWith('/auth/callback')) return '/dashboard'
  return input
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [successTitle, setSuccessTitle] = useState('All set!')
  const [message, setMessage] = useState('Completing your sign-in...')

  useEffect(() => {
    const getCallbackAttribution = () => {
      const result: Record<string, string> = {}
      ATTRIBUTION_KEYS.forEach((key) => {
        const value = searchParams?.get(key)
        if (value) result[key] = value
      })
      return result
    }

    const ensureOAuthProfile = async (provider: string | null, intent: string | null) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('OAuth session was created but no access token was available.')
      }

      setMessage('Preparing your Washlee profile...')
      const response = await fetch('/api/auth/oauth-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          provider,
          intent,
          marketingAttribution: getCallbackAttribution(),
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok || result.success === false) {
        throw new Error(result.error || 'Could not prepare your Washlee profile.')
      }
    }

    const handleCallback = async () => {
      try {
        const code = searchParams?.get('code')
        const provider = searchParams?.get('provider')
        const intent = searchParams?.get('intent') || 'login'
        const redirect = safeRedirectPath(searchParams?.get('redirect'))

        if (code) {
          console.log('[AuthCallback] Processing OAuth code callback...')
          setMessage(`Completing ${provider || 'OAuth'} ${intent}...`)

          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError

          if (!data.session?.user) {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) throw new Error('No session found after OAuth callback.')
          }

          await ensureOAuthProfile(provider, intent)
          setStatus('success')
          setSuccessTitle('You are signed in!')
          setMessage('You are signed in. Taking you to Washlee...')
          setTimeout(() => router.replace(redirect), 700)
          return
        }

        // Get token from URL hash
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const token_hash = params.get('access_token')
        const type = params.get('type')

        if (!token_hash || type !== 'signup') {
          console.log('[AuthCallback] No valid token found, checking for existing session...')
          
          // Check if Supabase already has a session (OAuth implicit flow or magic link)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()

          if (sessionError || !session) {
            throw new Error('No valid verification token or session found')
          }

          console.log('[AuthCallback] ✓ Valid session found:', session.user.id)
          if (provider || session.user.app_metadata?.provider) {
            await ensureOAuthProfile(provider || String(session.user.app_metadata?.provider || 'oauth'), intent)
            setStatus('success')
            setSuccessTitle('You are signed in!')
            setMessage('You are signed in. Taking you to Washlee...')
            setTimeout(() => router.replace(redirect), 700)
            return
          }

          await handleVerifiedSession(session.user)
          return
        }

        // Verify the token
        console.log('[AuthCallback] Verifying token...')
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'signup'
        })

        if (verifyError) {
          console.error('[AuthCallback] Verification error:', verifyError)
          throw verifyError
        }

        if (!data.user) {
          throw new Error('User not found after verification')
        }

        console.log('[AuthCallback] ✓ Email verified:', data.user.id)
        await handleVerifiedSession(data.user)
      } catch (error: any) {
        console.error('[AuthCallback] Error:', error)
        setStatus('error')
        setMessage(error?.message || 'Failed to verify email. Please try again.')
      }
    }

    const handleVerifiedSession = async (user: any) => {
      try {
        setMessage('Creating your profile...')

        // Get user metadata from signup
        const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || 'User'
        const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName || ''
        const phone = user.user_metadata?.phone || ''
        const state = user.user_metadata?.state || ''

        // Create customer profile
        try {
          await createCustomerProfile(user.id, {
            email: user.email || '',
            firstName,
            lastName,
            phone,
            state,
            personalUse: 'personal',
            preferenceMarketingTexts: false,
            preferenceAccountTexts: true,
            selectedPlan: 'none',
            accountStatus: 'active',
            uid: user.id,
            createdAt: new Date().toISOString()
          })
          console.log('[AuthCallback] ✓ Customer profile created')
        } catch (profileError: any) {
          console.warn('[AuthCallback] Profile creation warning:', profileError?.message)
          // Don't fail - user is verified, profile may exist
        }

        setStatus('success')
        setSuccessTitle('Email confirmed!')
        setMessage('Email confirmed! Completing your profile setup...')

        setTimeout(() => {
          console.log('[AuthCallback] ✓ Redirecting to profile setup')
          router.push('/auth/email-confirmed')
        }, 1500)
      } catch (error: any) {
        console.error('[AuthCallback] Session error:', error)
        setStatus('error')
        setMessage(error?.message || 'Failed to complete email verification.')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Spinner />
            <p className="mt-4 text-gray font-semibold">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-bold text-primary mb-2">{successTitle}</p>
            <p className="text-gray">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <p className="text-lg font-bold text-red-600 mb-2">Verification Failed</p>
            <p className="text-gray mb-6">{message}</p>
            <button
              onClick={() => router.push('/auth/signup-customer')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-light">
        <Spinner />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
