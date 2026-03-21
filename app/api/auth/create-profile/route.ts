import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      uid,
      email,
      firstName,
      lastName,
      phone,
      state,
      personalUse,
      preferenceMarketingTexts,
      preferenceAccountTexts,
      selectedPlan
    } = body

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, email' },
        { status: 400 }
      )
    }

    console.log('[API] Creating customer profile for user:', uid)

    const profileData = {
      id: uid,
      email,
      first_name: firstName || null,
      last_name: lastName || null,
      phone: phone || null,
      state: state || null,
      personal_use: personalUse || null,
      preference_marketing_texts: preferenceMarketingTexts || false,
      preference_account_texts: preferenceAccountTexts || true,
      selected_plan: selectedPlan || 'none',
      account_status: 'active',
      created_at: new Date().toISOString(),
    }

    console.log('[API] Insert data:', JSON.stringify(profileData, null, 2))

    const { data: result, error } = await supabaseAdmin
      .from('customers')
      .insert([profileData])
      .select()

    if (error) {
      const errorMsg = `Insert failed: ${error.message || JSON.stringify(error)}`
      console.error('[API] Insert error:', errorMsg, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        { 
          error: errorMsg, 
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint
        },
        { status: 400 }
      )
    }

    console.log('[API] ✓ Customer profile created:', result)
    return NextResponse.json({
      success: true,
      profile: result?.[0] || {}
    })
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString?.() || 'Unknown error'
    console.error('[API] Failed to create customer profile:', errorMsg)
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
