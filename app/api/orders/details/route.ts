import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBearerUser, hasAdminSession } from '@/lib/security/apiAuth'
import { cleanString } from '@/lib/security/validation'

function sanitizePublicItems(items: unknown) {
  if (!items || typeof items !== 'object' || Array.isArray(items)) return items

  const privateKeyPattern = /(address|phone|email|name|instruction|note|postcode|city|state)/i
  return Object.fromEntries(
    Object.entries(items as Record<string, unknown>)
      .filter(([key]) => !privateKeyPattern.test(key))
      .map(([key, value]) => [key, typeof value === 'string' ? cleanString(value, 200) : value])
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = cleanString(searchParams.get('orderId'), 100)

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 })
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching order:', error)
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const [authenticatedUser, adminSession] = await Promise.all([
      getBearerUser(request),
      hasAdminSession(request),
    ])
    const canViewPrivateDetails =
      adminSession ||
      Boolean(authenticatedUser && (authenticatedUser.id === order.user_id || authenticatedUser.id === order.pro_id))

    // Extract pricing from order
    const totalPrice = order.total_price || 0
    let items: Record<string, unknown> | null = null
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    } catch {
      items = null
    }
    const weight = typeof items?.weight === 'number' ? items.weight : 0

    if (!canViewPrivateDetails) {
      return NextResponse.json({
        id: order.id,
        totalPrice,
        weight,
        items: sanitizePublicItems(items),
        status: order.status,
        scheduledPickupDate: order.scheduled_pickup_date,
        scheduledDeliveryDate: order.scheduled_delivery_date,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      })
    }

    // Fetch customer details
    let customerData = null
    if (order.user_id) {
      const { data: customer } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone')
        .eq('id', order.user_id)
        .maybeSingle()
      customerData = customer
    }

    // Fetch pro details if assigned
    let proData = null
    let serviceAddress = null
    if (order.pro_id) {
      const { data: pro } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone')
        .eq('id', order.pro_id)
        .maybeSingle()
      proData = pro

      // Fetch employee's service address
      const { data: employee } = await supabase
        .from('employees')
        .select('address, city, state, postcode, country')
        .eq('user_id', order.pro_id)
        .maybeSingle()
      
      if (employee && employee.address) {
        const addressParts = [
          employee.address,
          employee.city,
          employee.state,
          employee.postcode,
          employee.country
        ].filter(Boolean)
        serviceAddress = addressParts.join(', ')
      }
    }

    const { data: job } = await supabase
      .from('pro_jobs')
      .select('id, status, posted_at, accepted_at, updated_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      id: order.id,
      pro_id: order.pro_id,
      totalPrice,
      weight,
      items,
      pickupAddress: order.pickup_address,
      deliveryAddress: order.delivery_address,
      serviceAddress: serviceAddress,
      status: order.status,
      scheduledPickupDate: order.scheduled_pickup_date,
      pickupTimeStatus: items?.pickupTimeStatus || 'pro_to_confirm',
      scheduledDeliveryDate: order.scheduled_delivery_date || items?.deliveryDate,
      deliveryTimeSlot: order.delivery_time_slot || items?.deliveryTimeSlot,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      job: job ? {
        id: job.id,
        status: job.status,
        postedAt: job.posted_at,
        acceptedAt: job.accepted_at,
        updatedAt: job.updated_at
      } : null,
      customer: customerData,
      pro: proData
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
