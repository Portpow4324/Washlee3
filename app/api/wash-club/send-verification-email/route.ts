import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // TODO: Integrate email service (SendGrid/Resend)
    console.log(`Verification email would be sent to: ${email}`)

    const { data, error } = await supabase
      .from('wash_club_verification_emails')
      .insert({
        email,
        verification_token: `token_${Date.now()}`,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, record: data?.[0] })
  } catch (error: any) {
    console.error('Error sending verification email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
