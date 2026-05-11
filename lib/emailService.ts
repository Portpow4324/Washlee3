/**
 * Unified Email Service for Washlee
 * ====================================
 * Uses Resend for email sending
 * 
 * Configuration:
 * - RESEND_API_KEY: Your Resend API key
 * - RESEND_FROM_EMAIL: Email to send from via Resend.
 *   Defaults to onboarding@resend.dev for testing until a domain is verified.
 * - RESEND_REPLY_TO_EMAIL: Optional reply-to address
 */

import { Resend } from 'resend'

interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

// Email templates - all message types needed for Washlee
export const EMAIL_TEMPLATES = {
  // ===== CUSTOMER EMAILS =====
  welcome: {
    id: 'welcome',
    name: 'Welcome to Washlee',
    subject: 'Welcome to Washlee! Get $10 Off Your First Order',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Welcome to Washlee!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.firstName},</p>
          <p>We're thrilled to have you on board! Washlee makes laundry easy with on-demand pickup and delivery.</p>
          <div style="background: #E8FFFB; border: 2px solid #48C9B0; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
            <p style="font-size: 12px; color: #6b7b78; margin: 0;">Your First Order Bonus</p>
            <p style="font-size: 20px; font-weight: bold; color: #48C9B0; margin: 10px 0;">$10 OFF</p>
            <p style="font-size: 12px; color: #6b7b78; margin: 0;">Use code <strong>WELCOME10</strong></p>
          </div>
          <p style="text-align: center;"><a href="${vars.bookingLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Book Your First Order</a></p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      </div>
    `
  },

  order_confirmation: {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    subject: 'Order Confirmed #{{orderId}} - Pickup {{pickupDate}}',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Order Confirmed!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.customerName},</p>
          <p>Your laundry pickup is scheduled for <strong>${vars.pickupDate} at ${vars.pickupTime}</strong></p>
          <div style="background: #f7fefe; padding: 20px; margin: 20px 0; border-left: 4px solid #48C9B0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${vars.orderId}</p>
            <p style="margin: 5px 0;"><strong>Weight:</strong> ${vars.weight}kg</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> ${vars.serviceType}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> $${vars.total}</p>
          </div>
          <p>Your assigned pro will arrive at your location at the scheduled time. Please have your laundry bag ready.</p>
          <p style="text-align: center;"><a href="${vars.trackingLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Order</a></p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      </div>
    `
  },

  pickup_reminder: {
    id: 'pickup_reminder',
    name: 'Pickup Reminder',
    subject: 'Reminder: Your pickup is today at {{pickupTime}}',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FFA500; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🕐 Pickup Reminder</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.customerName},</p>
          <p>Just a friendly reminder: Your laundry pickup is scheduled for <strong>today at ${vars.pickupTime}</strong></p>
          <p style="background: #fffacd; padding: 15px; border-radius: 5px; border-left: 4px solid #FFA500;">
            Please make sure your laundry bag is ready at your pickup location.
          </p>
          <p style="font-size: 12px; color: #6b7b78;">Order ID: ${vars.orderId}</p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      </div>
    `
  },

  order_shipped: {
    id: 'order_shipped',
    name: 'Order Picked Up',
    subject: 'Your order {{orderId}} has been picked up!',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">📦 Your Order is Being Washed</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.customerName},</p>
          <p>Great news! Your order #${vars.orderId} has been picked up by <strong>${vars.proName}</strong>.</p>
          <div style="background: #f7fefe; padding: 20px; margin: 20px 0; border-left: 4px solid #48C9B0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${vars.orderId}</p>
            <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${vars.estimatedDelivery}</p>
          </div>
          <p style="text-align: center;"><a href="${vars.trackingLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Order</a></p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      </div>
    `
  },

  delivery_notification: {
    id: 'delivery_notification',
    name: 'Order Delivered',
    subject: 'Your laundry is being delivered - Order {{orderId}}',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🚗 Your Order is On The Way!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.customerName},</p>
          <p>Your laundry from order #${vars.orderId} is ready and on the way!</p>
          <div style="background: #f7fefe; padding: 20px; margin: 20px 0; border-left: 4px solid #48C9B0;">
            <p style="margin: 5px 0;"><strong>Assigned Pro:</strong> ${vars.proName}</p>
            <p style="margin: 5px 0;"><strong>Estimated Arrival:</strong> ${vars.deliveryTime}</p>
          </div>
          <p style="text-align: center;"><a href="${vars.trackingLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Live Tracking</a></p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">Thank you for using Washlee!</p>
        </div>
      </div>
    `
  },

  rating_request: {
    id: 'rating_request',
    name: 'Rate Your Experience',
    subject: 'How was your Washlee experience?',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">⭐ Rate Your Experience</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.customerName},</p>
          <p>We'd love to hear about your experience with <strong>${vars.proName}</strong> on order #${vars.orderId}.</p>
          <div style="background: #E8FFFB; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
            <p style="font-size: 14px; color: #1f2d2b; margin: 0 0 15px 0;"><strong>Earn 10 Loyalty Points!</strong></p>
            <a href="${vars.ratingLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Leave a Review</a>
          </div>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">Your feedback helps us maintain quality service!</p>
        </div>
      </div>
    `
  },

  // ===== PRO EMAILS =====
  pro_order_assigned: {
    id: 'pro_order_assigned',
    name: 'New Order Assigned',
    subject: 'New Order Assigned: #{{orderId}}',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🎉 New Order Assigned</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.proName},</p>
          <p>You have a new order to accept!</p>
          <div style="background: #f7fefe; padding: 20px; margin: 20px 0; border-left: 4px solid #48C9B0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${vars.orderId}</p>
            <p style="margin: 5px 0;"><strong>Customer:</strong> ${vars.customerName}</p>
            <p style="margin: 5px 0;"><strong>Pickup Time:</strong> ${vars.pickupTime}</p>
            <p style="margin: 5px 0;"><strong>Weight:</strong> ${vars.weight}kg</p>
            <p style="margin: 5px 0;"><strong>Earnings:</strong> $${vars.earnings}</p>
          </div>
          <p style="text-align: center;"><a href="${vars.orderLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Order Details</a></p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">Accept this order to get started!</p>
        </div>
      </div>
    `
  },

  pro_application_approved: {
    id: 'pro_application_approved',
    name: 'Application Approved',
    subject: '🎉 Welcome to Washlee Pro!',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🎉 Welcome to Washlee Pro!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.firstName},</p>
          <p>Congratulations! Your Washlee Pro application has been <strong>APPROVED</strong>.</p>
          <div style="background: #E8FFFB; border: 2px solid #48C9B0; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="font-size: 12px; color: #6b7b78; margin: 0 0 10px 0;">Your Pro ID</p>
            <p style="font-size: 32px; font-weight: bold; color: #48C9B0; margin: 0; font-family: 'Courier New', monospace;">
              ${vars.proId}
            </p>
            <p style="font-size: 12px; color: #6b7b78; margin: 10px 0 0 0;">Use this ID to sign in and start accepting orders</p>
          </div>
          <p><strong>Next Steps:</strong></p>
          <ul style="font-size: 14px; color: #6b7b78; line-height: 1.8;">
            <li>Complete your payment details setup</li>
            <li>Verify your phone number</li>
            <li>Start accepting orders from your dashboard</li>
          </ul>
          <p style="text-align: center;"><a href="${vars.dashboardLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go To Dashboard</a></p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      </div>
    `
  },

  pro_application_rejected: {
    id: 'pro_application_rejected',
    name: 'Application Status Update',
    subject: 'Update on Your Washlee Pro Application',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Application Status Update</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.firstName},</p>
          <p>Thank you for applying to Washlee Pro. After careful review, we're unable to move forward with your application at this time.</p>
          <p style="background: #ffe0e0; padding: 15px; border-radius: 5px; border-left: 4px solid #ff6b6b;">
            <strong>Reason:</strong> ${vars.rejectionReason}
          </p>
          <p>We appreciate your interest and encourage you to reapply in the future. If you have any questions, please don't hesitate to reach out to our team.</p>
          <p style="text-align: center;"><a href="mailto:support@washlee.com.au" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact Support</a></p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      </div>
    `
  },

  // ===== ADMIN/SYSTEM EMAILS =====
  wholesale_inquiry_received: {
    id: 'wholesale_inquiry_received',
    name: 'Wholesale Inquiry - Admin Notification',
    subject: 'New Wholesale Inquiry: {{company}} - {{estimatedWeight}}kg',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🏢 New Wholesale Inquiry</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p style="font-size: 12px; color: #6b7b78; margin: 0 0 15px 0;">⚠️ ACTION REQUIRED: Review and follow up with this inquiry</p>
          <div style="background: #f7fefe; padding: 20px; margin: 20px 0; border-left: 4px solid #48C9B0;">
            <p style="margin: 5px 0;"><strong>Company:</strong> ${vars.company}</p>
            <p style="margin: 5px 0;"><strong>Contact:</strong> ${vars.contactName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${vars.email}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${vars.phone}</p>
            <p style="margin: 5px 0;"><strong>Estimated Weight:</strong> ${vars.estimatedWeight}kg</p>
            <p style="margin: 5px 0;"><strong>Order Type:</strong> ${vars.orderType}</p>
            <p style="margin: 5px 0;"><strong>Frequency:</strong> ${vars.frequency}</p>
            <p style="margin: 5px 0;"><strong>Inquiry ID:</strong> ${vars.inquiryId}</p>
          </div>
          <p><strong>Notes:</strong></p>
          <p style="white-space: pre-wrap; background: #f7fefe; padding: 15px; border-radius: 5px;">${vars.notes || 'No additional notes provided'}</p>
          <p style="text-align: center;"><a href="${vars.adminLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Review in Admin Panel</a></p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      </div>
    `
  },

  wholesale_inquiry_confirmation: {
    id: 'wholesale_inquiry_confirmation',
    name: 'Wholesale Inquiry Received - Customer Confirmation',
    subject: 'We Received Your Wholesale Inquiry - {{company}}',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">✅ Inquiry Received</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.contactName},</p>
          <p>Thank you for submitting your wholesale inquiry. We've received your request for <strong>${vars.estimatedWeight}kg</strong> of laundry services.</p>
          <div style="background: #f7fefe; padding: 20px; margin: 20px 0; border-left: 4px solid #48C9B0;">
            <p style="margin: 5px 0;"><strong>Inquiry ID:</strong> ${vars.inquiryId}</p>
            <p style="margin: 5px 0;"><strong>Company:</strong> ${vars.company}</p>
            <p style="margin: 5px 0;"><strong>Service Type:</strong> ${vars.orderType}</p>
            <p style="margin: 5px 0;"><strong>Frequency:</strong> ${vars.frequency}</p>
          </div>
          <p><strong>What happens next?</strong></p>
          <ol style="font-size: 14px; color: #6b7b78; line-height: 1.8;">
            <li>Our wholesale team will review your inquiry within 24-48 hours</li>
            <li>We'll contact you with a custom quote for your volume</li>
            <li>We'll discuss delivery schedule and special requirements</li>
            <li>Once approved, you can start scheduling pickups</li>
          </ol>
          <p style="background: #fffacd; padding: 15px; border-radius: 5px; border-left: 4px solid #FFA500;">
            Expected response time: <strong>24-48 business hours</strong>
          </p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">If you have questions in the meantime, contact us at lukaverde045@gmail.com</p>
        </div>
      </div>
    `
  },

  payment_failed: {
    id: 'payment_failed',
    name: 'Payment Failed',
    subject: 'Payment Issue: Order {{orderId}}',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">⚠️ Payment Issue</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.customerName},</p>
          <p>We were unable to process your payment for order #${vars.orderId}.</p>
          <div style="background: #ffe0e0; border: 2px solid #ff6b6b; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong>Error:</strong> ${vars.errorMessage}</p>
            <p style="margin: 5px 0;"><strong>Order Total:</strong> $${vars.orderTotal}</p>
          </div>
          <p><strong>Please:</strong></p>
          <ul style="font-size: 14px; color: #6b7b78; line-height: 1.8;">
            <li>Update your payment method</li>
            <li>Ensure your card is not expired or blocked</li>
            <li>Retry payment immediately</li>
          </ul>
          <p style="text-align: center;"><a href="${vars.paymentLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Update Payment</a></p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">Need help? Contact support@washlee.com.au</p>
        </div>
      </div>
    `
  },

  password_reset: {
    id: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset Your Washlee Password',
    template: (vars: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🔐 Password Reset Request</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p>Hi ${vars.firstName},</p>
          <p>We received a request to reset your Washlee password. Click the link below to set a new password.</p>
          <p style="background: #fffacd; padding: 15px; border-radius: 5px; border-left: 4px solid #FFA500; font-size: 12px;">
            This link expires in <strong>24 hours</strong>
          </p>
          <p style="text-align: center; margin: 30px 0;"><a href="${vars.resetLink}" style="background: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a></p>
          <p style="font-size: 14px; color: #6b7b78; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email. Your account remains secure.
          </p>
          <p style="font-size: 12px; color: #6b7b78; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      </div>
    `
  },

  email_confirmation: {
    id: 'email_confirmation',
    name: 'Confirm Your Email',
    subject: 'Confirm Your Email - Welcome to Washlee',
    template: (vars: Record<string, string>) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 600px; margin: 0 auto; background: #f7fefe;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 40px 30px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 15px;">🧺</div>
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Confirm Your Email</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Welcome to Washlee</p>
        </div>
        <div style="background: white; padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">Hi there,</p>
          <p style="margin: 0 0 30px 0; font-size: 16px; color: #6b7b78; line-height: 1.6;">
            Thanks for signing up! To get started with Washlee and book your first laundry order, please confirm your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.confirmLink}" style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Confirm Email Address
            </a>
          </div>

          <p style="margin: 20px 0 0 0; font-size: 13px; color: #999; text-align: center;">
            Or copy and paste this link in your browser:
          </p>
          <p style="margin: 10px 0; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 12px; color: #666; word-break: break-all; font-family: monospace;">
            ${vars.confirmLink}
          </p>

          <div style="background: #E8FFFB; border-left: 4px solid #48C9B0; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #48C9B0;">🎉 Welcome Bonus!</p>
            <p style="margin: 0; font-size: 14px; color: #1f2d2b;">Get <strong>$10 OFF</strong> your first order with code <strong>WELCOME10</strong></p>
          </div>

          <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
            <p style="margin: 0 0 15px 0; font-size: 13px; color: #999;">
              This link expires in <strong>24 hours</strong>. If you didn't create this account, you can safely ignore this email.
            </p>
            <p style="margin: 0; font-size: 11px; color: #bbb;">
              © 2026 Washlee Inc. All rights reserved. | <a href="https://washlee.com/privacy" style="color: #48C9B0; text-decoration: none;">Privacy Policy</a> | <a href="https://washlee.com/terms" style="color: #48C9B0; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </div>
    `
  }
}

