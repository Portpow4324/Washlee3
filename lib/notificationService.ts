import { Timestamp } from 'firebase/firestore'

export type NotificationType = 'email' | 'sms' | 'push' | 'in-app'
export type NotificationEvent =
  | 'order_confirmed'
  | 'pro_assigned'
  | 'order_pickup'
  | 'order_washing'
  | 'order_delivery'
  | 'order_completed'
  | 'order_cancelled'
  | 'review_requested'
  | 'pro_verified'
  | 'earnings_ready'
  | 'support_response'
  | 'promotional'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  event: NotificationEvent
  title: string
  message: string
  data?: Record<string, any> // Order ID, Pro ID, etc.
  read: boolean
  createdAt: Timestamp
  readAt?: Timestamp
}

export interface NotificationPreference {
  id: string
  userId: string
  // Email preferences
  emailOrderUpdates: boolean
  emailPromos: boolean
  emailSupport: boolean
  emailWeeklySummary: boolean
  // SMS preferences
  smsOrderUpdates: boolean
  smsPickup: boolean
  smsDelivery: boolean
  smsPromos: boolean
  // Push preferences
  pushOrderUpdates: boolean
  pushPromos: boolean
  pushMessages: boolean
  // Time preferences
  quietHoursStart: string // HH:mm format
  quietHoursEnd: string
  timezone: string
  updatedAt: Timestamp
}

export const defaultNotificationPreferences: Omit<NotificationPreference, 'id' | 'userId' | 'updatedAt'> = {
  emailOrderUpdates: true,
  emailPromos: false,
  emailSupport: true,
  emailWeeklySummary: true,
  smsOrderUpdates: true,
  smsPickup: true,
  smsDelivery: true,
  smsPromos: false,
  pushOrderUpdates: true,
  pushPromos: false,
  pushMessages: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  timezone: 'Australia/Sydney',
}

// Email templates
export const emailTemplates: Record<NotificationEvent, { subject: string; template: string }> = {
  order_confirmed: {
    subject: 'Order Confirmed - Washlee',
    template: `
      <h2>Your order has been confirmed!</h2>
      <p>Order ID: {{orderId}}</p>
      <p>Pickup scheduled: {{pickupDate}}</p>
      <p>Expected delivery: {{deliveryDate}}</p>
      <p>We'll notify you when a Washlee Pro accepts your order.</p>
    `,
  },
  pro_assigned: {
    subject: 'Your Washlee Pro Has Been Assigned',
    template: `
      <h2>Great news! Your pro is {{proName}}</h2>
      <p>Rating: {{proRating}}/5 ⭐</p>
      <p>Contact: {{proPhone}}</p>
      <p>Pickup time: {{pickupTime}}</p>
      <a href="{{trackingLink}}">Track your order</a>
    `,
  },
  order_pickup: {
    subject: 'Your Laundry is Being Picked Up',
    template: `
      <h2>Pickup in progress</h2>
      <p>Your Washlee Pro {{proName}} is on the way to pick up your laundry.</p>
      <p>Estimated arrival: {{eta}}</p>
      <a href="{{trackingLink}}">Live tracking</a>
    `,
  },
  order_washing: {
    subject: 'Your Laundry is Being Washed',
    template: `
      <h2>Washing in progress</h2>
      <p>Your clothes are being professionally cleaned with care.</p>
      <p>Expected completion: {{completionTime}}</p>
    `,
  },
  order_delivery: {
    subject: 'Your Laundry is Out for Delivery',
    template: `
      <h2>Your order is on the way!</h2>
      <p>{{proName}} is delivering your clean laundry.</p>
      <p>Expected delivery: {{eta}}</p>
      <a href="{{trackingLink}}">Live tracking</a>
    `,
  },
  order_completed: {
    subject: 'Your Order is Complete',
    template: `
      <h2>Order delivered successfully!</h2>
      <p>Thank you for using Washlee.</p>
      <p>We'd love your feedback! {{reviewLink}}</p>
      <p>Total cost: {{amount}}</p>
    `,
  },
  order_cancelled: {
    subject: 'Order Cancelled',
    template: `
      <h2>Your order has been cancelled</h2>
      <p>Order ID: {{orderId}}</p>
      <p>If you have questions, please contact support.</p>
    `,
  },
  review_requested: {
    subject: 'Share Your Experience with {{proName}}',
    template: `
      <h2>We'd love your feedback!</h2>
      <p>Rate {{proName}} and help other customers find great pros.</p>
      <p>Bonus: Earn 10 loyalty points for leaving a review!</p>
      <a href="{{reviewLink}}">Leave a review</a>
    `,
  },
  pro_verified: {
    subject: 'Congratulations! Your Profile is Verified',
    template: `
      <h2>You're now a verified Washlee Pro! 🎉</h2>
      <p>Your background check passed. You can now accept orders.</p>
      <p>Start earning: {{dashboardLink}}</p>
    `,
  },
  earnings_ready: {
    subject: 'Your Earnings Are Ready to Withdraw',
    template: `
      <h2>Payout available!</h2>
      <p>You have {{amount}} ready to withdraw.</p>
      <p>Payout method: {{paymentMethod}}</p>
      <a href="{{payoutLink}}">Request payout</a>
    `,
  },
  support_response: {
    subject: 'Support Response to Your Ticket #{{ticketId}}',
    template: `
      <h2>We've responded to your support ticket</h2>
      <p>{{message}}</p>
      <a href="{{ticketLink}}">View ticket</a>
    `,
  },
  promotional: {
    subject: '{{subject}}',
    template: `
      <h2>{{title}}</h2>
      <p>{{message}}</p>
      <a href="{{ctaLink}}">{{ctaText}}</a>
    `,
  },
}

