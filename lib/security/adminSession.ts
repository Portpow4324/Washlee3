export const ADMIN_SESSION_COOKIE = 'washlee_admin_session'
export const ADMIN_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60

const ADMIN_SESSION_TTL_MS = ADMIN_SESSION_MAX_AGE_SECONDS * 1000

function encoder() {
  return new TextEncoder()
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let mismatch = 0
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }

  return mismatch === 0
}

function hexToBytes(hex: string) {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) return null

  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function randomHex(bytes = 16) {
  const values = new Uint8Array(bytes)
  crypto.getRandomValues(values)
  return bytesToHex(values)
}

function passwordVariants(password: string) {
  const trimmed = password.trim()
  const normalizedWords = trimmed
    .toLowerCase()
    .replace(/[–—−]/g, '-')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return Array.from(new Set([password, trimmed, normalizedWords]))
}

function getSigningSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD_HASH ||
    process.env.ADMIN_PASSWORD ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'washlee-local-dev-admin-session'
  )
}

export function getConfiguredAdminPassword() {
  return process.env.ADMIN_PASSWORD || ''
}

function getConfiguredAdminPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH || ''
}

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder().encode(payload))
  return bytesToHex(new Uint8Array(signature))
}

export function isAdminPasswordConfigured() {
  return getConfiguredAdminPasswordHash().length > 0 || getConfiguredAdminPassword().length > 0
}

async function isPbkdf2PasswordValid(password: string, configuredHash: string) {
  const [algorithm, iterationsValue, saltHex, expectedHash] = configuredHash.split('$')
  const iterations = Number(iterationsValue)
  const salt = hexToBytes(saltHex || '')

  if (algorithm !== 'pbkdf2_sha256' || !Number.isInteger(iterations) || iterations < 100_000 || !salt || !expectedHash) {
    return false
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    key,
    256
  )
  const actualHash = bytesToHex(new Uint8Array(derivedBits))
  return timingSafeEqual(actualHash, expectedHash)
}

export async function isAdminPasswordValid(password: unknown) {
  if (typeof password !== 'string') return false

  const configuredHash = getConfiguredAdminPasswordHash()
  if (configuredHash) {
    for (const variant of passwordVariants(password)) {
      if (await isPbkdf2PasswordValid(variant, configuredHash)) return true
    }
    return false
  }

  const configuredPassword = getConfiguredAdminPassword()
  if (!configuredPassword) return false

  return passwordVariants(password).some((variant) => timingSafeEqual(variant, configuredPassword))
}

export async function createAdminSessionToken() {
  const issuedAt = Date.now().toString()
  const payload = `${issuedAt}.${randomHex()}`
  const signature = await hmacHex(getSigningSecret(), payload)
  return `${payload}.${signature}`
}

export async function verifyAdminSessionToken(token?: string | null) {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [issuedAt, nonce, signature] = parts
  const issuedAtNumber = Number(issuedAt)
  if (!Number.isFinite(issuedAtNumber) || !nonce || !signature) return false

  const tokenAge = Date.now() - issuedAtNumber
  if (tokenAge < 0 || tokenAge > ADMIN_SESSION_TTL_MS) return false

  const expectedSignature = await hmacHex(getSigningSecret(), `${issuedAt}.${nonce}`)
  return timingSafeEqual(signature, expectedSignature)
}
