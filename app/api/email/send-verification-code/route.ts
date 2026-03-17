import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, code, type } = await request.json()

    if (!email || !firstName || !code || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, code, type' },
        { status: 400 }
      )
    }

    const subject = type === 'email'
      ? '🔐 Your Washlee Email Verification Code'
      : '📱 Your Washlee Phone Verification Code'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fefe;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 24px;">Verification Code</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #1f2d2b; margin-top: 0;">
            Hi <strong>${firstName}</strong>,
          </p>

          <p style="font-size: 14px; color: #6b7b78; line-height: 1.6; margin: 20px 0;">
            Your Washlee verification code is ready. Use this code to verify your ${type === 'email' ? 'email address' : 'phone number'} during signup.
          </p>

          <div style="background: #E8FFFB; border: 2px solid #48C9B0; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center;">
            <p style="font-size: 12px; color: #6b7b78; margin: 0 0 10px 0;">Your Verification Code</p>
            <p style="font-size: 42px; font-weight: bold; color: #48C9B0; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </p>
          </div>

          <p style="font-size: 13px; color: #6b7b78; line-height: 1.6;">
            This code will expire in 15 minutes. If you didn't request this verification, please ignore this email.
          </p>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="font-size: 12px; color: #6b7b78; margin: 0;">
              © 2026 Washlee. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `

    const sendResult = await sendEmail({
      to: email,
      subject,
      html,
    })

    if (!sendResult.success) {
      return NextResponse.json({ error: sendResult.error || 'Failed to send verification email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Verification code sent successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('[Email] Error sending verification code:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
