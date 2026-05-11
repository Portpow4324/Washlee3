import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  })
}

function getClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return {
    auth: createClient(supabaseUrl, anonKey),
    admin: createClient(supabaseUrl, serviceKey),
  }
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')

  if (!token) {
    return { user: null, error: 'Missing authorization token' }
  }

  const { auth } = getClients()
  const { data, error } = await auth.auth.getUser(token)

  if (error || !data.user) {
    return { user: null, error: 'Invalid or expired token' }
  }

  return { user: data.user, error: null }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return json({ success: false, error: authError }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId') || user.id

    if (employeeId !== user.id) {
      return json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { admin } = getClients()
    const { data, error } = await admin
      .from('orders')
      .select('*')
      .or(`pro_id.eq.${employeeId},employee_id.eq.${employeeId},assigned_pro_id.eq.${employeeId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Mobile Orders] Pro fetch error:', error)
      return json({ success: false, error: 'Failed to fetch pro orders' }, { status: 500 })
    }

    return json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('[Mobile Orders] Pro route error:', error)
    return json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch pro orders' },
      { status: 500 }
    )
  }
}
