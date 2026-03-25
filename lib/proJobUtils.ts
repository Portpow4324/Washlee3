// Supabase uses Date strings (ISO 8601) or Date objects
type Timestamp = string | Date

export type ProJobStatus = 'available' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'

export interface ProJob {
  id: string
  orderId: string
  customerId: string
  proId: string
  status: ProJobStatus
  orderDetails: {
    weight: number
    items: string[]
    specialInstructions: string
    services: string[]
  }
  pickupLocation: {
    address: string
    lat: number
    lng: number
    instructions: string
  }
  deliveryLocation: {
    address: string
    lat: number
    lng: number
    instructions: string
  }
  pickupTime: Timestamp
  estimatedDeliveryTime: Timestamp
  actualPickupTime?: Timestamp
  actualDeliveryTime?: Timestamp
  earnings: number
  acceptedAt?: Timestamp
  completedAt?: Timestamp
  rating?: number
  feedback?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AvailableOrder {
  id: string
  customerId: string
  weight: number
  pickupAddress: string
  deliveryAddress: string
  pickupTime: Timestamp
  estimatedDelivery: Timestamp
  services: string[]
  price: number
  customerRating: number
  distance: number
  estimatedEarnings: number
}

export interface ProSchedule {
  proId: string
  date: Date
  availableHours: number
  scheduledJobs: ProJob[]
  totalEarnings: number
}

// Validation
export function validateProJob(job: Partial<ProJob>) {
  if (!job.orderId) return { isValid: false, error: 'Order ID required' }
  if (!job.proId) return { isValid: false, error: 'Pro ID required' }
  if (!job.pickupLocation?.address) return { isValid: false, error: 'Pickup address required' }
  if (!job.deliveryLocation?.address) return { isValid: false, error: 'Delivery address required' }
  return { isValid: true }
}

// Calculations
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function estimateEarnings(basePrice: number, distance: number, jobComplexity: number): number {
  // Base price (70% to pro) + distance bonus (0.50/km) + complexity bonus (5-15%)
  const basePortion = basePrice * 0.7
  const distanceBonus = distance * 0.5
  const complexityMultiplier = 1 + (jobComplexity - 1) * 0.05

  return Math.round((basePortion + distanceBonus) * complexityMultiplier * 100) / 100
}

export function calculateDeliveryETA(pickupTime: Date, weight: number): Date {
  // Simple ETA: pickup time + 2 hours + 30 min per 10kg
  const eta = new Date(pickupTime.getTime())
  eta.setHours(eta.getHours() + 2)
  eta.setMinutes(eta.getMinutes() + Math.ceil((weight / 10) * 30))
  return eta
}

// Status management
export function canAcceptJob(job: ProJob): boolean {
  return job.status === 'available'
}

export function canCompleteJob(job: ProJob): boolean {
  return job.status === 'in-progress'
}

export function canCancelJob(job: ProJob): boolean {
  return ['available', 'accepted'].includes(job.status)
}

export function getJobStatusLabel(status: ProJobStatus): string {
  const labels: Record<ProJobStatus, string> = {
    available: 'Available',
    accepted: 'Accepted',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return labels[status] || status
}

export function getJobStatusColor(status: ProJobStatus): string {
  const colors: Record<ProJobStatus, string> = {
    available: '#48C9B0',
    accepted: '#3B82F6',
    'in-progress': '#F59E0B',
    completed: '#10B981',
    cancelled: '#EF4444',
  }
  return colors[status] || '#6B7B78'
}

// Scheduling
export function getProAvailabilityForDay(jobs: ProJob[], date: Date, maxJobsPerDay: number = 8): number {
  const dayJobs = jobs.filter(j => {
    const jobDate = new Date(typeof j.createdAt === 'string' ? j.createdAt : j.createdAt)
    return jobDate.toDateString() === date.toDateString() && j.status !== 'cancelled'
  })
  return Math.max(0, maxJobsPerDay - dayJobs.length)
}

export function getProTotalEarningsForDay(jobs: ProJob[], date: Date): number {
  return jobs
    .filter(j => {
      const jobDate = new Date(typeof j.createdAt === 'string' ? j.createdAt : j.createdAt)
      return jobDate.toDateString() === date.toDateString() && j.status === 'completed'
    })
    .reduce((sum, j) => sum + j.earnings, 0)
}

// Filtering
export function filterAvailableOrders(orders: AvailableOrder[], maxDistance: number = 15): AvailableOrder[] {
  return orders.filter(o => o.distance <= maxDistance)
}

export function sortJobsByEarnings(jobs: ProJob[]): ProJob[] {
  return [...jobs].sort((a, b) => b.earnings - a.earnings)
}

export function sortJobsByDistance(jobs: ProJob[]): ProJob[] {
  // Dummy sort - in production, calculate actual distance
  return jobs
}

export function sortJobsByTime(jobs: ProJob[]): ProJob[] {
  return [...jobs].sort((a, b) => {
    const timeA = new Date(typeof a.pickupTime === 'string' ? a.pickupTime : a.pickupTime).getTime()
    const timeB = new Date(typeof b.pickupTime === 'string' ? b.pickupTime : b.pickupTime).getTime()
    return timeA - timeB
  })
}
