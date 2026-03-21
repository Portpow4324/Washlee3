import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * Verify that a user is an admin
 * Called from API routes and server actions
 */
export async function verifyAdmin(
  idToken: string
): Promise<{ isAdmin: boolean; uid: string | null }> {
  try {
    // Verify JWT using Supabase session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session?.user) {
      return { isAdmin: false, uid: null }
    }

    const uid = sessionData.session.user.id

    // Check Supabase for admin flag
    const { data: userData, error: queryError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', uid)
      .single()

    if (queryError || !userData) {
      return { isAdmin: false, uid: null }
    }

    return { isAdmin: userData.is_admin === true, uid }
  } catch (error) {
    console.error('Admin verification error:', error)
    return { isAdmin: false, uid: null }
  }
}

/**
 * Middleware to protect admin API routes
 */
export async function adminMiddleware(req: NextRequest) {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.substring(7)

    // Verify admin status
    const { isAdmin, uid } = await verifyAdmin(idToken)

    if (!isAdmin || !uid) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Pass admin info to the route via headers
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-admin-uid', uid)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  } catch (error) {
    console.error('Admin middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Simple function to set a user as admin
 */
export async function makeUserAdmin(uid: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        is_admin: true,
        admin_since: new Date().toISOString()
      })
      .eq('id', uid)

    if (error) {
      throw error
    }

    console.log(`User ${uid} made admin`)
    return true
  } catch (error) {
    console.error('Error making user admin:', error)
    return false
  }
}
