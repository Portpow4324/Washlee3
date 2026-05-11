import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient, getAnonClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  const serviceRoleClient = getServiceRoleClient()
  const anonClient = getAnonClient()

  try {
    const body = await request.json()
    const { employeeId, email, password } = body

    // Validate input
    if (!employeeId || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, email, password' },
        { status: 400 }
      )
    }

    console.log('[Employee Login] Attempting login:', { employeeId, email, password: '***' })
    const normalizedEmployeeId = String(employeeId).trim().toUpperCase()
    const normalizedEmail = String(email).trim().toLowerCase()

    // Validate employee ID format
    // Accept: 6-digit (123456), Standard (EMP-xxx-xxx), Payslip (PS-yyyymmdd-xxx)
    const isSixDigit = /^\d{6}$/.test(normalizedEmployeeId)
    const isStandardFormat = /^EMP-\d+-[A-Z0-9]+$/.test(normalizedEmployeeId)
    const isPayslipFormat = /^PS-\d{8}-[A-Z0-9]+$/.test(normalizedEmployeeId)

    if (!isSixDigit && !isStandardFormat && !isPayslipFormat) {
      return NextResponse.json(
        { error: 'Invalid employee ID format. Use 6 digits or full format.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Step 1: Verify employee exists in employees table
    const { data: employeeData, error: employeeError } = await serviceRoleClient
      .from('employees')
      .select('id, employee_id, first_name, last_name, email')
      .eq('email', normalizedEmail)
      .single()

    if (employeeError || !employeeData) {
      console.error('[Employee Login] Employee not found:', normalizedEmail)
      return NextResponse.json(
        { error: 'Employee not found or invalid credentials' },
        { status: 401 }
      )
    }

    const storedEmployeeId = String(employeeData.employee_id || '').trim().toUpperCase()
    const storedUuid = String(employeeData.id || '').trim().toUpperCase()
    const employeeIdMatches =
      normalizedEmployeeId === storedEmployeeId ||
      normalizedEmployeeId === storedUuid

    if (!employeeIdMatches) {
      console.error('[Employee Login] Employee ID mismatch:', {
        email: normalizedEmail,
        provided: normalizedEmployeeId,
      })
      return NextResponse.json(
        { error: 'Employee not found or invalid credentials' },
        { status: 401 }
      )
    }

    // Step 2: Verify password against Supabase Auth
    try {
      const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: normalizedEmail,
        password
      })

      if (authError) {
        console.error('[Employee Login] Auth error:', authError.message)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        )
      }

      // Step 3: Generate token (using session tokens or JWT-like structure)
      const token = authData.session?.access_token || 'employee-' + Date.now()

      console.log('[Employee Login] ✅ Login successful for employee:', employeeData.id)

      return NextResponse.json({
        success: true,
        token,
        employee: {
          id: employeeData.id,
          email: employeeData.email,
          firstName: employeeData.first_name,
          lastName: employeeData.last_name,
          employeeId: employeeData.employee_id || employeeId
        }
      })
    } catch (authError: any) {
      console.error('[Employee Login] Auth exception:', authError)
      return NextResponse.json(
        { error: 'Authentication service error' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Employee Login] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
