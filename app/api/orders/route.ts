import { NextRequest, NextResponse } from 'next/server'
import { getAllOrders, createOrder, updateOrder } from '@/lib/supabaseAdmin'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const result = await getAllOrders()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Get orders error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Map booking page payload to createOrder format
    const mappedData = {
      customer_id: body.uid,
      service_type: body.bookingData?.selectedService || 'standard',
      price: body.orderTotal || 0,
      bagCount: body.bookingData?.bagCount,
      pickupAddress: body.bookingData?.pickupAddress,
      deliveryAddress: body.bookingData?.deliveryAddress,
      delivery_speed: body.bookingData?.deliverySpeed,
      protection_plan: body.bookingData?.protectionPlan,
      notes: body.bookingData?.pickupInstructions,
      ...body.bookingData // Include all booking data fields
    }
    
    const result = await createOrder(mappedData)
    
    // Map Supabase response format to expected format
    if (result.data && !result.error) {
      return NextResponse.json({
        data: {
          ...result.data,
          orderId: result.data.id // Add orderId alias for backward compatibility
        }
      }, { status: 201 })
    }
    
    return NextResponse.json(result, { status: 500 })
  } catch (error) {
    console.error('[API] Create order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, status, paymentStatus } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      )
    }

    const result = await updateOrder(orderId, {
      status,
      payment_status: paymentStatus,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Update order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}
