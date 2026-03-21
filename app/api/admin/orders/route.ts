import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/orders
 * Get all orders across the system (admin only)
 * 
 * Note: This endpoint is temporarily disabled for MVP
 * Full migration to Supabase coming in Phase 8
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      success: true,
      orders: [],
      message: 'Admin orders endpoint temporarily disabled for MVP'
    },
    { status: 200 }
  )
}
