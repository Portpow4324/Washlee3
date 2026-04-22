import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

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

    // Extract pricing from order
    const totalPrice = order.total_price || 0
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    const weight = items?.weight || 0

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
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customer: customerData,
      pro: proData
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
