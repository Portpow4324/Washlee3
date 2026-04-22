/**
 * TEST ENDPOINT - Check if user profile exists
 * Returns user data from database
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('[TEST API] Checking user profile for:', userId)

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[TEST API] Error fetching user:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      console.log('[TEST API] User not found:', userId)
      return NextResponse.json({
        exists: false,
        userId,
        message: 'User profile does not exist in database',
      }, { status: 200 })
    }

    console.log('[TEST API] User found:', data)
    return NextResponse.json({
      exists: true,
      userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      data,
    }, { status: 200 })
  } catch (err) {
    console.error('[TEST API] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
