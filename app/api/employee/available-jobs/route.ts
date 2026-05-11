import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendProAcceptedJobEmail } from '@/lib/emailMarketing'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceKey)

type JsonRecord = Record<string, unknown>

function parseItems(raw: unknown): JsonRecord {
  if (!raw) return {}
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as JsonRecord
  if (typeof raw === 'string') {
    try {
      const decoded = JSON.parse(raw)
      return decoded && typeof decoded === 'object' && !Array.isArray(decoded)
        ? decoded as JsonRecord
        : {}
    } catch {
      return {}
    }
  }
  return {}
}

function readString(source: JsonRecord | null | undefined, keys: string[], fallback = '') {
  if (!source) return fallback
  for (const key of keys) {
    const value = source[key]
    if (value === null || value === undefined) continue
    const text = String(value).trim()
    if (text) return text
  }
  return fallback
}

function readNumber(source: JsonRecord | null | undefined, keys: string[], fallback = 0) {
  if (!source) return fallback
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return fallback
}

function parseDeniedBy(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

function estimatedProEarnings(totalPrice: number) {
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) return 0
  return Math.round(totalPrice * 0.75 * 100) / 100
}

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return { userId: null, error: 'Missing authorization token' }

  const auth = createClient(supabaseUrl, anonKey)
  const { data, error } = await auth.auth.getUser(token)

  if (error || !data.user) return { userId: null, error: 'Invalid or expired token' }
  return { userId: data.user.id, error: null }
}

async function resolveJob(jobIdOrOrderId: string) {
  let { data, error } = await supabaseAdmin
    .from('pro_jobs')
    .select('*')
    .eq('id', jobIdOrOrderId)
    .maybeSingle()

  if (!data && error?.code === '22P02') {
    error = null
  }

  if (!data && !error) {
    const fallback = await supabaseAdmin
      .from('pro_jobs')
      .select('*')
      .eq('order_id', jobIdOrOrderId)
      .maybeSingle()
    data = fallback.data
    error = fallback.error
  }

  return { data, error }
}

