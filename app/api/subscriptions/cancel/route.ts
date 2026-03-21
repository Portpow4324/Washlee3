import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
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
