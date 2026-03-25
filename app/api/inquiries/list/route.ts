import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'pro' // 'pro' or 'wholesale'
    const status = searchParams.get('status') // optional filter

    console.log('[API][inquiries/list] Fetching inquiries:', { type, status })

    if (type === 'pro') {
      let query = supabaseAdmin.from('pro_inquiries').select('*')

      if (status) {
        query = query.eq('status', status)
      }

      const { data: inquiries, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('[API][inquiries/list] Error fetching inquiries:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch inquiries' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        inquiries: inquiries || [],
        count: inquiries?.length || 0,
      })
    } else if (type === 'wholesale') {
      let query = supabaseAdmin.from('wholesale_inquiries').select('*')

      if (status) {
        query = query.eq('status', status)
      }

      const { data: inquiries, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('[API][inquiries/list] Error fetching inquiries:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch inquiries' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        inquiries: inquiries || [],
        count: inquiries?.length || 0,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid inquiry type' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('[API][inquiries/list] Exception:', error.message)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch inquiries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'POST not supported' }, { status: 405 })
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'PATCH not supported' }, { status: 405 })
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'PUT not supported' }, { status: 405 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'DELETE not supported' }, { status: 405 })
}
