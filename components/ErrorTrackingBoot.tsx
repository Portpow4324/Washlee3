'use client'

import { useEffect } from 'react'
import { logError } from '@/lib/adminErrorLogger'
import { useErrorTracking } from '@/lib/useErrorTracking'

function apiPathFrom(input: RequestInfo | URL) {
  try {
    const rawUrl = typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url
    const url = new URL(rawUrl, window.location.origin)
    return url.origin === window.location.origin && url.pathname.startsWith('/api/')
      ? url.pathname
      : null
  } catch {
    return null
  }
}

function shouldReportApiFailure(path: string, status?: number) {
  if (path === '/api/security/report') return false
  if (path === '/api/analytics/track') return false
  if (path === '/api/admin/session') return false

  return !status || status >= 500 || status === 403
}

export default function ErrorTrackingBoot() {
  useErrorTracking()

  useEffect(() => {
    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input, init) => {
      const path = apiPathFrom(input)
      const method = init?.method || (input instanceof Request ? input.method : 'GET')

      try {
        const response = await originalFetch(input, init)

        if (path && shouldReportApiFailure(path, response.status)) {
          logError(`Endpoint failed: ${path}`, `HTTP ${response.status} ${response.statusText || 'error'}`, {
            type: response.status === 403 ? 'authentication' : 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            context: {
              endpoint: path,
              method,
              statusCode: response.status,
              url: window.location.href,
            },
          })
        }

        return response
      } catch (error) {
        if (path && shouldReportApiFailure(path)) {
          logError(`Endpoint request failed: ${path}`, error instanceof Error ? error.message : 'Request failed', {
            type: 'network',
            severity: 'high',
            stack: error instanceof Error ? error.stack : undefined,
            context: {
              endpoint: path,
              method,
              url: window.location.href,
            },
          })
        }

        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