/**
 * Main email sending function using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const resendReplyToEmail = process.env.RESEND_REPLY_TO_EMAIL || resendFromEmail

  console.log('[EMAIL] ========================================')
  console.log('[EMAIL] sendEmail called')
  console.log('[EMAIL] To:', options.to)
  console.log('[EMAIL] Subject:', options.subject)
  console.log('[EMAIL] ========================================')

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey)

      console.log('[EMAIL] Sending via Resend from:', resendFromEmail)
      const response = await resend.emails.send({
        from: resendFromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo || resendReplyToEmail,
      })

      if (response.error) {
        console.error('[EMAIL] Resend error:', response.error)
        return {
          success: false,
          error: `Resend failed: ${response.error.message}`,
        }
      } else {
        console.log(`[EMAIL] ✅ Email sent via Resend to ${options.to}`)
        console.log(`[EMAIL] Message ID:`, response.data?.id)
        return {
          success: true,
          messageId: response.data?.id || `resend_${Date.now()}`,
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[EMAIL] Resend exception:', message)
      return {
        success: false,
        error: `Resend failed: ${message}`,
      }
    }
  }

  // No email service configured
  console.error('[EMAIL] ❌ No email service configured!')
  return {
    success: false,
    error: 'Email service not configured. Please set RESEND_API_KEY.',
  }
}

/**
 * Send a templated email with variables
 */
