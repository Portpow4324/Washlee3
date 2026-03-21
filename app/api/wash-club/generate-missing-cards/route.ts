import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'


export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient()
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Generate card ID
    const cardId = `card_${Date.now()}`

    const { data, error } = await supabase
      .from('wash_club_cards')
      .insert({
        user_id: userId,
        card_id: cardId,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, card: data?.[0] })
  } catch (error: any) {
    console.error('Error generating card:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
