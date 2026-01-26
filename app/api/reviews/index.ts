import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  updateDoc,
  doc,
  deleteDoc,
  QueryConstraint
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Review, validateReview, isSpam } from '@/lib/reviewUtils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const proId = searchParams.get('proId')
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')

    const reviewsRef = collection(db, 'reviews')
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

    if (proId) {
      constraints.push(where('proId', '==', proId))
    }
    if (orderId) {
      constraints.push(where('orderId', '==', orderId))
    }
    if (status) {
      constraints.push(where('status', '==', status))
    }

    const q = query(reviewsRef, ...constraints)
    const querySnapshot = await getDocs(q)

    const reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Review))

    return NextResponse.json({ reviews }, { status: 200 })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = validateReview(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid review data', details: validation.errors },
        { status: 400 }
      )
    }

    // Check for spam
    if (body.text && isSpam(body.text)) {
      return NextResponse.json(
        { error: 'Review contains suspicious content' },
        { status: 400 }
      )
    }

    // Check if already reviewed this order
    const reviewsRef = collection(db, 'reviews')
    const existingQuery = query(
      reviewsRef,
      where('orderId', '==', body.orderId),
      where('customerId', '==', body.customerId)
    )
    const existing = await getDocs(existingQuery)

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'You have already reviewed this order' },
        { status: 400 }
      )
    }

    const newReview: Partial<Review> = {
      ...body,
      status: 'pending',
      helpfulVotes: 0,
      createdAt: Timestamp.now()
    }

    const docRef = await addDoc(reviewsRef, newReview)

    return NextResponse.json(
      {
        id: docRef.id,
        ...newReview
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
