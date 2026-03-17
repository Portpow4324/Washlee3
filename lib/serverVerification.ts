import { db } from '@/lib/firebase'
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import COLLECTIONS from './collections'
/**
 * Server-side verification utilities.
 *
 * This module is intended to run only on the server (API routes) and is used to
 * store verification codes in a process-local store. This is a lightweight
 * stand-in for a more durable solution (Redis, database, etc.) in production.
 */

type VerificationRecord = {
  code: string
  expiresAt: number
  verified: boolean
}

// Firestore-based, no in-memory Map

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
  const record: VerificationRecord = {
    code,
    expiresAt: Date.now() + EXPIRY_MS,
    verified: false,
  }
  await setDoc(doc(db, COLLECTIONS.VERIFICATION_CODES, key), record)
  console.log('[ServerVerification] Stored code in Firestore:', { key, code })
}

export async function verifyCode(email: string, phone: string, code: string): Promise<boolean> {
  const key = makeKey(email, phone)
  const ref = doc(db, COLLECTIONS.VERIFICATION_CODES, key)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    console.log('[ServerVerification] No code stored for', key)
    return false
  }
  const stored = snap.data() as VerificationRecord
  console.log('[ServerVerification] Attempting to verify code:', { key, inputCode: code, stored })

  if (Date.now() > stored.expiresAt) {
    console.log('[ServerVerification] Code expired for', key)
    await deleteDoc(ref)
    return false
  }

  if (stored.verified) {
    console.log('[ServerVerification] Code already verified for', key)
    return true
  }

  // Remove all whitespace from code for robust comparison
  const normalizedCode = code.replace(/\s+/g, '')
  const storedCode = stored.code.replace(/\s+/g, '')
  if (storedCode !== normalizedCode) {
    console.log('[ServerVerification] Code mismatch for', key, { expected: storedCode, got: normalizedCode, rawInput: code, rawStored: stored.code })
    return false
  }

  await setDoc(ref, { ...stored, verified: true })
  console.log('[ServerVerification] Code verified for', key)
  return true
}

export async function getVerificationCodeForTesting(email: string, phone: string): Promise<string | null> {
  const key = makeKey(email, phone)
  const ref = doc(db, COLLECTIONS.VERIFICATION_CODES, key)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const stored = snap.data() as VerificationRecord
  return stored.code
}
