// Export Real Firebase Data for Supabase Migration
// Run this in Node.js or paste in Firebase Console

import admin from 'firebase-admin'
import * as fs from 'fs'

// Initialize Firebase Admin (use your credentials)
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://washlee-28e3f.firebaseio.com',
})

const db = admin.firestore()

interface FirebaseUser {
  uid: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
  createdAt?: any
  updatedAt?: any
}

interface FirebaseEmployee extends FirebaseUser {
  status?: string
  totalJobs?: number
  totalEarnings?: number
  rating?: number
}

interface FirebaseCustomer extends FirebaseUser {
  personalUse?: string
  totalOrders?: number
  totalSpent?: number
  rating?: number
  status?: string
  preferenceMarketingTexts?: boolean
  preferenceAccountTexts?: boolean
  selectedPlan?: string
}

async function exportAllData() {
  try {
    console.log('🔍 Fetching real data from Firebase...')

    // Fetch all collections
    const users = await fetchCollection('users')
    const customers = await fetchCollection('customers')
    const employees = await fetchCollection('employees')
    const orders = await fetchCollection('orders')
    const reviews = await fetchCollection('reviews')
    const inquiries = await fetchCollection('inquiries')

    // Export to CSV files
    console.log(`\n✅ Found ${users.length} users`)
    console.log(`✅ Found ${customers.length} customers`)
    console.log(`✅ Found ${employees.length} employees`)
    console.log(`✅ Found ${orders.length} orders`)
    console.log(`✅ Found ${reviews.length} reviews`)
    console.log(`✅ Found ${inquiries.length} inquiries`)

    // Save to JSON for manual review
    const exportData = {
      users,
      customers,
      employees,
      orders,
      reviews,
      inquiries,
      exportDate: new Date().toISOString(),
    }

    fs.writeFileSync('firebase-export.json', JSON.stringify(exportData, null, 2))
    console.log('\n📁 Exported to firebase-export.json')

    // Generate CSV files
    generateCSV('users', users)
    generateCSV('customers', customers)
    generateCSV('employees', employees)
    generateCSV('orders', orders)
    generateCSV('reviews', reviews)
    generateCSV('inquiries', inquiries)

    console.log('\n✅ All data exported successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error exporting data:', error)
    process.exit(1)
  }
}

async function fetchCollection(collectionName: string) {
  const collection = db.collection(collectionName)
  const snapshot = await collection.get()

  const docs: any[] = []
  snapshot.forEach((doc) => {
    docs.push({
      id: doc.id,
      ...doc.data(),
    })
  })

  return docs
}

function generateCSV(name: string, data: any[]) {
  if (data.length === 0) {
    console.log(`⚠️  No ${name} found, skipping CSV`)
    return
  }

  // Get all unique keys
  const keys = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => keys.add(key))
  })

  const headers = Array.from(keys).sort()
  const rows = [headers.join(',')]

  data.forEach((item) => {
    const values = headers.map((header) => {
      let value = item[header]

      // Handle special types
      if (value === undefined || value === null) return ''
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""')
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`

      return String(value)
    })

    rows.push(values.join(','))
  })

  const csv = rows.join('\n')
  fs.writeFileSync(`${name}-export.csv`, csv)
  console.log(`📊 Generated ${name}-export.csv (${data.length} records)`)
}

// Run the export
exportAllData()
