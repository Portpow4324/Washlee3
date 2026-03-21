import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Admin endpoint to confirm a user's email
 * Used during development when email verification is handled manually
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('[Admin] Confirming email:', email)

    // Get the user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json(
        { error: 'Failed to list users', details: listError },
        { status: 400 }
      )
    }

    const user = users?.find((u: any) => u.email === email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', email },
        { status: 404 }
      )
    }

    // Update user to mark email as confirmed
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('[Admin] Email confirmation error:', updateError)
      return NextResponse.json(
        { error: 'Failed to confirm email', details: updateError },
        { status: 400 }
      )
    }

    console.log('[Admin] ✓ Email confirmed for user:', email)

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?.user?.id || user.id,
        email: updatedUser?.user?.email || email,
        email_confirmed_at: updatedUser?.user?.email_confirmed_at
      }
    })
  } catch (error: any) {
    console.error('[Admin] Error confirming email:', error)
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