export async function sendTemplateEmail(
  templateKey: keyof typeof EMAIL_TEMPLATES,
  to: string,
  variables: Record<string, string>
): Promise<EmailResponse> {
  const template = EMAIL_TEMPLATES[templateKey]
  if (!template) {
    return {
      success: false,
      error: `Template '${templateKey}' not found`,
    }
  }

  // Build subject with variable substitution
  let subject = template.subject
  Object.entries(variables).forEach(([key, value]) => {
    subject = subject.replace(`{{${key}}}`, value)
  })

  // Build HTML from template function
  const html = template.template(variables)

  return sendEmail({
    to,
    subject,
    html,
  })
}

/**
 * Send welcome email to new customer
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  bookingLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('welcome', email, {
    firstName,
    bookingLink,
  })
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(
  email: string,
  customerName: string,
  orderId: string,
  pickupDate: string,
  pickupTime: string,
  weight: string,
  serviceType: string,
  total: string,
  trackingLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('order_confirmation', email, {
    customerName,
    orderId,
    pickupDate,
    pickupTime,
    weight,
    serviceType,
    total,
    trackingLink,
  })
}

/**
 * Send pickup reminder
 */
export async function sendPickupReminder(
  email: string,
  customerName: string,
  pickupTime: string,
  orderId: string
): Promise<EmailResponse> {
  return sendTemplateEmail('pickup_reminder', email, {
    customerName,
    pickupTime,
    orderId,
  })
}

