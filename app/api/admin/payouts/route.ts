import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/payouts
 * Get all pending payouts (admin only)
 * 
 * Note: This endpoint is temporarily disabled for MVP
 * Full migration to Supabase coming in Phase 8
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      success: true,
      payouts: [],
      message: 'Admin payouts endpoint temporarily disabled for MVP'
    },
    { status: 200 }
  )
}

/**
 * PATCH /api/admin/payouts
 * Note: Temporarily disabled for MVP
 */
export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false,
      message: 'Admin payouts endpoint temporarily disabled for MVP'
    },
    { status: 503 }
  )
}
