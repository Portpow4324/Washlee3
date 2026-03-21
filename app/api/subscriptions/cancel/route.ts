import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ current_plan: 'free', plan_end_date: null })
      .eq('id', userId)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, profile: data?.[0] })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
