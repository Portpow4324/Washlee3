/**
 * Multi-Role User Management
 * 
 * 🔗 RELATED FILES (ALL USER MANAGEMENT):
 * 
 * PRIMARY (Core functions):
 *   → userManagement.ts (709 lines) - MAIN MODULE
 *     Use for: Standard signup, profile updates, most operations
 *     Exports: All core CRUD functions
 *     This file imports from: userManagement.ts (uses core functions)
 * 
 * OPTIMIZATION VARIANTS:
 *   ← userManagement.optimized.ts (345 lines)
 *     Use for: Fast employee signup (skip validation)
 *     Improves: Speed by 30% (skips UUID collision detection)
 * 
 *   ← userManagement.deferred.ts (253 lines)
 *     Use for: Instant employee signup (ID generated async by Cloud Function)
 *     Improves: Speed by 50% (non-blocking, ID appears 100-500ms later)
 * 
 * ADVANCED WRAPPER:
 *   ← multiRoleUserManagement.ts (THIS FILE - 660 lines)
 *     Use for: Multi-role users, role transitions, permissions, audit trails
 *     Imports from: userManagement.ts (uses core functions)
 * 
 * NAVIGATION HUB:
 *   → userManagement.index.ts (FULL DOCUMENTATION)
 *     Read this for: Decision guide, integration examples, all options
 * 
 * ============================================================================
 * 
 * Handles users with combined roles:
 * - Customer + Loyalty
 * - Customer + Subscription
 * - Customer + Loyalty + Subscription
 * - Employee + Customer (dual role)
 * - And any other combination
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  Timestamp,
  WriteBatch,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import {
  UserMetadata,
  UserRole,
  CustomerProfile,
  EmployeeProfile,
  LoyaltyProgram,
  Subscription,
  FullUserProfile,
  MultiRoleUser,
} from './userTypes'

// ============================================
// GET USER DATA
// ============================================

/**
 * Get user metadata (users/{uid})
 * Quick lookup for user roles and status
 */
export async function getUserMetadata(uid: string): Promise<UserMetadata | null> {
  const docRef = doc(db, 'users', uid)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? (docSnap.data() as UserMetadata) : null
}

/**
 * Get full user profile with all their data
 * Loads: users/{uid} + customer/{uid} + employee/{uid} + loyalty_programs/{uid} + subscriptions/{uid}
 */
export async function getFullUserProfile(uid: string): Promise<FullUserProfile | null> {
  const metadata = await getUserMetadata(uid)
  if (!metadata) return null

  const profile: FullUserProfile = { metadata }

  // Load only the role documents that exist
  if (metadata.userTypes.includes('customer')) {
    const customerRef = doc(db, 'customers', uid)
    const customerSnap = await getDoc(customerRef)
    if (customerSnap.exists()) {
      profile.customer = customerSnap.data() as CustomerProfile
    }
  }

  if (metadata.userTypes.includes('employee')) {
    const employeeRef = doc(db, 'employees', uid)
    const employeeSnap = await getDoc(employeeRef)
    if (employeeSnap.exists()) {
      profile.employee = employeeSnap.data() as EmployeeProfile
    }
  }

  if (metadata.userTypes.includes('loyalty')) {
    const loyaltyRef = doc(db, 'loyalty_programs', uid)
    const loyaltySnap = await getDoc(loyaltyRef)
    if (loyaltySnap.exists()) {
      profile.loyalty = loyaltySnap.data() as LoyaltyProgram
    }
  }

  if (metadata.userTypes.includes('subscription')) {
    const subRef = doc(db, 'subscriptions', uid)
    const subSnap = await getDoc(subRef)
    if (subSnap.exists()) {
      profile.subscription = subSnap.data() as Subscription
    }
  }

  return profile
}

// ============================================
// CREATE USERS WITH MULTIPLE ROLES
// ============================================

/**
 * Create a new customer + loyalty member (combined)
 */
