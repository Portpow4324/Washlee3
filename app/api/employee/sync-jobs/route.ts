import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Sync pro_jobs accepted jobs to orders table
    // This ensures orders have pro_id set when a job is accepted
    
    const { data: acceptedJobs, error: jobsError } = await supabaseAdmin
      .from('pro_jobs')
      .select('id, order_id, pro_id, status')
      .not('pro_id', 'is', null)
      .eq('status', 'accepted')
    
    if (jobsError) {
      console.error('Error fetching accepted jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    let synced = 0
    let failed = 0

    // Update orders table with pro_id from pro_jobs
    for (const job of acceptedJobs || []) {
      if (!job.order_id) continue

      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ pro_id: job.pro_id, updated_at: new Date().toISOString() })
        .eq('id', job.order_id)

      if (updateError) {
        console.warn(`Failed to sync job ${job.id}:`, updateError)
        failed++
      } else {
        synced++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} jobs${failed > 0 ? `, ${failed} failed` : ''}`,
      synced,
      failed,
      total: (acceptedJobs || []).length
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Failed to sync jobs' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Trigger sync on GET for easy testing
    const syncResponse = await POST(request)
    return syncResponse
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