/**
 * Send order shipped notification
 */
export async function sendOrderShipped(
  email: string,
  customerName: string,
  orderId: string,
  proName: string,
  estimatedDelivery: string,
  trackingLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('order_shipped', email, {
    customerName,
    orderId,
    proName,
    estimatedDelivery,
    trackingLink,
  })
}

/**
 * Send delivery notification
 */
export async function sendDeliveryNotification(
  email: string,
  customerName: string,
  orderId: string,
  proName: string,
  deliveryTime: string,
  trackingLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('delivery_notification', email, {
    customerName,
    orderId,
    proName,
    deliveryTime,
    trackingLink,
  })
}

/**
 * Send rating request after delivery
 */
export async function sendRatingRequest(
  email: string,
  customerName: string,
  proName: string,
  orderId: string,
  ratingLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('rating_request', email, {
    customerName,
    proName,
    orderId,
    ratingLink,
  })
}

/**
 * Send pro order assignment notification
 */
export async function sendProOrderAssignment(
  proEmail: string,
  proName: string,
  orderId: string,
  customerName: string,
  pickupTime: string,
  weight: string,
  earnings: string,
  orderLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('pro_order_assigned', proEmail, {
    proName,
    orderId,
    customerName,
    pickupTime,
    weight,
    earnings,
    orderLink,
  })
}

