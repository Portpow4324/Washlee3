import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, order: data?.[0] })
  } catch (error: any) {
    console.error('Error cancelling order:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
