import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  console.log('[CHECK_USER] POST /api/auth/check-user called')
  
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceRoleClient()

    // Check if user exists in auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('[CHECK_USER] Error listing users:', listError.message)
      return NextResponse.json(
        { error: 'Failed to check user' },
        { status: 500 }
      )
    }

    const authUser = users?.find(u => u.email === email)
    
    if (!authUser) {
      console.log('[CHECK_USER] User not found:', email)
      return NextResponse.json({
        exists: false,
        phoneVerified: false,
        hasPhone: false
      })
    }

    // User exists - check phone verification status
    const { data: userData } = await supabase
      .from('users')
      .select('phone_verified, phone')
      .eq('id', authUser.id)
      .single()

    console.log('[CHECK_USER] User found:', email)
    return NextResponse.json({
      exists: true,
      userId: authUser.id,
      phoneVerified: userData?.phone_verified || false,
      hasPhone: !!userData?.phone,
      email
    })
  } catch (err: any) {
    console.error('[CHECK_USER] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
