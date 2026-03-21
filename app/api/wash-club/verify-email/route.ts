import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'


export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json({ error: 'Token and email required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('wash_club_verification_emails')
      .update({ verified_at: new Date().toISOString() })
      .eq('verification_token', token)
      .eq('email', email)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, record: data?.[0] })
  } catch (error: any) {
    console.error('Error verifying email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
