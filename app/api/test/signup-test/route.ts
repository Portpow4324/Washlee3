import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST SIGNUP] ==========================================')
    console.log('[TEST SIGNUP] Testing signup endpoint')
    
    const testData = {
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User',
      phone: '0412345678',
      userType: 'customer',
      state: 'NSW',
      personalUse: 'personal',
    }

    console.log('[TEST SIGNUP] Test data:', testData)

    // Sign up with Supabase Auth
    console.log('[TEST SIGNUP] Step 1: Creating auth account...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: {
          name: testData.name,
          phone: testData.phone,
          user_type: testData.userType,
        },
      },
    })

    if (authError) {
      console.error('[TEST SIGNUP] Auth error:', authError.message)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      console.error('[TEST SIGNUP] No user returned from auth')
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    const userId = authData.user.id
    console.log('[TEST SIGNUP] Auth account created:', userId)

    // Create user record in database
    console.log('[TEST SIGNUP] Step 2: Creating user database record...')
    console.log('[TEST SIGNUP] Inserting:', {
      id: userId,
      email: testData.email,
      name: testData.name,
      phone: testData.phone,
      user_type: testData.userType,
      state: testData.state,
      usage_type: testData.personalUse,
    })

    const { data: insertData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: testData.email,
        name: testData.name,
        phone: testData.phone,
        user_type: testData.userType,
        state: testData.state,
        usage_type: testData.personalUse,
        is_admin: false,
        is_employee: false,
        is_loyalty_member: false,
      })
      .select()

    if (userError) {
      console.error('[TEST SIGNUP] User error:', userError.message)
      console.error('[TEST SIGNUP] Full error:', userError)
      return NextResponse.json(
        { error: `User insert failed: ${userError.message}`, details: userError },
        { status: 500 }
      )
    }

    console.log('[TEST SIGNUP] User record created successfully')

    // Create customer record
    console.log('[TEST SIGNUP] Step 3: Creating customer record...')
    const { error: customerError } = await supabase
      .from('customers')
      .insert({
        id: userId,
        subscription_active: false,
        subscription_plan: null,
        subscription_status: 'inactive',
        payment_status: 'no_payment_method',
        delivery_address: null,
      })

    if (customerError) {
      console.error('[TEST SIGNUP] Customer error:', customerError.message)
      return NextResponse.json(
        { error: `Customer insert failed: ${customerError.message}`, details: customerError },
        { status: 500 }
      )
    }

    console.log('[TEST SIGNUP] ✅ All records created successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Test signup succeeded',
      userId,
      email: testData.email,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[TEST SIGNUP] Exception:', error.message)
    console.error('[TEST SIGNUP] Full exception:', error)
    return NextResponse.json(
      { error: error.message || 'Test failed' },
      { status: 500 }
    )
  }
}
