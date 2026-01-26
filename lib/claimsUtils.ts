import { Timestamp } from 'firebase/firestore'

export type ClaimStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'resolved'
export type ResolutionType = 'full_refund' | 're_wash' | 'replacement' | 'partial_refund'

export interface DamageClaim {
  id: string
  orderId: string
  customerId: string
  proId: string
  damageType: string
  severity: 'minor' | 'moderate' | 'severe'
  description: string
  photos: string[]
  status: ClaimStatus
  resolution?: ResolutionType
  compensation?: number
  submittedAt: Timestamp
  reviewedAt?: Timestamp
  resolvedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ClaimReview {
  claimId: string
  reviewerId: string
  status: 'approved' | 'rejected'
  resolution: ResolutionType
  compensationAmount: number
  reason: string
  timestamp: Timestamp
}

// Validation
export function validateDamageClaim(claim: Partial<DamageClaim>) {
  if (!claim.orderId) return { isValid: false, error: 'Order ID required' }
  if (!claim.customerId) return { isValid: false, error: 'Customer ID required' }
  if (!claim.damageType) return { isValid: false, error: 'Damage type required' }
  if (!claim.severity || !['minor', 'moderate', 'severe'].includes(claim.severity)) {
    return { isValid: false, error: 'Valid severity required' }
  }
  if (!claim.description || claim.description.length < 20) {
    return { isValid: false, error: 'Description must be at least 20 characters' }
  }
  if (!claim.photos || claim.photos.length === 0) {
    return { isValid: false, error: 'At least one photo required' }
  }
  return { isValid: true }
}

// Auto-resolution logic
export function getAutoResolution(
  severity: 'minor' | 'moderate' | 'severe',
  orderTotal: number
): {
  type: ResolutionType
  amount: number
} {
  switch (severity) {
    case 'minor':
      return { type: 'partial_refund', amount: Math.round(orderTotal * 0.25 * 100) / 100 }
    case 'moderate':
      return { type: 're_wash', amount: Math.round(orderTotal * 0.5 * 100) / 100 }
    case 'severe':
      return { type: 'full_refund', amount: orderTotal }
    default:
      return { type: 'partial_refund', amount: 0 }
  }
}

// Damage types
export const damageTypes = [
  'Stain or discoloration',
  'Tear or hole',
  'Shrinkage',
  'Color bleeding',
  'Missing item',
  'Wrong item returned',
  'Odor issue',
  'Other',
]

// Status display
export function getClaimStatusLabel(status: ClaimStatus): string {
  const labels: Record<ClaimStatus, string> = {
    submitted: 'Submitted',
    reviewing: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    resolved: 'Resolved',
  }
  return labels[status]
}

export function getClaimStatusColor(status: ClaimStatus): string {
  const colors: Record<ClaimStatus, string> = {
    submitted: '#3B82F6',
    reviewing: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
    resolved: '#8B5CF6',
  }
  return colors[status]
}

// Resolution display
export function getResolutionLabel(type: ResolutionType): string {
  const labels: Record<ResolutionType, string> = {
    full_refund: 'Full Refund',
    're_wash': 'Free Re-wash',
    replacement: 'Replacement Item',
    partial_refund: 'Partial Refund',
  }
  return labels[type]
}

// Claim timeline
export function getDaysBeforeCutoff(): number {
  return 14 // Days to file a claim
}

export function canFileClaim(completedAt: Timestamp): boolean {
  const now = new Date()
  const completed = new Date(completedAt.toMillis())
  const diffDays = Math.floor((now.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays < getDaysBeforeCutoff()
}

export function getDaysRemainingToFile(completedAt: Timestamp): number {
  const cutoffDate = new Date(completedAt.toMillis().valueOf() + getDaysBeforeCutoff() * 24 * 60 * 60 * 1000)
  const now = new Date()
  const diffDays = Math.ceil((cutoffDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

// Statistics
export function calculateClaimStats(claims: DamageClaim[]) {
  return {
    total: claims.length,
    pending: claims.filter(c => c.status === 'submitted' || c.status === 'reviewing').length,
    approved: claims.filter(c => c.status === 'approved').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
    totalCompensation: claims
      .filter(c => c.status === 'approved' || c.status === 'resolved')
      .reduce((sum, c) => sum + (c.compensation || 0), 0),
  }
}
