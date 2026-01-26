import { NextRequest, NextResponse } from 'next/server'
import {
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id
    const body = await request.json()
    const { action } = body

    const reviewRef = doc(db, 'reviews', reviewId)

    switch (action) {
      case 'approve': {
        await updateDoc(reviewRef, {
          status: 'approved'
        })

        return NextResponse.json(
          { success: true, status: 'approved' },
          { status: 200 }
        )
      }

      case 'reject': {
        const { reason } = body
        await updateDoc(reviewRef, {
          status: 'rejected'
        })

        // Log rejection
        await updateDoc(reviewRef, {
          rejectionReason: reason || 'Violates community guidelines'
        })

        return NextResponse.json(
          { success: true, status: 'rejected' },
          { status: 200 }
        )
      }

      case 'flag': {
        const { reason } = body
        await updateDoc(reviewRef, {
          flagged: true,
          flagReason: reason,
          flaggedAt: Timestamp.now()
        })

        return NextResponse.json(
          { success: true },
          { status: 200 }
        )
      }

      case 'helpful': {
        await updateDoc(reviewRef, {
          helpfulVotes: (body.currentVotes || 0) + 1
        })

        return NextResponse.json(
          { success: true },
          { status: 200 }
        )
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id
    const reviewRef = doc(db, 'reviews', reviewId)

    await deleteDoc(reviewRef)

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
