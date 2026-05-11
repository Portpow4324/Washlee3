import { NextRequest } from 'next/server'
import {
  getMobileClients,
  getMobileUser,
  insertNotification,
  mobileJson,
  mobileOptions,
  readString,
} from '@/lib/mobileBackend'

const allowedStages = ['assigned', 'pickup', 'picked_up', 'cleaning', 'in_transit', 'delivered'] as const

type Stage = typeof allowedStages[number]

function normalizeStage(value: unknown): Stage | null {
  const raw = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_')
  if (raw === 'picked' || raw === 'pickedup') return 'picked_up'
  if (raw === 'transit' || raw === 'out_for_delivery') return 'in_transit'
  if (raw === 'processing' || raw === 'washing') return 'cleaning'
  if (allowedStages.includes(raw as Stage)) return raw as Stage
  return null
}

function stageTimestampColumn(stage: Stage) {
  switch (stage) {
    case 'pickup':
      return 'pickup_started_at'
    case 'picked_up':
      return 'actual_pickup_date'
    case 'cleaning':
      return 'cleaning_started_at'
    case 'in_transit':
      return 'in_transit_at'
    case 'delivered':
      return 'actual_delivery_date'
    default:
      return null
  }
}

function stageTitle(stage: Stage) {
  switch (stage) {
    case 'assigned':
      return 'Pro assigned'
    case 'pickup':
      return 'Pickup started'
    case 'picked_up':
      return 'Laundry picked up'
    case 'cleaning':
      return 'Laundry is being cleaned'
    case 'in_transit':
      return 'Laundry is on the way'
    case 'delivered':
      return 'Order delivered'
  }
}

function orderProId(order: Record<string, unknown>) {
  return readString(order, ['pro_id', 'employee_id', 'assigned_pro_id'])
}

export async function OPTIONS() {
  return mobileOptions()
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request)
    if (authError || !user) return mobileJson({ success: false, error: authError }, { status: 401 })

    const body = await request.json()
    const orderId = readString(body, ['orderId', 'order_id'])
    const employeeId = readString(body, ['employeeId', 'employee_id', 'proId', 'pro_id'], user.id)
    const stage = normalizeStage(body.stage || body.status || body.nextStage)
    const note = readString(body, ['note', 'message'])

    if (!orderId || !stage) {
      return mobileJson(
        { success: false, error: 'Missing orderId or valid stage' },
        { status: 400 }
      )
    }

    if (employeeId !== user.id) {
      return mobileJson({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { admin } = getMobileClients()
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) {
      console.error('[Mobile Pro Status] Order lookup failed:', orderError.message)
      return mobileJson({ success: false, error: 'Failed to load order' }, { status: 500 })
    }

    if (!order) return mobileJson({ success: false, error: 'Order not found' }, { status: 404 })

    const assignedProId = orderProId(order)
    if (assignedProId && assignedProId !== employeeId) {
      return mobileJson({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const history = Array.isArray(order.status_history) ? order.status_history : []
    const update: Record<string, unknown> = {
      status: stage,
      stage_status: stage,
      stage_updated_at: now,
      status_history: [
        ...history,
        {
          stage,
          employeeId,
          note: note || null,
          createdAt: now,
        },
      ],
      updated_at: now,
    }

    if (!assignedProId) {
      update.pro_id = employeeId
      update.employee_id = employeeId
      update.assigned_pro_id = employeeId
    }

    const timestampColumn = stageTimestampColumn(stage)
    if (timestampColumn) update[timestampColumn] = now

    const { data: updatedOrder, error: updateError } = await admin
      .from('orders')
      .update(update)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('[Mobile Pro Status] Order update failed:', updateError.message)
      return mobileJson({ success: false, error: 'Failed to update order status' }, { status: 500 })
    }

    await admin
      .from('pro_jobs')
      .update({
        status: stage === 'delivered' ? 'completed' : 'in-progress',
        stage,
        stage_updated_at: now,
        updated_at: now,
      })
      .eq('order_id', orderId)

    const customerId = readString(updatedOrder, ['user_id', 'customer_id'])
    if (customerId) {
      await insertNotification(admin, {
        userId: customerId,
        type: 'order_status_updated',
        title: stageTitle(stage),
        message: stage === 'delivered'
          ? 'Your Washlee order has been delivered.'
          : 'Your Washlee order status has been updated.',
        data: { orderId, stage },
      })
    }

    await insertNotification(admin, {
      userId: employeeId,
      type: 'pro_order_status_updated',
      title: stageTitle(stage),
      message: `Order status marked as ${stage.replace(/_/g, ' ')}.`,
      data: { orderId, stage },
    })

    return mobileJson({
      success: true,
      data: {
        order: updatedOrder,
        stage,
      },
    })
  } catch (error) {
    console.error('[Mobile Pro Status] Unexpected error:', error)
    return mobileJson({ success: false, error: 'Failed to update order status' }, { status: 500 })
  }
}
