import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    // Get all orders (for debugging)
    const { data: allOrders, error: allError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, total_price')
      .limit(10)
      .order('created_at', { ascending: false })

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    console.log('[DEBUG] All orders in database:', allOrders?.length)
    console.log('[DEBUG] Orders:', allOrders)

    return NextResponse.json({
      count: allOrders?.length || 0,
      orders: allOrders || [],
    })
  } catch (error) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
