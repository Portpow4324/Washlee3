import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  Timestamp,
  startAfter,
  QueryConstraint
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Order, validateOrder, calculateOrderTotal, generateOrderNumber } from '@/lib/orderUtils'

const ORDERS_PER_PAGE = 10

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      )
    }

    const ordersRef = collection(db, 'orders')
    const constraints: QueryConstraint[] = [
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc'),
      limit((page + 1) * ORDERS_PER_PAGE)
    ]

    if (status) {
      constraints.splice(1, 0, where('status', '==', status))
    }

    const q = query(ordersRef, ...constraints)
    const querySnapshot = await getDocs(q)

    let orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order))

    if (search) {
      orders = orders.filter(order =>
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.contact.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    const startIndex = (page - 1) * ORDERS_PER_PAGE
    const endIndex = page * ORDERS_PER_PAGE
    const paginatedOrders = orders.slice(startIndex, endIndex)

    return NextResponse.json(
      {
        orders: paginatedOrders,
        total: orders.length,
        hasMore: endIndex < orders.length,
        page
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = validateOrder(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid order data', details: validation.errors },
        { status: 400 }
      )
    }

    const orderNumber = generateOrderNumber()
    const now = Timestamp.now()
    const pickupDate = new Date(body.pickupDate)
    const estimatedDelivery = new Date(pickupDate)
    estimatedDelivery.setHours(estimatedDelivery.getHours() + 48)

    const newOrder: Partial<Order> = {
      customerId: body.customerId,
      status: 'pending',
      items: body.items,
      pickupDate: Timestamp.fromDate(pickupDate),
      estimatedDelivery: Timestamp.fromDate(estimatedDelivery),
      pricing: calculateOrderTotal(
        body.items.reduce((sum: number, item: any) => sum + (item.price || 0), 0),
        body.discount || 0
      ),
      specialInstructions: body.specialInstructions || '',
      address: body.address,
      contact: body.contact,
      paymentId: body.paymentId,
      createdAt: now,
      updatedAt: now
    }

    const ordersRef = collection(db, 'orders')
    const docRef = await addDoc(ordersRef, newOrder)

    return NextResponse.json(
      {
        id: docRef.id,
        orderNumber,
        ...newOrder
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
