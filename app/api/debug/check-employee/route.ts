/**
 * Debug endpoint to check if employee record exists
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export async function GET(req: NextRequest) {
  try {
    const employeeId = req.nextUrl.searchParams.get('id')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID parameter required' },
        { status: 400 }
      )
    }

    // Query employees collection
    const employeesRef = collection(db, 'employees')
    const q = query(employeesRef, where('employeeId', '==', employeeId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json({
        found: false,
        employeeId,
        message: 'Employee not found in employees collection',
      })
    }

    const employeeDoc = querySnapshot.docs[0]
    const employee = employeeDoc.data()

    return NextResponse.json({
      found: true,
      employeeId,
      uid: employeeDoc.id,
      email: employee.email,
      status: employee.status,
      firstName: employee.firstName,
      lastName: employee.lastName,
      createdAt: employee.createdAt?.toDate?.() || employee.createdAt,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
