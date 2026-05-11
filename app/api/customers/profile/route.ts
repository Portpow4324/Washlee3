/**
 * API Route to fetch customer profile
 * Used by employee orders page to get customer name/email/phone
 * 
 * GET /api/customers/profile?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getBearerUser, hasAdminSession } from '@/lib/security/apiAuth'
import { cleanString, isUuid } from '@/lib/security/validation'

export async function GET(request: NextRequest) {
  try {
    const userId = cleanString(request.nextUrl.searchParams.get('userId'), 80)

    if (!userId || !isUuid(userId)) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const [user, adminSession] = await Promise.all([
      getBearerUser(request),
      hasAdminSession(request),
    ])

    if (!adminSession && user?.id !== userId) {
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const { data: assignedOrder, error: assignedOrderError } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('pro_id', user.id)
        .limit(1)
        .maybeSingle()

      if (assignedOrderError || !assignedOrder) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('full_name, name, email, phone')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[API] Error fetching customer:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customer profile' },
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
    return NextResponse.json(
      {
        name: data.full_name || data.name || 'Unknown',
        email: data.email || '',
        phone: data.phone || '',
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[API] Exception:', err)
    return NextResponse.json(
      { error: 'Failed to fetch customer profile' },
      { status: 500 }
    )
  }
}
