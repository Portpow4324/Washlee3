import { Timestamp } from 'firebase/firestore'

export interface OrderItem {
  type: string
  quantity: number
  instructions?: string
}

export interface OrderPricing {
  subtotal: number
  tax: number
  total: number
  discount?: number
}

export interface OrderAddress {
  street: string
  city: string
  state: string
  postcode: string
  coordinates?: { lat: number; lng: number }
}

export interface OrderContact {
  name: string
  phone: string
  email: string
}

export interface AssignedPro {
  id: string
  name: string
  phone: string
  rating: number
}

export interface OrderFeedback {
  rating?: number
  review?: string
  photos?: string[]
}

export interface Order {
  id: string
  customerId: string
  proId?: string
  status: 'pending' | 'accepted' | 'collecting' | 'washing' | 'delivering' | 'completed' | 'cancelled'
  items: OrderItem[]
  pickupDate: Timestamp | Date
  estimatedDelivery: Timestamp | Date
  actualDelivery?: Timestamp | Date
  pricing: OrderPricing
  specialInstructions?: string
  address: OrderAddress
  contact: OrderContact
  assignedPro?: AssignedPro
  paymentId?: string
  feedback?: OrderFeedback
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  cancellationReason?: string
  cancelledAt?: Timestamp | Date
}

// Order status labels
export const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Awaiting Pro',
  accepted: 'Pro Accepted',
  collecting: 'Collecting Laundry',
  washing: 'Washing',
  delivering: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

// Order status colors
export const ORDER_STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  collecting: 'bg-indigo-100 text-indigo-800',
  washing: 'bg-purple-100 text-purple-800',
  delivering: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

// Format order for display
export function formatOrder(order: Order): Omit<Order, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
} {
  return {
    ...order,
    createdAt: order.createdAt instanceof Timestamp
      ? order.createdAt.toDate().toLocaleDateString()
      : new Date(order.createdAt).toLocaleDateString(),
    updatedAt: order.updatedAt instanceof Timestamp
      ? order.updatedAt.toDate().toLocaleDateString()
      : new Date(order.updatedAt).toLocaleDateString()
  }
}

// Calculate estimated delivery (e.g., 48 hours from pickup)
export function calculateEstimatedDelivery(pickupDate: Date | Timestamp): Date {
  const pickup = pickupDate instanceof Timestamp ? pickupDate.toDate() : new Date(pickupDate)
  const delivery = new Date(pickup)
  delivery.setHours(delivery.getHours() + 48)
  return delivery
}

// Calculate tax (10% in Australia)
export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * 0.1 * 100) / 100
}

// Calculate order total
export function calculateOrderTotal(
  subtotal: number,
  discount: number = 0
): OrderPricing {
  const discountedSubtotal = subtotal - discount
  const tax = calculateTax(discountedSubtotal)
  return {
    subtotal,
    tax,
    total: discountedSubtotal + tax,
    discount: discount > 0 ? discount : undefined
  }
}

// Validate order data
export function validateOrder(order: Partial<Order>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!order.customerId) errors.push('Customer ID required')
  if (!order.items || order.items.length === 0) errors.push('Order must have at least one item')
  if (!order.address?.street) errors.push('Address street required')
  if (!order.address?.city) errors.push('Address city required')
  if (!order.address?.postcode) errors.push('Address postcode required')
  if (!order.contact?.name) errors.push('Contact name required')
  if (!order.contact?.phone) errors.push('Contact phone required')
  if (!order.contact?.email) errors.push('Contact email required')
  if (!order.pricing?.total || order.pricing.total <= 0) errors.push('Valid pricing required')

  return {
    valid: errors.length === 0,
    errors
  }
}

// Get order status badge emoji
export function getStatusEmoji(status: Order['status']): string {
  const emojis: Record<Order['status'], string> = {
    pending: '⏳',
    accepted: '✅',
    collecting: '📦',
    washing: '🧼',
    delivering: '🚗',
    completed: '✔️',
    cancelled: '❌'
  }
  return emojis[status]
}

// Calculate days until delivery
export function daysUntilDelivery(estimatedDelivery: Date | Timestamp): number {
  const delivery = estimatedDelivery instanceof Timestamp
    ? estimatedDelivery.toDate()
    : new Date(estimatedDelivery)
  const now = new Date()
  const diff = delivery.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Check if order can be cancelled (before collection)
export function canBeCancelled(status: Order['status']): boolean {
  return ['pending', 'accepted'].includes(status)
}

// Check if order can be reviewed (after completion)
export function canBeReviewed(status: Order['status']): boolean {
  return status === 'completed'
}

// Format pricing for display
export function formatPricing(pricing: OrderPricing): string {
  return `$${pricing.total.toFixed(2)}`
}

// Generate order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `ORD-${random}${timestamp}`
}
