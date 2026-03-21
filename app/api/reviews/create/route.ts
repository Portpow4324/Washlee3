import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
  try {
    const { orderId, rating, comment, userId } = await request.json()

    if (!orderId || !rating || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        order_id: orderId,
        user_id: userId,
        rating,
        comment,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, review: data?.[0] })
  } catch (error: any) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
