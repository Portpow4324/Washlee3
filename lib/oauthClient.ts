'use client'

import type { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { getAttributionMetadata, trackWashleeEvent } from '@/lib/analytics/client'

export type WashleeOAuthProvider = 'google' | 'apple'
export type OAuthIntent = 'login' | 'signup'

const APPLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH === 'true'

export function isOAuthProviderEnabled(provider: WashleeOAuthProvider) {
  if (provider === 'google') return true
  if (provider === 'apple') return APPLE_AUTH_ENABLED
  return false
}

function sanitizeRedirectPath(input?: string | null) {
  if (!input) return '/dashboard'
  if (!input.startsWith('/') || input.startsWith('//')) return '/dashboard'
  if (input.startsWith('/auth/callback')) return '/dashboard'
  return input
}

export async function startWashleeOAuth({
  provider,
  intent,
  redirectTo,
}: {
  provider: WashleeOAuthProvider
  intent: OAuthIntent
  redirectTo?: string | null
}) {
  if (!isOAuthProviderEnabled(provider)) {
    throw new Error('Apple sign in is pre-coded but not enabled yet. Enable the Apple provider in Supabase and set NEXT_PUBLIC_ENABLE_APPLE_AUTH=true when your Apple Developer setup is ready.')
  }

  if (typeof window === 'undefined') {
    throw new Error('OAuth can only start in the browser.')
  }

  const callbackUrl = new URL('/auth/callback', window.location.origin)
  callbackUrl.searchParams.set('provider', provider)
  callbackUrl.searchParams.set('intent', intent)
  callbackUrl.searchParams.set('redirect', sanitizeRedirectPath(redirectTo))

  const attribution = getAttributionMetadata()
  Object.entries(attribution).forEach(([key, value]) => {
    if (value) callbackUrl.searchParams.set(key, value)
  })

  trackWashleeEvent(intent === 'signup' ? 'customer_signup_started' : 'login_started', {
    metadata: {
      provider,
      method: 'oauth',
      redirect: sanitizeRedirectPath(redirectTo),
    },
  })

  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams:
        provider === 'google'
          ? {
              access_type: 'offline',
              prompt: 'select_account',
            }
          : undefined,
    },
  })

  if (error) throw error
}
