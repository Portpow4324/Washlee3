/**
 * GET /api/delivery/status/[orderId]
 * Get delivery status and real-time updates for an order
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    console.log('[Delivery Status] Fetching status for order:', orderId)

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(
        `
        id,
        status,
        delivery_speed,
        weight_kg,
        created_at,
        pickup_date,
        estimated_delivery_date,
        delivery_address,
        customer_id,
        assigned_pro_id
      `
      )
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('[Delivery Status] Order not found:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get assigned pro details if available
    let proDetails = null
    if (order.assigned_pro_id) {
      const { data: pro } = await supabaseAdmin
        .from('employees')
        .select('id, first_name, last_name, phone, vehicle')
        .eq('id', order.assigned_pro_id)
        .single()

      proDetails = pro
    }

    // Calculate real-time metrics
    const createdTime = new Date(order.created_at)
    const now = new Date()
    const elapsedHours = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60)

    // Determine estimated delivery based on delivery speed
    let estimatedDeliveryHours = 24
    if (order.delivery_speed === 'express') {
      estimatedDeliveryHours = 6
    }
    const estimatedDeliveryTime = new Date(createdTime.getTime() + estimatedDeliveryHours * 60 * 60 * 1000)

    // Calculate progress percentage
    const progressPercent = Math.min((elapsedHours / estimatedDeliveryHours) * 100, 100)

    const status = {
      orderId: order.id,
      currentStatus: order.status, // pending, processing, in_transit, delivered, cancelled
      deliverySpeed: order.delivery_speed,
      weightKg: order.weight_kg,
      deliveryAddress: order.delivery_address,
      
      // Timeline
      createdAt: order.created_at,
      elapsedHours: parseFloat(elapsedHours.toFixed(1)),
      estimatedDeliveryHours,
      estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
      progressPercent: parseFloat(progressPercent.toFixed(1)),
      
      // Pro assignment
      assignedPro: proDetails || null,
      
      // Status messages
      statusMessage: getStatusMessage(order.status, order.delivery_speed, elapsedHours, estimatedDeliveryHours),
      nextStep: getNextStep(order.status),
      
      // ETA
      estimatedDeliveryDate: estimatedDeliveryTime.toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
      estimatedDeliveryTimeStr: estimatedDeliveryTime.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      
      lastUpdated: now.toISOString(),
    }

    return NextResponse.json({ status }, { status: 200 })
  } catch (error: any) {
    console.error('[Delivery Status] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate customer-friendly status message
 */
function getStatusMessage(
  status: string,
  deliverySpeed: string,
  elapsedHours: number,
  estimatedHours: number
): string {
  const speedLabel = deliverySpeed === 'express' ? 'Express' : 'Standard'

  switch (status) {
    case 'pending':
      return `Your order is in queue for ${speedLabel} delivery. We'll assign a team member soon.`
    case 'processing':
      return `Your laundry is being processed (${elapsedHours.toFixed(1)}/${estimatedHours} hours elapsed). On track for ${speedLabel} delivery.`
    case 'in_transit':
      return `Your order is on the way! A Washlee team member will deliver it soon.`
    case 'delivered':
      return `✅ Your order has been delivered!`
    case 'cancelled':
      return `❌ Your order was cancelled. Please contact support.`
    default:
      return `Order status: ${status}`
  }
}

/**
 * Get next action for customer
 */
function getNextStep(status: string): string {
  switch (status) {
    case 'pending':
      return 'Waiting for team assignment'
    case 'processing':
      return 'Your laundry is being cleaned'
    case 'in_transit':
      return 'Delivery in progress - be ready to receive'
    case 'delivered':
      return 'Order complete! Leave a review'
    case 'cancelled':
      return 'Contact support if you need help'
    default:
      return 'No action needed'
  }
}
