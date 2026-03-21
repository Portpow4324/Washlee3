import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'

/**
 * Generates unique employee/payslip codes
 * Format: EMP-{TIMESTAMP}-{RANDOM_STRING}
 * Example: EMP-1709567890123-A7K9Q
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const { count = 1, format = 'standard' } = await request.json()

    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      )
    }

    const codes = []

    for (let i = 0; i < count; i++) {
      let code: string

      if (format === 'payslip') {
        // Format: PS-{DATE}-{RANDOM}
        // Example: PS-20240304-X9K2L
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
        const random = Math.random().toString(36).substring(2, 7).toUpperCase()
        code = `PS-${dateStr}-${random}`
      } else {
        // Default format: EMP-{TIMESTAMP}-{RANDOM}
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 7).toUpperCase()
        code = `EMP-${timestamp}-${random}`
      }

      codes.push({
        code,
        created_at: new Date().toISOString(),
        used: false,
        format: format,
      })
    }

    // Store codes in Supabase if needed
    for (const codeData of codes) {
      await supabase
        .from('employee_codes')
        .insert(codeData)
    }

    return NextResponse.json({
      success: true,
      codes: codes.map(c => c.code),
      count: codes.length,
      format: format,
    })
  } catch (error: any) {
    console.error('[API] Error generating codes:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate codes' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/employee-codes
 * Retrieve unused codes
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const { data: codes, error } = await supabase
      .from('employee_codes')
      .select('code, created_at, format')
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      success: true,
      codes: codes || [],
      count: codes?.length || 0,
    })
  } catch (error: any) {
    console.error('[API] Error fetching codes:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch codes' },
      { status: 500 }
    )
  }
}
