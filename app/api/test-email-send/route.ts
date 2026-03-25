import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email, subject, code } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('[TEST] Testing email send to:', email)

    const result = await sendEmail({
      to: email,
      subject: subject || '🔐 Washlee Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fefe;">
          <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px;">Test Email</h1>
          </div>

          <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px; color: #1f2d2b; margin-top: 0;">
              Hi there,
            </p>

            <p style="font-size: 14px; color: #6b7b78; line-height: 1.6; margin: 20px 0;">
              This is a test email to verify that SendGrid is working correctly.
            </p>

            ${code ? `
              <div style="background: #E8FFFB; border: 2px solid #48C9B0; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center;">
                <p style="font-size: 12px; color: #6b7b78; margin: 0 0 10px 0;">Your Test Code</p>
                <p style="font-size: 42px; font-weight: bold; color: #48C9B0; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </p>
              </div>
            ` : ''}

            <p style="font-size: 13px; color: #6b7b78; line-height: 1.6;">
              If you received this email, SendGrid is working correctly!
            </p>

            <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 25px; text-align: center;">
              <p style="font-size: 12px; color: #6b7b78; margin: 0;">
                © 2026 Washlee. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    })

    console.log('[TEST] Email send result:', result)

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    })
  } catch (error: any) {
    console.error('[TEST] Email test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}
