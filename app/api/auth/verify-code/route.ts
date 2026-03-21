import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    console.log('[VerifyCode] POST endpoint called')
    const body = await request.json()
    const { email, code } = body

    console.log('[VerifyCode] Verifying code for email:', email)
    console.log('[VerifyCode] Code entered:', code)

    if (!email || !code) {
      console.error('[VerifyCode] Missing email or code')
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Check if code exists and is valid
    console.log('[VerifyCode] Looking up verification code...')
    const now = new Date()
    const currentTime = now.toISOString()
    console.log('[VerifyCode] Current server time:', currentTime)
    
    const { data: codeRecord, error: lookupError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code.toUpperCase())
      .eq('used', false)
      .gt('expires_at', currentTime)
      .single()
    
    if (lookupError || !codeRecord) {
      console.warn('[VerifyCode] Looking for all codes for debugging...')
      const { data: allCodes } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code.toUpperCase())
      
      if (allCodes && allCodes.length > 0) {
        console.log('[VerifyCode] Code exists but is expired or used')
        console.log('[VerifyCode] Code record:', {
          used: allCodes[0].used,
          expires_at: allCodes[0].expires_at,
          current_time: currentTime,
          is_expired: allCodes[0].expires_at < currentTime
        })
      }
    }

    if (lookupError || !codeRecord) {
      console.warn('[VerifyCode] Code verification failed:', lookupError?.message || 'Code not found or expired')
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    console.log('[VerifyCode] ✓ Code is valid, marking as used...')

    // Mark code as used
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({
        used: true
      })
      .eq('id', codeRecord.id)

    if (updateError) {
      console.error('[VerifyCode] Failed to mark code as used:', updateError.message)
      return NextResponse.json(
        { error: 'Failed to verify code' },
        { status: 500 }
      )
    }

    console.log('[VerifyCode] ✓ Code marked as used')

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
