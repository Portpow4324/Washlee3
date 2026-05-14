/**
 * User Types & Interfaces for Washlee
 * 
 * Central hub: users/{uid}
 * Specific data: customers/{uid}, employees/{uid}, loyalty_programs/{uid}
 * 
 * A user can have multiple roles stored in users/{uid}.userTypes array
 */

// Supabase uses Date strings (ISO 8601) or Date objects
type Timestamp = string | Date

// ============================================
// ROLE TYPES
// ============================================

export type UserRole = 'customer' | 'employee' | 'loyalty' | 'subscription' | 'admin'

export type CustomerStatus = 'active' | 'suspended' | 'inactive'
export type EmployeeStatus = 'pending' | 'active' | 'suspended' | 'inactive'
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type SubscriptionPlan = 'none'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'pending'
export type BillingCycle = 'monthly' | 'quarterly' | 'annual'

// ============================================
// USERS COLLECTION - CENTRAL HUB
// ============================================

/**
 * users/{uid}
 * 
 * This is the central metadata document for every user.
 * It determines:
 * - What roles the user has (customer, employee, loyalty, legacy subscription)
 * - Quick access to status of each role
 * - Billing & account information
 * - Which is the primary role
 */
export interface UserMetadata {
  // Auth & Identity
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string

  // Multi-role Support
  userTypes: UserRole[]                    // e.g., ['customer', 'loyalty']
  primaryUserType: UserRole                // e.g., 'customer' (the main role)

  // Role-Specific Metadata (quick lookup)
  roles: {
    customer?: RoleMetadata<CustomerRoleData>
    employee?: RoleMetadata<EmployeeRoleData>
    loyalty?: RoleMetadata<LoyaltyRoleData>
    subscription?: RoleMetadata<SubscriptionRoleData>
    admin?: RoleMetadata<AdminRoleData>
  }

  // Account Settings
  preferences: {
    marketingTexts: boolean
    accountTexts: boolean
    emailNotifications: boolean
  }

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLoginAt: Timestamp
}

// Generic structure for any role's metadata
interface RoleMetadata<T> {
  status: string              // 'active', 'pending', etc.
  joinedAt: Timestamp
  metadata?: T                // Role-specific quick data
}

// Role-Specific Data (stored in users.roles)
interface CustomerRoleData {
  personalUse: 'personal' | 'business'
  totalOrders: number
  totalSpent: number
}

interface EmployeeRoleData {
  totalJobs: number
  totalEarnings: number
  state: string
}

interface LoyaltyRoleData {
  tier: LoyaltyTier
  points: number
}

interface SubscriptionRoleData {
  plan: SubscriptionPlan
  renewalDate: Timestamp
}

interface AdminRoleData {
  adminLevel: 'super' | 'moderator' | 'support'
}

// ============================================
// CUSTOMERS COLLECTION
// ============================================

/**
 * customers/{uid}
 * 
 * Detailed customer profile.
 * Only exists if user has 'customer' role.
 */
export interface CustomerProfile {
  // Identity
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string

  // Customer Info
  applicationType: 'customer'
  status: CustomerStatus
  personalUse: 'personal' | 'business'

  // Preferences
  preferenceMarketingTexts: boolean
  preferenceAccountTexts: boolean
  selectedPlan: 'none'

  // Statistics
  totalOrders: number
  totalSpent: number
  rating: number
  averageRating: number

  // Linked Profiles
  hasEmployeeProfile: boolean
  hasLoyaltyProfile: boolean
  hasSubscription: boolean

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================
// EMPLOYEES COLLECTION
// ============================================

/**
 * employees/{uid}
 * 
 * Employee/Pro profile.
 * Only exists if user has 'employee' role.
 */
export interface EmployeeProfile {
  // Identity
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string
  state: string

  // Employee Info
  applicationType: 'employee'
  status: EmployeeStatus
  employeeId: string              // Display ID (e.g., "123456")

  // Verification
  verificationStatus: {
    emailVerified: boolean
    phoneVerified: boolean
    idVerified: boolean
    backgroundCheckPassed: boolean
  }

  // Work Info
  employmentType: 'contractor' | 'employee'
  applicationStep: number
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }

  // Statistics
  totalJobs: number
  totalEarnings: number
  rating: number
  averageRating: number

  // Linked Profiles
  hasCustomerProfile: boolean

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================
// LOYALTY PROGRAMS COLLECTION
// ============================================

/**
 * loyalty_programs/{uid}
 * 
 * Loyalty program details.
 * Only exists if user has 'loyalty' role.
 */
export interface LoyaltyProgram {
  // Identity
  uid: string
  customerId: string           // Links to customers/{uid}

  // Tier & Points
  tier: LoyaltyTier
  points: number
  pointsExpiration: Timestamp
  lifetimePoints: number

  // Tier Info
  tierUpgradeEligible: boolean
  pointsToNextTier: number

  // History
  pointsEarnedThisMonth: number
  lastPointsEarned: Timestamp
  lastPointsRedeemed: Timestamp

  // Linked Profiles
  hasCustomerProfile: boolean
  hasSubscription: boolean

  // Timestamps
  joinedAt: Timestamp
  updatedAt: Timestamp
}

// ============================================
// SUBSCRIPTIONS COLLECTION
// ============================================

/**
 * subscriptions/{uid}
 * 
 * Subscription details.
 * Only exists if user has 'subscription' role.
 */
export interface Subscription {
  // Identity
  uid: string
  userId: string               // Links to users/{uid}

  // Plan Details
  plan: SubscriptionPlan
  status: SubscriptionStatus
  billingCycle: BillingCycle

  // Dates
  startDate: Timestamp
  renewalDate: Timestamp
  cancelledAt?: Timestamp
  pausedAt?: Timestamp

  // Pricing
  amount: number               // Monthly/quarterly/annual
  currency: string             // 'AUD', 'USD', etc.
  discount?: number            // If loyalty member

  // Payment
  stripeSubscriptionId: string
  stripeCustomerId: string
  paymentMethodId: string

  // Usage
  ordersIncluded: number       // Based on plan
  ordersUsed: number
  discountPercentage: number   // Loyalty-based

  // Linked Profiles
  hasCustomerProfile: boolean
  hasLoyaltyProfile: boolean

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * User with all their data
 * Used when you need the complete user profile
 */
export interface FullUserProfile {
  metadata: UserMetadata
  customer?: CustomerProfile
  employee?: EmployeeProfile
  loyalty?: LoyaltyProgram
  subscription?: Subscription
}

/**
 * Query result for users with multiple roles
 */
export interface MultiRoleUser {
  uid: string
  email: string
  roles: UserRole[]
  primaryRole: UserRole
  status: 'active' | 'suspended' | 'inactive'
}
