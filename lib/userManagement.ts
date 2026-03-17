/**
 * User Management System for Washlee
 * 
 * Architecture:
 * - Employees (Pro): Stored in 'employees' collection
 * - Customers: Stored in 'customers' collection
 * - Shared Auth: Single Firebase Auth account
 * - Employees can have BOTH employee AND customer profiles
 * - Customers have ONLY customer profile
 * 
 * Collections:
 * - employees/{employeeId} - Pro/employee profiles
 * - customers/{customerId} - Customer profiles
 * - users/{uid} - User metadata (maps auth uid to both systems)
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  collection, 
  where, 
  getDocs, 
  Timestamp,
  writeBatch,
  DocumentSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

// ============================================
// NUMERIC ID HELPERS (For better UX)
// ============================================

/**
 * Generate a short numeric ID for users
 * Format: WASH-XXXXXX (8 characters total)
 * Example: WASH-A7F2K9
 * 
 * Benefits over Firebase UID:
 * - Professional-looking display
 * - Easier to share/communicate
 * - Better for customer support (shorter reference IDs)
 * - Improves debugging (shorter logs)
 */
export function generateShortUserId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = 'WASH-'
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

/**
 * Compress Firebase UID to shorter numeric format
 * Converts 28-character Firebase UID to 12-character numeric ID
 * Example: aBcDeFgHiJkLmNoPqRsTuVwXyZ123 → WASH-F7K2A9
 */
export function compressFirebaseUid(firebaseUid: string): string {
  // Take first 6 characters and convert to base36, then to alphanumeric
  const compressed = firebaseUid
    .substring(0, 6)
    .split('')
    .map(c => c.charCodeAt(0))
    .reduce((acc, code) => acc + code, 0)
    .toString(36)
    .substring(0, 6)
    .toUpperCase()
  
  return `WASH-${compressed.padStart(6, 'A')}`
}

/**
 * Generate composite ID for display
 * Shows both short ID and Firebase UID reference
 * Used in error messages and support contexts
 */
export function getDisplayId(firebaseUid: string): {
  short: string
  full: string
  reference: string
} {
  const shortId = compressFirebaseUid(firebaseUid)
  return {
    short: shortId,
    full: firebaseUid,
    reference: `${shortId} (${firebaseUid.substring(0, 8)}...)`
  }
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface EmployeeProfile {
  uid: string
  employeeId: string // 6-digit unique code for employee login (100000-999999)
  email: string
  firstName: string
  lastName: string
  phone: string
  state: string
  workAddress: string // Employee's work location address
  password?: string // Never stored in production - for reference only
  applicationType: 'employee' | 'pro' // Distinguish from customer
  employmentType: 'full-time' | 'part-time' | 'contractor'
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'active'
  verificationStatus: {
    emailVerified: boolean
    phoneVerified: boolean
    idVerified: boolean
    backgroundCheckPassed: boolean
  }
  applicationStep: number // Track progress in onboarding
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  rating: number
  totalJobs: number
  totalEarnings: number
  bankDetails?: {
    accountHolderName: string
    accountNumber: string
    routingNumber: string
  }
  documents?: {
    idFile?: string // Firebase Storage path
    backgroundCheckFile?: string
  }
  comments?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  // Link to customer profile if they also have one
  linkedCustomerId?: string
  hasCustomerProfile: boolean
  // Preferences
  onboardingCompleted: boolean
  preferences?: {
    communicationMethod: 'email' | 'sms' | 'both'
    notificationSettings: Record<string, boolean>
  }
}

export interface CustomerProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string
  state?: string // Australian state
  applicationType: 'customer' // Distinguish from employee
  status: 'active' | 'suspended' | 'inactive'
  personalUse: 'personal' | 'business'
  ageOver65?: boolean
  preferenceMarketingTexts: boolean
  preferenceAccountTexts: boolean
  selectedPlan?: string // 'basic' | 'premium' | 'enterprise'
  paymentMethods?: Array<{
    id: string
    type: string
    last4: string
    default: boolean
  }>
  deliveryAddresses?: Array<{
    id: string
    address: string
    default: boolean
  }>
  totalOrders: number
  totalSpent: number
  rating: number
  createdAt: Timestamp
  updatedAt: Timestamp
  // Link to employee profile if they also have one
  linkedEmployeeId?: string
  hasEmployeeProfile: boolean
  // Preferences
  onboardingCompleted: boolean
  preferences?: {
    communicationMethod: 'email' | 'sms' | 'both'
    notificationSettings: Record<string, boolean>
  }
}

