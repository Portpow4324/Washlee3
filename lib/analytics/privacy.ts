export type AnalyticsSource = 'web' | 'ios' | 'android'

const ALLOWED_EVENT_NAMES = new Set([
  'page_view',
  'cta_clicked',
  'signup_started',
  'signup_completed',
  'signup_failed',
  'booking_started',
  'booking_completed',
  'login_started',
  'login_success',
  'login_failed',
  'app_opened',
  'screen_view',
])

const SAFE_METADATA_KEYS = new Set([
  'cta',
  'section',
  'route',
  'screen',
  'funnel_step',
  'platform',
  'app_version',
  'build_number',
  'status',
])

export function normalizeSource(source: unknown): AnalyticsSource {
  return source === 'ios' || source === 'android' ? source : 'web'
}

export function normalizeEventName(eventName: unknown): string {
  const normalized = typeof eventName === 'string' ? eventName.trim().slice(0, 80) : ''
  if (!normalized) return 'page_view'
  return ALLOWED_EVENT_NAMES.has(normalized) ? normalized : 'custom_event'
}

export function sanitizeText(value: unknown, maxLength = 300): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

export function sanitizeMetadata(value: unknown): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const safe: Record<string, string | number | boolean | null> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!SAFE_METADATA_KEYS.has(key)) continue

    if (typeof raw === 'string') {
      safe[key] = raw.slice(0, 160)
    } else if (typeof raw === 'number' || typeof raw === 'boolean' || raw === null) {
      safe[key] = raw
    }
  }
  return safe
}

export function deviceTypeFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'unknown'
  if (/ipad|tablet/i.test(userAgent)) return 'tablet'
  if (/mobile|iphone|android/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

export function browserFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'unknown'
  if (/edg\//i.test(userAgent)) return 'edge'
  if (/chrome|crios/i.test(userAgent)) return 'chrome'
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'safari'
  if (/firefox|fxios/i.test(userAgent)) return 'firefox'
  return 'other'
}
