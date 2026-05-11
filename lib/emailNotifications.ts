import { sendEmail } from './emailService'

const SUPPORT_EMAIL = 'support@washlee.com'
const WASHLEE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmation(
  customerEmail: string,
  customerName: string,
  orderId: string,
  totalPrice: number,
  weight: number,
  estimatedPickupDate: string
) {
  try {
    const mailOptions = {
      from: SUPPORT_EMAIL,
      to: customerEmail,
      subject: `Order Confirmed - ${orderId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #48C9B0;">Order Confirmed!</h1>
          <p>Hi ${customerName},</p>
          <p>Thank you for choosing Washlee! Your laundry order has been confirmed and we've received your payment.</p>
          
          <div style="background-color: #f7fefe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2d2b; margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId.slice(0, 8).toUpperCase()}</p>
            <p><strong>Weight:</strong> ${weight}kg</p>
            <p><strong>Total Amount:</strong> $${totalPrice} (inc. GST)</p>
            <p><strong>Estimated Pickup:</strong> ${estimatedPickupDate}</p>
          </div>

          <h3 style="color: #1f2d2b;">What Happens Next?</h3>
          <ol>
            <li><strong>Pro Assignment:</strong> We're matching your order with a verified Washlee Pro in your area.</li>
            <li><strong>Pickup Confirmation:</strong> Your pro will contact you to confirm the pickup time.</li>
            <li><strong>Washing & Delivery:</strong> Your laundry will be professionally washed and delivered back within 3-5 business days.</li>
            <li><strong>Rate Your Experience:</strong> Share your feedback to help other customers.</li>
          </ol>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p><a href="${WASHLEE_URL}/tracking/${orderId}" style="color: #48C9B0; text-decoration: none; font-weight: bold;">Track Your Order →</a></p>
            <p style="color: #6b7b78; font-size: 12px;">
              Questions? Contact us at ${SUPPORT_EMAIL}
            </p>
          </div>
        </div>
      `,
    }

    const result = await sendEmail(mailOptions)
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email')
    }
    console.log('[EMAIL] Order confirmation sent to:', customerEmail)
  } catch (error) {
    console.error('[EMAIL] Failed to send order confirmation:', error)
    // Don't throw - email failures shouldn't block order creation
  }
}

/**
 * Send pro assignment notification to pro
 */
export async function sendProAssignment(
  proEmail: string,
  proName: string,
  orderId: string,
  customerName: string,
  weight: string,
  amount: number,
  pickupAddress: string
) {
  try {
    const mailOptions = {
      from: SUPPORT_EMAIL,
      to: proEmail,
      subject: `New Job Available - ${weight}kg Order`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #48C9B0;">New Job Assigned!</h1>
          <p>Hi ${proName},</p>
          <p>A new laundry order has been assigned to you.</p>
          
          <div style="background-color: #f7fefe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2d2b; margin-top: 0;">Job Details</h3>
            <p><strong>Order ID:</strong> ${orderId.slice(0, 8).toUpperCase()}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Weight:</strong> ${weight}kg</p>
            <p><strong>Earnings:</strong> $${amount}</p>
            <p><strong>Pickup Address:</strong> ${pickupAddress}</p>
          </div>

          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Log in to your dashboard to view full job details</li>
            <li>Contact the customer to confirm pickup time</li>
            <li>Pick up, wash, and deliver the laundry</li>
            <li>Mark the order as complete in your dashboard</li>
          </ol>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p><a href="${WASHLEE_URL}/dashboard/pro/jobs" style="color: #48C9B0; text-decoration: none; font-weight: bold;">View Job Details →</a></p>
            <p style="color: #6b7b78; font-size: 12px;">
              Questions? Contact us at ${SUPPORT_EMAIL}
            </p>
          </div>
        </div>
      `,
    }

    const result = await sendEmail(mailOptions)
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email')
    }
    console.log('[EMAIL] Pro assignment notification sent to:', proEmail)
  } catch (error) {
    console.error('[EMAIL] Failed to send pro assignment notification:', error)
  }
}

/**
 * Send pickup reminder to customer
 */
export async function sendPickupReminder(
  customerEmail: string,
  customerName: string,
  orderId: string,
  proName: string,
  pickupTime: string
) {
  try {
    const mailOptions = {
      from: SUPPORT_EMAIL,
      to: customerEmail,
      subject: `Pickup Reminder - ${orderId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #48C9B0;">Pickup Reminder</h1>
          <p>Hi ${customerName},</p>
          <p>Your Washlee Pro ${proName} will be arriving soon to pick up your laundry!</p>
          
          <div style="background-color: #f7fefe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2d2b; margin-top: 0;">Pickup Details</h3>
            <p><strong>Time:</strong> ${pickupTime}</p>
            <p><strong>Pro:</strong> ${proName}</p>
            <p><strong>Order ID:</strong> ${orderId.slice(0, 8).toUpperCase()}</p>
          </div>

          <p>Please make sure your laundry is ready and easily accessible. If you need to reschedule, please contact us ASAP.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p><a href="${WASHLEE_URL}/tracking/${orderId}" style="color: #48C9B0; text-decoration: none; font-weight: bold;">Track Order →</a></p>
          </div>
        </div>
      `,
    }

    const result = await sendEmail(mailOptions)
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email')
    }
    console.log('[EMAIL] Pickup reminder sent to:', customerEmail)
  } catch (error) {
    console.error('[EMAIL] Failed to send pickup reminder:', error)
  }
}

/**
 * Send delivery confirmation email to customer
 */
export async function sendDeliveryConfirmation(
  customerEmail: string,
  customerName: string,
  orderId: string,
  proName: string,
  deliveredDate: string
) {
  try {
    const mailOptions = {
      from: SUPPORT_EMAIL,
      to: customerEmail,
      subject: `Delivery Complete - Order ${orderId.slice(0, 8).toUpperCase()} Ready`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #48C9B0;">Your Laundry is Ready!</h1>
          <p>Hi ${customerName},</p>
          <p>Great news! Your laundry has been delivered by ${proName}. Your clothes are fresh and ready to enjoy!</p>
          
          <div style="background-color: #f7fefe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2d2b; margin-top: 0;">Delivery Details</h3>
            <p><strong>Order ID:</strong> ${orderId.slice(0, 8).toUpperCase()}</p>
            <p><strong>Delivered By:</strong> ${proName}</p>
            <p><strong>Date:</strong> ${deliveredDate}</p>
          </div>

          <p><strong>Please Rate Your Experience</strong></p>
          <p>Help us improve by rating your Washlee Pro and sharing your feedback. Your reviews help other customers choose the best service!</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p><a href="${WASHLEE_URL}/dashboard/orders/${orderId}/review" style="color: #48C9B0; text-decoration: none; font-weight: bold;">Rate Your Pro →</a></p>
            <p style="color: #6b7b78; font-size: 12px;">
              Thank you for choosing Washlee!
            </p>
          </div>
        </div>
      `,
    }

    const result = await sendEmail(mailOptions)
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email')
    }
    console.log('[EMAIL] Delivery confirmation sent to:', customerEmail)
  } catch (error) {
    console.error('[EMAIL] Failed to send delivery confirmation:', error)
  }
}
