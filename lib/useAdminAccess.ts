/**
 * Helper to check if user has admin access
 * Supports both Firebase isAdmin flag and session-based ownerAccess
 */
export function useAdminAccess() {
  if (typeof window === 'undefined') return false
  
  // Check if user has owner access via session storage (from admin login)
  const ownerAccess = sessionStorage?.getItem('ownerAccess') === 'true'
  return ownerAccess
}
