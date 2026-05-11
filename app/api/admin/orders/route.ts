import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/admin/orders
 * Get all orders across the system (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        total_price,
        created_at,
        delivery_address,
        tracking_code,
        users(name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (fallbackError) {
        throw fallbackError
      }

      return NextResponse.json({ success: true, orders: fallbackData || [] })
    }

    return NextResponse.json({ success: true, orders: data || [] })
  } catch (error) {
    console.error('[Admin Orders] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load orders' },
      { status: 500 }
    )
  }
}
