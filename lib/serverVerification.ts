import { supabase } from '@/lib/supabaseClient'

/**
 * Server-side verification utilities.
 *
 * This module stores verification codes in Supabase verification_codes table.
 * Codes expire after 15 minutes.
 */

type VerificationRecord = {
  code: string
  expiresAt: number
  used: boolean
}

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
  const record = {
    email: email.trim().toLowerCase(),
    phone: phone.replace(/\D/g, ''),
    code,
    expires_at: new Date(Date.now() + EXPIRY_MS).toISOString(),
    used: false,
  }
  
  const { error } = await supabase
    .from('verification_codes')
    .insert([record])
  
  if (error) {
    console.error('[ServerVerification] Failed to store code:', error)
    throw error
  }
  
  console.log('[ServerVerification] Stored code in Supabase:', { key, code })
}

export async function verifyCode(email: string, phone: string, code: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.replace(/\D/g, '')
  
  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', normalizedEmail)
    .eq('phone', normalizedPhone)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error || !data || data.length === 0) {
    console.log('[ServerVerification] No code stored for', normalizedEmail, normalizedPhone)
    return false
  }
  
  const stored = data[0]
  const key = `${normalizedEmail}:${normalizedPhone}`
  console.log('[ServerVerification] Attempting to verify code:', { key, inputCode: code, stored })

  if (new Date(stored.expires_at) < new Date()) {
    console.log('[ServerVerification] Code expired for', key)
    // Delete expired code
    await supabase.from('verification_codes').delete().eq('id', stored.id)
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
    console.log('[ServerVerification] Code mismatch for', key, { expected: storedCode, got: normalizedCode, rawInput: code, rawStored: stored.code })
    return false
  }

  // Mark code as used
  const { error: updateError } = await supabase
    .from('verification_codes')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('id', stored.id)
  
  if (updateError) {
    console.error('[ServerVerification] Failed to mark code as used:', updateError)
    throw updateError
  }
  
  console.log('[ServerVerification] Code verified for', key)
  return true
}

export async function getVerificationCodeForTesting(email: string, phone: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.replace(/\D/g, '')
  
  const { data, error } = await supabase
    .from('verification_codes')
    .select('code')
    .eq('email', normalizedEmail)
    .eq('phone', normalizedPhone)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error || !data || data.length === 0) {
    return null
  }
  
  return data[0].code
}
