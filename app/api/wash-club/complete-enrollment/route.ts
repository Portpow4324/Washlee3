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
      .from('wash_club_members')
      .insert({
        user_id: userId,
        enrollment_date: new Date().toISOString(),
        credits: 0,
        status: 'active',
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, member: data?.[0] })
  } catch (error: any) {
    console.error('Error completing enrollment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
