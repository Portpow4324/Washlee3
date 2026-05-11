'use client'

const SESSION_KEY = 'washlee_analytics_session_id'

function getSessionId() {
  if (typeof window === 'undefined') return ''
  const existing = window.localStorage.getItem(SESSION_KEY)
  if (existing) return existing

  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`

  window.localStorage.setItem(SESSION_KEY, generated)
  return generated
}

export function trackWashleeEvent(
  eventName: string,
  options: {
    userId?: string | null
    path?: string
    screen?: string
    metadata?: Record<string, string | number | boolean | null | undefined>
  } = {}
) {
  if (typeof window === 'undefined') return

  const body = {
    sessionId: getSessionId(),
    eventName,
    source: 'web',
    path: options.path || window.location.pathname,
    screen: options.screen || null,
    referrer: document.referrer || null,
    userId: options.userId || null,
    deviceType: /mobile|iphone|android/i.test(window.navigator.userAgent) ? 'mobile' : 'desktop',
    metadata: options.metadata || {},
  }

  const json = JSON.stringify(body)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/track', new Blob([json], { type: 'application/json' }))
    return
  }

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: json,
    keepalive: true,
  }).catch(() => undefined)
}
