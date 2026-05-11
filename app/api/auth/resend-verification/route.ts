import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'
import { sendEmail } from '@/lib/emailService'
import { getVerificationEmailHtml } from '@/lib/resend-email'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    console.log('[ResendVerification] POST endpoint called!')
    const body = await request.json()
    const { email } = body

    console.log('[ResendVerification] Received email:', email)

    if (!email) {
      console.log('[ResendVerification] Email is missing!')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Resolve user_id for the provided email so the verification_codes table is consistent
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.warn('[ResendVerification] User lookup failed:', userError?.message)
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    const userId = users[0].id

    // Generate new verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log('[ResendVerification] Generated new verification code:', verificationCode)

    // Mark old codes as used (optional - to prevent old codes from working)
    console.log('[ResendVerification] Marking old codes as used...')
    const { error: markError } = await supabase
      .from('verification_codes')
      .update({ used: true, verified: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('type', 'email')
      .eq('used', false)
    
    if (markError) {
      console.warn('[ResendVerification] Failed to mark old codes as used:', markError.message)
    }

    // Store new verification code in database
    console.log('[ResendVerification] Storing new verification code in database...')
    const { error: codeError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: userId,
        type: 'email',
        code: verificationCode,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        verified: false,
      })
    
    if (codeError) {
      console.warn('[ResendVerification] Failed to store verification code:', codeError.message)
      // Continue anyway - code is generated, just not stored
    } else {
      console.log('[ResendVerification] ✓ Verification code stored')
    }

    // Record / refresh email confirmation metadata for admin and status checks
    const { error: emailConfirmError } = await supabase
      .from('email_confirmations')
      .upsert({
        user_id: userId,
        email,
        code: verificationCode,
        is_confirmed: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (emailConfirmError) {
      console.warn('[ResendVerification] Failed to upsert email_confirmations:', emailConfirmError.message)
    }

    // Get email template
    const firstName = email.split('@')[0].split('.')[0]
    const htmlContent = getVerificationEmailHtml(firstName, verificationCode)

    // Send via Resend-backed email service
    const result = await sendEmail({
      to: email,
      subject: 'Verify Your Washlee Email Address - New Code',
      html: htmlContent,
    })

    if (!result.success) {
      console.error('[ResendVerification] Email send failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code' },
        { status: 500 }
      )
    }

    console.log(`[ResendVerification] ✓ Verification code resent to:`, email)
    return NextResponse.json({
      success: true,
      message: 'Verification code resent successfully',
    })
  } catch (error) {
    console.error('[ResendVerification] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend verification code' },
      { status: 500 }
    )
  }
}
