import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
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
