import { auth } from '@/lib/firebase'

/**
 * Get Firebase ID token for authenticated API requests
 * Call this before making API calls that require authentication
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    if (!auth.currentUser) {
      console.warn('[AUTH] No current user logged in')
      return null
    }
    console.log('[AUTH] Getting ID token for user:', auth.currentUser.uid)
    const token = await auth.currentUser.getIdToken(true)
    console.log('[AUTH] Successfully got ID token:', token.substring(0, 20) + '...')
    return token
  } catch (error: any) {
    console.error('[AUTH] Failed to get ID token:', error.message)
    return null
  }
}


/**
 * Make an authenticated fetch request to an API route
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  console.log('[AUTH] authenticatedFetch called for:', url)
  const token = await getAuthToken()
  
  if (!token) {
    console.error('[AUTH] No token available, cannot authenticate request')
    throw new Error('No authentication token available')
  }

  console.log('[AUTH] Token obtained:', token.substring(0, 20) + '...')
  console.log('[AUTH] Setting Authorization header with Bearer token')
  
  const finalHeaders = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  
  console.log('[AUTH] Final headers:', {
    'Authorization': finalHeaders['Authorization'] ? 'Bearer ...' : 'MISSING',
    'Content-Type': finalHeaders['Content-Type']
  })
  
  const response = await fetch(url, {
    ...options,
    headers: finalHeaders,
  })
  
  console.log('[AUTH] Response status:', response.status)
  console.log('[AUTH] Response status text:', response.statusText)
  return response
}
