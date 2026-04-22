import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Initialize nodemailer transporter
// For production, use SMTP (SendGrid, Brevo, Gmail, etc.)
let transporter: nodemailer.Transporter | null = null

function initializeTransporter() {
  if (transporter) return transporter

  // Priority: SendGrid > Resend > SMTP (Gmail) > Fallback
  // SendGrid is prioritized as it's properly configured with lukaverde045@gmail.com
  if (process.env.SENDGRID_API_KEY) {
    console.log('[Email] Using SendGrid SMTP relay (Primary)')
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  } else if (process.env.RESEND_API_KEY) {
    console.log('[Email] Using Resend SMTP (Backup)')
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    })
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    console.log('[Email] Using SMTP (Fallback)')
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  } else {
    // Development fallback - logs to console
    console.warn('[Email] No email service configured. Emails will be logged to console.')
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: {
        user: 'dev',
        pass: 'dev',
      },
    })
  }

  return transporter
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailer = initializeTransporter()

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'noreply@washlee.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }

    console.log(`[Email] Sending email to ${options.to} - Subject: ${options.subject}`)

    const info = await mailer.sendMail(mailOptions)
    console.log(`[Email] Email sent successfully:`, info.messageId)

    return true
  } catch (error) {
    console.error('[Email] Failed to send email:', error)
    return false
  }
}

export async function sendOfferLetter(
  email: string,
  firstName: string,
  lastName: string,
  offerLetterHtml: string,
  employeeId: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Congratulations! Washlee Pro Offer - Employee ID ${employeeId}`,
    html: offerLetterHtml,
    text: `Dear ${firstName},\n\nCongratulations! You've been approved as a Washlee Pro Partner.\n\nYour Employee ID is: ${employeeId}\n\nPlease accept the offer by clicking the link in the HTML version of this email.\n\nBest regards,\nThe Washlee Team`,
  })
}

export async function sendRejectionEmail(
  email: string,
  firstName: string,
  rejectionReason: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2d2b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 3px solid #48C9B0; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #48C9B0; }
        .content { margin-bottom: 30px; }
        .footer { color: #6b7b78; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Washlee</div>
        </div>
        <div class="content">
            <p>Dear ${firstName},</p>
            <p>Thank you for your interest in becoming a Washlee Pro Partner. We've carefully reviewed your application and qualifications.</p>
            <p>Unfortunately, at this time, we are unable to proceed with your application.</p>
            <p><strong>Feedback:</strong> ${rejectionReason}</p>
            <p>We appreciate your interest and encourage you to reapply in the future. If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The Washlee Team</p>
        </div>
        <div class="footer">
            <p>Washlee Pty Ltd | Professional Laundry Service Marketplace | Australia</p>
        </div>
    </div>
</body>
</html>
  `

  return sendEmail({
    to: email,
    subject: 'Washlee Pro Application Update',
    html,
    text: `Dear ${firstName},\n\nThank you for your interest in becoming a Washlee Pro Partner.\n\nUnfortunately, we are unable to proceed with your application at this time.\n\nReason: ${rejectionReason}\n\nBest regards,\nThe Washlee Team`,
  })
}