/**
 * Send pro application approved notification
 */
export async function sendProApplicationApproved(
  email: string,
  firstName: string,
  proId: string,
  dashboardLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('pro_application_approved', email, {
    firstName,
    proId,
    dashboardLink,
  })
}

/**
 * Send pro application rejected notification
 */
export async function sendProApplicationRejected(
  email: string,
  firstName: string,
  rejectionReason: string
): Promise<EmailResponse> {
  return sendTemplateEmail('pro_application_rejected', email, {
    firstName,
    rejectionReason,
  })
}

/**
 * Send wholesale inquiry admin notification
 */
export async function sendWholesaleInquiryAdminNotification(
  adminEmail: string,
  company: string,
  contactName: string,
  email: string,
  phone: string,
  estimatedWeight: string,
  orderType: string,
  frequency: string,
  inquiryId: string,
  notes: string,
  adminLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('wholesale_inquiry_received', adminEmail, {
    company,
    contactName,
    email,
    phone,
    estimatedWeight,
    orderType,
    frequency,
    inquiryId,
    notes,
    adminLink,
  })
}

/**
 * Send wholesale inquiry customer confirmation
 */
export async function sendWholesaleInquiryConfirmation(
  email: string,
  contactName: string,
  company: string,
  estimatedWeight: string,
  orderType: string,
  frequency: string,
  inquiryId: string
): Promise<EmailResponse> {
  return sendTemplateEmail('wholesale_inquiry_confirmation', email, {
    contactName,
    company,
    estimatedWeight,
    orderType,
    frequency,
    inquiryId,
  })
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailed(
  email: string,
  customerName: string,
  orderId: string,
  errorMessage: string,
  orderTotal: string,
  paymentLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('payment_failed', email, {
    customerName,
    orderId,
    errorMessage,
    orderTotal,
    paymentLink,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(
  email: string,
  firstName: string,
  resetLink: string
): Promise<EmailResponse> {
  return sendTemplateEmail('password_reset', email, {
    firstName,
    resetLink,
  })
}

const emailService = {
  sendEmail,
  sendTemplateEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendPickupReminder,
  sendOrderShipped,
  sendDeliveryNotification,
  sendRatingRequest,
  sendProOrderAssignment,
  sendProApplicationApproved,
  sendProApplicationRejected,
  sendWholesaleInquiryAdminNotification,
  sendWholesaleInquiryConfirmation,
  sendPaymentFailed,
  sendPasswordReset,
}

export default emailService

/**
 * Send branded email confirmation
 */
export async function sendBrandedConfirmationEmail(
  email: string,
  confirmationLink: string
): Promise<void> {
  const template = EMAIL_TEMPLATES.email_confirmation
  
  const html = template.template({
    confirmLink: confirmationLink
  })

  await sendEmail({
    to: email,
    subject: template.subject,
    html: html,
    replyTo: process.env.RESEND_REPLY_TO_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  })
}
