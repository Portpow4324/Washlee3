import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/email-service'
import { getBearerUser, hasAdminSession } from '@/lib/security/apiAuth'
import { cleanString } from '@/lib/security/validation'

interface RefundRequest {
  orderId: string
  userId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RefundRequest = await request.json()
    const orderId = cleanString(body.orderId, 100)
    const userId = cleanString(body.userId, 80)

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, userId' },
        { status: 400 }
      )
    }

    const [authenticatedUser, adminSession] = await Promise.all([
      getBearerUser(request),
      hasAdminSession(request),
    ])

    if (!adminSession && (!authenticatedUser || authenticatedUser.id !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    console.log('[Refund API] Processing refund request:', { orderId, userId })

    // Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .eq('status', 'cancelled')
      .single()

    if (orderError || !order) {
      console.error('[Refund API] Order not found or not cancelled:', orderError)
      return NextResponse.json(
        { error: 'Order not found, unauthorized, or not cancelled' },
        { status: 404 }
      )
    }

    // Fetch user details for email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, name, phone')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('[Refund API] User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if refund has already been requested
    const { data: existingRefund } = await supabaseAdmin
      .from('refund_requests')
      .select('id')
      .eq('order_id', orderId)
      .single()

    if (existingRefund) {
      return NextResponse.json(
        { error: 'Refund request already exists for this order' },
        { status: 400 }
      )
    }

    // Create refund request in database
    const { data: refund, error: refundError } = await supabaseAdmin
      .from('refund_requests')
      .insert([
        {
          order_id: orderId,
          user_id: userId,
          amount: order.total_price,
          status: 'pending',
          created_at: new Date(),
        },
      ])
      .select()
      .single()

    if (refundError) {
      console.error('[Refund API] Failed to create refund request:', refundError)
      return NextResponse.json(
        { error: 'Failed to create refund request' },
        { status: 500 }
      )
    }

    // Generate Stripe/PayPal payment link
    // For now, we'll create a placeholder that shows the invoice details
    const invoiceDetails = {
      orderid: order.id,
      amount: order.total_price,
      currency: 'USD',
      description: `Refund for cancelled order ${order.id.slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    }

    // Create a secure refund token for reference
    const refundToken = Buffer.from(JSON.stringify(invoiceDetails)).toString('base64')

    // Send email to customer with refund details and payment link
    const emailContent = `
      <h2>Refund Request Received</h2>
      <p>Hi ${user.name},</p>
      <p>Your refund request for order <strong>${order.id.slice(0, 8)}</strong> has been received.</p>
      
      <h3>Refund Details:</h3>
      <ul>
        <li><strong>Order ID:</strong> ${order.id}</li>
        <li><strong>Refund Amount:</strong> $${order.total_price.toFixed(2)}</li>
        <li><strong>Request Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>

      <h3>Next Steps:</h3>
      <p>To complete your refund, please click the link below to choose your preferred payment method (Stripe or PayPal):</p>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/refund-payment?token=${refundToken}" 
           style="display: inline-block; padding: 12px 24px; background-color: #48C9B0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Complete Refund
        </a>
      </p>

      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        <strong>Timeline:</strong> Once you complete the refund through your preferred payment method, the funds will be returned to your original payment method within 3-5 business days.
      </p>

      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        If you have any questions, please contact our support team.
      </p>

      <p>Best regards,<br>The Washlee Team</p>
    `

    // Send email to customer
    try {
      await sendEmail({
        to: user.email,
        subject: 'Refund Request Confirmed - Action Required',
        html: emailContent,
      })
      console.log('[Refund API] Customer email sent to:', user.email)
    } catch (emailError) {
      console.error('[Refund API] Failed to send customer email:', emailError)
      // Don't fail the refund if email fails, just log it
    }

    // Send admin notification email
    try {
      const adminEmailContent = `
        <h2>New Refund Request - Requires Review</h2>
        <p>A new refund request has been submitted and requires admin review.</p>
        
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Request ID:</strong> ${refund.id}</li>
          <li><strong>Order ID:</strong> ${order.id}</li>
          <li><strong>Customer Name:</strong> ${user.name}</li>
          <li><strong>Customer Email:</strong> ${user.email}</li>
          <li><strong>Customer Phone:</strong> ${user.phone || 'N/A'}</li>
          <li><strong>Refund Amount:</strong> $${order.total_price.toFixed(2)}</li>
          <li><strong>Request Date:</strong> ${new Date().toLocaleDateString()}</li>
          <li><strong>Status:</strong> Pending</li>
        </ul>

        <h3>Order Summary:</h3>
        <ul>
          <li><strong>Items:</strong> ${order.item_count || '1'} item(s)</li>
          <li><strong>Original Price:</strong> $${order.total_price.toFixed(2)}</li>
          <li><strong>Pickup Address:</strong> ${order.pickup_address || 'N/A'}</li>
          <li><strong>Delivery Address:</strong> ${order.delivery_address || 'N/A'}</li>
        </ul>

        <h3>Action Required:</h3>
        <p>Please review this refund request and process the payment accordingly. Update the status in the admin dashboard when complete.</p>

        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          <strong>Next Steps:</strong>
          <ol>
            <li>Review the refund request details</li>
            <li>Verify the order cancellation</li>
            <li>Process the refund through the appropriate payment gateway</li>
            <li>Update the refund status in the system</li>
            <li>Customer will receive payment within 3-5 business days</li>
          </ol>
        </p>

        <p>Best regards,<br>Washlee Refund System</p>
      `

      const adminEmail = process.env.ADMIN_EMAIL || 'lukaverde045@gmail.com'
      await sendEmail({
        to: adminEmail,
        subject: `New Refund Request - $${order.total_price.toFixed(2)} - ${user.name}`,
        html: adminEmailContent,
      })
      console.log('[Refund API] Admin email sent to:', adminEmail)
    } catch (adminEmailError) {
      console.error('[Refund API] Failed to send admin email:', adminEmailError)
      // Don't fail the refund if admin email fails, just log it
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Refund request created. Check your email for payment instructions.',
        refund: {
          id: refund.id,
          orderId: order.id,
          amount: order.total_price,
          status: 'pending',
          createdAt: refund.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Refund API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
