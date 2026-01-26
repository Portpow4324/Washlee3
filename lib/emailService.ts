// Email service for Washlee
// Supports Resend, SendGrid, or custom SMTP

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface EmailOptions {
  to: string
  from?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

class EmailService {
  private provider: 'resend' | 'sendgrid' | 'none' = 'none'
  private apiKey: string = ''

  constructor() {
    const resendKey = process.env.RESEND_API_KEY
    const sendgridKey = process.env.SENDGRID_API_KEY

    if (resendKey) {
      this.provider = 'resend'
      this.apiKey = resendKey
    } else if (sendgridKey) {
      this.provider = 'sendgrid'
      this.apiKey = sendgridKey
    }
  }

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) {
      console.warn('No email provider configured. Email would have been sent to:', options.to)
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        error: undefined
      }
    }

    if (this.provider === 'resend') {
      return this.sendWithResend(options)
    } else if (this.provider === 'sendgrid') {
      return this.sendWithSendGrid(options)
    }

    return {
      success: false,
      error: 'No email provider configured'
    }
  }

  /**
   * Send with Resend
   */
  private async sendWithResend(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: options.from || 'noreply@washlee.com.au',
          to: options.to,
          subject: options.subject,
          html: options.html,
          reply_to: options.replyTo
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.message || 'Failed to send email'
        }
      }

      const data = await response.json()
      return {
        success: true,
        messageId: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed'
      }
    }
  }

  /**
   * Send with SendGrid
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject
            }
          ],
          from: {
            email: options.from || 'noreply@washlee.com.au',
            name: 'Washlee'
          },
          content: [
            {
              type: 'text/html',
              value: options.html
            }
          ],
          reply_to: options.replyTo ? { email: options.replyTo } : undefined
        })
      })

      if (response.status !== 202) {
        const error = await response.json()
        return {
          success: false,
          error: error.errors?.[0]?.message || 'Failed to send email'
        }
      }

      return {
        success: true,
        messageId: response.headers.get('X-Message-ID') || undefined
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed'
      }
    }
  }

  /**
   * Email template: Order Confirmation
   */
  static orderConfirmationEmail(data: {
    customerName: string
    orderId: string
    pickupDate: string
    estimatedDelivery: string
    items: Array<{ type: string; quantity: number }>
    total: number
  }): EmailTemplate {
    const itemsHtml = data.items
      .map(item => `<li>${item.quantity}x ${item.type}</li>`)
      .join('')

    return {
      subject: `Order Confirmed - #${data.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #48C9B0;">Order Confirmed!</h1>
          <p>Hi ${data.customerName},</p>
          <p>Your order has been confirmed and a Washlee Pro will be assigned shortly.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Pickup Date:</strong> ${data.pickupDate}</p>
            <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
            
            <h4>Items:</h4>
            <ul>${itemsHtml}</ul>
            
            <p><strong>Total:</strong> $${data.total.toFixed(2)}</p>
          </div>

          <p>You'll receive a notification when a pro accepts your order and is on the way.</p>
          
          <p>Questions? <a href="https://washlee.com.au/support">Contact Support</a></p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">
          <p style="color: #999; font-size: 12px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      `,
      text: `Order Confirmed - #${data.orderId}\n\nYour order has been confirmed. Items: ${data.items.map(i => `${i.quantity}x ${i.type}`).join(', ')}\n\nPickup: ${data.pickupDate}\nDelivery: ${data.estimatedDelivery}\nTotal: $${data.total.toFixed(2)}`
    }
  }

  /**
   * Email template: Pro Accepted Order
   */
  static proAcceptedOrderEmail(data: {
    customerName: string
    orderId: string
    proName: string
    proPhone: string
    pickupDate: string
    estimatedDelivery: string
  }): EmailTemplate {
    return {
      subject: `Your order has been accepted!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #48C9B0;">Order Accepted!</h1>
          <p>Hi ${data.customerName},</p>
          <p>Great news! A pro has accepted your order.</p>
          
          <div style="background: #E8FFFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Pro Details</h3>
            <p><strong>Name:</strong> ${data.proName}</p>
            <p><strong>Phone:</strong> <a href="tel:${data.proPhone}">${data.proPhone}</a></p>
          </div>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Information</h3>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Pickup:</strong> ${data.pickupDate}</p>
            <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
          </div>

          <p>You can track your order in real-time in your dashboard.</p>
          
          <p><a href="https://washlee.com.au/dashboard" style="background: #48C9B0; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View Order</a></p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">
          <p style="color: #999; font-size: 12px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      `,
      text: `Order Accepted!\n\nPro: ${data.proName}\nPhone: ${data.proPhone}\n\nPickup: ${data.pickupDate}\nDelivery: ${data.estimatedDelivery}`
    }
  }

  /**
   * Email template: Order Delivered
   */
  static orderDeliveredEmail(data: {
    customerName: string
    orderId: string
    proName: string
    deliveryDate: string
  }): EmailTemplate {
    return {
      subject: `Your laundry has been delivered!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #48C9B0;">✓ Delivered!</h1>
          <p>Hi ${data.customerName},</p>
          <p>Your laundry has been delivered by ${data.proName}.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Delivered:</strong> ${data.deliveryDate}</p>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
          </div>

          <p>Please review your items and leave a review to help us improve!</p>
          
          <p><a href="https://washlee.com.au/dashboard/orders/${data.orderId}/review" style="background: #48C9B0; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Leave Review</a></p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">
          <p style="color: #999; font-size: 12px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      `,
      text: `Your laundry has been delivered by ${data.proName}.\n\nOrder ID: ${data.orderId}\nDelivered: ${data.deliveryDate}\n\nPlease leave a review!`
    }
  }

  /**
   * Email template: Welcome Email
   */
  static welcomeEmail(data: { userName: string; userType: 'customer' | 'pro' }): EmailTemplate {
    const proContent = data.userType === 'pro'
      ? `<p>Welcome to the Washlee Pro community! Complete your profile and verification to start accepting orders.</p>`
      : `<p>Welcome to Washlee! Book your first order and experience the convenience of laundry pickup & delivery.</p>`

    return {
      subject: 'Welcome to Washlee!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #48C9B0;">Welcome to Washlee!</h1>
          <p>Hi ${data.userName},</p>
          ${proContent}
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p><a href="https://washlee.com.au/faq" style="color: #48C9B0;">View FAQ</a> | <a href="https://washlee.com.au/support" style="color: #48C9B0;">Contact Support</a></p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">
          <p style="color: #999; font-size: 12px;">© 2026 Washlee. All rights reserved.</p>
        </div>
      `,
      text: `Welcome to Washlee, ${data.userName}!`
    }
  }
}

export default new EmailService()
