import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  console.log('[VERIFY_PHONE_CODE] POST /api/auth/verify-phone-code called')
  
  try {
    const { phone, code, userId } = await request.json()

    if (!phone || !code || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, code, userId' },
        { status: 400 }
      )
    }

    const supabase = getServiceRoleClient()

    // Look up the verification code
    console.log('[VERIFY_PHONE_CODE] Looking up verification code...')
    const { data: codeData, error: lookupError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('user_id', userId)
      .eq('code_type', 'phone')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (lookupError || !codeData) {
      console.warn('[VERIFY_PHONE_CODE] Code not found or expired')
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    console.log('[VERIFY_PHONE_CODE] ✓ Code verified')

    // Update the users table with verified phone
    console.log('[VERIFY_PHONE_CODE] Updating user phone...')
    const { error: updateError } = await supabase
      .from('users')
      .update({
        phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[VERIFY_PHONE_CODE] Error updating user:', updateError.message)
      return NextResponse.json(
        { error: 'Failed to verify phone' },
        { status: 500 }
      )
    }

    console.log('[VERIFY_PHONE_CODE] ✓ User phone updated')

    // Delete the used code
    await supabase
      .from('verification_codes')
      .delete()
      .eq('id', codeData.id)

    // Also update the customers or employees table if phone is empty
    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('id', userId)
        .single()

      if (customerData) {
        await supabase
          .from('customers')
          .update({ phone })
          .eq('id', userId)
      }
    } catch (err) {
      console.log('[VERIFY_PHONE_CODE] Customer record not found, trying employees...')
      try {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id')
          .eq('id', userId)
          .single()

        if (employeeData) {
          await supabase
            .from('employees')
            .update({ phone })
            .eq('id', userId)
        }
      } catch (empErr) {
        console.log('[VERIFY_PHONE_CODE] Employee record also not found')
      }
    }

    console.log('[VERIFY_PHONE_CODE] ✓ Phone verification complete')

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully'
    })
  } catch (err: any) {
    console.error('[VERIFY_PHONE_CODE] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
