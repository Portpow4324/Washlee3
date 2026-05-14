'use client'

const SESSION_KEY = 'washlee_analytics_session_id'
const ATTRIBUTION_KEY = 'washlee_attribution'

const ATTRIBUTION_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'promo',
  'ref',
  'channel',
  'campaign_id',
] as const

const ATTRIBUTION_PATHS = [
  '/booking',
  '/checkout',
  '/auth/signup',
  '/auth/signup-customer',
  '/auth/login',
  '/auth/signin',
  '/wash-club',
  '/pro',
  '/mobile-app',
  '/pricing',
  '/contact',
  '/corporate',
  '/wholesale',
]

type Attribution = Partial<Record<(typeof ATTRIBUTION_PARAMS)[number], string>>

type StoredAttribution = {
  firstTouch: Attribution
  lastTouch: Attribution
  landingPage: string
  firstCapturedAt: string
  lastCapturedAt: string
}

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

function readStoredAttribution(): StoredAttribution | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredAttribution
  } catch {
    return null
  }
}

function writeStoredAttribution(value: StoredAttribution) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value))
}

function attributionFromSearch(search: string): Attribution {
  const params = new URLSearchParams(search)
  const attribution: Attribution = {}

  ATTRIBUTION_PARAMS.forEach((key) => {
    const value = params.get(key)
    if (value) attribution[key] = value
  })

  return attribution
}

export function captureAttributionFromUrl() {
  if (typeof window === 'undefined') return null

  const current = attributionFromSearch(window.location.search)
  if (Object.keys(current).length === 0) return readStoredAttribution()

  const existing = readStoredAttribution()
  const now = new Date().toISOString()
  const next: StoredAttribution = {
    firstTouch: existing?.firstTouch && Object.keys(existing.firstTouch).length > 0
      ? existing.firstTouch
      : current,
    lastTouch: current,
    landingPage: existing?.landingPage || window.location.pathname,
    firstCapturedAt: existing?.firstCapturedAt || now,
    lastCapturedAt: now,
  }

  writeStoredAttribution(next)
  return next
}

export function getAttributionMetadata(): Record<string, string> {
  const stored = captureAttributionFromUrl()
  if (!stored) return {}

  const metadata: Record<string, string> = {
    landing_page: stored.landingPage,
    first_captured_at: stored.firstCapturedAt,
    last_captured_at: stored.lastCapturedAt,
  }

  Object.entries(stored.lastTouch).forEach(([key, value]) => {
    if (value) metadata[key] = value
  })

  Object.entries(stored.firstTouch).forEach(([key, value]) => {
    if (value) metadata[`first_${key}`] = value
  })

  return metadata
}

export function buildUrlWithAttribution(href: string | null) {
  if (!href || typeof window === 'undefined') return href
  if (
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('javascript:')
  ) {
    return href
  }

  const stored = captureAttributionFromUrl()
  if (!stored || Object.keys(stored.lastTouch).length === 0) return href

  try {
    const url = new URL(href, window.location.origin)
    if (url.origin !== window.location.origin) return href
    if (!ATTRIBUTION_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) {
      return href
    }

    Object.entries(stored.lastTouch).forEach(([key, value]) => {
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value)
      }
    })

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return href
  }
}

function hasMarketingConsent() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('cookieConsent') === 'accepted'
}

function trackMarketingPixels(
  eventName: string,
  metadata: Record<string, string | number | boolean | null | undefined>
) {
  if (typeof window === 'undefined' || !hasMarketingConsent()) return

  const win = window as typeof window & {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    ttq?: { track?: (event: string, payload?: Record<string, unknown>) => void }
  }

  const safeMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null)
  )

  win.gtag?.('event', eventName, safeMetadata)
  win.fbq?.('trackCustom', eventName, safeMetadata)
  win.ttq?.track?.(eventName, safeMetadata)
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

  const attributionMetadata = getAttributionMetadata()
  const eventMetadata = {
    ...attributionMetadata,
    ...options.metadata,
  }

  trackMarketingPixels(eventName, eventMetadata)

  const body = {
    sessionId: getSessionId(),
    eventName,
    source: 'web',
    path: options.path || window.location.pathname,
    screen: options.screen || null,
    referrer: document.referrer || null,
    userId: options.userId || null,
    deviceType: /mobile|iphone|android/i.test(window.navigator.userAgent) ? 'mobile' : 'desktop',
    metadata: eventMetadata,
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
