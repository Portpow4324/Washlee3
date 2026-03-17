/**
 * POST /api/wash-club/send-verification-email
 * Send verification code to user's email
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'
import { randomBytes } from 'crypto'
import sgMail from '@sendgrid/mail'

// Initialize Firebase Admin
const apps = getApps()
if (apps.length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
  initializeApp({
    credential: cert(serviceAccount as any),
  })
}

const auth = getAuth()
const db = getFirestore()

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid
    const userEmail = decodedToken.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Generate verification code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store verification code
    await db.collection('wash_club_verification').doc(userId).set({
      code,
      email: userEmail,
      expiresAt,
      verified: false,
      createdAt: new Date(),
    })

    console.log(`[WASH_CLUB] Verification code for ${userEmail}: ${code}`)

    // Send email using SendGrid
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      try {
        console.log('[WASH_CLUB] Attempting to send email via SendGrid')
        console.log('[WASH_CLUB] From:', process.env.SENDGRID_FROM_EMAIL)
        console.log('[WASH_CLUB] To:', userEmail)
        
        const response = await sgMail.send({
          to: userEmail,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: 'Your WASH Club Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #48C9B0;">Verify Your WASH Club Account</h2>
              <p>Your verification code is:</p>
              <h1 style="color: #48C9B0; font-size: 32px; letter-spacing: 5px; text-align: center;">${code}</h1>
              <p>This code will expire in 15 minutes.</p>
              <p style="color: #666; font-size: 12px;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </div>
          `,
          text: `Your WASH Club verification code is: ${code}\n\nThis code will expire in 15 minutes.`,
        })
        console.log('[WASH_CLUB] SendGrid response:', response)
        console.log(`[WASH_CLUB] Verification email sent to ${userEmail}`)
      } catch (emailError: any) {
        console.error('[WASH_CLUB] SendGrid email error:', emailError)
        console.error('[WASH_CLUB] SendGrid error message:', emailError.message)
        console.error('[WASH_CLUB] SendGrid error response:', emailError.response?.body)
        // Don't fail the request - code is stored, but email sending failed
        // In production, you might want to handle this differently
      }
    } else {
      console.log('[WASH_CLUB] SendGrid not configured - SENDGRID_API_KEY:', !!process.env.SENDGRID_API_KEY)
      console.log('[WASH_CLUB] SENDGRID_FROM_EMAIL:', !!process.env.SENDGRID_FROM_EMAIL)
    }

    // For development, return the code
    const isDevelopment = process.env.NODE_ENV === 'development'

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      ...(isDevelopment && { code }), // Only in development
    })
  } catch (error) {
    console.error('Send verification email error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
