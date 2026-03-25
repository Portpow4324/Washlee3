/**
 * Server-side verification utilities using in-memory storage.
 * 
 * This module stores verification codes in memory with expiration.
 * Codes expire after 15 minutes.
 * 
 * Note: In production with multiple instances, use Redis or a database table.
 */

type VerificationRecord = {
  code: string
  expiresAt: number
  used: boolean
}

// In-memory storage for verification codes
// Key format: email:phone
const verificationCodes = new Map<string, VerificationRecord>()

const EXPIRY_MS = 15 * 60 * 1000 // 15 minutes

function makeKey(email: string, phone: string) {
  const normalizedEmail = email.trim().toLowerCase()

  // Normalize phone to digits only and prefer E.164-style (AU) for matching.
  let normalizedPhone = phone.replace(/\D/g, '')
  if (normalizedPhone.startsWith('0') && normalizedPhone.length === 10) {
    // Convert local AU number (0412...) to country code format (61412...)
    normalizedPhone = `61${normalizedPhone.slice(1)}`
  }

  return `${normalizedEmail}:${normalizedPhone}`
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function storeVerificationCode(email: string, phone: string, code: string): Promise<void> {
  const key = makeKey(email, phone)
  
  verificationCodes.set(key, {
    code,
    expiresAt: Date.now() + EXPIRY_MS,
    used: false,
  })
  
  console.log('[ServerVerification] Stored code in memory:', { key, code })
}

export async function verifyCode(email: string, phone: string, code: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  let normalizedPhone = phone.replace(/\D/g, '')
  
  // Try both formats (with and without country code)
  let key = `${normalizedEmail}:${normalizedPhone}`
  let stored = verificationCodes.get(key)
  
  // If not found and phone doesn't start with 61, try with country code
  if (!stored && !normalizedPhone.startsWith('61') && normalizedPhone.length === 10) {
    normalizedPhone = `61${normalizedPhone.slice(1)}`
    key = `${normalizedEmail}:${normalizedPhone}`
    stored = verificationCodes.get(key)
  }
  
  if (!stored) {
    console.log('[ServerVerification] No code stored for', key)
    return false
  }
  
  console.log('[ServerVerification] Attempting to verify code:', { key, inputCode: code, stored })

  // Check expiration
  if (stored.expiresAt < Date.now()) {
    console.log('[ServerVerification] Code expired for', key)
    verificationCodes.delete(key)
    return false
  }

  if (stored.used) {
    console.log('[ServerVerification] Code already verified for', key)
    return true
  }

  // Remove all whitespace from code for robust comparison
  const normalizedCode = code.replace(/\s+/g, '')
  const storedCode = stored.code.replace(/\s+/g, '')
  
  if (storedCode !== normalizedCode) {
    console.log('[ServerVerification] Code mismatch for', key, { expected: storedCode, got: normalizedCode })
    return false
  }

  // Mark code as used
  stored.used = true
  verificationCodes.set(key, stored)
  
  console.log('[ServerVerification] Code verified for', key)
  return true
}

export async function getVerificationCodeForTesting(email: string, phone: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase()
  let normalizedPhone = phone.replace(/\D/g, '')
  
  let key = `${normalizedEmail}:${normalizedPhone}`
  let stored = verificationCodes.get(key)
  
  // If not found and phone doesn't start with 61, try with country code
  if (!stored && !normalizedPhone.startsWith('61') && normalizedPhone.length === 10) {
    normalizedPhone = `61${normalizedPhone.slice(1)}`
    key = `${normalizedEmail}:${normalizedPhone}`
    stored = verificationCodes.get(key)
  }
  
  if (!stored) {
    return null
  }
  
  return stored.code
}
