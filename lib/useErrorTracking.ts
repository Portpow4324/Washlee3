'use client'

import { useEffect } from 'react'
import { logError } from '@/lib/adminErrorLogger'

/**
 * Hook to track errors app-wide
 * Captures unhandled errors and logs them to admin dashboard
 */
export function useErrorTracking() {
  useEffect(() => {
    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[ERROR-TRACKING] Unhandled Promise Rejection:', event.reason)

      logError(
        'Unhandled Promise Rejection',
        event.reason?.message || String(event.reason),
        {
          type: 'runtime',
          stack: event.reason?.stack,
          context: {
            url: window.location.href,
          },
        }
      )
    }

    // Catch runtime errors
    const handleError = (event: ErrorEvent) => {
      console.error('[ERROR-TRACKING] Runtime Error:', event.error)

      logError(event.error?.message || 'Unknown error', event.filename || 'unknown', {
        type: 'runtime',
        stack: event.error?.stack,
        context: {
          url: window.location.href,
          file: event.filename,
          line: event.lineno,
          column: event.colno,
        },
      })
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])
}

/**
 * Hook to track API errors
 */
export function useApiErrorTracking(endpoint: string) {
  return async function trackError(
    error: any,
    context?: {
      method?: string
      statusCode?: number
      requestBody?: any
      responseBody?: any
    }
  ) {
    const message = error?.message || String(error)

    logError(`API Error - ${endpoint}`, message, {
      type: determineFetchErrorType(error, context?.statusCode),
      stack: error?.stack,
      context: {
        url: window.location.href,
        endpoint,
        method: context?.method,
        statusCode: context?.statusCode,
        requestBody: context?.requestBody,
        responseBody: context?.responseBody,
      },
    })
  }
}

/**
 * Wrap fetch calls to auto-track errors
 */
export async function trackedFetch(
  url: string,
  options?: RequestInit & { trackingLabel?: string }
) {
  const label = options?.trackingLabel || url
  const trackerLog = useApiErrorTracking(label)

  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const body = await response.text()

      await trackerLog(new Error(`HTTP ${response.status}`), {
        method: options?.method || 'GET',
        statusCode: response.status,
        requestBody: options?.body,
        responseBody: body,
      })
    }

    return response
  } catch (error: any) {
    await trackerLog(error, {
      method: options?.method || 'GET',
      requestBody: options?.body,
    })

    throw error
  }
}

/**
 * Determine error type from fetch error
 */
function determineFetchErrorType(
  error: any,
  statusCode?: number
): 'network' | 'validation' | 'database' | 'authentication' | 'payment' | 'system' {
  if (statusCode === 400) return 'validation'
  if (statusCode === 401) return 'authentication'
  if (statusCode === 429) return 'system'
  if (statusCode && statusCode >= 500) return 'database'

  const message = error?.message?.toLowerCase() || ''

  if (message.includes('network') || message.includes('fetch')) return 'network'
  if (message.includes('auth')) return 'authentication'
  if (message.includes('database') || message.includes('firestore')) return 'database'

  return 'network'
}
