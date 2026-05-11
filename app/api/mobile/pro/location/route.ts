import { NextRequest } from 'next/server'
import {
  getMobileClients,
  getMobileUser,
  insertNotification,
  mobileJson,
  mobileOptions,
  readNumber,
  readString,
} from '@/lib/mobileBackend'

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180
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
    const employeeId = readString(body, ['employeeId', 'employee_id', 'proId', 'pro_id'], user.id)
    const orderId = readString(body, ['orderId', 'order_id'])
    const latitude = readNumber(body, ['latitude', 'lat'], Number.NaN)
    const longitude = readNumber(body, ['longitude', 'lng', 'lon'], Number.NaN)
    const accuracy = readNumber(body, ['accuracy', 'accuracyMeters'], 0)
    const heading = readNumber(body, ['heading'], 0)
    const speed = readNumber(body, ['speed'], 0)

    if (employeeId !== user.id) {
      return mobileJson({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return mobileJson({ success: false, error: 'Invalid latitude or longitude' }, { status: 400 })
    }

    const { admin } = getMobileClients()
    const now = new Date().toISOString()

    if (orderId) {
      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle()

      if (orderError) {
        console.error('[Mobile Pro Location] Order lookup failed:', orderError.message)
        return mobileJson({ success: false, error: 'Failed to load order' }, { status: 500 })
      }

      if (!order) return mobileJson({ success: false, error: 'Order not found' }, { status: 404 })

      const assignedProId = orderProId(order)
      if (assignedProId && assignedProId !== employeeId) {
        return mobileJson({ success: false, error: 'Forbidden' }, { status: 403 })
      }
    }

    const employeeLocation = {
      current_latitude: latitude,
      current_longitude: longitude,
      current_location_accuracy_m: accuracy || null,
      current_location_heading: heading || null,
      current_location_speed: speed || null,
      current_location_updated_at: now,
      location_sharing_enabled: true,
      updated_at: now,
    }

    const { error: employeeError } = await admin
      .from('employees')
      .update(employeeLocation)
      .eq('id', employeeId)

    if (employeeError) {
      console.error('[Mobile Pro Location] Employee update failed:', employeeError.message)
      return mobileJson({ success: false, error: 'Failed to update pro location' }, { status: 500 })
    }

    if (orderId) {
      const { error: orderLocationError } = await admin
        .from('orders')
        .update({
          pro_latitude: latitude,
          pro_longitude: longitude,
          pro_location_accuracy_m: accuracy || null,
          pro_location_heading: heading || null,
          pro_location_updated_at: now,
          updated_at: now,
        })
        .eq('id', orderId)

      if (orderLocationError) {
        console.warn('[Mobile Pro Location] Order location mirror failed:', orderLocationError.message)
      }
    }

    const { error: eventError } = await admin
      .from('pro_location_events')
      .insert({
        employee_id: employeeId,
        order_id: orderId || null,
        latitude,
        longitude,
        accuracy_m: accuracy || null,
        heading: heading || null,
        speed: speed || null,
        created_at: now,
      })

    if (eventError) {
      console.warn('[Mobile Pro Location] Location event insert failed:', eventError.message)
    }

    if (orderId) {
      const { data: order } = await admin
        .from('orders')
        .select('user_id, customer_id')
        .eq('id', orderId)
        .maybeSingle()
      const customerId = readString(order, ['user_id', 'customer_id'])
      if (customerId) {
        await insertNotification(admin, {
          userId: customerId,
          type: 'pro_location_updated',
          title: 'Your pro is on the way',
          message: 'Your Washlee Pro location was updated for this order.',
          data: { orderId },
        })
      }
    }

    return mobileJson({
      success: true,
      data: {
        employeeId,
        orderId: orderId || null,
        latitude,
        longitude,
        updatedAt: now,
      },
    })
  } catch (error) {
    console.error('[Mobile Pro Location] Unexpected error:', error)
    return mobileJson({ success: false, error: 'Failed to update location' }, { status: 500 })
  }
}
