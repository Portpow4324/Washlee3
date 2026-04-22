/**
 * Refund Request API - Handles customer refund requests
 * POST /api/refunds - Create new refund request
 * GET /api/refunds?orderId=xxx - Get refund status by order ID
 * GET /api/refunds?userId=xxx - Get refund status by user ID
 * GET /api/refunds?status=pending - Get refunds by status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendRefundRequestEmail } from '@/lib/emailMarketing'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceRole)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      orderId,
      userId,
      amount,
      paymentMethod,
      transactionId,
      notes,
      email,
      customerName,
    } = body

    // Validate required fields
    if (!orderId || !userId || !amount || !email || !customerName) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['orderId', 'userId', 'amount', 'email', 'customerName'],
        },
        { status: 400 }
      )
    }

    // Create refund request in database
    const { data: refund, error: insertError } = await supabase
      .from('refund_requests')
      .insert([
        {
          order_id: orderId,
          user_id: userId,
          amount: amount,
          payment_method: paymentMethod || null,
          transaction_id: transactionId || null,
          notes: notes || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('[RefundAPI] Error creating refund request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create refund request', details: insertError },
        { status: 500 }
      )
    }

    // Send confirmation email to customer
    try {
      await sendRefundRequestEmail({
        to: email,
        customerName: customerName,
        orderId: orderId,
        refundAmount: amount,
        reason: notes || 'Refund requested',
        ticketId: refund.id.substring(0, 8).toUpperCase(),
        orderDate: new Date().toISOString().split('T')[0],
      })

      console.log('[RefundAPI] ✓ Refund confirmation email sent to:', email)
    } catch (emailError) {
      console.error('[RefundAPI] Warning: Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails, just log it
    }

    // Send admin notification email
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'support@washlee.com'

      const adminHtml = `
        <html>
          <body>
            <h2>New Refund Request - ID #${refund.id}</h2>
            <p><strong>Customer:</strong> ${customerName} (${email})</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Refund Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod || 'Not specified'}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p><strong>Status:</strong> pending</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/admin/refunds/${refund.id}">View in Admin Panel</a></p>
          </body>
        </html>
      `

      // Use Resend to send admin email
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@washlee.com',
          to: adminEmail,
          subject: `New Refund Request: ID #${refund.id}`,
          html: adminHtml,
        }),
      })

      if (response.ok) {
        console.log('[RefundAPI] ✓ Admin notification sent')
      } else {
        const error = await response.json()
        console.error('[RefundAPI] Warning: Failed to send admin notification:', error)
      }
    } catch (adminEmailError) {
      console.error('[RefundAPI] Warning: Failed to send admin email:', adminEmailError)
    }

    return NextResponse.json(
      {
        success: true,
        refundId: refund.id,
        orderId: orderId,
        amount: amount,
        status: 'pending',
        message: `Refund request created successfully. ID: ${refund.id}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[RefundAPI] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const refundId = searchParams.get('refundId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    // Validate that at least one search parameter is provided
    if (!orderId && !refundId && !userId && !status) {
      return NextResponse.json(
        {
          error: 'Missing query parameters. Provide one of: orderId, refundId, userId, or status',
        },
        { status: 400 }
      )
    }

    let query = supabase.from('refund_requests').select('*')

    if (orderId) {
      query = query.eq('order_id', orderId)
    } else if (refundId) {
      query = query.eq('id', refundId)
    } else if (userId) {
      query = query.eq('user_id', userId)
    } else if (status) {
      query = query.eq('status', status)
    }

    const { data: refunds, error: queryError } = await query

    if (queryError) {
      console.error('[RefundAPI] Query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch refund requests' }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        refunds: refunds || [],
        count: (refunds || []).length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[RefundAPI] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
