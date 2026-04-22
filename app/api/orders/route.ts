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
    console.log('[API] POST /api/orders - Received payload:', JSON.stringify(body).substring(0, 200))
    
    // Map booking page payload to createOrder format
    const mappedData = {
      user_id: body.uid,
      service_type: body.bookingData?.selectedService || 'standard',
      total_price: body.orderTotal || 0,
      bagCount: body.bookingData?.bagCount,
      pickupAddress: body.bookingData?.pickupAddress,
      deliveryAddress: body.bookingData?.deliveryAddress,
      delivery_speed: body.bookingData?.deliverySpeed,
      protection_plan: body.bookingData?.protectionPlan,
      notes: body.bookingData?.pickupInstructions,
      ...body.bookingData // Include all booking data fields
    }
    
    console.log('[API] Calling createOrder with:', { user_id: mappedData.user_id, total_price: mappedData.total_price })
    const result = await createOrder(mappedData)
    console.log('[API] createOrder result:', result)
    
    // Map Supabase response format to expected format
    if (result.data && !result.error) {
      const orderId = result.data.id
      
      // Send order confirmation email asynchronously (don't block the response)
      try {
        console.log('[API] Sending order confirmation email for order:', orderId)
        const { sendOrderConfirmationEmail } = await import('@/lib/emailMarketing')
        
        // Get customer email from body or look it up
        const customerEmail = body.email || body.customerEmail
        const customerName = body.customerName || 'Valued Customer'
        
        if (customerEmail) {
          sendOrderConfirmationEmail({
            to: customerEmail,
            customerName: customerName,
            orderId: orderId,
            pickupDate: mappedData.pickupDate || 'Soon',
            pickupTime: mappedData.pickupTime || 'To be scheduled',
            pickupAddress: mappedData.pickupAddress || 'As provided',
            totalPrice: mappedData.total_price,
            serviceType: mappedData.service_type,
            weight: mappedData.weight,
            orderUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com'}/tracking/${orderId}`,
          }).catch(err => {
            console.error('[API] Warning: Failed to send order confirmation email:', err)
            // Don't fail the API response if email fails
          })
        }
      } catch (err) {
        console.error('[API] Error in order confirmation email:', err)
        // Don't fail the API response if email fails
      }
      
      return NextResponse.json({
        data: {
          ...result.data,
          orderId: result.data.id // Add orderId alias for backward compatibility
        }
      }, { status: 201 })
    }
    
    console.error('[API] createOrder failed with error:', result.error)
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
