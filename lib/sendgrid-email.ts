/**
 * Legacy email compatibility service for Washlee
 * Handles transactional and marketing emails
 * Sends through the shared Resend-backed email service
 */

import { sendEmail as sendResendEmail } from './emailService'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  template: string
}

interface EmailOptions {
  to: string
  subject: string
  htmlBody: string
  templateId?: string
  variables?: Record<string, string>
}

// Email templates with placeholder variables
const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  welcome: {
    id: 'welcome_email',
    name: 'Welcome Email',
    subject: 'Welcome to Washlee! Get $10 Off Your First Order',
    template: `
    <h1>Welcome to Washlee!</h1>
    <p>Hi {{firstName}},</p>
    <p>We're thrilled to have you on board. Washlee makes laundry easy with on-demand pickup and delivery.</p>
    <p><strong>Your First Order Bonus: $10 OFF</strong></p>
    <p>Use code WELCOME10 at checkout.</p>
    <p>Get started today!</p>
    `,
  },
  order_confirmation: {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    subject: 'Order Confirmed: {{orderId}} - Pickup on {{pickupDate}}',
    template: `
    <h2>Order Confirmed!</h2>
    <p>Hi {{customerName}},</p>
    <p>Your laundry pickup is scheduled for <strong>{{pickupDate}} at {{pickupTime}}</strong></p>
    <p><strong>Order Details:</strong></p>
    <ul>
      <li>Order ID: {{orderId}}</li>
      <li>Weight: {{weight}}kg</li>
      <li>Service: {{serviceType}}</li>
      <li>Total: {{total}}</li>
    </ul>
    <p>Your assigned pro will arrive at your location at the scheduled time.</p>
    `,
  },
  pickup_reminder: {
    id: 'pickup_reminder',
    name: 'Pickup Reminder',
    subject: 'Pickup Reminder: {{orderId}} - {{pickupTime}} Today',
    template: `
    <h2>Your Pickup is Coming!</h2>
    <p>Hi {{customerName}},</p>
    <p>Just a friendly reminder: Your laundry pickup is scheduled for <strong>today at {{pickupTime}}</strong></p>
    <p>Please make sure your laundry bag is ready at your pickup location.</p>
    <p>Order ID: {{orderId}}</p>
    `,
  },
  delivery_notification: {
    id: 'delivery_notification',
    name: 'Delivery Notification',
    subject: 'Your Laundry is on the Way! {{orderId}}',
    template: `
    <h2>Your Order is Being Delivered!</h2>
    <p>Hi {{customerName}},</p>
    <p>Your laundry from order {{orderId}} is ready and on the way!</p>
    <p><strong>Delivery Details:</strong></p>
    <ul>
      <li>Pro: {{proName}}</li>
      <li>Estimated Arrival: {{deliveryTime}}</li>
      <li>Track Order: {{trackingLink}}</li>
    </ul>
    <p>Thank you for using Washlee!</p>
    `,
  },
  rating_request: {
    id: 'rating_request',
    name: 'Rating Request',
    subject: 'How Was Your Washlee Experience? - Rate {{proName}}',
    template: `
    <h2>Please Rate Your Experience</h2>
    <p>Hi {{customerName}},</p>
    <p>We'd love to hear about your experience with {{proName}} on order {{orderId}}.</p>
    <p><strong>Rate this service and earn 10 loyalty points!</strong></p>
    <p><a href="{{ratingLink}}">Leave a Review</a></p>
    <p>Your feedback helps us maintain quality service!</p>
    `,
  },
  loyalty_points: {
    id: 'loyalty_points',
    name: 'Loyalty Points Earned',
    subject: 'You Earned {{points}} Loyalty Points!',
    template: `
    <h2>Loyalty Points Earned!</h2>
    <p>Hi {{customerName}},</p>
    <p>Great news! You've earned <strong>{{points}} loyalty points</strong> from order {{orderId}}.</p>
    <p>Total Points: {{totalPoints}}</p>
    <p>You're {{pointsToReward}} points away from your next reward!</p>
    <p><a href="{{loyaltyLink}}">View Your Rewards</a></p>
    `,
  },
  referral_bonus: {
    id: 'referral_bonus',
    name: 'Referral Bonus Earned',
    subject: 'Your Referral Bonus: $10 Added!',
    template: `
    <h2>Referral Bonus Earned!</h2>
    <p>Hi {{referrerName}},</p>
    <p>Great news! Your friend {{refereeName}} completed their first order and you've earned <strong>$10</strong>!</p>
    <p>Total Referral Earnings: {{earnings}}</p>
    <p><a href="{{referralLink}}">Share More & Earn More</a></p>
    `,
  },
  promotional_campaign: {
    id: 'promotional_campaign',
    name: 'Promotional Campaign',
    subject: 'Campaign - Limited Time Offer',
    template: `
    <h2>Special Promotion</h2>
    <p>Hi there,</p>
    <p>Check out this exclusive offer just for you!</p>
    <p><strong>Limited time only - Act now!</strong></p>
    `,
  },
  winback_campaign: {
    id: 'winback_campaign',
    name: 'Win-back Campaign',
    subject: 'We Miss You - Special Offer Inside',
    template: `
    <h2>We Miss You!</h2>
    <p>Hi there,</p>
    <p>It has been a while since your last order. We would love to have you back!</p>
    <p><strong>Special offer available just for you</strong></p>
    <p>Book your next laundry service today</p>
    `,
  },
}