// SMS templates
export const smsTemplates: Record<NotificationEvent, string> = {
  order_confirmed:
    'Washlee: Order confirmed! Pickup: {{pickupDate}}. Delivery: {{deliveryDate}}. {{trackingLink}}',
  pro_assigned: 'Washlee: {{proName}} (⭐{{proRating}}) is your pro! Pickup {{pickupTime}}. {{trackingLink}}',
  order_pickup: 'Washlee: {{proName}} is picking up your laundry. ETA {{eta}}. {{trackingLink}}',
  order_washing: 'Washlee: Your clothes are being cleaned. Ready {{completionTime}}.',
  order_delivery: 'Washlee: {{proName}} is delivering your laundry. ETA {{eta}}. {{trackingLink}}',
  order_completed: 'Washlee: Order complete! Cost ${{amount}}. Review {{proName}}: {{reviewLink}}',
  order_cancelled: 'Washlee: Order {{orderId}} cancelled. Need help? Support: {{supportLink}}',
  review_requested: 'Washlee: Review {{proName}} and earn 10 loyalty points! {{reviewLink}}',
  pro_verified: 'Washlee: You\'re verified! Start accepting orders: {{dashboardLink}}',
  earnings_ready: 'Washlee: ${{amount}} ready to withdraw. {{payoutLink}}',
  support_response: 'Washlee: Support responded to ticket #{{ticketId}}. {{ticketLink}}',
  promotional: '{{message}} {{ctaLink}}',
}

// Validation
export function validateNotificationPreference(pref: Partial<NotificationPreference>) {
  if (pref.quietHoursStart && !/^\d{2}:\d{2}$/.test(pref.quietHoursStart)) {
    return { isValid: false, error: 'Invalid quiet hours start time' }
  }
  if (pref.quietHoursEnd && !/^\d{2}:\d{2}$/.test(pref.quietHoursEnd)) {
    return { isValid: false, error: 'Invalid quiet hours end time' }
  }
  return { isValid: true }
}

export function isInQuietHours(preferences: NotificationPreference): boolean {
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const start = preferences.quietHoursStart
  const end = preferences.quietHoursEnd

  if (start < end) {
    return currentTime >= start && currentTime < end
  } else {
    // Quiet hours span midnight
    return currentTime >= start || currentTime < end
  }
}

export function shouldSendNotification(
  event: NotificationEvent,
  type: NotificationType,
  preferences: NotificationPreference
): boolean {
  // Check quiet hours for time-sensitive notifications
  if (['order_pickup', 'order_delivery'].includes(event) && isInQuietHours(preferences)) {
    return false
  }

  // Check type-specific preferences
  switch (type) {
    case 'email':
      if (event === 'order_confirmed' || event === 'pro_assigned') return preferences.emailOrderUpdates
      if (event.includes('promo')) return preferences.emailPromos
      if (event === 'support_response') return preferences.emailSupport
      return preferences.emailOrderUpdates
    case 'sms':
      if (event === 'order_pickup') return preferences.smsPickup
      if (event === 'order_delivery') return preferences.smsDelivery
      if (event.includes('promo')) return preferences.smsPromos
      if (event.includes('order')) return preferences.smsOrderUpdates
      return false
    case 'push':
      if (event.includes('promo')) return preferences.pushPromos
      if (event.includes('order')) return preferences.pushOrderUpdates
      if (event === 'support_response') return preferences.pushMessages
      return false
    case 'in-app':
      return true // Always send in-app
    default:
      return true
  }
}

export function getNotificationTitle(event: NotificationEvent): string {
  const titles: Record<NotificationEvent, string> = {
    order_confirmed: 'Order Confirmed',
    pro_assigned: 'Pro Assigned',
    order_pickup: 'Pickup in Progress',
    order_washing: 'Washing in Progress',
    order_delivery: 'Out for Delivery',
    order_completed: 'Order Complete',
    order_cancelled: 'Order Cancelled',
    review_requested: 'Share Your Experience',
    pro_verified: 'Profile Verified',
    earnings_ready: 'Earnings Ready',
    support_response: 'Support Response',
    promotional: 'Special Offer',
  }
  return titles[event] || 'Notification'
}
