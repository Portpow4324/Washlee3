export function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''

  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function isBodyTooLarge(contentLength: string | null, maxBytes: number) {
  if (!contentLength) return false

  const parsed = Number(contentLength)
  return Number.isFinite(parsed) && parsed > maxBytes
}
