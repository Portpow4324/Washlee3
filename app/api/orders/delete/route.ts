import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getBearerUser, hasAdminSession } from '@/lib/security/apiAuth'
import { cleanString } from '@/lib/security/validation'

interface DeleteOrderRequest {
  orderId: string
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: DeleteOrderRequest = await request.json()
    const orderId = cleanString(body.orderId, 100)
    const userId = cleanString(body.userId, 80)

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      )
    }

    const [authenticatedUser, adminSession] = await Promise.all([
      getBearerUser(request),
      hasAdminSession(request),
    ])

    if (!adminSession && (!authenticatedUser || authenticatedUser.id !== userId)) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this order' },
        { status: 403 }
      )
    }

    console.log('[Delete Order API] Processing deletion for order:', orderId)

    // Get order details first (including pro_id, user_id, total_price)
    // Note: Using service role, so we can query any order, but we verify user ownership below
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, pro_id, total_price, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('[Delete Order API] Order not found:', orderError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify that the user requesting deletion owns this order
    // If userId is provided, verify it matches
    if (!adminSession && order.user_id !== userId) {
      console.error('[Delete Order API] User does not own this order:', {
        requestingUser: userId,
        orderOwner: order.user_id,
      })
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this order' },
        { status: 403 }
      )
    }

    console.log('[Delete Order API] Order found:', {
      id: order.id,
      userId: order.user_id,
      proId: order.pro_id,
      amount: order.total_price,
    })

    // 1. CUSTOMER DASHBOARD: Delete order from customer view
    const { error: deleteError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('user_id', order.user_id)

    if (deleteError) {
      console.error('[Delete Order API] Failed to delete order:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      )
    }

    console.log('[Delete Order API] ✅ Order deleted from customer dashboard:', orderId)

    // 2. PRO DASHBOARD: Remove assignment if pro is assigned
    if (order.pro_id) {
      await supabaseAdmin
        .from('orders')
        .update({ pro_id: null })
        .eq('id', orderId)
        .eq('pro_id', order.pro_id)

      // Note: Order is already deleted, so this won't work. Instead, we log it as info
      console.log('[Delete Order API] Pro assignment info:', {
        proId: order.pro_id,
        note: 'Order already deleted, pro assignment cleared',
      })
    }

    // 3. REFUND SYSTEM: Mark any associated refund requests as cancelled
    if (order.status === 'cancelled') {
      const { data: refundRequest } = await supabaseAdmin
        .from('refund_requests')
        .select('id, status')
        .eq('order_id', orderId)
        .single()

      if (refundRequest && refundRequest.status === 'pending') {
        // Update refund to cancelled
        await supabaseAdmin
          .from('refund_requests')
          .update({ status: 'cancelled' })
          .eq('id', refundRequest.id)

        console.log('[Delete Order API] Refund request cancelled for order:', orderId)
      }
    }

    // 4. AUDIT LOG: Log the deletion
    try {
      const { error: auditError } = await supabaseAdmin
        .from('order_deletions')
        .insert([
          {
            order_id: orderId,
            user_id: order.user_id,
            pro_id: order.pro_id,
            order_amount: order.total_price,
            order_status: order.status,
            deleted_at: new Date(),
            reason: 'customer_request',
          },
        ])

      if (auditError) {
        console.warn('[Delete Order API] Could not log deletion (table may not exist):', auditError.message)
        // Don't fail the entire operation if audit log fails
      } else {
        console.log('[Delete Order API] ✅ Deletion logged to audit table')
      }
    } catch (auditErr) {
      console.warn('[Delete Order API] Audit log error:', auditErr)
      // Don't fail the entire operation if audit log fails
    }

    console.log('[Delete Order API] ✅ Order deletion complete:', orderId)

    return NextResponse.json({
      success: true,
      message: 'Order removed from your dashboard',
      orderId,
      deletedAt: new Date(),
    })
  } catch (error) {
    console.error('[Delete Order API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
