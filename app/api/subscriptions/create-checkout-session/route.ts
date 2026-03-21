import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, planType } = await request.json()

    if (!userId || !planType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create checkout session
    const sessionId = `session_${Date.now()}`
    
    const { data, error } = await supabase
      .from('checkout_sessions')
      .insert({
        user_id: userId,
        plan_type: planType,
        session_id: sessionId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, sessionId, session: data?.[0] })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
