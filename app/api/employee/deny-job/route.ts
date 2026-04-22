import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, employeeId } = body

    if (!jobId || !employeeId) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId and employeeId' },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, get the pro_job to find the order_id
    const { data: proJob, error: proJobError } = await supabase
      .from('pro_jobs')
      .select('id, order_id')
      .eq('id', jobId)
      .maybeSingle()

    if (proJobError || !proJob) {
      console.error('Pro job not found:', proJobError)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get the order to check/update denied_by
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, denied_by')
      .eq('id', proJob.order_id)
      .maybeSingle()

    if (orderError || !order) {
      console.error('Order not found:', orderError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Parse denied_by array
    let deniedByList = []
    if (order.denied_by && typeof order.denied_by === 'string') {
      try {
        deniedByList = JSON.parse(order.denied_by)
      } catch {
        deniedByList = []
      }
    } else if (Array.isArray(order.denied_by)) {
      deniedByList = order.denied_by
    }

    // Add employee to denied list if not already there
    if (!deniedByList.includes(employeeId)) {
      deniedByList.push(employeeId)
    }

    // Update the order with the denied employee list
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        denied_by: JSON.stringify(deniedByList),
        updated_at: new Date().toISOString()
      })
      .eq('id', proJob.order_id)

    if (updateError) {
      console.error('Error updating job:', updateError)
      return NextResponse.json(
        { error: 'Failed to deny job' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Job denied successfully',
        data: {
          jobId,
          deniedBy: deniedByList
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error denying job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
