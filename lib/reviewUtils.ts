import { Timestamp } from 'firebase/firestore'

export interface ReviewRatings {
  speed: number
  quality: number
  professionalism: number
}

export interface Review {
  id: string
  orderId: string
  customerId: string
  proId: string
  rating: number
  text?: string
  photos?: string[]
  categoryRatings: ReviewRatings
  verifiedPurchase: boolean
  helpfulVotes: number
  createdAt: Timestamp | Date
  status: 'pending' | 'approved' | 'rejected'
}

export const REVIEW_STATUS_LABELS: Record<Review['status'], string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected'
}

export function validateReview(review: Partial<Review>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!review.orderId) errors.push('Order ID required')
  if (!review.customerId) errors.push('Customer ID required')
  if (!review.proId) errors.push('Pro ID required')
  if (!review.rating || review.rating < 1 || review.rating > 5) {
    errors.push('Rating must be between 1 and 5')
  }
  if (!review.categoryRatings?.speed || review.categoryRatings.speed < 1 || review.categoryRatings.speed > 5) {
    errors.push('Speed rating must be between 1 and 5')
  }
  if (!review.categoryRatings?.quality || review.categoryRatings.quality < 1 || review.categoryRatings.quality > 5) {
    errors.push('Quality rating must be between 1 and 5')
  }
  if (!review.categoryRatings?.professionalism || review.categoryRatings.professionalism < 1 || review.categoryRatings.professionalism > 5) {
    errors.push('Professionalism rating must be between 1 and 5')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function getStarDisplay(rating: number): string {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  let stars = '★'.repeat(fullStars)
  if (hasHalfStar) stars += '☆'
  stars += '☆'.repeat(5 - Math.ceil(rating))
  return stars
}

export function calculateProRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

export function isAppropriateFlagword(text: string): boolean {
  const flagwords = ['scam', 'fake', 'stolen', 'fraud', 'harass', 'abuse', 'threat']
  return flagwords.some(word => text.toLowerCase().includes(word))
}

export function isSpam(text: string): boolean {
  const urlPattern = /https?:\/\/\S+/g
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  
  return (text.match(urlPattern) || []).length > 2 || 
         (text.match(emailPattern) || []).length > 1 ||
         text.split(' ').length < 3
}
