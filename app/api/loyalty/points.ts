import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import {
  LoyaltyMember,
  LoyaltyTier,
  calculateTier,
  calculateOrderPoints,
  getTierUpgradeMessage,
  pointsToNextTier,
  TIER_REQUIREMENTS,
  PointsTransaction,
  POINTS_RATES
} from '@/lib/loyaltyLogic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, customerId, points, description, orderId, orderTotal } = body

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    switch (action) {
      case 'initialize': {
        // Initialize loyalty member for new customer
        const memberRef = doc(db, 'loyalty_members', customerId)
        const memberSnap = await getDoc(memberRef)

        if (memberSnap.exists()) {
          return NextResponse.json({ error: 'Member already initialized' }, { status: 400 })
        }

        const newMember: LoyaltyMember = {
          customerId,
          email: body.email || '',
          points: 0,
          tier: 'silver',
          totalSpent: 0,
          totalOrders: 0,
          pointsHistory: [],
          referrals: [],
          lastPointsUpdated: Timestamp.now(),
          tierUpdatedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }

        await setDoc(memberRef, newMember)

        return NextResponse.json({ success: true, member: newMember })
      }

      case 'add_points': {
        // Add points to member (from order completion, referral, etc.)
        const memberRef = doc(db, 'loyalty_members', customerId)
        const memberSnap = await getDoc(memberRef)

        if (!memberSnap.exists()) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        const member = memberSnap.data() as LoyaltyMember
        const newPoints = member.points + points
        const previousTier = member.tier
        const newTier = calculateTier(newPoints)

        const transaction: PointsTransaction = {
          id: `pt_${Date.now()}`,
          type: 'earn',
          points,
          description: description || 'Points earned',
          orderId,
          createdAt: Timestamp.now()
        }

        // Add transaction to history
        const updatedHistory = [...member.pointsHistory, transaction]

        // Update member
        await updateDoc(memberRef, {
          points: newPoints,
          tier: newTier,
          lastPointsUpdated: Timestamp.now(),
          ...(newTier !== previousTier && { tierUpdatedAt: Timestamp.now() }),
          pointsHistory: updatedHistory,
          updatedAt: Timestamp.now()
        })

        // Also update totalOrders if from order
        if (orderId) {
          await updateDoc(memberRef, {
            totalOrders: member.totalOrders + 1,
            totalSpent: (member.totalSpent || 0) + (orderTotal || 0)
          })
        }

        return NextResponse.json({
          success: true,
          points: newPoints,
          tier: newTier,
          tierUpgraded: newTier !== previousTier,
          tierUpgradeMessage: newTier !== previousTier ? getTierUpgradeMessage(previousTier, newTier) : null
        })
      }

      case 'redeem_points': {
        // Redeem points for reward
        const memberRef = doc(db, 'loyalty_members', customerId)
        const memberSnap = await getDoc(memberRef)

        if (!memberSnap.exists()) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        const member = memberSnap.data() as LoyaltyMember

        if (member.points < points) {
          return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
        }

        const newPoints = member.points - points
        const transaction: PointsTransaction = {
          id: `pt_${Date.now()}`,
          type: 'redeem',
          points: -points,
          description: description || 'Points redeemed for reward',
          createdAt: Timestamp.now()
        }

        const updatedHistory = [...member.pointsHistory, transaction]

        await updateDoc(memberRef, {
          points: newPoints,
          pointsHistory: updatedHistory,
          updatedAt: Timestamp.now()
        })

        // Create redemption record
        await addDoc(collection(db, 'loyalty_redemptions'), {
          customerId,
          points,
          description,
          status: 'completed',
          createdAt: Timestamp.now()
        })

        return NextResponse.json({
          success: true,
          pointsRemaining: newPoints,
          message: `${points} points redeemed successfully!`
        })
      }

      case 'get_member': {
        // Get member loyalty info
        const memberRef = doc(db, 'loyalty_members', customerId)
        const memberSnap = await getDoc(memberRef)

        if (!memberSnap.exists()) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        const member = memberSnap.data() as LoyaltyMember
        const pointsToNext = pointsToNextTier(member.points, member.tier)

        return NextResponse.json({
          member,
          pointsToNextTier: pointsToNext,
          progress: {
            points: member.points,
            tier: member.tier,
            totalSpent: member.totalSpent,
            totalOrders: member.totalOrders
          }
        })
      }

      case 'get_history': {
        // Get points transaction history
        const memberRef = doc(db, 'loyalty_members', customerId)
        const memberSnap = await getDoc(memberRef)

        if (!memberSnap.exists()) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        const member = memberSnap.data() as LoyaltyMember
        const history = (member.pointsHistory || []).slice(-20) // Last 20 transactions

        return NextResponse.json({ history })
      }

      case 'apply_referral': {
        // Apply referral code to new signup
        const { referralCode, newCustomerId } = body

        // Find referrer by code
        const membersRef = collection(db, 'loyalty_members')
        const q = query(membersRef, where('referralCode', '==', referralCode))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
        }

        const referrerDoc = snapshot.docs[0]
        const referrer = referrerDoc.data() as LoyaltyMember

        // Add referral record to referrer
        const referralRecord = {
          referralId: `ref_${Date.now()}`,
          referredEmail: body.referredEmail || '',
          status: 'registered',
          pointsEarned: POINTS_RATES.referralConversion,
          createdAt: Timestamp.now()
        }

        const updatedReferrals = [...(referrer.referrals || []), referralRecord]
        const referralPoints = referrer.points + POINTS_RATES.referralConversion

        await updateDoc(doc(db, 'loyalty_members', referrer.customerId), {
          points: referralPoints,
          referrals: updatedReferrals,
          tier: calculateTier(referralPoints),
          updatedAt: Timestamp.now()
        })

        return NextResponse.json({
          success: true,
          message: `${POINTS_RATES.referralConversion} points earned from referral!`,
          pointsEarned: POINTS_RATES.referralConversion
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Loyalty API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
