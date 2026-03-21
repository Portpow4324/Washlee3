import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('[ORDERS-SIMPLE] ===== NEW ORDER REQUEST =====')
  try {
    const body = await request.json()
    console.log('[ORDERS-SIMPLE] Order received:', {
      uid: body.uid,
      customerEmail: body.customerEmail,
      total: body.orderTotal,
    })

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // For now, just log and return a mock order ID
    // We'll create the orders table later
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('[ORDERS-SIMPLE] Created mock order:', mockOrderId)

    return NextResponse.json({
      data: {
        id: mockOrderId,
        orderId: mockOrderId,
        customer_id: body.uid,
        price: body.orderTotal,
        status: 'pending_payment',
        created_at: new Date().toISOString(),
      },
      success: true,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[ORDERS-SIMPLE] ❌ ERROR:', error.message)
    console.error('[ORDERS-SIMPLE] Full error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  console.log('[ORDERS-SIMPLE] GET request')
  return NextResponse.json({
    data: [],
    success: true,
  })
}
