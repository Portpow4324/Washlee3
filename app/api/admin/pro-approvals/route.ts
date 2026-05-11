import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Transform Supabase pro_inquiries data to match ProApplication interface
function transformProInquiry(row: any) {
  // Extract ID image from id_verification JSON
  let idImage = null
  if (row.id_verification && typeof row.id_verification === 'object') {
    // If it's a base64 string, use it directly
    if (row.id_verification.base64) {
      idImage = row.id_verification.base64
    } else if (typeof row.id_verification === 'string') {
      // If stored as string, try to parse it
      try {
        const parsed = JSON.parse(row.id_verification)
        idImage = parsed.base64 || row.id_verification
      } catch {
        idImage = row.id_verification
      }
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    email: row.email,
    phone: row.phone || '',
    state: row.state || '',
    status: row.status || 'pending',
    workVerification: row.work_verification || {
      hasWorkRight: false,
      hasValidLicense: false,
      hasTransport: false,
      hasEquipment: false,
      ageVerified: false
    },
    skillsAssessment: row.skills_assessment || '',
    comments: row.comments || '',
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
    idImage: idImage,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Use service role for admin operations (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('[Admin Pro Approvals GET] Status filter:', status)

    let query = supabase.from('pro_inquiries').select('*')
    
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    console.log('[Admin Pro Approvals GET] Raw query result:', { count: data?.length, error: error?.message })
    if (data?.length) {
      console.log('[Admin Pro Approvals GET] First record keys:', Object.keys(data[0]))
    }

    if (error) {
      console.error('[Admin Pro Approvals] Error fetching applications:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform data to match ProApplication interface
    const transformedData = (data || []).map(transformProInquiry)

    console.log('[Admin Pro Approvals GET] Returning transformed data count:', transformedData.length)
    return NextResponse.json({ success: true, data: transformedData })
  } catch (err) {
    console.error('[Admin Pro Approvals] Unexpected error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, comments, employeeId } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, status' },
        { status: 400 }
      )
    }

    // Use service role for admin operations (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, get the pro inquiry to find the user_id
    const { data: proInquiryData, error: fetchError } = await supabase
      .from('pro_inquiries')
      .select('user_id, first_name, last_name, email, phone, state')
      .eq('id', id)
      .single()

    if (fetchError || !proInquiryData) {
      console.error('[Admin Pro Approvals] Error fetching pro inquiry:', fetchError)
      return NextResponse.json({ success: false, error: 'Pro inquiry not found' }, { status: 404 })
    }

    const userId = proInquiryData.user_id

    // Update the pro_inquiries status
    const updatePayload: any = { 
      status, 
      updated_at: new Date().toISOString()
    }
    if (comments) updatePayload.comments = comments
    if (employeeId && status === 'approved') updatePayload.employee_id = employeeId

    const { data: updatedData, error: updateError } = await supabase
      .from('pro_inquiries')
      .update(updatePayload)
      .eq('id', id)
      .select()

    if (updateError) {
      console.error('[Admin Pro Approvals] Error updating application:', updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    // If status is 'approved', create employee account and set is_employee flag
    if (status === 'approved') {
      console.log('[Admin Pro Approvals] Approving pro application for user:', userId)

      try {
        // Update user profile to set is_employee = true
        const { error: profileError } = await supabase
          .from('users')
          .update({ 
            is_employee: true,
            user_type: 'pro',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (profileError) {
          console.error('[Admin Pro Approvals] Error updating user profile:', profileError)
          // Continue anyway - the main update succeeded
        } else {
          console.log('[Admin Pro Approvals] User profile updated - set as employee/pro')
        }

        // Create employee record in employees table (if it exists)
        const { error: employeeError } = await supabase
          .from('employees')
          .upsert({
            id: userId,
            user_id: userId,
            employee_id: employeeId,
            first_name: proInquiryData.first_name,
            last_name: proInquiryData.last_name,
            email: proInquiryData.email,
            phone: proInquiryData.phone,
            state: proInquiryData.state,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })

        if (employeeError) {
          // Check if error is because table doesn't exist or employee already exists
          if (employeeError.message.includes('exists') || employeeError.message.includes('violates')) {
            console.log('[Admin Pro Approvals] Employee record already exists or constraint violation')
          } else if (employeeError.message.includes('does not exist')) {
            console.log('[Admin Pro Approvals] Employees table does not exist - skipping employee creation')
          } else {
            console.error('[Admin Pro Approvals] Error creating employee record:', employeeError)
          }
        } else {
          console.log('[Admin Pro Approvals] Employee record created')
        }
      } catch (err) {
        console.error('[Admin Pro Approvals] Error in approval workflow:', err)
        // Continue - the main status update succeeded
      }
    }

    const transformed = updatedData?.[0] ? transformProInquiry(updatedData[0]) : null

    return NextResponse.json({ success: true, data: transformed })
  } catch (err) {
    console.error('[Admin Pro Approvals] Unexpected error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'MVP disabled' }, { status: 503 })
}
export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'MVP disabled' }, { status: 503 })
}
export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'MVP disabled' }, { status: 503 })
}
