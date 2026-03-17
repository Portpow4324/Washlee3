import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import COLLECTIONS from '@/lib/collections'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // Dump all stored codes from Firestore (for debugging only)
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.VERIFICATION_CODES))
    const codes: Record<string, any> = {}
    snapshot.forEach((doc) => {
      codes[doc.id] = doc.data()
    })
    return NextResponse.json({ codes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}