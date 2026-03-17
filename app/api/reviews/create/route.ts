import { NextRequest, NextResponse } from 'next/server'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, proId, customerId, rating, comment, createdAt } = body

    if (!orderId || !proId || !customerId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Create review document in reviews collection
    const reviewRef = await addDoc(collection(db, 'reviews'), {
      orderId,
      proId,
      customerId,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date(createdAt),
      updatedAt: new Date(),
    })

    // Update pro document with review reference
    const proDocRef = doc(db, 'professionals', proId)
    await updateDoc(proDocRef, {
      reviews: arrayUnion(reviewRef.id),
      // Optionally calculate average rating here
    })

    // Update order with review reference
    const orderDocRef = doc(db, `users/${customerId}/orders/${orderId}`)
    await updateDoc(orderDocRef, {
      reviewId: reviewRef.id,
      reviewed: true,
      reviewedAt: new Date(),
    })

    console.log(`Review created: ${reviewRef.id} for pro ${proId}`)

    return NextResponse.json(
      {
        success: true,
        reviewId: reviewRef.id,
        message: 'Review submitted successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    )
  }
}
