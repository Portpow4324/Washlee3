/**
 * API Route to fetch customer profile
 * Used by employee orders page to get customer name/email/phone
 * 
 * GET /api/customers/profile?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS and fetch customer profile
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('full_name, name, email, phone')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[API] Error fetching customer:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        {
          name: 'Unknown',
          email: '',
          phone: '',
        },
        { status: 200 }
      )
    }

    // Return full_name if available, otherwise name
    return NextResponse.json({
      name: data.full_name || data.name || 'Unknown',
      email: data.email || '',
      phone: data.phone || '',
    }, { status: 200 })
  } catch (err) {
    console.error('[API] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
