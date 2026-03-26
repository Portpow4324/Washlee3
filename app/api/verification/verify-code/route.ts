import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/serverVerification'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  try {
    const { email, phone, code, type = 'phone' } = await request.json()

    if (!email || !phone || !code) {
      return NextResponse.json({ error: 'Missing required fields: email, phone, code' }, { status: 400 })
    }

    console.log(`[VerifyCode] Verifying ${type} code for:`, { email, phone })

    const verified = await verifyCode(email, phone, code)

    if (!verified) {
      return NextResponse.json({ success: false, error: 'Invalid or expired code' }, { status: 400 })
    }

    // If verified, update the database to mark verification as complete
    try {
      const supabase = getServiceRoleClient()
      
      if (type === 'phone') {
        console.log('[VerifyCode] Updating phone_verified in database...')
        const { error } = await supabase
          .from('users')
          .update({
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
          })
          .eq('email', email)

        if (error) {
          console.error('[VerifyCode] Error updating phone_verified:', error)
          // Still return success - verification code was valid
          return NextResponse.json({ 
            success: true, 
            verified: true,
            warning: 'Code verified but database update failed'
          })
        }

        console.log('[VerifyCode] ✓ Phone verification recorded in database')
      } else if (type === 'email') {
        console.log('[VerifyCode] Updating email_verified in Supabase auth...')
        // For email, we update the auth user's email_confirmed status
        const { error } = await supabase
          .from('users')
          .update({
            email_verified: true,
            email_verified_at: new Date().toISOString(),
          })
          .eq('email', email)

        if (error) {
          console.error('[VerifyCode] Error updating email_verified:', error)
          return NextResponse.json({ 
            success: true, 
            verified: true,
            warning: 'Code verified but database update failed'
          })
        }

        console.log('[VerifyCode] ✓ Email verification recorded in database')
      }
    } catch (dbError: any) {
      console.error('[VerifyCode] Database error:', dbError.message)
      // Verification was successful even if database update fails
      return NextResponse.json({ 
        success: true, 
        verified: true,
        warning: 'Code verified but database update failed'
      })
    }

    return NextResponse.json({ success: true, verified: true })
  } catch (err: any) {
    console.error('[API][verification/verify-code] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to verify code' }, { status: 500 })
  }
}
