import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client (lazy initialized)
    const supabase = getSupabaseAdminClient()

    console.log('[VerifyCode] POST endpoint called')
    const body = await request.json()
    const { email, code, phone } = body

    console.log('[VerifyCode] Verifying code for email:', email)
    console.log('[VerifyCode] Code entered:', code)
    console.log('[VerifyCode] Code type:', typeof code)
    console.log('[VerifyCode] Code length:', code?.length)

    if (!email || !code) {
      console.error('[VerifyCode] Missing email or code')
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }
    // Check the code against verification_codes table (this is the source of truth)
    console.log('[VerifyCode] Looking up user by email...')
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.error('[VerifyCode] User lookup failed:', userError?.message)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = users[0].id
    console.log('[VerifyCode] Found user ID:', userId)

    console.log('[VerifyCode] Looking up latest valid verification code in DB...')
    const { data: codeEntries, error: codeQueryError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'email')
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    console.log('[VerifyCode] Code query response:', {
      codeQueryError: codeQueryError?.message,
      codeEntries,
      codeEntriesLength: codeEntries?.length,
      queryFilters: {
        user_id: userId,
        type: 'email',
        used: false,
        expires_at_gte: new Date().toISOString()
      }
    })

    if (codeQueryError || !codeEntries || codeEntries.length === 0) {
      console.warn('[VerifyCode] ❌ No active verification code record found')
      console.warn('[VerifyCode] Query error:', codeQueryError?.message)
      console.warn('[VerifyCode] Code entries count:', codeEntries?.length)
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    const matchedCodeRecord = codeEntries[0]
    console.log('[VerifyCode] Stored code record:', {
      id: matchedCodeRecord.id,
      code: matchedCodeRecord.code,
      code_type: typeof matchedCodeRecord.code,
      code_length: matchedCodeRecord.code?.length,
      used: matchedCodeRecord.used,
      verified: matchedCodeRecord.verified,
      expires_at: matchedCodeRecord.expires_at,
    })
    if (matchedCodeRecord.code.trim().toUpperCase() !== String(code).trim().toUpperCase()) {
      console.warn('[VerifyCode] Code mismatch:', {
        expected: matchedCodeRecord.code,
        received: code,
        expected_trimmed_upper: matchedCodeRecord.code.trim().toUpperCase(),
        received_trimmed_upper: String(code).trim().toUpperCase(),
      })
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    console.log('[VerifyCode] Code matches record - marking as used...')
    const { error: updateCodeError } = await supabase
      .from('verification_codes')
      .update({ used: true, verified: true, used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', matchedCodeRecord.id)

    if (updateCodeError) {
      console.warn('[VerifyCode] Warning: failed to update verification code record:', updateCodeError.message)
    }

    // mark email_confirmation record if exists
    const { error: updateEmailConfError } = await supabase
      .from('email_confirmations')
      .update({ is_confirmed: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (updateEmailConfError) {
      console.warn('[VerifyCode] Warning: could not update email_confirmations record:', updateEmailConfError.message)
    }

    // Confirm email in Supabase Auth by looking up user by email
    console.log('[VerifyCode] Looking up user in Supabase Auth...')
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.error('[VerifyCode] Failed to list users:', listError.message)
      // still proceed because code is valid
    }

    const authUser = authUsers?.users?.find((u: any) => u.email === email)
    if (authUser) {
      console.log('[VerifyCode] Confirming email for auth user ID:', authUser.id)
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { email_confirm: true }
      )
      if (confirmError) {
        console.warn('[VerifyCode] Failed to confirm email in Supabase Auth:', confirmError.message)
      }
    }

    console.log('[VerifyCode] ✓ Verification complete for:', email)
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      email_confirmed: true,
      email,
      userId,
    })
  } catch (error) {
    console.error('[VerifyCode] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
