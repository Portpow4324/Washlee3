/**
 * POST /api/inquiries/create
 * Create a new wholesale inquiry
 * 
 * Migrated from Firebase Admin SDK to Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWholesaleInquiryAdminNotification, sendWholesaleInquiryConfirmation } from '@/lib/emailService'

interface InquiryRequest {
  company: string
  contactName: string
  email: string
  phone: string
  estimatedWeight: number
  orderType: string
  frequency: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: InquiryRequest = await request.json()

    // Validate required fields
    if (!body.company || !body.contactName || !body.email || !body.phone) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[API] Creating wholesale inquiry:', body.company)

    // Create inquiry in Supabase
    const { data: inquiry, error: createError } = await supabaseAdmin
      .from('wholesale_inquiries')
      .insert({
        company: body.company,
        contact_name: body.contactName,
        email: body.email,
        phone: body.phone,
        estimated_weight: body.estimatedWeight,
        order_type: body.orderType,
        frequency: body.frequency,
        notes: body.notes || '',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[API] Error creating inquiry:', createError)
      return NextResponse.json(
        { success: false, message: 'Failed to create inquiry', error: createError.message },
        { status: 500 }
      )
    }

    console.log('[API] ✓ Inquiry created:', inquiry.id)

    // Send confirmation email to customer
    try {
      const adminLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/inquiries/${inquiry.id}`
      await sendWholesaleInquiryConfirmation(
        body.email,
        body.contactName,
        body.company,
        String(body.estimatedWeight),
        body.orderType,
        body.frequency,
        inquiry.id
      )
      console.log('[API] ✓ Confirmation email sent to customer')
    } catch (emailError) {
      console.warn('[API] Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    // Send admin notification
    try {
      const adminEmail = process.env.EMPLOYER_EMAIL || 'lukaverde045@gmail.com'
      const adminLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/inquiries/${inquiry.id}`
      
      // Get admin user to send notification
      const { data: adminUsers } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('role', 'admin')
        .limit(1)

      if (adminUsers && adminUsers.length > 0) {
        await supabaseAdmin.from('admin_notifications').insert({
          recipient_id: adminUsers[0].id,
          title: `New Wholesale Inquiry - ${body.company}`,
          message: `${body.contactName} from ${body.company} submitted an inquiry for ${body.estimatedWeight}kg`,
          type: 'inquiry',
          related_id: inquiry.id,
          data: {
            company: body.company,
            weight: body.estimatedWeight,
            frequency: body.frequency,
          },
          read: false,
          created_at: new Date().toISOString(),
        })
        console.log('[API] ✓ Admin notification created')
      }

      // Also send email notification to admin
      await sendWholesaleInquiryAdminNotification(
        adminEmail,
        body.company,
        body.contactName,
        body.email,
        body.phone,
        String(body.estimatedWeight),
        body.orderType,
        body.frequency,
        inquiry.id,
        body.notes || '',
        adminLink
      )
    } catch (notificationError) {
      console.warn('[API] Failed to send admin notification:', notificationError)
      // Don't fail the request
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry created successfully',
      inquiryId: inquiry.id,
    })
  } catch (error: any) {
    console.error('[API] Error in inquiry creation:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
