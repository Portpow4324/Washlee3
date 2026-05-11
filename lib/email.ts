/**
 * Email service utility functions
 * Sends through the shared Resend-backed email service
 */

import { sendEmail } from './emailService'

type WorkVerification = {
  hasWorkRight?: boolean | null
  hasValidLicense?: boolean | null
  hasTransport?: boolean | null
  hasEquipment?: boolean | null
  ageVerified?: boolean | null
}

type EmployeeEmailData = {
  firstName: string
  lastName: string
  employeeId?: string
  email?: string
  phone?: string
  state?: string
  workVerification?: WorkVerification
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || 'Failed to send email')
}

export async function sendEmployeeConfirmationEmail(
  email: string,
  employeeData: EmployeeEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { firstName, lastName, employeeId } = employeeData

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fefe;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Washlee Pro!</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #1f2d2b; margin-top: 0;">
            Hi <strong>${firstName} ${lastName}</strong>,
          </p>

          <p style="font-size: 14px; color: #6b7b78; line-height: 1.6; margin: 20px 0;">
            Thank you for joining Washlee! Your application has been received and is under review.
          </p>

          <div style="background: #E8FFFB; border: 2px solid #48C9B0; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <p style="font-size: 12px; color: #6b7b78; margin: 0 0 10px 0;">Your Employee ID</p>
            <p style="font-size: 32px; font-weight: bold; color: #48C9B0; margin: 0; font-family: 'Courier New', monospace;">
              ${employeeId || 'Generating...'}
            </p>
            <p style="font-size: 12px; color: #6b7b78; margin: 10px 0 0 0;">Use this ID to sign in to your pro dashboard</p>
          </div>

          <p style="font-size: 14px; color: #6b7b78; line-height: 1.6; margin: 20px 0;">
            <strong>Next Steps:</strong>
          </p>
          <ul style="font-size: 14px; color: #6b7b78; line-height: 1.8;">
            <li>Complete your profile verification</li>
            <li>Submit required documents (ID, insurance)</li>
            <li>Get approved and start earning</li>
          </ul>

          <p style="font-size: 14px; color: #6b7b78; line-height: 1.6; margin: 20px 0;">
            Questions? Contact us at <strong>support@washlee.com.au</strong>
          </p>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="font-size: 12px; color: #6b7b78; margin: 0;">
              © 2026 Washlee. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `

    const result = await sendEmail({
      to: email,
      subject: 'Welcome to Washlee Pro!',
      html: htmlContent,
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send email' }
    }

    console.log('[Email] ✅ Employee confirmation email sent to:', email)
    return { success: true }
  } catch (err: unknown) {
    const message = getErrorMessage(err)
    console.error('[Email] Error sending employee confirmation:', message)
    return { success: false, error: message }
  }
}

export async function sendEmployerNotificationEmail(
  employeeData: EmployeeEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { firstName, lastName, email, phone, state, employeeId, workVerification } = employeeData

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fefe;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">New Pro Application</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #1f2d2b; margin-top: 0;">
            New Washlee Pro Application Received
          </p>

          <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="font-size: 14px; color: #1f2d2b; margin: 5px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p style="font-size: 14px; color: #1f2d2b; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="font-size: 14px; color: #1f2d2b; margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
            <p style="font-size: 14px; color: #1f2d2b; margin: 5px 0;"><strong>State:</strong> ${state}</p>
            <p style="font-size: 14px; color: #1f2d2b; margin: 5px 0;"><strong>Employee ID:</strong> ${employeeId || 'Generating...'}</p>
          </div>

          <p style="font-size: 14px; color: #1f2d2b; margin: 20px 0;"><strong>Verification Status:</strong></p>
          <ul style="font-size: 13px; color: #6b7b78;">
            <li>Work Right: ${workVerification?.hasWorkRight ? '✅ Confirmed' : '❌ Not confirmed'}</li>
            <li>Valid License: ${workVerification?.hasValidLicense ? '✅ Confirmed' : '❌ Not confirmed'}</li>
            <li>Transport: ${workVerification?.hasTransport ? '✅ Confirmed' : '❌ Not confirmed'}</li>
            <li>Equipment: ${workVerification?.hasEquipment ? '✅ Confirmed' : '❌ Not confirmed'}</li>
            <li>Age Verified: ${workVerification?.ageVerified ? '✅ Confirmed' : '❌ Not confirmed'}</li>
          </ul>

          <p style="font-size: 12px; color: #6b7b78; margin-top: 20px;">
            Review this application in the admin panel and approve or request additional information.
          </p>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="font-size: 12px; color: #6b7b78; margin: 0;">
              © 2026 Washlee. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `

    const adminEmail = process.env.EMPLOYER_EMAIL || 'admin@washlee.com.au'

    const result = await sendEmail({
      to: adminEmail,
      subject: `New Pro Application: ${firstName} ${lastName}`,
      html: htmlContent,
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send email' }
    }

    console.log('[Email] ✅ Employer notification email sent to:', adminEmail)
    return { success: true }
  } catch (err: unknown) {
    const message = getErrorMessage(err)
    console.error('[Email] Error sending employer notification:', message)
    return { success: false, error: message }
  }
}

export async function sendEmailVerificationCode(
  email: string,
  firstName: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fefe;">
        <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 24px;">Verification Code</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #1f2d2b; margin-top: 0;">
            Hi <strong>${firstName}</strong>,
          </p>

          <p style="font-size: 14px; color: #6b7b78; line-height: 1.6; margin: 20px 0;">
            Your Washlee verification code is ready. Use this code to verify your email address during signup.
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

    const result = await sendEmail({
      to: email,
      subject: 'Your Washlee Verification Code',
      html: htmlContent,
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send email' }
    }

    console.log('[Email] ✅ Verification code sent to:', email)
    return { success: true }
  } catch (err: unknown) {
    const message = getErrorMessage(err)
    console.error('[Email] Error sending verification code:', message)
    return { success: false, error: message }
  }
}

export async function sendPhoneVerificationCode(
  phone: string,
  firstName: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // SMS implementation would go here (Twilio, AWS SNS, etc.)
    // For now, we'll just log it
    console.log(`[SMS] Verification code for ${firstName} at ${phone}: ${code}`)
    
    // In production, integrate with Twilio or similar
    // Example: await client.messages.create({ to: phone, from: '...', body: ... })
    
    return { success: true }
  } catch (err: unknown) {
    const message = getErrorMessage(err)
    console.error('[SMS] Error sending phone code:', message)
    return { success: false, error: message || 'Failed to send SMS' }
  }
}