export async function createCustomerWithLoyalty(
  uid: string,
  customerData: Partial<CustomerProfile>,
  loyaltyData: Partial<LoyaltyProgram>
): Promise<void> {
  const batch = writeBatch(db)
  const now = Timestamp.now()

  // 1. Create user metadata
  const userMetadata: UserMetadata = {
    uid,
    email: customerData.email || '',
    firstName: customerData.firstName || '',
    lastName: customerData.lastName || '',
    phone: customerData.phone || '',
    userTypes: ['customer', 'loyalty'],
    primaryUserType: 'customer',
    roles: {
      customer: {
        status: 'active',
        joinedAt: now,
        metadata: {
          personalUse: customerData.personalUse || 'personal',
          totalOrders: 0,
          totalSpent: 0,
        },
      },
      loyalty: {
        status: 'active',
        joinedAt: now,
        metadata: {
          tier: 'bronze',
          points: 0,
        },
      },
    },
    preferences: {
      marketingTexts: customerData.preferenceMarketingTexts || false,
      accountTexts: customerData.preferenceAccountTexts || false,
      emailNotifications: true,
    },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  }

  // 2. Create customer profile
  const customerProfile: CustomerProfile = {
    uid,
    email: customerData.email || '',
    firstName: customerData.firstName || '',
    lastName: customerData.lastName || '',
    phone: customerData.phone || '',
    applicationType: 'customer',
    status: 'active',
    personalUse: customerData.personalUse || 'personal',
    preferenceMarketingTexts: customerData.preferenceMarketingTexts || false,
    preferenceAccountTexts: customerData.preferenceAccountTexts || false,
    selectedPlan: customerData.selectedPlan || 'none',
    totalOrders: 0,
    totalSpent: 0,
    rating: 0,
    averageRating: 0,
    hasEmployeeProfile: false,
    hasLoyaltyProfile: true,
    hasSubscription: false,
    createdAt: now,
    updatedAt: now,
  }

  // 3. Create loyalty program
  const loyalty: LoyaltyProgram = {
    uid,
    customerId: uid,
    tier: 'bronze',
    points: 0,
    pointsExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) as any, // 1 year
    lifetimePoints: 0,
    tierUpgradeEligible: false,
    pointsToNextTier: 1000,
    pointsEarnedThisMonth: 0,
    lastPointsEarned: now,
    lastPointsRedeemed: now,
    hasCustomerProfile: true,
    hasSubscription: false,
    joinedAt: now,
    updatedAt: now,
  }

  // Write all documents
  batch.set(doc(db, 'users', uid), userMetadata)
  batch.set(doc(db, 'customers', uid), customerProfile)
  batch.set(doc(db, 'loyalty_programs', uid), loyalty)

  await batch.commit()
  console.log('[MultiRole] Created customer + loyalty for:', uid)
}

/**
 * Create a new customer + subscription (combined)
 */
