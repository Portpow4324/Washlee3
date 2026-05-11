/**
 * Unified Email Service for Washlee V2
 * ====================================
 * Supports email providers:
 * 1. Resend (primary)
 * 2. SMTP via Nodemailer (fallback - for development/testing)
 */

import nodemailer from 'nodemailer'
import { Resend } from 'resend'

interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  provider?: string
}

// ============================================
// RESEND Configuration
// ============================================
const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

// ============================================
// SMTP Configuration (optional fallback)
// ============================================
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER || 'onboarding@resend.dev'

let smtpTransporter: nodemailer.Transporter | null = null

/**
 * Initialize SMTP transporter (with caching)
 */
function getSmtpTransporter(): nodemailer.Transporter | null {
  if (smtpTransporter) return smtpTransporter

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn('[SMTP] Configuration incomplete. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env.local')
    return null
  }

  try {
    smtpTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    })

    console.log('[SMTP] ✓ Transporter initialized')
    return smtpTransporter
  } catch (error) {
    console.error('[SMTP] Failed to create transporter:', error)
    return null
  }
}

/**
 * Send email via Resend
 */
async function sendViaResend(options: EmailOptions): Promise<EmailResponse> {
  if (!resend || !RESEND_API_KEY) {
    return {
      success: false,
      error: 'Resend not configured',
      provider: 'resend',
    }
  }

  try {
    console.log('[Resend] Sending to:', options.to)
    
    const response = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || RESEND_FROM_EMAIL,
    })

    if (response.error) {
      console.error('[Resend] Error:', response.error)
      return {
        success: false,
        error: response.error.message,
        provider: 'resend',
      }
    }

    console.log('[Resend] ✓ Sent successfully:', response.data?.id)
    return {
      success: true,
      messageId: response.data?.id,
      provider: 'resend',
    }
  } catch (error) {
    console.error('[Resend] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'resend',
    }
  }
}

/**
 * Send email via SMTP fallback
 */
async function sendViaSMTP(options: EmailOptions): Promise<EmailResponse> {
  const transporter = getSmtpTransporter()

  if (!transporter) {
    return {
      success: false,
      error: 'SMTP not configured',
      provider: 'smtp',
    }
  }

  try {
    console.log('[SMTP] Sending to:', options.to)
    
    const info = await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || SMTP_FROM_EMAIL,
    })

    console.log('[SMTP] ✓ Sent successfully:', info.messageId)
    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp',
    }
  } catch (error) {
    console.error('[SMTP] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'smtp',
    }
  }
}

/**
 * Primary email sending function - tries multiple providers
 * 1. Tries Resend first (including onboarding@resend.dev for testing)
 * 2. Falls back to SMTP if explicitly configured
 * 3. Returns success/error with provider information
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  console.log('[Email] Attempting to send to:', options.to)
  console.log('[Email] Subject:', options.subject)

  // Try Resend first
  if (RESEND_API_KEY) {
    console.log('[Email] Trying Resend...')
    const resendResult = await sendViaResend(options)
    if (resendResult.success) {
      return resendResult
    }
    console.log('[Email] Resend failed:', resendResult.error)
  }

  // Fall back to SMTP
  if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
    console.log('[Email] Trying SMTP...')
    const smtpResult = await sendViaSMTP(options)
    if (smtpResult.success) {
      return smtpResult
    }
    console.log('[Email] SMTP failed:', smtpResult.error)
  }

  // Both failed or not configured
  return {
    success: false,
    error: 'No email provider configured (Resend or SMTP)',
    provider: 'none',
  }
}

/**
 * Verify SMTP connection
 */
export async function verifySMTPConnection(): Promise<boolean> {
  const transporter = getSmtpTransporter()
  if (!transporter) {
    console.log('[SMTP] Not configured')
    return false
  }

  try {
    await transporter.verify()
    console.log('[SMTP] ✓ Connection verified')
    return true
  } catch (error) {
    console.error('[SMTP] Connection failed:', error)
    return false
  }
}

/**
 * Get email provider status
 */
export function getEmailProviderStatus() {
  return {
    resend: {
      configured: !!RESEND_API_KEY,
      verifiedDomain: RESEND_FROM_EMAIL !== 'onboarding@resend.dev',
      fromEmail: RESEND_FROM_EMAIL,
    },
    smtp: {
      configured: !!(SMTP_HOST && SMTP_USER && SMTP_PASSWORD),
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER ? `${SMTP_USER.substring(0, 3)}...` : undefined,
      fromEmail: SMTP_FROM_EMAIL,
    },
  }
}
