import { NextRequest, NextResponse } from 'next/server'
import { getAllOrders, createOrder, updateOrder } from '@/lib/supabaseAdmin'
import { createClient } from '@supabase/supabase-js'
import { hasAdminSession } from '@/lib/security/apiAuth'
import { cleanString } from '@/lib/security/validation'
import { calculateBookingQuote, getMobilePricingConfig } from '@/lib/mobilePricing'

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json({ error: 'Admin session required' }, { status: 401 })
    }

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
    const bookingData = body.bookingData || body
    const pricingConfig = await getMobilePricingConfig()
    const quote = calculateBookingQuote({
      estimatedWeight: bookingData?.estimatedWeight,
      weight: bookingData?.weight,
      customWeight: bookingData?.customWeight,
      bagCount: bookingData?.bagCount,
      deliverySpeed: bookingData?.deliverySpeed || body.delivery_speed,
      protectionPlan: bookingData?.protectionPlan || body.protection_plan,
      hangDry: bookingData?.hangDry,
      returnsOnHangers: bookingData?.returnsOnHangers,
    }, pricingConfig)

    // Map booking page payload to createOrder format. The server quote is the
    // source of truth for order total; the client-sent total is treated as
    // display-only context and never trusted for the stored amount.
    const mappedData = {
      ...bookingData, // Include all booking data fields, then override trusted server values below.
      user_id: body.uid || body.customer_id,
      customerName: body.customerName || bookingData?.customerName,
      customerEmail: body.customerEmail || body.email || bookingData?.customerEmail,
      customerPhone: body.customerPhone || body.phone || bookingData?.customerPhone,
      service_type: bookingData?.selectedService || body.service_type || 'standard',
      total_price: quote.total,
      weight: quote.estimatedWeight,
      bagCount: bookingData?.bagCount,
      pickupAddress: bookingData?.pickupAddress || body.pickup_address || body.delivery_address,
      deliveryAddress: bookingData?.deliveryAddress || body.delivery_address,
      delivery_speed: bookingData?.deliverySpeed || body.delivery_speed,
      protection_plan: bookingData?.protectionPlan || body.protection_plan,
      notes: bookingData?.pickupInstructions || body.pickup_instructions,
      pickupDate: bookingData?.pickupDate || body.pickup_date,
      deliveryDate: bookingData?.deliveryDate || body.delivery_date,
      deliveryTimeSlot: bookingData?.deliveryTimeSlot || body.delivery_time_slot,
      pricingQuote: quote,
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
            pickupTime: 'Your pro will confirm after accepting',
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
    const orderId = cleanString(body.orderId, 100)
    const status = cleanString(body.status, 40)
    const paymentStatus = cleanString(body.paymentStatus, 40)

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      )
    }

    const adminSession = await hasAdminSession(request)
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id, user_id, pro_id')
      .eq('id', orderId)
      .maybeSingle()

    if (existingOrderError) {
      return NextResponse.json({ error: 'Failed to verify order access' }, { status: 500 })
    }

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!adminSession && existingOrder.user_id !== user.id && existingOrder.pro_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, string> = {}
    if (status) updates.status = status
    if (paymentStatus) updates.payment_status = paymentStatus

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    const result = await updateOrder(orderId, updates)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Update order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function PUT() {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 })
}
