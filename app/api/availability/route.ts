import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeAvailability, setAvailability } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
    }

    const result = await getEmployeeAvailability(employeeId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Get availability error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get availability' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, availabilityData } = body

    const result = await setAvailability(employeeId, availabilityData)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Set availability error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set availability' },
      { status: 500 }
    )
  }
}