async function updateOrderAssignment(orderId: string, employeeId: string) {
  const now = new Date().toISOString()
  const update = {
    pro_id: employeeId,
    employee_id: employeeId,
    assigned_pro_id: employeeId,
    status: 'assigned',
    stage_status: 'assigned',
    stage_updated_at: now,
    updated_at: now,
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update(update)
    .eq('id', orderId)

  if (!error) return

  let retry = await supabaseAdmin
    .from('orders')
    .update({
      pro_id: employeeId,
      assigned_pro_id: employeeId,
      status: 'assigned',
      stage_status: 'assigned',
      stage_updated_at: now,
      updated_at: now,
    })
    .eq('id', orderId)

  if (retry.error) {
    retry = await supabaseAdmin
      .from('orders')
      .update({
        employee_id: employeeId,
        assigned_pro_id: employeeId,
        status: 'assigned',
        stage_status: 'assigned',
        stage_updated_at: now,
        updated_at: now,
      })
      .eq('id', orderId)
  }

  if (retry.error) {
    retry = await supabaseAdmin
      .from('orders')
      .update({
        status: 'assigned',
        stage_status: 'assigned',
        stage_updated_at: now,
        updated_at: now,
      })
      .eq('id', orderId)
  }

  if (retry.error) {
    console.warn('[AvailableJobs] Failed to update order assignment:', retry.error.message)
  }
}

async function createUserNotification(userId: string, payload: {
  type: string
  title: string
  message: string
  data?: JsonRecord
}) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.warn('[AvailableJobs] Failed to create notification:', error.message)
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (auth.error || !auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId') || auth.userId
  const status = searchParams.get('status') || 'available'
  const limit = Math.min(Number(searchParams.get('limit') || 20), 50)

  if (!employeeId) {
    return NextResponse.json({ success: false, error: 'Missing employeeId parameter' }, { status: 400 })
  }

  if (auth.userId && employeeId !== auth.userId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('pro_jobs')
      .select('*')
      .eq('status', status)
      .is('pro_id', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[AvailableJobs] Fetch error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 })
    }

    const result = []

    for (const job of jobs || []) {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', job.order_id)
        .maybeSingle()

      if (!order) continue

      const deniedBy = parseDeniedBy(order.denied_by)
      if (deniedBy.includes(employeeId)) continue

      const items = parseItems(order.items)
      const totalPrice = readNumber(order, ['total_price', 'totalPrice'])
      const weight = readNumber(order, ['weight', 'weight_kg'], readNumber(items, ['weight', 'estimatedWeight'], 10))
      const pickupAddress = readString(order, ['pickup_address', 'pickupAddress'])

      let customerName = readString(order, ['customer_name', 'customerName'])
      if (!customerName && order.user_id) {
        const { data: customer } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', order.user_id)
          .maybeSingle()
        customerName = readString(customer, ['full_name', 'name', 'first_name'], 'Customer')
      }

      result.push({
        id: job.id,
        jobId: job.id,
        order_id: job.order_id,
        orderId: job.order_id,
        status: job.status,
        posted_at: job.posted_at || job.created_at,
        created_at: job.created_at,
        customerName,
        customer_name: customerName,
        pickupAddress,
        pickup_address: pickupAddress,
        scheduledPickupDate: order.scheduled_pickup_date || order.pickup_date || items.pickupDate,
        pickup_date: order.scheduled_pickup_date || order.pickup_date || items.pickupDate,
        deliveryDate: order.scheduled_delivery_date || order.delivery_date || items.deliveryDate,
        delivery_time_slot: order.delivery_time_slot || items.deliveryTimeSlot,
        serviceType: order.service_type || items.service_type,
        deliverySpeed: order.delivery_speed || items.delivery_speed,
        protectionPlan: order.protection_plan || items.protection_plan,
        weight,
        weight_kg: weight,
        estimatedWeight: weight,
        totalPrice,
        total_price: totalPrice,
        estimatedEarnings: estimatedProEarnings(totalPrice),
        earnings: estimatedProEarnings(totalPrice),
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
    })
  } catch (error) {
    console.error('[AvailableJobs] Route error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (auth.error || !auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  try {
    const { jobId, employeeId, action } = await request.json()

    if (!jobId || !employeeId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: jobId, employeeId, action' },
        { status: 400 }
      )
    }

    if (auth.userId && employeeId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { data: jobData, error: jobFetchError } = await resolveJob(String(jobId))
    if (jobFetchError || !jobData) {
      console.error('[AvailableJobs] Job lookup failed:', jobFetchError)
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    const { data: orderData, error: orderFetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', jobData.order_id)
      .single()

    if (orderFetchError || !orderData) {
      console.error('[AvailableJobs] Order lookup failed:', orderFetchError)
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (action === 'reject') {
      const deniedBy = Array.from(new Set([...parseDeniedBy(orderData.denied_by), employeeId]))
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ denied_by: deniedBy, updated_at: new Date().toISOString() })
        .eq('id', orderData.id)

      if (error) {
        console.warn('[AvailableJobs] Could not persist denied_by:', error.message)
      }

      return NextResponse.json({
        success: true,
        message: 'Job declined',
      })
    }

    if (action !== 'accept') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    if (jobData.status !== 'available' || jobData.pro_id) {
      return NextResponse.json(
        { success: false, error: 'This job has already been claimed' },
        { status: 409 }
      )
    }

    let accepted = await supabaseAdmin
      .from('pro_jobs')
      .update({
        pro_id: employeeId,
        status: 'accepted',
        stage: 'assigned',
        accepted_at: new Date().toISOString(),
        stage_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobData.id)
      .eq('status', 'available')
      .is('pro_id', null)
      .select()
      .single()

    if (accepted.error?.code === '23503') {
      console.warn('[AvailableJobs] pro_id FK rejected, recording accepted status only:', accepted.error.message)
      accepted = await supabaseAdmin
        .from('pro_jobs')
        .update({
          status: 'accepted',
          stage: 'assigned',
          accepted_at: new Date().toISOString(),
          stage_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobData.id)
        .eq('status', 'available')
        .select()
        .single()
    }

    if (accepted.error || !accepted.data) {
      console.error('[AvailableJobs] Accept failed:', accepted.error)
      return NextResponse.json({ success: false, error: 'Failed to accept job' }, { status: 500 })
    }

    await updateOrderAssignment(orderData.id, employeeId)

    const { data: proData } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .maybeSingle()

    const { data: customerData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', orderData.user_id)
      .maybeSingle()

    await createUserNotification(orderData.user_id, {
      type: 'order_assigned',
      title: 'Your order has a Washlee Pro',
      message: `${readString(proData, ['name', 'first_name'], 'Your Washlee Pro')} accepted your order.`,
      data: {
        orderId: orderData.id,
        jobId: jobData.id,
        proId: employeeId,
      },
    })

    await createUserNotification(employeeId, {
      type: 'job_claimed',
      title: 'Job claimed',
      message: 'This pickup is now in your jobs list.',
      data: {
        orderId: orderData.id,
        jobId: jobData.id,
      },
    })

    if (customerData?.email && proData) {
      try {
        await sendProAcceptedJobEmail({
          to: customerData.email,
          customerName: readString(customerData, ['full_name', 'name'], 'Valued Customer'),
          proName: readString(proData, ['name', 'first_name'], 'Your Washlee Pro'),
          proPhone: readString(proData, ['phone'], 'Contact via email'),
          proEmail: readString(proData, ['email'], 'support@washlee.com'),
          orderAmount: readNumber(orderData, ['total_price']),
          orderId: orderData.id,
        })
      } catch (emailError) {
        console.error('[AvailableJobs] Customer email failed:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Job accepted successfully',
      data: accepted.data,
    })
  } catch (error) {
    console.error('[AvailableJobs] Job action error:', error)
    return NextResponse.json({ success: false, error: 'Failed to process job action' }, { status: 500 })
  }
}
