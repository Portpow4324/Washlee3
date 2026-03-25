import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'
import { verifyCode } from '@/lib/serverVerification'

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client (lazy initialized)
    const supabase = getSupabaseAdminClient()

    console.log('[VerifyCode] POST endpoint called')
    const body = await request.json()
    const { email, code, phone } = body

    console.log('[VerifyCode] Verifying code for email:', email)
    console.log('[VerifyCode] Code entered:', code)

    if (!email || !code) {
      console.error('[VerifyCode] Missing email or code')
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Verify code using in-memory storage (server verification)
    console.log('[VerifyCode] Checking in-memory verification code...')
    const phoneForVerification = phone || ''
    const isCodeValid = await verifyCode(email, phoneForVerification, code)
    
    if (!isCodeValid) {
      console.warn('[VerifyCode] Code verification failed: Invalid or expired code')
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    console.log('[VerifyCode] ✓ Code is valid')

    // Confirm email in Supabase Auth by looking up user by email
    console.log('[VerifyCode] Looking up user by email in Supabase Auth...')
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('[VerifyCode] Failed to list users:', listError.message)
      return NextResponse.json({
        success: true,
        message: 'Code verified but email confirmation in auth failed',
        email,
        warning: 'Code was verified but Supabase email confirmation could not be completed'
      })
    }

    // Find user by email
    const authUser = authUsers.users.find(u => u.email === email)
    
    if (authUser) {
      console.log('[VerifyCode] Found user in auth:', authUser.id)
      console.log('[VerifyCode] Confirming email for user:', authUser.id)
      
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { email_confirm: true }
      )

      if (confirmError) {
        console.error('[VerifyCode] Failed to confirm email in auth:', confirmError.message)
        // Don't fail - code was verified, just email confirmation might not work
      } else {
        console.log('[VerifyCode] ✓ Email confirmed in Supabase Auth')
      }
    } else {
      console.warn('[VerifyCode] User not found in Supabase Auth for email:', email)
    }

    console.log('[VerifyCode] ✓ Verification complete for:', email)
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      email_confirmed: true,
      email,
      userId: authUser?.id
    })
  } catch (error) {
    console.error('[VerifyCode] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
