export async function isAdminUser(uid: string): Promise<boolean> {
  try {
    // Admin users are determined by explicit UID list (set via env var).
    // This prevents everyone from being treated as an admin just because an
    // env var exists in development.
    const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    return adminUids.includes(uid)
  } catch (err) {
    console.error('[Verification] Error checking admin status:', err)
    return false
  }
}

export type VerificationType = 'email' | 'phone'

const API_BASE = '/api/verification'

export async function requestVerificationCode(
  email: string,
  phone: string,
  firstName: string,
  type: VerificationType
): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const res = await fetch(`${API_BASE}/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, firstName, type }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { success: false, error: data.error || 'Failed to request code' }
    }

    const data = await res.json()
    return { success: data.success, code: data.code }
  } catch (err: any) {
    console.error('[Verification] requestVerificationCode error:', err)
    return { success: false, error: err.message }
  }
}

export async function verifyCode(
  email: string,
  phone: string,
  code: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, code }),
    })

    if (!res.ok) return false
    const data = await res.json()
    return !!data.success
  } catch (err) {
    console.error('[Verification] verifyCode error:', err)
    return false
  }
}

export async function getVerificationCodeForTesting(email: string, phone: string): Promise<string | null> {
  // Don't make API call if email or phone are empty
  if (!email || !phone) {
    return null
  }

  try {
    const params = new URLSearchParams({ email, phone })
    const res = await fetch(`${API_BASE}/get-code?${params.toString()}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.code ?? null
  } catch {
    return null
  }
}
