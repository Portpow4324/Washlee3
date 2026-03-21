// DEPRECATED: This file is no longer used
// Firebase Admin SDK has been replaced with Supabase
// See /lib/multiServiceAccount.ts and /lib/middleware/admin.ts for current admin implementation

export const adminAuth = null
export const adminDb = null
export const secondaryAuth = null
export const secondaryDb = null

// Stub exports for legacy code
export const getSecondaryAdmin = () => null
export const getAdminDb = () => null
export const getAdminAuth = () => null
export const getSecondaryDb = () => null

console.warn('⚠️ DEPRECATED: firebaseAdmin.ts is no longer in use. Use Supabase admin client instead.')
