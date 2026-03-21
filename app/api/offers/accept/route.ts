import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json()

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Missing employee ID' },
        { status: 400 }
      )
    }

    // Find employee by ID
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('user_id, offer_accepted_at')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const userId = employee.user_id

    // Check if offer was already accepted
    if (employee.offer_accepted_at) {
      return NextResponse.json({
        success: true,
        message: 'Offer was already accepted',
        employeeId,
      })
    }

    // Update employee record
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        offer_accepted_at: new Date().toISOString(),
        dashboard_access: true,
        status: 'active',
      })
      .eq('id', employeeId)

    if (updateError) throw updateError

    console.log('[API] Offer accepted successfully:', employeeId)

    return NextResponse.json({
      success: true,
      employeeId,
      userId,
      message: 'Offer accepted successfully',
    })
  } catch (error: any) {
    console.error('[API] Error accepting offer:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to accept offer' },
      { status: 500 }
    )
  }
}
