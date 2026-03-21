import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
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
