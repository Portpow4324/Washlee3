import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

interface ProInquiryRequest {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  state: string
  idVerification?: {
    fileName: string
    fileType: string
    base64: string
  } | null
  workVerification: {
    hasWorkRight: boolean | null
    hasValidLicense: boolean | null
    hasTransport: boolean | null
    hasEquipment: boolean | null
    ageVerified: boolean | null
  }
  skillsAssessment: string
  availability: Record<string, boolean>
  comments?: string
  createdAt: string
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ProInquiryRequest = await request.json()

    // Validate required fields
    if (!body.userId || !body.firstName || !body.lastName || !body.email || !body.phone || !body.state) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[API][inquiries/create] Creating pro inquiry for:', body.email)

    // Create inquiry in Supabase
    const { data: inquiry, error: createError } = await supabaseAdmin
      .from('pro_inquiries')
      .insert({
        user_id: body.userId,
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        state: body.state,
        id_verification: body.idVerification,
        work_verification: body.workVerification,
        skills_assessment: body.skillsAssessment,
        availability: body.availability,
        comments: body.comments || '',
        status: body.status || 'pending',
        created_at: body.createdAt,
      })
      .select()
      .single()

    if (createError) {
      console.error('[API][inquiries/create] Error creating inquiry:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to create inquiry: ' + createError.message },
        { status: 500 }
      )
    }

    console.log('[API][inquiries/create] ✓ Inquiry created:', inquiry.id)

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
      message: 'Inquiry created successfully',
    })
  } catch (error: any) {
    console.error('[API][inquiries/create] Exception:', error.message)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create inquiry' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'GET not supported' }, { status: 405 })
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'PATCH not supported' }, { status: 405 })
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'PUT not supported' }, { status: 405 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'DELETE not supported' }, { status: 405 })
}
