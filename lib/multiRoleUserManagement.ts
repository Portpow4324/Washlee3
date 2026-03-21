// Multi-Role User Management - Placeholder for MVP
// Migrated to Supabase in Phase 8

interface UserMetadata {
  uid: string
  email: string
  displayName?: string
  roles: ('customer' | 'pro' | 'admin')[]
}

export async function getUserMetadata(uid: string): Promise<UserMetadata | null> {
  console.log('[UserMgmt] Getting metadata for:', uid)
  // TODO: Implement using Supabase in Phase 9
  return null
}

export async function setUserMetadata(uid: string, metadata: Partial<UserMetadata>): Promise<void> {
  console.log('[UserMgmt] Setting metadata for:', uid, metadata)
  // TODO: Implement using Supabase in Phase 9
}

export async function hasRole(uid: string, role: string): Promise<boolean> {
  console.log('[UserMgmt] Checking role:', uid, role)
  // TODO: Implement using Supabase in Phase 9
  return false
}

export async function switchRole(uid: string, newRole: 'customer' | 'pro'): Promise<void> {
  console.log('[UserMgmt] Switching role:', uid, newRole)
  // TODO: Implement using Supabase in Phase 9
}
