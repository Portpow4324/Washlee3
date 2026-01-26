import { Timestamp } from 'firebase/firestore'

export type EmailSequenceType =
  | 'welcome'
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'review_request'
  | 'pro_application_status'
  | 'pro_order_assigned'
  | 'payment_reminder'
  | 'loyalty_milestone'
  | 'promotional'
  | 'reengagement'

export type EmailPreference =
  | 'marketing'
  | 'order_updates'
  | 'account_notifications'
  | 'promotions'
  | 'weekly_digest'

export interface EmailSequence {
  id: string
  type: EmailSequenceType
  name: string
  description: string
  subject: string
  template: string
  delayHours?: number
  active: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
  category: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface EmailLog {
  id: string
  customerId: string
  email: string
  type: EmailSequenceType
  subject: string
  status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked'
  sentAt: Timestamp
  openedAt?: Timestamp
  clickedAt?: Timestamp
  errorMessage?: string
}

export interface EmailPreferences {
  customerId: string
  email: string
  preferences: Record<EmailPreference, boolean>
  unsubscribed: boolean
  unsubscribedAt?: Timestamp
  updatedAt: Timestamp
}

// Email sequence definitions
export const EMAIL_SEQUENCES: Record<EmailSequenceType, EmailSequence> = {
  welcome: {
    id: 'seq_welcome',
    type: 'welcome',
    name: 'Welcome to Washlee',
    description: 'Sent when new customer signs up',
    subject: 'Welcome to Washlee! {{firstName}}',
    template: 'welcome',
    delayHours: 0,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  order_confirmation: {
    id: 'seq_order_conf',
    type: 'order_confirmation',
    name: 'Order Confirmation',
    description: 'Sent when order is placed',
    subject: 'Order Confirmation #{{orderId}}',
    template: 'order_confirmation',
    delayHours: 0,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  order_shipped: {
    id: 'seq_order_shipped',
    type: 'order_shipped',
    name: 'Order Shipped',
    description: 'Sent when order is picked up',
    subject: 'Your order is on the way!',
    template: 'order_shipped',
    delayHours: 0,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  order_delivered: {
    id: 'seq_order_delivered',
    type: 'order_delivered',
    name: 'Order Delivered',
    description: 'Sent when order is delivered',
    subject: 'Your order has been delivered',
    template: 'order_delivered',
    delayHours: 0,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  review_request: {
    id: 'seq_review_req',
    type: 'review_request',
    name: 'Review Request',
    description: 'Request review after delivery',
    subject: 'How was your Washlee experience?',
    template: 'review_request',
    delayHours: 48,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  pro_application_status: {
    id: 'seq_pro_app_status',
    type: 'pro_application_status',
    name: 'Pro Application Status',
    description: 'Sent when pro application status changes',
    subject: 'Your Washlee Pro Application - {{status}}',
    template: 'pro_application_status',
    delayHours: 0,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  pro_order_assigned: {
    id: 'seq_pro_order_assigned',
    type: 'pro_order_assigned',
    name: 'Pro Order Assigned',
    description: 'Sent when new order is assigned to pro',
    subject: 'New order assigned: #{{orderId}}',
    template: 'pro_order_assigned',
    delayHours: 0,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  payment_reminder: {
    id: 'seq_payment_reminder',
    type: 'payment_reminder',
    name: 'Payment Reminder',
    description: 'Payment failure reminder',
    subject: 'Your payment needs attention',
    template: 'payment_reminder',
    delayHours: 24,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  loyalty_milestone: {
    id: 'seq_loyalty_milestone',
    type: 'loyalty_milestone',
    name: 'Loyalty Milestone',
    description: 'When customer reaches loyalty milestone',
    subject: 'You\'ve reached {{milestone}} points!',
    template: 'loyalty_milestone',
    delayHours: 0,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  promotional: {
    id: 'seq_promotional',
    type: 'promotional',
    name: 'Promotional Email',
    description: 'Marketing and promotional campaigns',
    subject: '{{promoTitle}}',
    template: 'promotional',
    delayHours: 0,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  reengagement: {
    id: 'seq_reengagement',
    type: 'reengagement',
    name: 'Reengagement Campaign',
    description: 'Sent to inactive users',
    subject: 'We miss you! Come back to Washlee',
    template: 'reengagement',
    delayHours: 0,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
}

// Default email preferences (what users get by default)
export const DEFAULT_PREFERENCES: Record<EmailPreference, boolean> = {
  marketing: true,
  order_updates: true,
  account_notifications: true,
  promotions: true,
  weekly_digest: false
}

/**
 * Get HTML template for email
 */
export function getEmailTemplate(type: EmailSequenceType, variables: Record<string, string>): string {
  const templates: Record<EmailSequenceType, string> = {
    welcome: `
      <h1>Welcome to Washlee, {{firstName}}!</h1>
      <p>We're excited to have you join our laundry service community.</p>
      <p>Here's what you can do next:</p>
      <ul>
        <li>Book your first order and get {{firstOrderDiscount}}% off</li>
        <li>Join our WASH Club loyalty program</li>
        <li>Refer a friend and earn points</li>
      </ul>
      <a href="{{bookingLink}}">Book Your First Order</a>
    `,
    order_confirmation: `
      <h1>Order Confirmed!</h1>
      <p>Thank you for your order #{{orderId}}</p>
      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Pickup: {{pickupDate}}</li>
        <li>Estimated Delivery: {{estimatedDelivery}}</li>
        <li>Total: {{totalPrice}}</li>
      </ul>
      <a href="{{trackingLink}}">Track Your Order</a>
    `,
    order_shipped: `
      <h1>Your Order is On The Way!</h1>
      <p>Order #{{orderId}} has been picked up by {{proName}}</p>
      <p>Expected delivery: {{estimatedDelivery}}</p>
      <a href="{{trackingLink}}">Live Tracking</a>
    `,
    order_delivered: `
      <h1>Order Delivered!</h1>
      <p>Your order #{{orderId}} has been delivered.</p>
      <p>Your pro {{proName}} left your items at {{deliveryLocation}}</p>
      <a href="{{reviewLink}}">Leave a Review</a>
    `,
    review_request: `
      <h1>How was your experience?</h1>
      <p>We'd love to hear about your recent order.</p>
      <a href="{{reviewLink}}">Leave a Review</a>
    `,
    pro_application_status: `
      <h1>Application Status Update</h1>
      <p>Your Washlee Pro application status: <strong>{{status}}</strong></p>
      <a href="{{applicationLink}}">View Details</a>
    `,
    pro_order_assigned: `
      <h1>New Order Assigned!</h1>
      <p>You have a new order: #{{orderId}}</p>
      <p>Pickup: {{pickupTime}}</p>
      <p>Customer: {{customerName}}</p>
      <a href="{{orderLink}}">View Order Details</a>
    `,
    payment_reminder: `
      <h1>Payment Needs Attention</h1>
      <p>Your payment for order #{{orderId}} couldn't be processed.</p>
      <a href="{{paymentLink}}">Update Payment Method</a>
    `,
    loyalty_milestone: `
      <h1>Milestone Reached!</h1>
      <p>Congratulations! You've reached {{milestone}} points!</p>
      <p>Your tier is now: {{tier}}</p>
      <a href="{{loyaltyLink}}">Redeem Rewards</a>
    `,
    promotional: `
      <h1>{{promoTitle}}</h1>
      <p>{{promoDescription}}</p>
      <a href="{{promoLink}}">{{promoButtonText}}</a>
    `,
    reengagement: `
      <h1>We Miss You!</h1>
      <p>It's been a while since your last order.</p>
      <p>Come back and use code COMEBACK10 for 10% off your next order.</p>
      <a href="{{bookingLink}}">Book Now</a>
    `
  }

  let template = templates[type]

  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    template = template.replace(`{{${key}}}`, value)
  })

  return template
}

/**
 * Check if user should receive email type
 */
export function shouldSendEmail(preferences: EmailPreferences, emailType: EmailSequenceType): boolean {
  if (preferences.unsubscribed) return false

  const typeToPreference: Record<EmailSequenceType, EmailPreference | null> = {
    welcome: 'account_notifications',
    order_confirmation: 'order_updates',
    order_shipped: 'order_updates',
    order_delivered: 'order_updates',
    review_request: 'order_updates',
    pro_application_status: 'account_notifications',
    pro_order_assigned: 'order_updates',
    payment_reminder: 'account_notifications',
    loyalty_milestone: 'marketing',
    promotional: 'promotions',
    reengagement: 'marketing'
  }

  const preference = typeToPreference[emailType]
  return preference ? preferences.preferences[preference] : true
}

/**
 * Calculate send time for scheduled emails
 */
export function calculateSendTime(delayHours: number, createdAt?: Timestamp): Date {
  const now = createdAt?.toDate() || new Date()
  const sendTime = new Date(now)
  sendTime.setHours(sendTime.getHours() + delayHours)
  return sendTime
}

/**
 * Format email for display
 */
export function formatEmailLog(log: EmailLog): {
  subject: string
  status: string
  sentDate: string
  opened: boolean
} {
  return {
    subject: log.subject,
    status: log.status,
    sentDate: new Date(log.sentAt.toDate()).toLocaleDateString(),
    opened: log.status === 'opened'
  }
}

/**
 * Get email preference label
 */
export function getPreferenceLabel(pref: EmailPreference): string {
  const labels: Record<EmailPreference, string> = {
    marketing: 'Marketing & Promotions',
    order_updates: 'Order Updates',
    account_notifications: 'Account Notifications',
    promotions: 'Special Offers',
    weekly_digest: 'Weekly Digest'
  }
  return labels[pref]
}
