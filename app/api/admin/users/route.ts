import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Admin endpoint to manage test users
 * GET - List all users
 * DELETE - Delete a specific user by email
 */

export async function GET(request: NextRequest) {
  try {
    // Get all auth users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to list users', details: usersError },
        { status: 400 }
      )
    }

    // Get all customer profiles
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id, email, first_name, last_name, created_at, account_status')

    if (customersError) {
      console.error('[Admin] Error fetching customers:', customersError)
    }

    return NextResponse.json({
      authUsersCount: users?.length || 0,
      customersCount: customers?.length || 0,
      authUsers: users?.map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at
      })) || [],
      customers: customers || []
    })
  } catch (error: any) {
    console.error('[Admin] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('[Admin] Deleting user:', email)

    // Find the user by email
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

    // Delete the user (this also cascades to customers table due to FK constraint)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete user', details: deleteError },
        { status: 400 }
      )
    }

    console.log('[Admin] ✓ User deleted:', email, user.id)

    return NextResponse.json({
      success: true,
      deletedUser: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error: any) {
    console.error('[Admin] Delete error:', error)
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
