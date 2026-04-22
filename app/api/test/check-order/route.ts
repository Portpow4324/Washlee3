/**
 * TEST ENDPOINT - Check order details
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    console.log('[TEST API] Checking order:', orderId)

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('[TEST API] Error fetching order:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[TEST API] Order found:', {
      id: data.id,
      user_id: data.user_id,
      pro_id: data.pro_id,
      status: data.status,
      total_price: data.total_price,
    })

    return NextResponse.json({
      id: data.id,
      user_id: data.user_id,
      pro_id: data.pro_id,
      status: data.status,
      total_price: data.total_price,
      items: data.items,
    }, { status: 200 })
  } catch (err) {
    console.error('[TEST API] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
