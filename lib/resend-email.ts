/**
 * Resend Email Service for Washlee
 * Handles transactional emails
 * Documentation: https://resend.com/docs
 */

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

// Initialize Resend client
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

interface SendEmailParams {
  to: string
  subject: string
  html: string
  replyTo?: string
}

/**
 * Send email via Resend
 */
export async function sendEmailViaResend({ to, subject, html, replyTo }: SendEmailParams) {
  if (!resend || !RESEND_API_KEY) {
    console.error('[Resend] API key not configured')
    throw new Error('Resend API key not configured')
  }

  try {
    console.log('[Resend] Sending email to:', to)
    
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      replyTo: replyTo || FROM_EMAIL,
    })

    if (response.error) {
      console.error('[Resend] Error sending email:', response.error)
      throw new Error(response.error.message)
    }

    console.log('[Resend] ✓ Email sent successfully:', response.data?.id)
    return response.data
  } catch (error) {
    console.error('[Resend] Failed to send email:', error)
    throw error
  }
}

/**
 * Email verification template
 */
export function getVerificationEmailHtml(firstName: string, verificationCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2d2b;
      background-color: #f7fefe;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(31, 45, 43, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .header-title {
      font-size: 24px;
      margin: 10px 0 0 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #1f2d2b;
    }
    .message {
      color: #6b7b78;
      line-height: 1.6;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .code-display {
      background-color: #E8FFFB;
      border: 2px solid #48C9B0;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      margin: 40px 0;
    }
    .code-label {
      font-size: 12px;
      color: #6b7b78;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .code {
      font-size: 52px;
      font-weight: bold;
      color: #48C9B0;
      font-family: 'Courier New', monospace;
      letter-spacing: 12px;
      margin: 15px 0;
    }
    .code-instruction {
      color: #6b7b78;
      margin-top: 15px;
      font-size: 13px;
    }
    .expiration {
      background-color: #FFF8E8;
      border-left: 4px solid #FFA500;
      padding: 15px;
      border-radius: 4px;
      margin: 30px 0;
      font-size: 13px;
      color: #8B6914;
    }
    .footer {
      text-align: center;
      color: #6b7b78;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e8e6;
    }
    .footer-text {
      margin: 8px 0;
    }
    .footer-link {
      color: #48C9B0;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e0e8e6;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🧺 Washlee</div>
      <h1 class="header-title">Verify Your Email</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">Hi ${firstName},</div>
      
      <!-- Main Message -->
      <div class="message">
        Thank you for signing up for Washlee! We're excited to have you join our community. To complete your account setup and start booking laundry services, please verify your email address.
      </div>
      
      <!-- Verification Code -->
      <div class="code-display">
        <div class="code-label">Your Verification Code</div>
        <div class="code">${verificationCode}</div>
        <div class="code-instruction">Enter this code to verify your email</div>
      </div>
      
      <!-- Instructions -->
      <div class="message">
        Enter this 6-digit code in the verification field on the Washlee app to complete your registration.
      </div>
      
      <!-- Expiration Warning -->
      <div class="expiration">
        <strong>⏰ This code expires in 24 hours</strong><br>
        For security, you'll need to request a new code if it expires.
      </div>
      
      <!-- Security Notice -->
      <div class="message">
        <strong>🔒 Security Reminder:</strong> Never share this code with anyone. Washlee employees will never ask for your verification code.
      </div>
      
      <!-- Did Not Sign Up -->
      <div class="message">
        If you didn't create a Washlee account, you can safely ignore this email.
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">Washlee - On-Demand Laundry Service</div>
      <div class="footer-text">© 2026 Washlee. All rights reserved.</div>
      <div class="divider"></div>
      <div class="footer-text">
        <a href="https://washlee.com" class="footer-link">Visit Website</a>
        |
        <a href="https://washlee.com/privacy" class="footer-link">Privacy Policy</a>
        |
        <a href="https://washlee.com/support" class="footer-link">Help</a>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Welcome email template
 */
export function getWelcomeEmailHtml(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2d2b;
      background-color: #f7fefe;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(31, 45, 43, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .header-title {
      font-size: 24px;
      margin: 10px 0 0 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1f2d2b;
    }
    .message {
      color: #6b7b78;
      line-height: 1.6;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .benefit-section {
      margin: 30px 0;
    }
    .benefit-title {
      font-size: 16px;
      font-weight: 600;
      color: #48C9B0;
      margin-bottom: 15px;
    }
    .benefit-item {
      padding: 10px 0;
      color: #6b7b78;
      line-height: 1.6;
      font-size: 14px;
    }
    .benefit-item-icon {
      margin-right: 10px;
    }
    .cta-button {
      display: inline-block;
      background-color: #48C9B0;
      color: white;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 30px 0;
      font-size: 16px;
    }
    .cta-button:hover {
      background-color: #3ba59a;
    }
    .promo-box {
      background-color: #E8FFFB;
      border: 2px solid #48C9B0;
      border-radius: 8px;
      padding: 25px;
      text-align: center;
      margin: 30px 0;
    }
    .promo-code {
      font-size: 14px;
      color: #6b7b78;
      margin-bottom: 10px;
    }
    .promo-display {
      font-size: 32px;
      font-weight: bold;
      color: #48C9B0;
      letter-spacing: 2px;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
    }
    .promo-value {
      font-size: 14px;
      color: #1f2d2b;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      color: #6b7b78;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e8e6;
    }
    .footer-text {
      margin: 8px 0;
    }
    .footer-link {
      color: #48C9B0;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🧺 Washlee</div>
      <h1 class="header-title">Welcome to Washlee!</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">Welcome ${firstName}!</div>
      
      <!-- Main Message -->
      <div class="message">
        We're thrilled to have you join Washlee. Say goodbye to laundry day stress and hello to clean clothes delivered to your doorstep.
      </div>
      
      <!-- Promo Box -->
      <div class="promo-box">
        <div class="promo-code">Your First Order Bonus:</div>
        <div class="promo-display">WELCOME10</div>
        <div class="promo-value">Get $10 OFF Your First Order</div>
      </div>
      
      <!-- Benefits -->
      <div class="benefit-section">
        <div class="benefit-title">Why Choose Washlee?</div>
        <div class="benefit-item">
          <span class="benefit-item-icon">✓</span>
          <strong>Convenient Pickup & Delivery</strong> - We come to you
        </div>
        <div class="benefit-item">
          <span class="benefit-item-icon">✓</span>
          <strong>Premium Care</strong> - Your clothes treated with care
        </div>
        <div class="benefit-item">
          <span class="benefit-item-icon">✓</span>
          <strong>Clear Prices</strong> - Standard $7.50/kg, Express $12.50/kg, $75 minimum
        </div>
        <div class="benefit-item">
          <span class="benefit-item-icon">✓</span>
          <strong>Flexible Scheduling</strong> - Book anytime, 24/7
        </div>
      </div>
      
      <!-- CTA -->
      <div style="text-align: center;">
        <a href="https://washlee.com/dashboard" class="cta-button">Book Your First Order</a>
      </div>
      
      <!-- Next Steps -->
      <div class="message">
        <strong>Next Steps:</strong>
        <br>1. Log in to your Washlee account
        <br>2. Enter your delivery address
        <br>3. Schedule your first pickup
        <br>4. Use code WELCOME10 at checkout for $10 OFF!
      </div>
      
      <!-- Support -->
      <div class="message">
        Have questions? Our support team is here to help! Reply to this email or visit our help center.
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">Washlee - On-Demand Laundry Service</div>
      <div class="footer-text">© 2026 Washlee. All rights reserved.</div>
      <div style="margin: 15px 0;">
        <a href="https://washlee.com" class="footer-link">Website</a>
        |
        <a href="https://washlee.com/privacy" class="footer-link">Privacy</a>
        |
        <a href="https://washlee.com/support" class="footer-link">Support</a>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Order confirmation email template
 */
export function getOrderConfirmationEmailHtml(
  customerName: string,
  orderId: string,
  pickupDate: string,
  pickupTime: string,
  totalAmount: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2d2b;
      background-color: #f7fefe;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(31, 45, 43, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .header-title {
      font-size: 24px;
      margin: 10px 0 0 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1f2d2b;
    }
    .order-id {
      background-color: #E8FFFB;
      border-left: 4px solid #48C9B0;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 14px;
    }
    .order-id-label {
      color: #6b7b78;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .order-id-value {
      font-size: 18px;
      font-weight: bold;
      color: #48C9B0;
      font-family: 'Courier New', monospace;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e0e8e6;
      font-size: 14px;
    }
    .detail-label {
      color: #6b7b78;
      font-weight: 500;
    }
    .detail-value {
      color: #1f2d2b;
      font-weight: 600;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      font-size: 16px;
      font-weight: bold;
      color: #48C9B0;
      border-top: 2px solid #48C9B0;
    }
    .message {
      color: #6b7b78;
      line-height: 1.6;
      margin: 20px 0;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      color: #6b7b78;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e8e6;
    }
    .footer-text {
      margin: 8px 0;
    }
    .footer-link {
      color: #48C9B0;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🧺 Washlee</div>
      <h1 class="header-title">Order Confirmed!</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">Hi ${customerName},</div>
      
      <!-- Order ID -->
      <div class="order-id">
        <div class="order-id-label">Order ID</div>
        <div class="order-id-value">${orderId}</div>
      </div>
      
      <!-- Order Details -->
      <div class="detail-row">
        <span class="detail-label">📅 Pickup Date:</span>
        <span class="detail-value">${pickupDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🕐 Pickup Time:</span>
        <span class="detail-value">${pickupTime}</span>
      </div>
      <div class="total-row">
        <span>Total Amount:</span>
        <span>${totalAmount}</span>
      </div>
      
      <!-- Message -->
      <div class="message">
        Your laundry pickup is confirmed! Our team will arrive at your location on the scheduled date and time. You'll receive a notification 30 minutes before pickup.
      </div>
      
      <div class="message">
        <strong>What happens next:</strong>
        <br>✓ We send a reminder 30 minutes before pickup
        <br>✓ Our professional team picks up your laundry
        <br>✓ We professionally clean and care for your items
        <br>✓ We deliver clean laundry back to you
      </div>
      
      <!-- Track Order -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://washlee.com/tracking" style="display: inline-block; background-color: #48C9B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Track Your Order</a>
      </div>
      
      <div class="message">
        Thank you for choosing Washlee! We appreciate your business and look forward to serving you.
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">Washlee - On-Demand Laundry Service</div>
      <div class="footer-text">© 2026 Washlee. All rights reserved.</div>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Get available email templates (for admin/marketing)
 */
export function getEmailTemplates() {
  return [
    {
      id: 'welcome_email',
      name: 'Welcome Email',
      subject: 'Welcome to Washlee! Get $10 Off Your First Order',
      description: 'New user onboarding email',
    },
    {
      id: 'order_confirmation',
      name: 'Order Confirmation',
      subject: 'Order Confirmed - Your Laundry is Scheduled',
      description: 'Order confirmation and pickup details',
    },
    {
      id: 'promotional_campaign',
      name: 'Promotional Campaign',
      subject: 'Special Offer: Get 20% Off This Week',
      description: 'Marketing promotion email',
    },
    {
      id: 'weekly_newsletter',
      name: 'Weekly Newsletter',
      subject: 'Your Weekly Washlee Update',
      description: 'Customer newsletter',
    },
    {
      id: 'verification_code',
      name: 'Email Verification',
      subject: 'Verify Your Washlee Email Address',
      description: 'Email verification code',
    },
  ]
}
