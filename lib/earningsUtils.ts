import { Timestamp } from 'firebase/firestore'

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type PaymentMethod = 'bank_transfer' | 'stripe_connect'

export interface ProEarnings {
  proId: string
  totalEarnings: number
  totalCompleted: number
  averageEarningsPerJob: number
  thisMonth: number
  thisWeek: number
  thisDay: number
  pendingEarnings: number
  lastUpdated: Timestamp
}

export interface Payout {
  id: string
  proId: string
  amount: number
  status: PayoutStatus
  paymentMethod: PaymentMethod
  bankAccount?: {
    accountHolder: string
    accountNumber: string
    routingNumber: string
    bankName: string
  }
  stripeAccountId?: string
  stripePayoutId?: string
  requestedAt: Timestamp
  processedAt?: Timestamp
  completedAt?: Timestamp
  failureReason?: string
  notes?: string
}

export interface EarningsTransaction {
  id: string
  proId: string
  orderId: string
  amount: number
  type: 'job_completed' | 'bonus' | 'refund' | 'adjustment'
  status: 'earned' | 'pending_payout' | 'paid_out'
  description: string
  createdAt: Timestamp
}

export interface ProStats {
  totalJobs: number
  completedJobs: number
  cancelledJobs: number
  averageRating: number
  totalReviews: number
  responseTime: number // minutes
  acceptanceRate: number // percentage
  completionRate: number // percentage
}

// Validation
export function validatePayout(payout: Partial<Payout>) {
  if (!payout.proId) return { isValid: false, error: 'Pro ID required' }
  if (!payout.amount || payout.amount <= 0) return { isValid: false, error: 'Amount must be positive' }
  if (!payout.paymentMethod) return { isValid: false, error: 'Payment method required' }

  if (payout.paymentMethod === 'bank_transfer' && payout.bankAccount) {
    if (!payout.bankAccount.accountHolder) return { isValid: false, error: 'Account holder required' }
    if (!payout.bankAccount.accountNumber) return { isValid: false, error: 'Account number required' }
    if (!payout.bankAccount.routingNumber) return { isValid: false, error: 'Routing number required' }
  }

  return { isValid: true }
}

// Earnings calculations
export function calculateDailyEarnings(transactions: EarningsTransaction[]): Record<string, number> {
  const daily: Record<string, number> = {}

  transactions.forEach(t => {
    const date = new Date(t.createdAt.toMillis?.() || 0).toISOString().split('T')[0]
    daily[date] = (daily[date] || 0) + t.amount
  })

  return daily
}

export function calculateWeeklyEarnings(transactions: EarningsTransaction[]): number {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  return transactions
    .filter(t => new Date(t.createdAt.toMillis?.() || 0) >= oneWeekAgo)
    .reduce((sum, t) => sum + t.amount, 0)
}

export function calculateMonthlyEarnings(transactions: EarningsTransaction[]): number {
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  return transactions
    .filter(t => new Date(t.createdAt.toMillis?.() || 0) >= oneMonthAgo)
    .reduce((sum, t) => sum + t.amount, 0)
}

export function calculatePayoutMinimum(): number {
  return 50 // Min $50 before payout allowed
}

export function isPayoutEligible(earnings: ProEarnings): boolean {
  return earnings.pendingEarnings >= calculatePayoutMinimum()
}

// Tax calculations (Australian tax - 45%)
export function calculateTaxableEarnings(grossEarnings: number): number {
  return Math.round(grossEarnings * 0.45 * 100) / 100
}

export function calculateNetEarnings(grossEarnings: number): number {
  return grossEarnings - calculateTaxableEarnings(grossEarnings)
}

// Payout scheduling
export function getNextPayoutDate(): Date {
  const today = new Date()
  const nextFriday = new Date(today)
  nextFriday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7 || 7))
  nextFriday.setHours(0, 0, 0, 0)
  return nextFriday
}

export function getDaysUntilPayout(): number {
  const now = new Date()
  const nextPayout = getNextPayoutDate()
  const diffTime = nextPayout.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Status display
export function getPayoutStatusLabel(status: PayoutStatus): string {
  const labels: Record<PayoutStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  }
  return labels[status] || status
}

export function getPayoutStatusColor(status: PayoutStatus): string {
  const colors: Record<PayoutStatus, string> = {
    pending: '#F59E0B',
    processing: '#3B82F6',
    completed: '#10B981',
    failed: '#EF4444',
  }
  return colors[status] || '#6B7B78'
}

// Earnings trend
export function calculateEarningsTrend(previousPeriod: number, currentPeriod: number): {
  change: number
  percentChange: number
  trending: 'up' | 'down' | 'flat'
} {
  const change = currentPeriod - previousPeriod
  const percentChange = previousPeriod === 0 ? 0 : (change / previousPeriod) * 100

  return {
    change,
    percentChange,
    trending: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
  }
}

// Professional statistics
export function calculateProStats(jobs: any[], reviews: any[]): ProStats {
  const completedJobs = jobs.filter(j => j.status === 'completed')
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  return {
    totalJobs: jobs.length,
    completedJobs: completedJobs.length,
    cancelledJobs: jobs.filter(j => j.status === 'cancelled').length,
    averageRating,
    totalReviews: reviews.length,
    responseTime: 15, // minutes (dummy)
    acceptanceRate: jobs.length > 0 ? (jobs.filter(j => j.status !== 'cancelled').length / jobs.length) * 100 : 0,
    completionRate: jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
  }
}
