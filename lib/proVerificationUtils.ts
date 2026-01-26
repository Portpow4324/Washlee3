import { Timestamp } from 'firebase/firestore'

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'in-review'
export type DocumentType = 'id' | 'background-check' | 'insurance' | 'license'

export interface VerificationDocument {
  id: string
  type: DocumentType
  url: string
  uploadedAt: Timestamp
  verifiedAt?: Timestamp
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
}

export interface ProVerification {
  id: string
  proId: string
  status: VerificationStatus
  documents: VerificationDocument[]
  backgroundCheckId?: string // Onfido check ID
  backgroundCheckStatus?: 'pending' | 'completed' | 'clear' | 'issues'
  backgroundCheckUrl?: string
  idVerificationStatus?: 'pending' | 'completed' | 'verified'
  insuranceExpiry?: Timestamp
  licenseExpiry?: Timestamp
  verifiedAt?: Timestamp
  rejectionReason?: string
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface VerificationBadge {
  proId: string
  status: 'verified' | 'pending' | 'rejected'
  verifiedAt?: Date
  expiresAt?: Date
}

// Validation
export function validateVerificationDocument(doc: Partial<VerificationDocument>) {
  if (!doc.type) return { isValid: false, error: 'Document type required' }
  if (!doc.url) return { isValid: false, error: 'Document URL required' }
  if (!['id', 'background-check', 'insurance', 'license'].includes(doc.type)) {
    return { isValid: false, error: 'Invalid document type' }
  }
  return { isValid: true }
}

export function isVerificationComplete(verification: ProVerification): boolean {
  if (verification.status !== 'approved') return false

  // All required documents must be approved
  const requiredDocs = ['id', 'background-check']
  const approvedDocs = verification.documents
    .filter(d => d.status === 'approved')
    .map(d => d.type)

  return requiredDocs.every(type => approvedDocs.includes(type as DocumentType))
}

export function getVerificationBadge(verification: ProVerification): VerificationBadge {
  return {
    proId: verification.proId,
    status: verification.status === 'approved' ? 'verified' : verification.status === 'pending' ? 'pending' : 'rejected',
    verifiedAt: verification.verifiedAt ? new Date(verification.verifiedAt.toMillis()) : undefined,
    expiresAt: verification.backgroundCheckUrl ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined,
  }
}

export function getVerificationStatusLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    pending: 'Pending Review',
    approved: 'Verified',
    rejected: 'Verification Failed',
    'in-review': 'In Review',
  }
  return labels[status] || status
}

export function getVerificationStatusColor(status: VerificationStatus): string {
  const colors: Record<VerificationStatus, string> = {
    pending: '#FFA500', // orange
    approved: '#48C9B0', // teal
    rejected: '#EF4444', // red
    'in-review': '#3B82F6', // blue
  }
  return colors[status] || '#6B7B78'
}

export function canResubmitVerification(verification: ProVerification): boolean {
  // Can resubmit if rejected or pending for > 30 days
  if (verification.status === 'rejected') return true

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const createdAt = new Date(verification.createdAt.toMillis())

  return verification.status === 'pending' && createdAt < thirtyDaysAgo
}

export function getRequiredDocuments(proType: 'individual' | 'business'): DocumentType[] {
  const baseDocs: DocumentType[] = ['id', 'background-check']

  if (proType === 'business') {
    return [...baseDocs, 'license']
  }

  return baseDocs
}

export function calculateVerificationProgress(verification: ProVerification): number {
  const totalSteps = 3 // Documents, Background Check, Approval
  let completedSteps = 0

  if (verification.documents.length > 0) completedSteps += 1
  if (verification.backgroundCheckStatus === 'completed' || verification.backgroundCheckStatus === 'clear') {
    completedSteps += 1
  }
  if (verification.status === 'approved') completedSteps += 1

  return Math.round((completedSteps / totalSteps) * 100)
}

export function getVerificationTimelineEvents(verification: ProVerification) {
  const events = []

  if (verification.createdAt) {
    events.push({
      date: new Date(verification.createdAt.toMillis()),
      title: 'Application started',
      status: 'completed',
    })
  }

  if (verification.documents.some(d => d.status === 'approved')) {
    const firstApprovedDoc = verification.documents.find(d => d.status === 'approved')
    if (firstApprovedDoc?.verifiedAt) {
      events.push({
        date: new Date(firstApprovedDoc.verifiedAt.toMillis()),
        title: 'Documents verified',
        status: 'completed',
      })
    }
  }

  if (verification.backgroundCheckStatus === 'completed' || verification.backgroundCheckStatus === 'clear') {
    events.push({
      date: new Date(verification.updatedAt.toMillis()),
      title: 'Background check completed',
      status: verification.backgroundCheckStatus === 'clear' ? 'completed' : 'warning',
    })
  }

  if (verification.status === 'approved' && verification.verifiedAt) {
    events.push({
      date: new Date(verification.verifiedAt.toMillis()),
      title: 'Profile verified',
      status: 'completed',
    })
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}
