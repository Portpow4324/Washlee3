import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('[Check Pro Inquiry] Checking status for user:', userId)

    const { data, error } = await supabase
      .from('pro_inquiries')
      .select('id, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('[Check Pro Inquiry] Query result:', { data, error: error?.message })

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('[Check Pro Inquiry] Database error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      proInquiry: data || null
    })
  } catch (err) {
    console.error('[Check Pro Inquiry] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    )
  }
}