export async function createCustomerWithSubscription(
  uid: string,
  customerData: Partial<CustomerProfile>,
  subscriptionData: Partial<Subscription>
): Promise<void> {
  const batch = writeBatch(db)
  const now = Timestamp.now()

  // 1. Create user metadata
  const userMetadata: UserMetadata = {
    uid,
    email: customerData.email || '',
    firstName: customerData.firstName || '',
    lastName: customerData.lastName || '',
    phone: customerData.phone || '',
    userTypes: ['customer', 'subscription'],
    primaryUserType: 'customer',
    roles: {
      customer: {
        status: 'active',
        joinedAt: now,
        metadata: {
          personalUse: customerData.personalUse || 'personal',
          totalOrders: 0,
          totalSpent: 0,
        },
      },
      subscription: {
        status: subscriptionData.status || 'active',
        joinedAt: now,
        metadata: {
          plan: subscriptionData.plan || 'starter',
          renewalDate: subscriptionData.renewalDate || now,
        },
      },
    },
    preferences: {
      marketingTexts: customerData.preferenceMarketingTexts || false,
      accountTexts: customerData.preferenceAccountTexts || false,
      emailNotifications: true,
    },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  }

  // 2. Create customer profile
  const customerProfile: CustomerProfile = {
    uid,
    email: customerData.email || '',
    firstName: customerData.firstName || '',
    lastName: customerData.lastName || '',
    phone: customerData.phone || '',
    applicationType: 'customer',
    status: 'active',
    personalUse: customerData.personalUse || 'personal',
    preferenceMarketingTexts: customerData.preferenceMarketingTexts || false,
    preferenceAccountTexts: customerData.preferenceAccountTexts || false,
    selectedPlan: (subscriptionData.plan as any) || 'starter',
    totalOrders: 0,
    totalSpent: 0,
    rating: 0,
    averageRating: 0,
    hasEmployeeProfile: false,
    hasLoyaltyProfile: false,
    hasSubscription: true,
    createdAt: now,
    updatedAt: now,
  }

  // 3. Create subscription
  const subscription: Subscription = {
    uid,
    userId: uid,
    plan: (subscriptionData.plan || 'starter') as any,
    status: (subscriptionData.status || 'active') as any,
    billingCycle: (subscriptionData.billingCycle || 'monthly') as any,
    startDate: now,
    renewalDate: subscriptionData.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    amount: subscriptionData.amount || 9.99,
    currency: 'AUD',
    stripeSubscriptionId: subscriptionData.stripeSubscriptionId || '',
    stripeCustomerId: subscriptionData.stripeCustomerId || '',
    paymentMethodId: subscriptionData.paymentMethodId || '',
    ordersIncluded: 10,
    ordersUsed: 0,
    discountPercentage: 0,
    hasCustomerProfile: true,
    hasLoyaltyProfile: false,
    createdAt: now,
    updatedAt: now,
  }

  batch.set(doc(db, 'users', uid), userMetadata)
  batch.set(doc(db, 'customers', uid), customerProfile)
  batch.set(doc(db, 'subscriptions', uid), subscription)

  await batch.commit()
  console.log('[MultiRole] Created customer + subscription for:', uid)
}

/**
 * Create a full premium user: Customer + Loyalty + Subscription
 */
export async function createPremiumUser(
  uid: string,
  customerData: Partial<CustomerProfile>,
  subscriptionData: Partial<Subscription>
): Promise<void> {
  const batch = writeBatch(db)
  const now = Timestamp.now()

  const userMetadata: UserMetadata = {
    uid,
    email: customerData.email || '',
    firstName: customerData.firstName || '',
    lastName: customerData.lastName || '',
    phone: customerData.phone || '',
    userTypes: ['customer', 'loyalty', 'subscription'],
    primaryUserType: 'customer',
    roles: {
      customer: {
        status: 'active',
        joinedAt: now,
        metadata: {
          personalUse: customerData.personalUse || 'personal',
          totalOrders: 0,
          totalSpent: 0,
        },
      },
      loyalty: {
        status: 'active',
        joinedAt: now,
        metadata: {
          tier: 'silver', // Premium tier
          points: 0,
        },
      },
      subscription: {
        status: subscriptionData.status || 'active',
        joinedAt: now,
        metadata: {
          plan: subscriptionData.plan || 'professional',
          renewalDate: subscriptionData.renewalDate || now,
        },
      },
    },
    preferences: {
      marketingTexts: customerData.preferenceMarketingTexts || false,
      accountTexts: customerData.preferenceAccountTexts || false,
      emailNotifications: true,
    },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  }

  // Create all three profiles
  const customerProfile: CustomerProfile = {
    uid,
    email: customerData.email || '',
    firstName: customerData.firstName || '',
    lastName: customerData.lastName || '',
    phone: customerData.phone || '',
    applicationType: 'customer',
    status: 'active',
    personalUse: customerData.personalUse || 'personal',
    preferenceMarketingTexts: customerData.preferenceMarketingTexts || false,
    preferenceAccountTexts: customerData.preferenceAccountTexts || false,
    selectedPlan: (subscriptionData.plan || 'professional') as any,
    totalOrders: 0,
    totalSpent: 0,
    rating: 0,
    averageRating: 0,
    hasEmployeeProfile: false,
    hasLoyaltyProfile: true,
    hasSubscription: true,
    createdAt: now,
    updatedAt: now,
  }

  const loyalty: LoyaltyProgram = {
    uid,
    customerId: uid,
    tier: 'silver',
    points: 0,
    pointsExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) as any,
    lifetimePoints: 0,
    tierUpgradeEligible: false,
    pointsToNextTier: 2500,
    pointsEarnedThisMonth: 0,
    lastPointsEarned: now,
    lastPointsRedeemed: now,
    hasCustomerProfile: true,
    hasSubscription: true,
    joinedAt: now,
    updatedAt: now,
  }

  const subscription: Subscription = {
    uid,
    userId: uid,
    plan: (subscriptionData.plan || 'professional') as any,
    status: (subscriptionData.status || 'active') as any,
    billingCycle: (subscriptionData.billingCycle || 'monthly') as any,
    startDate: now,
    renewalDate: subscriptionData.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    amount: subscriptionData.amount || 19.99,
    currency: 'AUD',
    discount: 10, // Loyalty discount
    stripeSubscriptionId: subscriptionData.stripeSubscriptionId || '',
    stripeCustomerId: subscriptionData.stripeCustomerId || '',
    paymentMethodId: subscriptionData.paymentMethodId || '',
    ordersIncluded: 25,
    ordersUsed: 0,
    discountPercentage: 10,
    hasCustomerProfile: true,
    hasLoyaltyProfile: true,
    createdAt: now,
    updatedAt: now,
  }

  batch.set(doc(db, 'users', uid), userMetadata)
  batch.set(doc(db, 'customers', uid), customerProfile)
  batch.set(doc(db, 'loyalty_programs', uid), loyalty)
  batch.set(doc(db, 'subscriptions', uid), subscription)

  await batch.commit()
  console.log('[MultiRole] Created premium user (customer + loyalty + subscription) for:', uid)
}

