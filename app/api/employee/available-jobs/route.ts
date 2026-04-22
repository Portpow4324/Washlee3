import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendProAcceptedJobEmail } from '@/lib/emailMarketing'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  const status = searchParams.get('status') || 'available'
  const limit = searchParams.get('limit') || '20'
  
  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employeeId parameter' }, { status: 400 })
  }
  
  try {
    // Fetch available jobs (not yet accepted by this employee)
    const { data, error } = await supabaseAdmin
      .from('pro_jobs')
      .select('*')
      .eq('status', status)
      .is('pro_id', null) // Only show jobs not yet accepted
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
    
    if (error) {
      console.error('Jobs fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }
    
    // Filter out jobs that the employee has denied
    const filteredData = data?.filter(job => {
      if (!job.order_id) return true
      
      // We'll filter these client-side after fetching order denied_by
      return true
    }) || []
    
    // Get order details to check denied_by list
    const finalData = []
    for (const job of filteredData) {
      const { data: orderData } = await supabaseAdmin
        .from('orders')
        .select('denied_by')
        .eq('id', job.order_id)
        .maybeSingle()
      
      let deniedByList = []
      if (orderData?.denied_by) {
        try {
          deniedByList = typeof orderData.denied_by === 'string' 
            ? JSON.parse(orderData.denied_by) 
            : orderData.denied_by
        } catch {
          deniedByList = []
        }
      }
      
      // Only include job if employee hasn't denied it
      if (!deniedByList.includes(employeeId)) {
        finalData.push(job)
      }
    }
    
    return NextResponse.json({ 
      success: true,
      data: finalData || [],
      count: finalData?.length || 0
    })
  } catch (error) {
    console.error('Jobs fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, employeeId, action } = await request.json()
    
    if (!jobId || !employeeId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: jobId, employeeId, action' 
      }, { status: 400 })
    }
    
    if (action === 'accept') {
      // First, get the job to find the associated order_id
      const { data: jobData, error: jobFetchError } = await supabaseAdmin
        .from('pro_jobs')
        .select('id, order_id')
        .eq('id', jobId)
        .single()
      
      if (jobFetchError || !jobData) {
        console.error('Error fetching job:', jobFetchError)
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      // Get the order to find customer_id and order details
      const { data: orderData, error: orderFetchError } = await supabaseAdmin
        .from('orders')
        .select('id, user_id, total_price, status')
        .eq('id', jobData.order_id)
        .single()
      
      if (orderFetchError || !orderData) {
        console.error('Error fetching order:', orderFetchError)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Get pro (employee) details
      const { data: proData, error: proFetchError } = await supabaseAdmin
        .from('employees')
        .select('id, name, email, phone')
        .eq('id', employeeId)
        .single()
      
      // Get customer details
      const { data: customerData, error: customerFetchError } = await supabaseAdmin
        .from('users')
        .select('email, full_name, phone')
        .eq('id', orderData.user_id)
        .single()

      // Accept the job in pro_jobs table
      const { data, error } = await supabaseAdmin
        .from('pro_jobs')
        .update({
          pro_id: employeeId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
      
      if (error) {
        // If FK constraint fails, just update the status
        if (error.code === '23503') {
          console.warn('FK constraint on pro_id, updating status only:', error.message)
          const { data: statusData, error: statusError } = await supabaseAdmin
            .from('pro_jobs')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .select()
          
          if (statusError) {
            console.error('Job accept error:', statusError)
            return NextResponse.json({ error: 'Failed to accept job' }, { status: 500 })
          }
          
          return NextResponse.json({ 
            success: true,
            message: 'Job accepted successfully',
            data: statusData[0],
            note: 'Pro assignment pending - requires employees table setup'
          })
        }
        
        console.error('Job accept error:', error)
        return NextResponse.json({ error: 'Failed to accept job' }, { status: 500 })
      }

      // Also update the corresponding order in the orders table with the pro_id
      if (jobData.order_id) {
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .update({
            pro_id: employeeId,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobData.order_id)
        
        if (orderError) {
          console.warn('Error updating order with pro_id:', orderError)
          // Don't fail the whole operation if order update fails
        }
      }

      // Send email to customer with pro details
      if (customerData && proData) {
        try {
          await sendProAcceptedJobEmail({
            to: customerData.email,
            customerName: customerData.full_name || 'Valued Customer',
            proName: proData.name || 'Your Washlee Pro',
            proPhone: proData.phone || 'Contact via email',
            proEmail: proData.email || 'support@washlee.com',
            orderAmount: orderData.total_price || 0,
            orderId: orderData.id,
          })
          console.log('[Accept Job] ✓ Pro accepted email sent to customer:', customerData.email)
        } catch (emailError) {
          console.error('[Accept Job] Failed to send pro details email:', emailError)
          // Don't fail the job acceptance if email fails
        }
      } else {
        console.warn('[Accept Job] Could not send email - missing customer or pro data')
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Job accepted successfully',
        data: data[0] 
      })
    } else if (action === 'reject') {
      // Reject/decline the job (just don't accept it)
      return NextResponse.json({ 
        success: true,
        message: 'Job declined'
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Job action error:', error)
    return NextResponse.json({ error: 'Failed to process job action' }, { status: 500 })
  }
}
