import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emailService'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * POST /api/auth/resend-confirmation
 * Resend verification email for an existing user
 */
export async function POST(request: NextRequest) {
  console.log('[RESEND-CONFIRMATION] ==========================================')
  console.log('[RESEND-CONFIRMATION] POST /api/auth/resend-confirmation called')

  try {
    const { email } = await request.json()

    if (!email) {
      console.error('[RESEND-CONFIRMATION] Email not provided')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('[RESEND-CONFIRMATION] Looking up user:', email)

    // Get the user from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()
    const user = authUser?.users.find(u => u.email === email)

    if (!user) {
      console.error('[RESEND-CONFIRMATION] User not found:', email)
      return NextResponse.json(
        { error: 'Email not found. Please sign up first.' },
        { status: 404 }
      )
    }

    console.log('[RESEND-CONFIRMATION] User found:', user.id)

    // Check if already confirmed
    if (user.email_confirmed_at) {
      console.warn('[RESEND-CONFIRMATION] User already confirmed:', email)
      return NextResponse.json(
        { error: 'This email is already verified.' },
        { status: 400 }
      )
    }

    // Generate new verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log('[RESEND-CONFIRMATION] Generated verification code:', verificationCode)

    // Send verification email via Resend
    console.log('[RESEND-CONFIRMATION] Sending verification email...')
    const firstName = user.user_metadata?.name?.split(' ')[0] || 'there'

    const emailSent = await sendEmail({
      to: email,
      subject: 'Verify Your Washlee Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🧺 Washlee</h1>
            <p style="margin: 10px 0 0 0;">Verify Your Email</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
            <p>Hi ${firstName},</p>
            <p>We received a request to verify your email for your Washlee account. If this wasn't you, please ignore this email.</p>
            
            <div style="background: #E8FFFB; border: 2px solid #48C9B0; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
              <p style="font-size: 12px; color: #6b7b78; margin: 0;">Your Verification Code</p>
              <p style="font-size: 28px; font-weight: bold; color: #48C9B0; margin: 10px 0; letter-spacing: 2px;">${verificationCode}</p>
              <p style="font-size: 12px; color: #6b7b78; margin: 0;">Enter this code in your Washlee app</p>
            </div>
            
            <p style="text-align: center; color: #6b7b78; font-size: 12px;">⏰ This code expires in 24 hours</p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
            
            <p style="font-size: 12px; color: #6b7b78;">🔒 <strong>Security:</strong> Never share this code with anyone. Washlee employees will never ask for your verification code.</p>
            
            <p style="font-size: 12px; color: #6b7b78; margin-top: 30px;">© 2026 Washlee. All rights reserved.<br/>
            <a href="https://washlee.com" style="color: #48C9B0; text-decoration: none;">Visit Website</a> | 
            <a href="https://washlee.com/privacy" style="color: #48C9B0; text-decoration: none;">Privacy Policy</a></p>
          </div>
        </div>
      `
    })

    if (!emailSent.success) {
      console.error('[RESEND-CONFIRMATION] Failed to send email:', emailSent.error)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      )
    }

    // Update the email_confirmations table with new code
    console.log('[RESEND-CONFIRMATION] Updating email_confirmations record...')
    const { error: updateError } = await supabase
      .from('email_confirmations')
      .update({
        verification_code: verificationCode,
        email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email)

    if (updateError) {
      console.warn('[RESEND-CONFIRMATION] Failed to update confirmation record:', updateError.message)
      // Don't fail - email was already sent
    }

    console.log('[RESEND-CONFIRMATION] ✅ Verification email resent successfully')
    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent successfully. Check your inbox.',
        email,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[RESEND-CONFIRMATION] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}