// ============================================
// ADD ROLE TO EXISTING USER
// ============================================

/**
 * Add loyalty to existing customer
 */
export async function addLoyaltyToCustomer(uid: string): Promise<void> {
  const batch = writeBatch(db)
  const now = Timestamp.now()

  // Update user metadata
  await updateDoc(doc(db, 'users', uid), {
    userTypes: arrayUnion('loyalty'),
    'roles.loyalty': {
      status: 'active',
      joinedAt: now,
      metadata: {
        tier: 'bronze',
        points: 0,
      },
    },
  })

  // Create loyalty program
  const loyalty: LoyaltyProgram = {
    uid,
    customerId: uid,
    tier: 'bronze',
    points: 0,
    pointsExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) as any,
    lifetimePoints: 0,
    tierUpgradeEligible: false,
    pointsToNextTier: 1000,
    pointsEarnedThisMonth: 0,
    lastPointsEarned: now,
    lastPointsRedeemed: now,
    hasCustomerProfile: true,
    hasSubscription: false,
    joinedAt: now,
    updatedAt: now,
  }

  batch.set(doc(db, 'loyalty_programs', uid), loyalty)

  // Update customer profile
  batch.update(doc(db, 'customers', uid), {
    hasLoyaltyProfile: true,
  })

  await batch.commit()
  console.log('[MultiRole] Added loyalty to customer:', uid)
}

/**
 * Add subscription to existing customer
 */
