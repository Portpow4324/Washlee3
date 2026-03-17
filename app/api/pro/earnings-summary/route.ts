import { NextRequest, NextResponse } from 'next/server'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// GET earnings summary
async function handleGET(request: NextRequest) {
  try {
    const proId = request.nextUrl.searchParams.get('proId') || 'test-pro-id'

    const ordersRef = collection(db, 'assignments')
    const q = query(ordersRef, where('proId', '==', proId))
    const querySnapshot = await getDocs(q)

    let totalEarned = 0
    let completedOrders = 0

    for (const doc of querySnapshot.docs) {
      const assignment = doc.data()
      if (assignment.orderStatus === 'completed') {
        completedOrders++
        totalEarned += assignment.totalPrice || 0
      }
    }

    const payoutsRef = collection(db, 'payouts')
    const payoutQuery = query(payoutsRef, where('proId', '==', proId), where('status', '==', 'completed'))
    const payoutSnapshot = await getDocs(payoutQuery)

    let totalPaidOut = 0
    for (const doc of payoutSnapshot.docs) {
      totalPaidOut += doc.data().amount || 0
    }

    const balance = totalEarned - totalPaidOut

    const allPayoutsQuery = query(payoutsRef, where('proId', '==', proId))
    const allPayoutsSnapshot = await getDocs(allPayoutsQuery)
    const payouts = allPayoutsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`Earnings summary for pro ${proId}: Total=$${totalEarned}, Balance=$${balance}`)

    return NextResponse.json(
      {
        earnings: {
          totalEarned,
          balance,
          completedOrders,
        },
        payouts,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching earnings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}

export { handleGET as GET }