export interface UserMetadata {
  uid: string
  email: string
  userTypes: ('employee' | 'customer')[] // Array of roles
  primaryUserType: 'employee' | 'customer'
  employeeId?: string
  customerId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  // For analytics
  firstLoginAt?: Timestamp
  lastLoginAt?: Timestamp
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a unique 6-digit employee ID code
 * Format: 100000-999999
 */
export async function generateUniqueEmployeeId(): Promise<string> {
  let employeeId = ''
  let isUnique = false
  
  while (!isUnique) {
    // Generate random 6-digit number (100000-999999)
    employeeId = String(Math.floor(Math.random() * 900000) + 100000)
    
    // Check if this ID already exists
    const existingQuery = query(
      collection(db, 'employees'),
      where('employeeId', '==', employeeId)
    )
    const existingDocs = await getDocs(existingQuery)
    isUnique = existingDocs.empty
  }
  
  return employeeId
}

// ============================================
// EMPLOYEE PROFILE FUNCTIONS
// ============================================

/**
 * Create a new employee profile
 */
export async function createEmployeeProfile(
  uid: string,
  data: Partial<EmployeeProfile>
): Promise<void> {
  const employeeRef = doc(db, 'employees', uid)
  
  // Generate unique 6-digit employee ID
  const employeeId = await generateUniqueEmployeeId()
  
  const employeeData: EmployeeProfile = {
    uid,
    employeeId, // Add the generated 6-digit code
    email: data.email || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    phone: data.phone || '',
    state: data.state || '',
    workAddress: data.workAddress || '',
    applicationType: 'employee',
    employmentType: data.employmentType || 'contractor',
    status: 'pending',
    verificationStatus: {
      emailVerified: false,
      phoneVerified: false,
      idVerified: false,
      backgroundCheckPassed: false,
    },
    applicationStep: 0,
    availability: data.availability || {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    rating: 0,
    totalJobs: 0,
    totalEarnings: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...(data.linkedCustomerId ? { linkedCustomerId: data.linkedCustomerId } : {}),
    hasCustomerProfile: !!data.linkedCustomerId,
    onboardingCompleted: false,
    ...(data.preferences ? { preferences: data.preferences } : {}),
  }
  
  await setDoc(employeeRef, employeeData)
  
  // Update user metadata
  await updateUserMetadata(uid, {
    email: data.email || '',
    userTypes: ['employee'],
    primaryUserType: 'employee',
    employeeId: uid,
  })
}

/**
 * Get employee profile
 */
export async function getEmployeeProfile(
  employeeId: string
): Promise<EmployeeProfile | null> {
  const docSnap = await getDoc(doc(db, 'employees', employeeId))
  return docSnap.exists() ? (docSnap.data() as EmployeeProfile) : null
}

/**
 * Update employee profile
 */
export async function updateEmployeeProfile(
  employeeId: string,
  updates: Partial<EmployeeProfile>
): Promise<void> {
  const employeeRef = doc(db, 'employees', employeeId)
  await updateDoc(employeeRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Update employee verification status
 */
export async function updateEmployeeVerification(
  employeeId: string,
  verificationData: Partial<EmployeeProfile['verificationStatus']>
): Promise<void> {
  const employeeRef = doc(db, 'employees', employeeId)
  const current = await getEmployeeProfile(employeeId)
  
  if (!current) throw new Error('Employee not found')
  
  await updateDoc(employeeRef, {
    verificationStatus: {
      ...current.verificationStatus,
      ...verificationData,
    },
    updatedAt: Timestamp.now(),
  })
}

// ============================================
// CUSTOMER PROFILE FUNCTIONS
// ============================================

/**
 * Create a new customer profile
 */
export async function createCustomerProfile(
  uid: string,
  data: Partial<CustomerProfile>
): Promise<void> {
  const customerRef = doc(db, 'customers', uid)
  
  const customerData: CustomerProfile = {
    uid,
    email: data.email || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    phone: data.phone || '',
    applicationType: 'customer',
    status: 'active',
    personalUse: data.personalUse || 'personal',
    ageOver65: data.ageOver65 || false,
    preferenceMarketingTexts: data.preferenceMarketingTexts || false,
    preferenceAccountTexts: data.preferenceAccountTexts || true,
    selectedPlan: data.selectedPlan || 'basic',
    totalOrders: 0,
    totalSpent: 0,
    rating: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...(data.linkedEmployeeId ? { linkedEmployeeId: data.linkedEmployeeId } : {}),
    hasEmployeeProfile: !!data.linkedEmployeeId,
    onboardingCompleted: false,
    ...(data.preferences ? { preferences: data.preferences } : {}),
    ...(data.paymentMethods ? { paymentMethods: data.paymentMethods } : {}),
    ...(data.deliveryAddresses ? { deliveryAddresses: data.deliveryAddresses } : {}),
  }
  
  await setDoc(customerRef, customerData)
  
  // Update user metadata
  await updateUserMetadata(uid, {
    email: data.email || '',
    userTypes: ['customer'],
    primaryUserType: 'customer',
    customerId: uid,
  })
}

/**
 * Get customer profile
 */
export async function getCustomerProfile(
  customerId: string
): Promise<CustomerProfile | null> {
  const docSnap = await getDoc(doc(db, 'customers', customerId))
  return docSnap.exists() ? (docSnap.data() as CustomerProfile) : null
}

/**
 * Update customer profile
 */
export async function updateCustomerProfile(
  customerId: string,
  updates: Partial<CustomerProfile>
): Promise<void> {
  const customerRef = doc(db, 'customers', customerId)
  await updateDoc(customerRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}

// ============================================
// USER METADATA FUNCTIONS
// ============================================

/**
 * Get or create user metadata
 */
export async function getUserMetadata(uid: string): Promise<UserMetadata | null> {
  const docSnap = await getDoc(doc(db, 'users', uid))
  return docSnap.exists() ? (docSnap.data() as UserMetadata) : null
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(
  uid: string,
  data: Partial<UserMetadata>
): Promise<void> {
  const userRef = doc(db, 'users', uid)
  const existing = await getUserMetadata(uid)
  
  if (existing) {
    await updateDoc(userRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })
  } else {
    // Create new metadata
    const metadata: UserMetadata = {
      uid,
      email: data.email || '',
      userTypes: data.userTypes || [],
      primaryUserType: data.primaryUserType || 'customer',
      ...(data.employeeId ? { employeeId: data.employeeId } : {}),
      ...(data.customerId ? { customerId: data.customerId } : {}),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    await setDoc(userRef, metadata)
  }
}

// ============================================
// LINKED ACCOUNT FUNCTIONS
// ============================================

/**
 * Convert a customer to also become an employee
 * Creates employee profile and links both accounts
 */
export async function upgradeCustomerToEmployee(
  uid: string,
  employeeData: Partial<EmployeeProfile>
): Promise<void> {
  const batch = writeBatch(db)
  
  // Get existing customer profile
  const customerProfile = await getCustomerProfile(uid)
  if (!customerProfile) throw new Error('Customer profile not found')
  
  // Create employee profile
  const employeeRef = doc(db, 'employees', uid)
  const newEmployeeData = {
    uid,
    employeeId: undefined, // Will be generated by Cloud Function
    email: employeeData.email || customerProfile.email,
    firstName: employeeData.firstName || customerProfile.firstName,
    lastName: employeeData.lastName || customerProfile.lastName,
    phone: employeeData.phone || customerProfile.phone,
    state: employeeData.state || '',
    applicationType: 'employee' as const,
    employmentType: employeeData.employmentType || 'contractor',
    status: 'pending' as const,
    verificationStatus: {
      emailVerified: false,
      phoneVerified: false,
      idVerified: false,
      backgroundCheckPassed: false,
    },
    applicationStep: 0,
    availability: employeeData.availability || {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    rating: 0,
    totalJobs: 0,
    totalEarnings: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    linkedCustomerId: uid, // Link to customer
    hasCustomerProfile: true,
    onboardingCompleted: false,
    preferences: employeeData.preferences,
    ...employeeData,
  }
  batch.set(employeeRef, newEmployeeData)
  
  // Update customer profile to indicate employee profile exists
  const customerRef = doc(db, 'customers', uid)
  batch.update(customerRef, {
    linkedEmployeeId: uid,
    hasEmployeeProfile: true,
    updatedAt: Timestamp.now(),
  })
  
  // Update user metadata
  const userRef = doc(db, 'users', uid)
  const metadata = await getUserMetadata(uid)
  batch.set(userRef, {
    ...(metadata || {}),
    uid,
    email: customerProfile.email,
    userTypes: ['employee', 'customer'],
    primaryUserType: 'employee',
    employeeId: uid,
    customerId: uid,
    updatedAt: Timestamp.now(),
    createdAt: metadata?.createdAt || Timestamp.now(),
  }, { merge: true })
  
  await batch.commit()
}

/**
 * Convert an employee to also become a customer
 * Creates customer profile and links both accounts
 */
export async function upgradeEmployeeToCustomer(
  uid: string,
  customerData: Partial<CustomerProfile>
): Promise<void> {
  const batch = writeBatch(db)
  
  // Get existing employee profile
  const employeeProfile = await getEmployeeProfile(uid)
  if (!employeeProfile) throw new Error('Employee profile not found')
  
  // Create customer profile
  const customerRef = doc(db, 'customers', uid)
  const newCustomerData: CustomerProfile = {
    uid,
    email: customerData.email || employeeProfile.email,
    firstName: customerData.firstName || employeeProfile.firstName,
    lastName: customerData.lastName || employeeProfile.lastName,
    phone: customerData.phone || employeeProfile.phone,
    applicationType: 'customer',
    status: 'active',
    personalUse: customerData.personalUse || 'personal',
    ageOver65: customerData.ageOver65 || false,
    preferenceMarketingTexts: customerData.preferenceMarketingTexts || false,
    preferenceAccountTexts: customerData.preferenceAccountTexts || true,
    selectedPlan: customerData.selectedPlan || 'basic',
    totalOrders: 0,
    totalSpent: 0,
    rating: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    linkedEmployeeId: uid, // Link to employee
    hasEmployeeProfile: true,
    onboardingCompleted: false,
    preferences: customerData.preferences,
    ...customerData,
  }
  batch.set(customerRef, newCustomerData)
  
  // Update employee profile to indicate customer profile exists
  const employeeRef = doc(db, 'employees', uid)
  batch.update(employeeRef, {
    linkedCustomerId: uid,
    hasCustomerProfile: true,
    updatedAt: Timestamp.now(),
  })
  
  // Update user metadata
  const userRef = doc(db, 'users', uid)
  const metadata = await getUserMetadata(uid)
  batch.set(userRef, {
    ...(metadata || {}),
    uid,
    email: employeeProfile.email,
    userTypes: ['employee', 'customer'],
    primaryUserType: 'employee',
    employeeId: uid,
    customerId: uid,
    updatedAt: Timestamp.now(),
    createdAt: metadata?.createdAt || Timestamp.now(),
  }, { merge: true })
  
  await batch.commit()
}

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Get all user types for a given email
 */
export async function getUserTypesByEmail(
  email: string
): Promise<('employee' | 'customer')[]> {
  const userTypes: ('employee' | 'customer')[] = []
  
  // Check employees collection
  const employeeQuery = query(
    collection(db, 'employees'),
    where('email', '==', email)
  )
  const employeeSnap = await getDocs(employeeQuery)
  if (!employeeSnap.empty) userTypes.push('employee')
  
  // Check customers collection
  const customerQuery = query(
    collection(db, 'customers'),
    where('email', '==', email)
  )
  const customerSnap = await getDocs(customerQuery)
  if (!customerSnap.empty) userTypes.push('customer')
  
  return userTypes
}

/**
 * Check if user has both employee and customer profiles
 */
export async function hasLinkedProfiles(uid: string): Promise<boolean> {
  const employee = await getEmployeeProfile(uid)
  const customer = await getCustomerProfile(uid)
  return !!employee && !!customer
}

/**
 * Get primary user role
 */
export async function getPrimaryUserRole(
  uid: string
): Promise<'employee' | 'customer' | null> {
  const metadata = await getUserMetadata(uid)
  return metadata?.primaryUserType || null
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Delete employee profile (but keep customer if exists)
 */
export async function deleteEmployeeProfile(uid: string): Promise<void> {
  const batch = writeBatch(db)
  
  const employeeRef = doc(db, 'employees', uid)
  batch.delete(employeeRef)
  
  // Update customer profile if exists
  const customer = await getCustomerProfile(uid)
  if (customer) {
    const customerRef = doc(db, 'customers', uid)
    batch.update(customerRef, {
      linkedEmployeeId: undefined,
      hasEmployeeProfile: false,
      updatedAt: Timestamp.now(),
    })
    
    // Update user metadata
    const userRef = doc(db, 'users', uid)
    batch.update(userRef, {
      userTypes: ['customer'],
      primaryUserType: 'customer',
      employeeId: undefined,
      updatedAt: Timestamp.now(),
    })
  } else {
    // Delete user metadata if no other profiles
    const userRef = doc(db, 'users', uid)
    batch.delete(userRef)
  }
  
  await batch.commit()
}

/**
 * Delete customer profile (but keep employee if exists)
 */
export async function deleteCustomerProfile(uid: string): Promise<void> {
  const batch = writeBatch(db)
  
  const customerRef = doc(db, 'customers', uid)
  batch.delete(customerRef)
  
  // Update employee profile if exists
  const employee = await getEmployeeProfile(uid)
  if (employee) {
    const employeeRef = doc(db, 'employees', uid)
    batch.update(employeeRef, {
      linkedCustomerId: undefined,
      hasCustomerProfile: false,
      updatedAt: Timestamp.now(),
    })
    
    // Update user metadata
    const userRef = doc(db, 'users', uid)
    batch.update(userRef, {
      userTypes: ['employee'],
      primaryUserType: 'employee',
      customerId: undefined,
      updatedAt: Timestamp.now(),
    })
  } else {
    // Delete user metadata if no other profiles
    const userRef = doc(db, 'users', uid)
    batch.delete(userRef)
  }
  
  await batch.commit()
}

export default {
  // Employee functions
  createEmployeeProfile,
  getEmployeeProfile,
  updateEmployeeProfile,
  updateEmployeeVerification,
  
  // Customer functions
  createCustomerProfile,
  getCustomerProfile,
  updateCustomerProfile,
  
  // Metadata functions
  getUserMetadata,
  updateUserMetadata,
  
  // Linked account functions
  upgradeCustomerToEmployee,
  upgradeEmployeeToCustomer,
  hasLinkedProfiles,
  
  // Query functions
  getUserTypesByEmail,
  getPrimaryUserRole,
  
  // Batch operations
  deleteEmployeeProfile,
  deleteCustomerProfile,
}
