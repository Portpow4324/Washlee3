import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Try to get from customers table (using admin client to bypass RLS)
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, phone, address, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (!customerError && customerData) {
      console.log('[Profile API] ✓ Found customer:', customerData.email)
      return NextResponse.json({
        success: true,
        data: {
          id: customerData.id,
          email: customerData.email,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          phone: customerData.phone,
          address: customerData.address,
          user_type: 'customer',
          created_at: customerData.created_at,
          updated_at: customerData.updated_at
        }
      })
    }

    // Try employees table
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, email, first_name, last_name, phone, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (!employeeError && employeeData) {
      console.log('[Profile API] ✓ Found employee:', employeeData.email)
      return NextResponse.json({
        success: true,
        data: {
          id: employeeData.id,
          email: employeeData.email,
          first_name: employeeData.first_name,
          last_name: employeeData.last_name,
          phone: employeeData.phone,
          user_type: 'pro',
          is_employee: true,
          created_at: employeeData.created_at,
          updated_at: employeeData.updated_at
        }
      })
    }

    // Not found in either table
    console.log('[Profile API] ⚠️ Profile not found for user:', userId)
    return NextResponse.json({
      success: false,
      error: 'Profile not found'
    }, { status: 404 })

  } catch (error: any) {
    console.error('[Profile API] Error:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
