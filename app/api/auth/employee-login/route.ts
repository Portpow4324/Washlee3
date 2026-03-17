/**
 * Employee Login API Route
 * 
 * Authenticates employees using their Employee ID + Email + Password
 * 
 * POST /api/auth/employee-login
 * Body: {
 *   employeeId: string (6-digit code or full format)
 *   email: string
 *   password: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const { employeeId, email, password } = await req.json()

    console.log('[Employee Login API] Received:', { employeeId, email, password: '***' })

    // Validate input
    if (!employeeId || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Employee ID, email, and password are required' },
        { status: 400 }
      )
    }

    // Accept multiple ID formats:
    // 1. 6-digit format: 123456
    // 2. Standard format: EMP-1773230849589-1ZE64
    // 3. Payslip format: PS-20240304-X9K2L
    const isSixDigit = /^\d{6}$/.test(employeeId)
    const isStandardFormat = /^EMP-\d+-[A-Z0-9]+$/.test(employeeId)
    const isPayslipFormat = /^PS-\d{8}-[A-Z0-9]+$/.test(employeeId)

    if (!isSixDigit && !isStandardFormat && !isPayslipFormat) {
      return NextResponse.json(
        { success: false, error: 'Invalid employee ID format. Use 6 digits or full format (EMP-xxx-xxx)' },
        { status: 400 }
      )
    }

    // Query employees collection by employeeId
    const employeesRef = collection(db, 'employees')
    const q = query(employeesRef, where('employeeId', '==', employeeId))
    const querySnapshot = await getDocs(q)

    console.log(`[Employee Login API] Query for "${employeeId}": ${querySnapshot.docs.length} results`)

    if (querySnapshot.empty) {
      console.log(`[Employee Login API] ❌ Employee ID "${employeeId}" not found`)
      return NextResponse.json(
        { success: false, error: 'Employee ID not found. Please check your credentials.' },
        { status: 401 }
      )
    }

    console.log(`[Employee Login API] ✓ Found employee record`)

    const employeeDoc = querySnapshot.docs[0]
    const employee = employeeDoc.data()

    // Verify email matches - case insensitive
    if (employee.email.toLowerCase() !== email.toLowerCase()) {
      console.log(`[Employee Login API] ❌ Email mismatch: provided "${email}" but found "${employee.email}"`)
      return NextResponse.json(
        { success: false, error: 'Employee ID or email does not match our records' },
        { status: 401 }
      )
    }

    console.log(`[Employee Login API] ✓ Email verified`)

    // Verify employee status
    if (employee.status === 'rejected' || employee.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: `Account is ${employee.status}` },
        { status: 403 }
      )
    }

    // Attempt to sign in with email and password
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        employee.email,
        password
      )

      // Get ID token for authentication
      const idToken = await userCredential.user.getIdToken()

      // Update user record in 'users' collection to mark as employee
      const userRef = doc(db, 'users', userCredential.user.uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        // User document exists - update it
        await updateDoc(userRef, {
          userType: 'pro',
          isEmployee: true,
          employeeId: employee.employeeId,
        })
        console.log(`[Employee Login API] ✓ Updated existing user document with isEmployee=true`)
      } else {
        // User document doesn't exist - create it
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: employee.email,
          name: `${employee.firstName} ${employee.lastName}`,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone,
          userType: 'pro',
          isEmployee: true,
          employeeId: employee.employeeId,
          createdAt: new Date().toISOString(),
          marketingTexts: true,
          accountTexts: true,
        })
        console.log(`[Employee Login API] ✓ Created new user document with isEmployee=true`)
      }

      return NextResponse.json(
        {
          success: true,
          token: idToken,
          employee: {
            uid: employee.uid,
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            state: employee.state,
            status: employee.status,
            rating: employee.rating,
            totalJobs: employee.totalJobs,
            totalEarnings: employee.totalEarnings,
          },
        },
        { status: 200 }
      )
    } catch (authError: any) {
      if (authError.code === 'auth/wrong-password') {
        return NextResponse.json(
          { success: false, error: 'Incorrect password' },
          { status: 401 }
        )
      }
      throw authError
    }
  } catch (error: any) {
    console.error('Employee login error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}
