import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import { ProVerification, VerificationDocument, validateVerificationDocument } from '@/lib/proVerificationUtils'

// GET /api/pro/verification - Fetch pro's verification status
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pro profile to find verification
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id

    // Get verification
    const verificationRef = doc(db, 'pro-verifications', proId)
    const verificationSnap = await getDoc(verificationRef)

    if (!verificationSnap.exists()) {
      // Return empty verification state
      const emptyVerification: ProVerification = {
        id: proId,
        proId,
        status: 'pending',
        documents: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      return NextResponse.json(emptyVerification)
    }

    return NextResponse.json(verificationSnap.data())
  } catch (error: any) {
    console.error('Verification fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch verification' }, { status: 500 })
  }
}

// POST /api/pro/verification - Upload verification document
export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentType, documentUrl } = await request.json()

    // Validate
    if (!documentType || !documentUrl) {
      return NextResponse.json({ error: 'Document type and URL required' }, { status: 400 })
    }

    const validation = validateVerificationDocument({ type: documentType, url: documentUrl })
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Get pro profile
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id

    // Get or create verification
    const verificationRef = doc(db, 'pro-verifications', proId)
    const verificationSnap = await getDoc(verificationRef)

    let verification: ProVerification

    if (!verificationSnap.exists()) {
      verification = {
        id: proId,
        proId,
        status: 'pending',
        documents: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    } else {
      verification = verificationSnap.data() as ProVerification
    }

    // Create new document
    const newDocument: VerificationDocument = {
      id: `${documentType}-${Date.now()}`,
      type: documentType,
      url: documentUrl,
      uploadedAt: Timestamp.now(),
      status: 'pending',
    }

    // Remove existing document of same type if present
    verification.documents = verification.documents.filter(d => d.type !== documentType)
    verification.documents.push(newDocument)
    verification.updatedAt = Timestamp.now()
    verification.status = 'in-review'

    // Save verification
    await setDoc(verificationRef, verification)

    // Create audit log
    await addDoc(collection(db, 'pro-verifications', proId, 'audit-log'), {
      action: 'document_uploaded',
      documentType,
      timestamp: Timestamp.now(),
      userId: user.uid,
    })

    return NextResponse.json(newDocument, { status: 201 })
  } catch (error: any) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload document' }, { status: 500 })
  }
}

// PATCH /api/pro/verification - Request background check or update status
export async function PATCH(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, backgroundCheckId, notes } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    // Get pro profile
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id
    const verificationRef = doc(db, 'pro-verifications', proId)
    const verificationSnap = await getDoc(verificationRef)

    if (!verificationSnap.exists()) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    const verification = verificationSnap.data() as ProVerification

    switch (action) {
      case 'request_background_check':
        if (!backgroundCheckId) {
          return NextResponse.json({ error: 'Background check ID required' }, { status: 400 })
        }
        verification.backgroundCheckId = backgroundCheckId
        verification.backgroundCheckStatus = 'pending'
        break

      case 'submit_for_review':
        // Ensure at least ID document is uploaded
        if (!verification.documents.some(d => d.type === 'id')) {
          return NextResponse.json(
            { error: 'ID document required before submission' },
            { status: 400 }
          )
        }
        verification.status = 'in-review'
        break

      case 'update_notes':
        verification.notes = notes || ''
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    verification.updatedAt = Timestamp.now()
    await updateDoc(verificationRef, { ...verification } as any)

    // Create audit log
    await addDoc(collection(db, 'pro-verifications', proId, 'audit-log'), {
      action,
      timestamp: Timestamp.now(),
      userId: user.uid,
      details: { backgroundCheckId, notes },
    })

    return NextResponse.json(verification)
  } catch (error: any) {
    console.error('Verification update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update verification' }, { status: 500 })
  }
}
