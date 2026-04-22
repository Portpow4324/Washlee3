import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  
  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employeeId parameter' }, { status: 400 })
  }
  
  try {
    // Fetch all orders for this employee
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, earnings, status, created_at')
      .eq('employee_id', employeeId)
    
    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
    }
    
    // Fetch payout history
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from('payouts')
      .select('id, amount, status, requested_at, processed_at')
      .eq('employee_id', employeeId)
      .order('requested_at', { ascending: false })
    
    if (payoutsError) {
      console.error('Payouts fetch error:', payoutsError)
      // Don't fail, just continue without payout history
    }
    
    // Calculate balance
    const completedEarnings = (orders || [])
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => {
        const earning = parseFloat(o.earnings?.toString() || '0')
        return sum + (isNaN(earning) ? 0 : earning)
      }, 0)
    
    const pendingEarnings = (orders || [])
      .filter(o => o.status !== 'completed')
      .reduce((sum, o) => {
        const earning = parseFloat(o.earnings?.toString() || '0')
        return sum + (isNaN(earning) ? 0 : earning)
      }, 0)
    
    const processedPayouts = (payouts || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount?.toString() || '0')
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
    
    const availableBalance = completedEarnings - processedPayouts
    
    return NextResponse.json({ 
      success: true,
      data: {
        availableBalance: parseFloat(availableBalance.toFixed(2)),
        completedEarnings: parseFloat(completedEarnings.toFixed(2)),
        pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
        totalPaidOut: parseFloat(processedPayouts.toFixed(2)),
        minimumPayout: 100.00,
        canWithdraw: availableBalance >= 100
      }
    })
  } catch (error) {
    console.error('Balance calculation error:', error)
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employeeId, amount, accountType, accountDetails } = await request.json()
    
    if (!employeeId || !amount || !accountType) {
      return NextResponse.json({ 
        error: 'Missing required fields: employeeId, amount, accountType' 
      }, { status: 400 })
    }
    
    if (amount < 100) {
      return NextResponse.json({ 
        error: 'Minimum payout amount is $100.00' 
      }, { status: 400 })
    }
    
    // Create payout request
    const { data, error } = await supabaseAdmin
      .from('payouts')
      .insert({
        employee_id: employeeId,
        amount: amount,
        account_type: accountType,
        account_details: accountDetails,
        status: 'pending',
        requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (error) {
      console.error('Payout creation error:', error)
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Payout request submitted successfully',
      data: data[0]
    })
  } catch (error) {
    console.error('Payout error:', error)
    return NextResponse.json({ error: 'Failed to process payout request' }, { status: 500 })
  }
}
