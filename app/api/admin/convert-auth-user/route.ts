import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/admin/convert-auth-user
 * 
 * Converts a Supabase Auth user to an Employee or Customer profile
 * 
 * Body:
 * {
 *   userId: string (Supabase Auth UID)
 *   email: string
 *   displayName: string
 *   type: 'employee' | 'customer'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, displayName, type } = body

    if (!userId || !email || !type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, email, type'
      }, { status: 400 })
    }

    if (type !== 'employee' && type !== 'customer') {
      return NextResponse.json({
        success: false,
        error: 'Type must be "employee" or "customer"'
      }, { status: 400 })
    }

    const [firstName, lastName] = displayName?.split(' ') || ['', '']

    // Create profile in appropriate table
    if (type === 'employee') {
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: userId,
          email,
          first_name: firstName || 'Employee',
          last_name: lastName || '',
          phone: '',
          state: '',
          status: 'pending',
          email_verified: false,
          phone_verified: false,
          id_verified: false,
          background_check_passed: false,
          application_step: 0,
          rating: 0,
          total_jobs: 0,
          total_earnings: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          onboarding_completed: false,
        })

      if (employeeError) throw employeeError

      return NextResponse.json({
        success: true,
        message: `Successfully converted ${email} to employee profile`,
        type: 'employee',
        userId
      })
    } else if (type === 'customer') {
      const { error: customerError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          first_name: firstName || 'Customer',
          last_name: lastName || '',
          phone: '',
          user_type: 'customer',
          status: 'active',
          total_orders: 0,
          total_spent: 0,
          marketing_opted_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (customerError) throw customerError

      return NextResponse.json({
        success: true,
        message: `Successfully converted ${email} to customer profile`,
        type: 'customer',
        userId
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type provided'
    }, { status: 400 })

  } catch (error: any) {
    console.error('[API] Error converting auth user:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to convert auth user'
    }, { status: 500 })
  }
}
