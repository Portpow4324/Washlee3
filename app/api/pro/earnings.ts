import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore'
import { calculateMonthlyEarnings, calculateWeeklyEarnings } from '@/lib/earningsUtils'

// GET /api/pro/earnings - Get pro's earnings summary
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pro profile
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id

    // Get earnings transactions
    const transactionsQuery = query(collection(db, 'earnings-transactions'), where('proId', '==', proId))
    const transactionsSnap = await getDocs(transactionsQuery)
    const transactions = transactionsSnap.docs.map(doc => doc.data())

    // Calculate earnings
    const totalEarnings = transactions
      .filter(t => t.status !== 'refund')
      .reduce((sum, t) => sum + t.amount, 0)

    const completedCount = transactions.filter(t => t.type === 'job_completed').length
    const monthlyEarnings = calculateMonthlyEarnings(transactions as any)
    const weeklyEarnings = calculateWeeklyEarnings(transactions as any)

    // Get pending earnings (not yet paid out)
    const payoutsQuery = query(
      collection(db, 'pro-payouts'),
      where('proId', '==', proId),
      where('status', '==', 'pending')
    )
    const payoutsSnap = await getDocs(payoutsQuery)
    const pendingPayout = payoutsSnap.docs.length > 0
      ? payoutsSnap.docs[0].data().amount
      : 0

    const pendingEarnings = totalEarnings - pendingPayout

    return NextResponse.json({
      proId,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalCompleted: completedCount,
      averageEarningsPerJob: completedCount > 0 ? Math.round((totalEarnings / completedCount) * 100) / 100 : 0,
      thisMonth: Math.round(monthlyEarnings * 100) / 100,
      thisWeek: Math.round(weeklyEarnings * 100) / 100,
      thisDay: 0, // Calculate from today's transactions
      pendingEarnings: Math.round(pendingEarnings * 100) / 100,
      lastUpdated: Timestamp.now(),
      transactions: transactions.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || 0
        const timeB = b.createdAt?.toMillis?.() || 0
        return timeB - timeA
      }),
    })
  } catch (error: any) {
    console.error('Earnings fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch earnings' }, { status: 500 })
  }
}

// GET /api/pro/earnings/breakdown - Get earnings breakdown by period
export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { period } = await request.json()

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
    }

    // Get pro profile
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id

    // Get transactions
    const transactionsQuery = query(collection(db, 'earnings-transactions'), where('proId', '==', proId))
    const transactionsSnap = await getDocs(transactionsQuery)
    const transactions = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))

    // Group by period
    const breakdown: Record<string, number> = {}

    const now = new Date()
    const ranges = {
      daily: 1,
      weekly: 7,
      monthly: 30,
    }

    const range = ranges[period as keyof typeof ranges]

    for (let i = 0; i < range; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = date.toISOString().split('T')[0]

      const dayEarnings = transactions
        .filter(t => {
          const tDate = new Date(t.createdAt?.toMillis?.() || 0).toISOString().split('T')[0]
          return tDate === key
        })
        .reduce((sum, t) => sum + (t.status !== 'refund' ? t.amount : 0), 0)

      if (dayEarnings > 0) {
        breakdown[key] = dayEarnings
      }
    }

    return NextResponse.json({
      period,
      breakdown,
      totalEarnings: Object.values(breakdown).reduce((a, b) => a + b, 0),
    })
  } catch (error: any) {
    console.error('Earnings breakdown error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch breakdown' }, { status: 500 })
  }
}
