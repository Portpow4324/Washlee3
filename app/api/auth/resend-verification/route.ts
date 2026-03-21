import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emailService'
import { getVerificationEmailHtml } from '@/lib/resend-email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
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

    // Generate new verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log('[ResendVerification] Generated new verification code:', verificationCode)

    // Mark old codes as used (optional - to prevent old codes from working)
    console.log('[ResendVerification] Marking old codes as used...')
    const { error: markError } = await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false)
    
    if (markError) {
      console.warn('[ResendVerification] Failed to mark old codes as used:', markError.message)
    }

    // Store new verification code in database
    console.log('[ResendVerification] Storing new verification code in database...')
    const { error: codeError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code: verificationCode,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: false
      })
    
    if (codeError) {
      console.warn('[ResendVerification] Failed to store verification code:', codeError.message)
      // Continue anyway - code is generated, just not stored
    } else {
      console.log('[ResendVerification] ✓ Verification code stored')
    }

    // Get email template
    const firstName = email.split('@')[0].split('.')[0]
    const htmlContent = getVerificationEmailHtml(firstName, verificationCode)

    // Send via email service (SendGrid primary, Resend fallback)
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
