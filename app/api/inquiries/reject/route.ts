import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'
import { sendProApplicationRejected } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const { inquiryId, adminId, adminName, rejectionReason } = await request.json()

    if (!inquiryId || !adminId || !rejectionReason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch inquiry details
    const { data: inquiry, error: fetchError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single()

    if (fetchError || !inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      )
    }

    // Update inquiry status
    const { error: updateError } = await supabase
      .from('inquiries')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        admin_name: adminName,
        rejection_reason: rejectionReason,
      })
      .eq('id', inquiryId)

    if (updateError) throw updateError

    // Send rejection email
    const result = await sendProApplicationRejected(
      inquiry.email,
      inquiry.first_name,
      rejectionReason
    )
    const emailSent = result?.success || result?.messageId ? true : false

    console.log(`[API] Inquiry rejected and email sent: ${emailSent}`)

    return NextResponse.json({
      success: true,
      inquiryId,
      emailSent,
    })
  } catch (error: any) {
    console.error('[API] Error rejecting inquiry:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to reject inquiry' },
      { status: 500 }
    )
  }
}
