/**
 * POST /api/delivery/track-capacity
 * Track orders for capacity planning
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { orderId, weightKg, deliverySpeed, timestamp } = await request.json()

    console.log('[Capacity Tracking] Tracking order:', {
      orderId,
      weightKg,
      deliverySpeed,
    })

    if (!orderId || !weightKg) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, weightKg' },
        { status: 400 }
      )
    }

    // Update order with delivery metrics
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        weight_kg: weightKg,
        delivery_speed: deliverySpeed,
        capacity_tracked_at: timestamp,
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('[Capacity Tracking] Error updating order:', updateError.message)
      return NextResponse.json(
        { error: 'Failed to track capacity' },
        { status: 500 }
      )
    }

    // Log to capacity_log table for analytics
    const { error: logError } = await supabaseAdmin
      .from('capacity_logs')
      .insert({
        order_id: orderId,
        weight_kg: weightKg,
        delivery_speed: deliverySpeed,
        logged_at: timestamp,
      })

    if (logError) {
      console.warn('[Capacity Tracking] Warning - could not log to capacity table:', logError.message)
      // Don't fail the request, just warn
    }

    return NextResponse.json(
      { success: true, message: 'Order capacity tracked' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Capacity Tracking] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
