/**
 * TEST ENDPOINT - Test user query with admin client
 * This tests if RLS is the problem
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    console.log('[TEST API] Testing user fetch with admin client for:', userId)

    // Test with admin client (bypasses RLS)
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('name, email, phone')
      .eq('id', userId)
      .maybeSingle()

    console.log('[TEST API] Admin query result:', { error: adminError, data: adminData })

    if (adminError) {
      return NextResponse.json({
        error: adminError.message,
        code: adminError.code,
      }, { status: 400 })
    }

    return NextResponse.json({
      found: !!adminData,
      data: adminData,
    }, { status: 200 })
  } catch (err) {
    console.error('[TEST API] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}