export async function addSubscriptionToCustomer(
  uid: string,
  subscriptionData: Partial<Subscription>
): Promise<void> {
  const batch = writeBatch(db)
  const now = Timestamp.now()
  const renewalDate = subscriptionData.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // Update user metadata
  await updateDoc(doc(db, 'users', uid), {
    userTypes: arrayUnion('subscription'),
    'roles.subscription': {
      status: subscriptionData.status || 'active',
      joinedAt: now,
      metadata: {
        plan: subscriptionData.plan || 'starter',
        renewalDate,
      },
    },
  })

  // Create subscription
  const subscription: Subscription = {
    uid,
    userId: uid,
    plan: (subscriptionData.plan || 'starter') as any,
    status: (subscriptionData.status || 'active') as any,
    billingCycle: (subscriptionData.billingCycle || 'monthly') as any,
    startDate: now,
    renewalDate: renewalDate as any,
    amount: subscriptionData.amount || 9.99,
    currency: 'AUD',
    stripeSubscriptionId: subscriptionData.stripeSubscriptionId || '',
    stripeCustomerId: subscriptionData.stripeCustomerId || '',
    paymentMethodId: subscriptionData.paymentMethodId || '',
    ordersIncluded: 10,
    ordersUsed: 0,
    discountPercentage: 0,
    hasCustomerProfile: true,
    hasLoyaltyProfile: false,
    createdAt: now,
    updatedAt: now,
  }

  batch.set(doc(db, 'subscriptions', uid), subscription)

  // Update customer profile
  batch.update(doc(db, 'customers', uid), {
    hasSubscription: true,
    selectedPlan: subscriptionData.plan || 'starter',
  })

  await batch.commit()
  console.log('[MultiRole] Added subscription to customer:', uid)
}

// ============================================
// REMOVE ROLE FROM USER
// ============================================

/**
 * Remove loyalty from user (downgrade from premium)
 */
export async function removeLoyaltyFromUser(uid: string): Promise<void> {
  const batch = writeBatch(db)

  // Update user metadata
  batch.update(doc(db, 'users', uid), {
    userTypes: arrayRemove('loyalty'),
    'roles.loyalty': null,
  })

  // Delete loyalty document
  batch.delete(doc(db, 'loyalty_programs', uid))

  // Update customer profile if exists
  batch.update(doc(db, 'customers', uid), {
    hasLoyaltyProfile: false,
  })

  await batch.commit()
  console.log('[MultiRole] Removed loyalty from user:', uid)
}

/**
 * Remove subscription from user (downgrade)
 */
export async function removeSubscriptionFromUser(uid: string): Promise<void> {
  const batch = writeBatch(db)

  // Update user metadata
  batch.update(doc(db, 'users', uid), {
    userTypes: arrayRemove('subscription'),
    'roles.subscription': null,
  })

  // Delete subscription document
  batch.delete(doc(db, 'subscriptions', uid))

  // Update customer profile if exists
  batch.update(doc(db, 'customers', uid), {
    hasSubscription: false,
    selectedPlan: 'none',
  })

  await batch.commit()
  console.log('[MultiRole] Removed subscription from user:', uid)
}

// ============================================
// QUERY MULTI-ROLE USERS
// ============================================

/**
 * Find all users with specific role combination
 * e.g., findUsersByRoles(['customer', 'loyalty']) finds all loyalty members
 */
export async function findUsersByRoles(roles: UserRole[]): Promise<MultiRoleUser[]> {
  const usersRef = collection(db, 'users')
  
  // For simplicity, query for users where userTypes array contains all specified roles
  // In a real app, you might want to create a composite index
  const results: MultiRoleUser[] = []

  const q = query(usersRef)
  const snapshot = await getDocs(q)

  snapshot.forEach((doc) => {
    const userData = doc.data() as UserMetadata
    // Check if user has all requested roles
    const hasAllRoles = roles.every(role => userData.userTypes.includes(role))
    if (hasAllRoles) {
      results.push({
        uid: userData.uid,
        email: userData.email,
        roles: userData.userTypes,
        primaryRole: userData.primaryUserType,
        status: userData.roles[userData.primaryUserType]?.status as any,
      })
    }
  })

  return results
}

/**
 * Find all premium users (customer + loyalty + subscription)
 */
export async function findPremiumUsers(): Promise<MultiRoleUser[]> {
  return findUsersByRoles(['customer', 'loyalty', 'subscription'])
}

/**
 * Find all loyalty members
 */
export async function findLoyaltyMembers(): Promise<MultiRoleUser[]> {
  return findUsersByRoles(['loyalty'])
}

/**
 * Find all subscribers
 */
export async function findSubscribers(): Promise<MultiRoleUser[]> {
  return findUsersByRoles(['subscription'])
}
