import { NextRequest, NextResponse } from 'next/server'
import { 
  sendProApplicationApproved, 
  sendProApplicationRejected 
} from '@/lib/emailService'

/**
 * POST /api/pro/application-decision
 * Send pro application approval or rejection email
 * 
 * Body:
 * - proEmail: string (required)
 * - firstName: string (required)
 * - decision: 'approved' | 'rejected' (required)
 * - proId: string (optional, for approved)
 * - rejectionReason: string (optional, for rejected)
 * - dashboardLink: string (optional, for approved)
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      proEmail, 
      firstName = 'User',
      decision, 
      proId,
      rejectionReason,
      dashboardLink 
    } = await request.json()

    if (!proEmail || !firstName || !decision) {
      return NextResponse.json(
        { error: 'Missing required fields: proEmail, firstName, decision' },
        { status: 400 }
      )
    }

    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json(
        { error: 'Decision must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    console.log('[PRO-DECISION-API] Pro application decision:', decision, 'for:', proEmail)

    let emailResult

    if (decision === 'approved') {
      // Send approval email
      if (!proId) {
        return NextResponse.json(
          { error: 'proId is required for approved decision' },
          { status: 400 }
        )
      }

      const finalDashboardLink = dashboardLink || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/pro`

      emailResult = await sendProApplicationApproved(
        proEmail,
        firstName,
        proId,
        finalDashboardLink
      )

      if (emailResult.success) {
        console.log('[PRO-DECISION-API] ✓ Approval email sent to:', proEmail)
      } else {
        console.error('[PRO-DECISION-API] Approval email failed:', emailResult.error)
      }
    } else {
      // Send rejection email
      const finalRejectionReason = rejectionReason || 'We are unable to move forward with your application at this time.'

      emailResult = await sendProApplicationRejected(
        proEmail,
        firstName,
        finalRejectionReason
      )

      if (emailResult.success) {
        console.log('[PRO-DECISION-API] ✓ Rejection email sent to:', proEmail)
      } else {
        console.error('[PRO-DECISION-API] Rejection email failed:', emailResult.error)
      }
    }

    return NextResponse.json(
      { 
        success: emailResult.success,
        message: `${decision.charAt(0).toUpperCase() + decision.slice(1)} email sent`,
        proEmail
      },
      { status: emailResult.success ? 200 : 500 }
    )
  } catch (error: any) {
    console.error('[PRO-DECISION-API] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Pro Application Decision API',
    endpoint: '/api/pro/application-decision',
    method: 'POST',
    body: {
      proEmail: 'string',
      firstName: 'string',
      decision: 'approved | rejected',
      proId: 'string (required if approved)',
      rejectionReason: 'string (optional)',
      dashboardLink: 'string (optional)'
    }
  })
}
