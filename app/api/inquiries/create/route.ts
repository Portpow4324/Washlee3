import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { cleanString, isBodyTooLarge, isEmail, isUuid } from '@/lib/security/validation'
import {
  sendEmployeeConfirmationEmail,
  sendEmployerNotificationEmail,
} from '@/lib/email'

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

const MAX_INQUIRY_BODY_BYTES = 3_000_000
const MAX_ID_VERIFICATION_BASE64_CHARS = 2_500_000
const ALLOWED_ID_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf'])

function boolOrNull(value: unknown) {
  return typeof value === 'boolean' ? value : null
}

function sanitizeWorkVerification(value: unknown) {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {}

  return {
    hasWorkRight: boolOrNull(input.hasWorkRight),
    hasValidLicense: boolOrNull(input.hasValidLicense),
    hasTransport: boolOrNull(input.hasTransport),
    hasEquipment: boolOrNull(input.hasEquipment),
    ageVerified: boolOrNull(input.ageVerified),
  }
}

function sanitizeAvailability(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 40)
      .filter(([, available]) => typeof available === 'boolean')
      .map(([slot, available]) => [cleanString(slot, 50), available])
      .filter(([slot]) => Boolean(slot))
  )
}

function sanitizeIdVerification(value: unknown) {
  if (!value || typeof value !== 'object') return null

  const input = value as Record<string, unknown>
  const fileName = cleanString(input.fileName, 180)
  const fileType = cleanString(input.fileType, 80).toLowerCase()
  const base64 = cleanString(input.base64, MAX_ID_VERIFICATION_BASE64_CHARS + 1)

  if (!fileName || !ALLOWED_ID_FILE_TYPES.has(fileType)) return null
  if (base64.length > MAX_ID_VERIFICATION_BASE64_CHARS) {
    throw new Error('ID verification file is too large')
  }

  return { fileName, fileType, base64 }
}

export async function POST(request: NextRequest) {
  try {
    if (isBodyTooLarge(request.headers.get('content-length'), MAX_INQUIRY_BODY_BYTES)) {
      return NextResponse.json(
        { success: false, error: 'Request body is too large' },
        { status: 413 }
      )
    }

    const body = await request.json().catch(() => null) as Partial<ProInquiryRequest> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const userId = cleanString(body.userId, 80)
    const firstName = cleanString(body.firstName, 80)
    const lastName = cleanString(body.lastName, 80)
    const email = cleanString(body.email, 254).toLowerCase()
    const phone = cleanString(body.phone, 40)
    const state = cleanString(body.state, 40)
    const skillsAssessment = cleanString(body.skillsAssessment, 2_000)
    const comments = cleanString(body.comments, 1_000)
    const idVerification = sanitizeIdVerification(body.idVerification)
    const workVerification = sanitizeWorkVerification(body.workVerification)
    const availability = sanitizeAvailability(body.availability)

    if (!userId || !firstName || !lastName || !email || !phone || !state) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!isUuid(userId) || !isEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid inquiry fields' },
        { status: 400 }
      )
    }

    console.log('[API][inquiries/create] Creating pro inquiry')

    const { data: inquiry, error: createError } = await supabaseAdmin
      .from('pro_inquiries')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        state,
        id_verification: idVerification,
        work_verification: workVerification,
        skills_assessment: skillsAssessment,
        availability,
        comments,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[API][inquiries/create] Error creating inquiry:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to create inquiry' },
        { status: 500 }
      )
    }

    console.log('[API][inquiries/create] ✓ Inquiry created:', inquiry.id)

    // Fan out the same employee + employer notification emails the website pro
    // signup form used to send client-side. Doing this server-side keeps web
    // and mobile pro applications behaviourally identical.
    //
    // These are fire-and-forget — neither failure should fail the response or
    // hide the fact that the inquiry was successfully recorded.
    const employeeData = {
      firstName,
      lastName,
      email,
      phone,
      state,
      employeeId: inquiry.id,
      applicationType: 'pro' as const,
      workVerification,
      availability,
      skillsAssessment,
      comments,
    }

    void Promise.allSettled([
      sendEmployeeConfirmationEmail(email, {
        firstName,
        lastName,
        email,
        phone,
        employeeId: inquiry.id,
      }).then((result) => {
        if (!result.success) {
          console.warn(
            '[API][inquiries/create] Employee confirmation email failed:',
            result.error
          )
        }
      }),
      sendEmployerNotificationEmail(employeeData).then((result) => {
        if (!result.success) {
          console.warn(
            '[API][inquiries/create] Employer notification email failed:',
            result.error
          )
        }
      }),
    ]).catch((err) => {
      console.warn('[API][inquiries/create] Email fan-out exception:', err)
    })

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
      message: 'Inquiry created successfully',
    })
  } catch (error) {
    console.error('[API][inquiries/create] Exception:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create inquiry' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ success: false, message: 'GET not supported' }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: 'PATCH not supported' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ success: false, message: 'PUT not supported' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: 'DELETE not supported' }, { status: 405 })
}
