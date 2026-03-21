import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
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