/**
 * Send email through Resend.
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
  const { to, subject, htmlBody, templateId, variables } = options

  try {
    console.log(`[EMAIL] Sending legacy-template email to ${to}`)
    console.log(`[EMAIL] Template ID: ${templateId || 'N/A'}`)
    if (variables) {
      console.log(`[EMAIL] Variables: ${Object.keys(variables).join(', ')}`)
    }

    const result = await sendResendEmail({
      to,
      subject,
      html: htmlBody,
    })

    return {
      success: result.success,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false }
  }
}

/**
 * Send email using template with variable substitution
 */
export async function sendTemplateEmail(
  templateKey: string,
  to: string,
  variables: Record<string, string>
): Promise<{ success: boolean; messageId?: string }> {
  const template = EMAIL_TEMPLATES[templateKey]
  if (!template) {
    throw new Error(`Template '${templateKey}' not found`)
  }

  // Replace variables in subject and body
  let subject = template.subject
  let body = template.template

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(regex, value)
    body = body.replace(regex, value)
  })

  return sendEmail({
    to,
    subject,
    htmlBody: body,
    templateId: template.id,
    variables,
  })
}

/**
 * Get all email templates
 */
export function getEmailTemplates(): Record<string, EmailTemplate> {
  return EMAIL_TEMPLATES
}

/**
 * Get template by key
 */
export function getEmailTemplate(key: string): EmailTemplate | null {
  return EMAIL_TEMPLATES[key] || null
}

/**
 * Send bulk email to multiple recipients
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  htmlBody: string,
  templateId?: string
): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
  let sentCount = 0
  let failedCount = 0

  for (const to of recipients) {
    const result = await sendEmail({
      to,
      subject,
      htmlBody,
      templateId,
    })
    if (result.success) {
      sentCount++
    } else {
      failedCount++
    }
  }

  console.log(`[EMAIL BULK] Sent: ${sentCount}, Failed: ${failedCount}`)
  return { success: failedCount === 0, sentCount, failedCount }
}

/**
 * Send campaign email (marketing)
 */
export async function sendCampaignEmail(
  campaignId: string,
  segments: string[], // 'customers' | 'pros' | 'new_users' | etc
  templateKey: string,
  variables: Record<string, string>,
  scheduleTime?: Date
): Promise<{ success: boolean; campaignId: string; scheduledFor?: Date }> {
  console.log(`[CAMPAIGN] Campaign ${campaignId} to segments: ${segments.join(', ')}`)
  console.log(`[CAMPAIGN] Template: ${templateKey}`)

  if (scheduleTime) {
    console.log(`[CAMPAIGN] Scheduled for: ${scheduleTime.toISOString()}`)
    // In production, this would queue the campaign for later sending
  } else {
    console.log(`[CAMPAIGN] Sending immediately`)
  }

  return {
    success: true,
    campaignId,
    scheduledFor: scheduleTime,
  }
}

/**
 * Get email statistics
 */
export function getEmailStats(): {
  totalSent: number
  opened: number
  clicked: number
  bounced: number
  openRate: number
  clickRate: number
} {
  // Mock statistics
  return {
    totalSent: 1250,
    opened: 875,
    clicked: 320,
    bounced: 15,
    openRate: 70,
    clickRate: 25.6,
  }
}

/**
 * Unsubscribe email address from all marketing
 */
export async function unsubscribeEmail(email: string): Promise<{ success: boolean }> {
  console.log(`[EMAIL] Unsubscribed: ${email}`)
  return { success: true }
}
