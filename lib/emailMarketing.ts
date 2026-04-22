/**
 * Email Marketing Service for Washlee
 * Handles all transactional and marketing emails triggered by user actions
 * Integrates with Resend for reliable email delivery
 */

import { sendEmailViaResend } from './resend-email'

interface EmailData {
  to: string
  customerName: string
  [key: string]: any
}

/**
 * WELCOME EMAIL - Sent when user signs up
 */
export async function sendWelcomeEmail(data: {
  to: string
  customerName: string
  email: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .cta-button { display: inline-block; background: #48C9B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .section { margin: 20px 0; }
          .benefit-list { list-style: none; padding: 0; }
          .benefit-list li { padding: 8px 0; padding-left: 25px; position: relative; }
          .benefit-list li:before { content: "✓"; position: absolute; left: 0; color: #48C9B0; font-weight: bold; }
          .footer { background: #1f2d2b; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .discount-box { background: #E8FFFB; border: 2px solid #48C9B0; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .discount-code { font-size: 24px; font-weight: bold; color: #48C9B0; text-align: center; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Washlee! 🎉</h1>
            <p>Your laundry just got easy</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>Thank you for signing up with Washlee! We're thrilled to have you join our community of busy professionals who've reclaimed 1+ hours every week.</p>
            
            <div class="discount-box">
              <p><strong>Exclusive Welcome Offer:</strong></p>
              <div class="discount-code">WELCOME10</div>
              <p>Get <strong>$10 OFF</strong> your first order</p>
            </div>
            
            <div class="section">
              <h2>Here's What You Get with Washlee:</h2>
              <ul class="benefit-list">
                <li>On-demand pickup from your home or office</li>
                <li>Professional washing, drying & folding</li>
                <li>Flexible delivery (next day or same day express)</li>
                <li>Full damage protection included</li>
                <li>Real-time order tracking</li>
                <li>24/7 customer support</li>
              </ul>
            </div>
            
            <div class="section">
              <h3>How It Works:</h3>
              <ol>
                <li><strong>Book</strong> - Schedule your pickup in seconds</li>
                <li><strong>We Pick Up</strong> - Our pro collects your laundry</li>
                <li><strong>We Wash</strong> - Professional care & attention</li>
                <li><strong>We Deliver</strong> - Fresh, clean clothes to your door</li>
              </ol>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/booking" class="cta-button">Schedule Your First Pickup</a>
            </p>
            
            <div class="section">
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Download the Washlee app for even easier booking (coming soon)</li>
                <li>Save your favorite preferences for faster ordering</li>
                <li>Refer friends and earn credits</li>
              </ul>
            </div>
            
            <p>Questions? Reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/faq">FAQ</a></p>
            
            <p>Welcome aboard!<br><strong>The Washlee Team</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Washlee. All rights reserved.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/privacy-policy" style="color: #7FE3D3; text-decoration: none;">Privacy Policy</a> | <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/terms-of-service" style="color: #7FE3D3; text-decoration: none;">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmailViaResend({
      to: data.to,
      subject: `Welcome to Washlee, ${data.customerName}! Get $10 Off Your First Order`,
      html,
    })
    console.log('[EmailMarketing] ✓ Welcome email sent to:', data.email)
    return true
  } catch (error) {
    console.error('[EmailMarketing] Failed to send welcome email:', error)
    throw error
  }
}

/**
 * ORDER CONFIRMATION EMAIL - Sent when order is created
 */
export async function sendOrderConfirmationEmail(data: {
  to: string
  customerName: string
  orderId: string
  pickupDate: string
  pickupTime: string
  pickupAddress: string
  totalPrice: number
  serviceType: string
  weight?: number
  orderUrl: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-box { background: white; border: 2px solid #48C9B0; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #48C9B0; }
          .detail-value { color: #333; }
          .total-row { display: flex; justify-content: space-between; padding: 15px 0; background: #E8FFFB; padding: 15px; border-radius: 4px; margin-top: 10px; }
          .total-label { font-weight: bold; font-size: 16px; }
          .total-value { font-weight: bold; font-size: 20px; color: #48C9B0; }
          .cta-button { display: inline-block; background: #48C9B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .problem-section { background: #fffbf0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { background: #1f2d2b; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .step { margin: 10px 0; }
          .step-title { font-weight: bold; color: #48C9B0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Order Confirmed!</h1>
            <p>Thank you for choosing Washlee</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>Your laundry order has been confirmed and is ready for pickup!</p>
            
            <div class="order-box">
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${data.orderId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Date:</span>
                <span class="detail-value">${data.pickupDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Time:</span>
                <span class="detail-value">${data.pickupTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${data.pickupAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Service Type:</span>
                <span class="detail-value">${data.serviceType}</span>
              </div>
              ${data.weight ? `<div class="detail-row">
                <span class="detail-label">Estimated Weight:</span>
                <span class="detail-value">${data.weight} kg</span>
              </div>` : ''}
              <div class="total-row">
                <span class="total-label">Total:</span>
                <span class="total-value">$${data.totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="${data.orderUrl}" class="cta-button">Track Your Order</a>
            </p>
            
            <div class="problem-section">
              <p><strong>⚠️ Did You Not Make This Order?</strong></p>
              <div class="step">
                <span class="step-title">Option 1: Cancel Order</span>
                <p>Visit your dashboard and click "Cancel Order" (available until 24 hours before pickup)</p>
              </div>
              <div class="step">
                <span class="step-title">Option 2: Request a Refund</span>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/help/request-refund" style="color: #ff9800; font-weight: bold;">Submit a refund request</a> - our team will respond within 2 hours</p>
              </div>
              <div class="step">
                <span class="step-title">Option 3: Change Your Password</span>
                <p>If you didn't recognize this order, <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/dashboard/settings" style="color: #ff9800; font-weight: bold;">change your password</a> for security</p>
              </div>
              <p><strong>How to change your password:</strong></p>
              <ol>
                <li>Go to Dashboard → Settings</li>
                <li>Click "Change Password"</li>
                <li>Enter your current password and new password</li>
                <li>Click "Update Password"</li>
              </ol>
            </div>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>What Happens Next:</strong></p>
              <p>Our pickup professional will arrive at your location on the scheduled date and time. Be sure to have your laundry ready near the pickup location (front door, gate, etc.).</p>
            </div>
            
            <p>Need help? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/help">Contact Support</a> • <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/faq">FAQ</a></p>
            
            <p>Best regards,<br><strong>The Washlee Team</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Washlee. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmailViaResend({
      to: data.to,
      subject: `Order Confirmed: #${data.orderId} - Receipt for Your Washlee Pickup`,
      html,
    })
    console.log('[EmailMarketing] ✓ Order confirmation email sent to:', data.to)
    return true
  } catch (error) {
    console.error('[EmailMarketing] Failed to send order confirmation email:', error)
    throw error
  }
}

/**
 * REFUND REQUEST EMAIL - Sent when customer requests a refund
 */
export async function sendRefundRequestEmail(data: {
  to: string
  customerName: string
  orderId: string
  refundAmount: number
  reason: string
  ticketId: string
  orderDate: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .ticket-box { background: white; border: 2px solid #FF9800; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #FF9800; }
          .detail-value { color: #333; }
          .ticket-number { font-size: 24px; font-weight: bold; color: #FF9800; text-align: center; font-family: monospace; }
          .status-box { background: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { background: #1f2d2b; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Refund Request Received</h1>
            <p>We're here to help</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>We've received your refund request for order #${data.orderId}. Our support team is reviewing your case and will be in touch shortly.</p>
            
            <div class="ticket-box">
              <p style="text-align: center; margin-top: 0;"><strong>Your Ticket ID:</strong></p>
              <div class="ticket-number">#${data.ticketId}</div>
              
              <div class="detail-row" style="margin-top: 20px;">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${data.orderId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Refund Amount:</span>
                <span class="detail-value">$${data.refundAmount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${data.orderDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value">${data.reason}</span>
              </div>
            </div>
            
            <div class="status-box">
              <p><strong>What Happens Next:</strong></p>
              <ul>
                <li><strong>Simple Cases (cancellation):</strong> Refund processed within 2 hours</li>
                <li><strong>Complex Cases (quality issues):</strong> Our team will contact you within 24 hours to discuss</li>
                <li>Refunds are credited to your original payment method</li>
                <li>Processing time: 3-5 business days (varies by bank)</li>
              </ul>
            </div>
            
            <p><strong>Keep Your Ticket ID Safe:</strong> #${data.ticketId}</p>
            <p>Use this ID to reference your refund request if you need to follow up.</p>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Need to Add Information?</strong></p>
              <p>Reply to this email with any additional details about your refund request. Our support team checks these regularly.</p>
            </div>
            
            <p>Thank you for your patience and for being a Washlee customer.<br><strong>The Washlee Support Team</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Washlee. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmailViaResend({
      to: data.to,
      subject: `Refund Request Received - Ticket #${data.ticketId}`,
      html,
    })
    console.log('[EmailMarketing] ✓ Refund request email sent to:', data.to)
    return true
  } catch (error) {
    console.error('[EmailMarketing] Failed to send refund request email:', error)
    throw error
  }
}

/**
 * SUBSCRIPTION SIGNUP EMAIL - Sent when customer subscribes to a plan
 */
export async function sendSubscriptionSignupEmail(data: {
  to: string
  customerName: string
  planName: string
  planPrice: number
  billingCycle: string
  benefits: string[]
  subscriptionUrl: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9C27B0 0%, #E040FB 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .plan-box { background: white; border: 2px solid #9C27B0; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .benefit-list { list-style: none; padding: 0; }
          .benefit-list li { padding: 8px 0; padding-left: 25px; position: relative; }
          .benefit-list li:before { content: "★"; position: absolute; left: 0; color: #9C27B0; font-weight: bold; }
          .cta-button { display: inline-block; background: #9C27B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background: #1f2d2b; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .price { font-size: 32px; font-weight: bold; color: #9C27B0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${data.planName}! 🎉</h1>
            <p>Your subscription is active</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>Thank you for subscribing to the <strong>${data.planName}</strong> plan! You're now unlocking exclusive benefits and savings.</p>
            
            <div class="plan-box">
              <p style="text-align: center; margin-top: 0;">
                <strong>${data.planName} Plan</strong>
              </p>
              <div class="price">$${data.planPrice}/${data.billingCycle}</div>
              
              <h3>Your Benefits:</h3>
              <ul class="benefit-list">
                ${data.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${data.subscriptionUrl}" class="cta-button">Manage Your Subscription</a>
            </p>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>You can manage your subscription anytime from your dashboard</li>
                <li>Billing date: Same day each month</li>
                <li>Cancel anytime - no questions asked</li>
              </ul>
            </div>
            
            <p>Questions about your subscription? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/help">Contact Support</a></p>
            
            <p>Happy laundering!<br><strong>The Washlee Team</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Washlee. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmailViaResend({
      to: data.to,
      subject: `Welcome to ${data.planName}! Your Subscription is Active`,
      html,
    })
    console.log('[EmailMarketing] ✓ Subscription signup email sent to:', data.to)
    return true
  } catch (error) {
    console.error('[EmailMarketing] Failed to send subscription signup email:', error)
    throw error
  }
}

/**
 * LOYALTY PROGRAM SIGNUP EMAIL - Sent when customer joins loyalty program
 */
export async function sendLoyaltyProgramEmail(data: {
  to: string
  customerName: string
  pointsBalance: number
  rewardsUrl: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .points-box { background: white; border: 3px solid #F59E0B; padding: 30px; border-radius: 6px; margin: 20px 0; text-align: center; }
          .points-value { font-size: 48px; font-weight: bold; color: #F59E0B; }
          .reward-item { background: white; border-left: 4px solid #F59E0B; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .cta-button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background: #1f2d2b; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Welcome to Washlee Rewards!</h1>
            <p>Earn points with every order</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>You're now a member of the Washlee Rewards program! Every time you book a pickup, you'll earn points that unlock exclusive rewards.</p>
            
            <div class="points-box">
              <p style="margin-top: 0;"><strong>Your Starting Points Balance:</strong></p>
              <div class="points-value">${data.pointsBalance}</div>
              <p style="margin-bottom: 0; color: #666;">Ready to earn more! 🚀</p>
            </div>
            
            <h3>How It Works:</h3>
            <div class="reward-item">
              <p><strong>1 Point = $0.01 in Value</strong></p>
              <p>Earn 10 points per dollar spent on every order</p>
            </div>
            
            <div class="reward-item">
              <p><strong>Redeem Rewards</strong></p>
              <p>100 points = $1 off your next order<br>500 points = $10 bonus credit</p>
            </div>
            
            <div class="reward-item">
              <p><strong>Bonus Points</strong></p>
              <p>First subscription signup: +50 points<br>Refer a friend: +25 points each</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${data.rewardsUrl}" class="cta-button">View Your Rewards</a>
            </p>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Pro Tips:</strong></p>
              <ul>
                <li>Points never expire as long as your account is active</li>
                <li>Combine points with promo codes for maximum savings</li>
                <li>Share your referral code to earn even more points</li>
              </ul>
            </div>
            
            <p>Start booking and earn rewards today!<br><strong>The Washlee Team</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Washlee. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmailViaResend({
      to: data.to,
      subject: `Welcome to Washlee Rewards! Start Earning Points`,
      html,
    })
    console.log('[EmailMarketing] ✓ Loyalty program email sent to:', data.to)
    return true
  } catch (error) {
    console.error('[EmailMarketing] Failed to send loyalty program email:', error)
    throw error
  }
}

/**
 * ORDER READY FOR PICKUP EMAIL - Sent when order is being prepped
 */
export async function sendOrderReadyEmail(data: {
  to: string
  customerName: string
  orderId: string
  pickupDate: string
  pickupTime: string
  estimatedDelivery: string
  trackingUrl: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; border: 2px solid #48C9B0; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .cta-button { display: inline-block; background: #48C9B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background: #1f2d2b; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .timeline { margin: 20px 0; }
          .timeline-item { display: flex; margin: 15px 0; }
          .timeline-dot { width: 12px; height: 12px; background: #48C9B0; border-radius: 50%; margin-right: 15px; margin-top: 4px; flex-shrink: 0; }
          .timeline-text { flex: 1; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Laundry is Ready! ✓</h1>
            <p>Order #${data.orderId} has been completed</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>Great news! Your laundry has been beautifully washed, dried, and folded. It's ready for delivery!</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Delivery Information</h3>
              <p><strong>Scheduled Delivery:</strong> ${data.estimatedDelivery}</p>
              <p><strong>Order ID:</strong> #${data.orderId}</p>
              <p>Your items will be delivered to the address provided in your order.</p>
            </div>
            
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-text">
                  <strong>✓ Pickup Complete</strong>
                  <p style="margin: 5px 0; color: #666; font-size: 14px;">Your laundry was collected</p>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-text">
                  <strong>✓ Washing & Care</strong>
                  <p style="margin: 5px 0; color: #666; font-size: 14px;">Professional wash, dry & fold applied</p>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-text">
                  <strong>⟳ Out for Delivery</strong>
                  <p style="margin: 5px 0; color: #666; font-size: 14px;">Coming soon to your door</p>
                </div>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="${data.trackingUrl}" class="cta-button">Track Your Delivery</a>
            </p>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Be Home for Delivery:</strong></p>
              <p>Please ensure someone is home to receive your order on the scheduled delivery date. Our driver will attempt delivery once. If you're not available, they'll contact you.</p>
            </div>
            
            <p>Thank you for choosing Washlee!<br><strong>The Washlee Team</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Washlee. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmailViaResend({
      to: data.to,
      subject: `Your Laundry is Ready! - Order #${data.orderId}`,
      html,
    })
    console.log('[EmailMarketing] ✓ Order ready email sent to:', data.to)
    return true
  } catch (error) {
    console.error('[EmailMarketing] Failed to send order ready email:', error)
    throw error
  }
}

/**
 * ORDER DELIVERED EMAIL - Sent when order is delivered
 */
export async function sendOrderDeliveredEmail(data: {
  to: string
  customerName: string
  orderId: string
  deliveredDate: string
  reviewUrl: string
  nextSteps: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background: #1f2d2b; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .box { background: white; border: 2px solid #4CAF50; padding: 20px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Order Delivered!</h1>
            <p>Your laundry has arrived</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>Your order #${data.orderId} has been successfully delivered on <strong>${data.deliveredDate}</strong>!</p>
            
            <div class="box">
              <p style="margin-top: 0;"><strong>Delivery confirmed.</strong> Your fresh, clean laundry is now in your possession.</p>
            </div>
            
            <div style="background: #E8F5E9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <p><strong>How Was Your Experience?</strong></p>
              <p>We'd love to hear your feedback! Your review helps us improve and helps other customers.</p>
              <p style="text-align: center;">
                <a href="${data.reviewUrl}" class="cta-button">Leave a Review</a>
              </p>
            </div>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>What's Next?</strong></p>
              <p>${data.nextSteps}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <p><strong>Ready for Another Order?</strong></p>
              <p>Book your next pickup and earn loyalty points. You can schedule recurring pickups for even more convenience!</p>
            </div>
            
            <p>Thank you for choosing Washlee!<br><strong>The Washlee Team</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Washlee. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmailViaResend({
      to: data.to,
      subject: `Order Delivered! - Order #${data.orderId} - Leave a Review`,
      html,
    })
    console.log('[EmailMarketing] ✓ Order delivered email sent to:', data.to)
    return true
  } catch (error) {
    console.error('[EmailMarketing] Failed to send order delivered email:', error)
    throw error
  }
}

/**
 * PROMOTIONAL EMAIL - Generic promotional campaign
 */
export async function sendPromotionalEmail(data: {
  to: string
  customerName: string
  subject: string
  title: string
  message: string
  cta: {
    text: string
    url: string
  }
  promoCode?: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .cta-button { display: inline-block; background: #48C9B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .promo-code { background: #E8FFFB; border: 2px dashed #48C9B0; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0; }
          .promo-label { color: #666; font-size: 14px; margin-bottom: 5px; }
          .promo-value { font-size: 28px; font-weight: bold; color: #48C9B0; font-family: monospace; }
          .footer { background: #1f2d2b; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.title}</h1>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>${data.message}</p>
            
            ${data.promoCode ? `
              <div class="promo-code">
                <div class="promo-label">Use this code at checkout:</div>
                <div class="promo-value">${data.promoCode}</div>
              </div>
            ` : ''}
            
            <p style="text-align: center;">
              <a href="${data.cta.url}" class="cta-button">${data.cta.text}</a>
            </p>
            
            <p>Questions? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/help">Contact Support</a></p>
            
            <p>Best regards,<br><strong>The Washlee Team</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Washlee. All rights reserved.</p>
            <p><a href="https://washlee.com/unsubscribe" style="color: #7FE3D3; text-decoration: none;">Unsubscribe</a></p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmailViaResend({
      to: data.to,
      subject: data.subject,
      html,
    })
    console.log('[EmailMarketing] ✓ Promotional email sent to:', data.to)
    return true
  } catch (error) {
    console.error('[EmailMarketing] Failed to send promotional email:', error)
    throw error
  }
}

/**
 * PRO ACCEPTED JOB EMAIL - Sent to customer when pro accepts their order
 */
export async function sendProAcceptedJobEmail(data: {
  to: string
  customerName: string
  proName: string
  proPhone: string
  proEmail: string
  orderAmount: number
  orderId: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .cta-button { display: inline-block; background: #48C9B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .section { margin: 20px 0; padding: 20px; background: white; border-radius: 6px; border-left: 4px solid #48C9B0; }
          .pro-info { background: #E8FFFB; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .pro-detail { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #48C9B0; }
          .pro-detail-label { font-weight: bold; color: #1f2d2b; }
          .pro-detail-value { color: #48C9B0; }
          .footer { background: #1f2d2b; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .checkmark { color: #48C9B0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Your Order is Assigned! 🎉</h1>
            <p>Your laundry pro is on the way</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <div class="section">
              <h2 style="color: #48C9B0; margin-top: 0;">Good News!</h2>
              <p>Your laundry order has been accepted by a Washlee Pro. Here are your pro's contact details:</p>
            </div>

            <div class="pro-info">
              <h3 style="margin-top: 0; color: #1f2d2b;">📋 Your Washlee Pro</h3>
              
              <div class="pro-detail">
                <span class="pro-detail-label">Name:</span>
                <span class="pro-detail-value">${data.proName}</span>
              </div>
              
              <div class="pro-detail">
                <span class="pro-detail-label">Phone:</span>
                <span class="pro-detail-value"><a href="tel:${data.proPhone}" style="color: #48C9B0; text-decoration: none;">${data.proPhone}</a></span>
              </div>
              
              <div class="pro-detail">
                <span class="pro-detail-label">Email:</span>
                <span class="pro-detail-value"><a href="mailto:${data.proEmail}" style="color: #48C9B0; text-decoration: none;">${data.proEmail}</a></span>
              </div>
              
              <div class="pro-detail" style="border-bottom: none;">
                <span class="pro-detail-label">Order ID:</span>
                <span class="pro-detail-value">${data.orderId}</span>
              </div>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">What Happens Next?</h3>
              <ul style="line-height: 1.8;">
                <li><span class="checkmark">✓</span> Your pro will contact you to confirm pickup time</li>
                <li><span class="checkmark">✓</span> We'll send you real-time tracking updates</li>
                <li><span class="checkmark">✓</span> Your laundry will be delivered on the scheduled date</li>
                <li><span class="checkmark">✓</span> You'll receive a tracking link to monitor your order</li>
              </ul>
            </div>

            <div class="section" style="background: #FFF3CD; border-left-color: #FF9800;">
              <h3 style="margin-top: 0; color: #FF9800;">💡 Pro Tip</h3>
              <p>Keep your pro's contact details handy! You can reach out directly if you need to reschedule or have questions about your order.</p>
            </div>

            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/dashboard/orders" class="cta-button">View Your Order</a>
            </p>
            
            <p>Questions? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/help">Contact Support</a></p>
            
            <p>Best regards,<br><strong>The Washlee Team</strong></p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Washlee. All rights reserved.</p>
            <p><a href="https://washlee.com/unsubscribe" style="color: #7FE3D3; text-decoration: none;">Unsubscribe</a></p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmailViaResend({
      to: data.to,
      subject: `${data.proName} accepted your Washlee order!`,
      html,
    })
    console.log('[EmailMarketing] ✓ Pro accepted job email sent to:', data.to)
    return true
  } catch (error) {
    console.error('[EmailMarketing] Failed to send pro accepted job email:', error)
    throw error
  }
}
