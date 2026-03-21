import { NextRequest, NextResponse } from 'next/server'
import { sendProOrderAssignment } from '@/lib/emailService'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/pro/assign-order
 * Assign an order to a pro and send notification email
 * 
 * Body:
 * - orderId: string (required)
 * - proId: string (required)
 * - proEmail: string (required)
 * - proName: string (required)
 * - customerName: string (required)
 * - pickupTime: string (optional)
 * - weight: string (optional)
 * - earnings: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      orderId, 
      proId,
      proEmail, 
      proName,
      customerName,
      pickupTime,
      weight,
      earnings
    } = await request.json()

    if (!orderId || !proId || !proEmail || !proName || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, proId, proEmail, proName, customerName' },
        { status: 400 }
      )
    }

    console.log('[PRO-ASSIGNMENT-API] Assigning order:', orderId, 'to pro:', proId)

    // Get order details from Supabase if not provided
    let orderDetails: any = {
      pickupTime: pickupTime || 'TBD',
      weight: weight || 'TBD',
      earnings: earnings || 'TBD'
    }

    try {
      const { data: orderDoc, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (!orderError && orderDoc) {
        orderDetails = {
          pickupTime: pickupTime || orderDoc.pickup_time || 'TBD',
          weight: weight || (orderDoc.estimated_weight ? `${orderDoc.estimated_weight}kg` : 'TBD'),
          earnings: earnings || 'TBD'
        }

        // Update order with assigned pro
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            pro_id: proId,
            status: 'confirmed',
            assigned_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (updateError) throw updateError
        console.log('[PRO-ASSIGNMENT-API] ✓ Order updated with pro assignment')
      }
    } catch (dbError: any) {
      console.warn('[PRO-ASSIGNMENT-API] Could not fetch order details:', dbError.message)
      // Continue with provided details
    }

    // Send pro order assignment email
    const orderLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/pro/orders/${orderId}`
    const emailResult = await sendProOrderAssignment(
      proEmail,
      proName,
      orderId,
      customerName,
      orderDetails.pickupTime,
      orderDetails.weight,
      orderDetails.earnings,
      orderLink
    )

    const emailSent = emailResult?.success || emailResult?.messageId ? true : false

    console.log('[PRO-ASSIGNMENT-API] ✓ Order assignment email sent:', emailSent)

    return NextResponse.json({
      success: true,
      orderId,
      proId,
      emailSent,
      message: 'Order assigned successfully',
    })
  } catch (error: any) {
    console.error('[PRO-ASSIGNMENT-API] Error assigning order:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to assign order' },
      { status: 500 }
    )
  }
}
