import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { sendProApplicationApproved } from '@/lib/emailService'

// Initialize Firebase Admin if not already done
try {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error('Missing Firebase Admin SDK credentials in environment variables')
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      } as any),
    })
  }
} catch (initError: any) {
  console.error('[API] Firebase Admin initialization failed:', initError.message)
}

export async function POST(request: NextRequest) {
  try {
    const { 
      inquiryId, 
      adminId, 
      adminName, 
      employeeId: customEmployeeId,
      verificationChecklist 
    } = await request.json()

    if (!inquiryId || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = admin.firestore()
    const inquiry = await db.collection('inquiries').doc(inquiryId).get()

    if (!inquiry.exists) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      )
    }

    const inquiryData = inquiry.data()

    // Use provided employee ID or generate one
    const employeeId = customEmployeeId || `EMP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Update inquiry status with verification checklist
    await db.collection('inquiries').doc(inquiryId).update({
      status: 'approved',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: adminId,
      adminName: adminName,
      employeeId: employeeId,
      verificationChecklist: verificationChecklist || {
        idVerified: true,
        contactVerified: true,
        workRightsVerified: true,
        backgroundCheckPassed: true,
        documentsReviewed: true,
      },
    })

    // Update user record with employee status
    const userId = inquiryData?.userId
    if (userId) {
      await db.collection('users').doc(userId).update({
        isEmployee: true,
        employeeId: employeeId,
        approvalDate: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: adminId,
        employeeStatus: 'active',
        verificationChecklist: verificationChecklist || {},
      })

      // CRITICAL: Also create/update employee record in 'employees' collection
      // This is required for the employee-login API to find the employee
      await db.collection('employees').doc(userId).set({
        uid: userId,
        employeeId: employeeId,
        email: inquiryData?.email || '',
        firstName: inquiryData?.firstName || '',
        lastName: inquiryData?.lastName || '',
        phone: inquiryData?.phone || '',
        state: inquiryData?.state || '',
        status: 'approved',
        approvalDate: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: adminId,
        verificationChecklist: verificationChecklist || {},
        rating: 0,
        totalJobs: 0,
        totalEarnings: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    // Send approval email to the pro
    const result = await sendProApplicationApproved(
      inquiryData?.email,
      inquiryData?.firstName,
      employeeId,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/pro`
    )
    const emailSent = result?.success || result?.messageId ? true : false

    console.log(`[API] Inquiry approved (ID: ${employeeId}) and approval email sent: ${emailSent}`)

    return NextResponse.json({
      success: true,
      inquiryId,
      employeeId,
      emailSent,
    })
  } catch (error: any) {
    console.error('[API] Error approving inquiry:', {
      message: error.message,
      code: error.code,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to approve inquiry' },
      { status: 500 }
    )
  }
}
