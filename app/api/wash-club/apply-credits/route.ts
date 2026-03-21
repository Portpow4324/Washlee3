import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'


export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
  try {
    const { userId, credits } = await request.json()

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('wash_club_members')
      .update({ credits })
      .eq('user_id', userId)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, member: data?.[0] })
  } catch (error: any) {
    console.error('Error applying credits:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
