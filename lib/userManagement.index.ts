/**
 * USER MANAGEMENT INDEX & NAVIGATION
 * ====================================
 * 
 * This file serves as the central hub for all user management functionality.
 * It re-exports key functions from all user management modules.
 * 
 * RELATED FILES:
 * 1. userManagement.ts              ← MAIN (709 lines) - Core user CRUD operations
 * 2. userManagement.optimized.ts    ← OPTIMIZATION (345 lines) - Speed improvements for signup
 * 3. userManagement.deferred.ts     ← ASYNC (253 lines) - Deferred ID generation for speed
 * 4. multiRoleUserManagement.ts     ← ADVANCED (660 lines) - Multi-role & concurrent roles
 * 
 * USAGE:
 * ======
 * When you need user management:
 * 
 * Option 1 - STANDARD (Recommended for most cases):
 *   import { createEmployeeProfile, createCustomerProfile } from '@/lib/userManagement'
 * 
 * Option 2 - OPTIMIZED (For fast signup):
 *   import { generateEmployeeDisplayId } from '@/lib/userManagement.optimized'
 * 
 * Option 3 - DEFERRED (For instant signup, ID generated async):
 *   import { createEmployeeProfileDeferred } from '@/lib/userManagement.deferred'
 * 
 * Option 4 - MULTI-ROLE (For users with multiple roles):
 *   import { createMultiRoleUser, upgradeToEmployee } from '@/lib/multiRoleUserManagement'
 * 
 * ============================================================================
 */

// Core exports from main user management
export {
  // Types
  type EmployeeProfile,
  type CustomerProfile,
  type UserMetadata,
  
  // Numeric ID helpers
  generateShortUserId,
  compressFirebaseUid,
  getDisplayId,
  
  // Employee operations
  createEmployeeProfile,
  getEmployeeProfile,
  updateEmployeeProfile,
  deleteEmployeeProfile,
  
  // Customer operations
  createCustomerProfile,
  getCustomerProfile,
  updateCustomerProfile,
  deleteCustomerProfile,
  
  // Utility functions
  hasLinkedProfiles,
} from './userManagement'

// DOCUMENTATION FOR EACH MODULE
/**
 * FILE 1: userManagement.ts (MAIN - 709 lines)
 * =============================================
 * 
 * Purpose: Core user management system for Washlee
 * 
 * Key Features:
 * ✅ Employee profile creation & management
 * ✅ Customer profile creation & management  
 * ✅ Linked profiles (user can be both customer + employee)
 * ✅ Numeric ID helpers (WASH-XXXXXX format)
 * ✅ Role verification & status tracking
 * 
 * Key Functions:
 * - createEmployeeProfile(uid, employeeData) → Create pro/employee
 * - createCustomerProfile(uid, customerData) → Create customer
 * - getEmployeeProfile(uid) → Fetch employee details
 * - getCustomerProfile(uid) → Fetch customer details
 * - updateEmployeeProfile(uid, updates) → Update employee
 * - updateCustomerProfile(uid, updates) → Update customer
 * - hasLinkedProfiles(uid) → Check if user has multiple roles
 * - generateShortUserId() → Create WASH-XXXXXX format ID
 * - compressFirebaseUid(firebaseUid) → Convert Firebase UID
 * 
 * When to use:
 * - Standard signup flow (customer OR employee)
 * - Most user management operations
 * - Account updates & verification
 * - Profile migrations
 * 
 * Performance: ~500-750ms for full profile creation
 * 
 * Learn more: ./userManagement.ts
 */

/**
 * FILE 2: userManagement.optimized.ts (OPTIMIZATION - 345 lines)
 * ============================================================
 * 
 * Purpose: Speed-optimized version of user management
 * 
 * Key Improvements:
 * ✅ Eliminates UUID collision detection (uses Math.random instead)
 * ✅ Direct Firestore writes (skips intermediate validation)
 * ✅ 6-digit employee ID as display field (non-unique)
 * ✅ Performance logging included
 * 
 * Key Functions:
 * - generateEmployeeDisplayId() → Instant 6-digit ID (100000-999999)
 * - generateUUID() → Instant UUID for internal use
 * - createEmployeeProfileOptimized() → Fast employee creation
 * 
 * Performance: ~350-450ms (30% faster than standard)
 * Trade-off: Skips some validation checks
 * 
 * When to use:
 * - Employee signup (speed critical)
 * - High-volume onboarding scenarios
 * - When user experience (speed) > data validation
 * 
 * NOT recommended for:
 * - Customer signup (validation more important)
 * - Profile updates (need safety)
 * - Sensitive operations
 * 
 * Learn more: ./userManagement.optimized.ts
 */

/**
 * FILE 3: userManagement.deferred.ts (ASYNC - 253 lines)
 * ========================================================
 * 
 * Purpose: Asynchronous ID generation for instant signup
 * 
 * Key Improvements:
 * ✅ Profile created instantly (no blocking)
 * ✅ Employee ID generated async by Cloud Function
 * ✅ User sees success immediately
 * ✅ ID appears in profile 100-500ms later
 * 
 * Key Functions:
 * - createEmployeeProfileDeferred(uid, data) → Instant (async ID)
 * - [Cloud Function] generateEmployeeIdAsync() → Runs async
 * 
 * Performance: ~250-350ms initial + 300-500ms async
 * User Experience: Feels instant (no UI blocking)
 * 
 * When to use:
 * - Employee signup (best UX)
 * - Mobile-first applications
 * - When instant feedback matters most
 * - High-frequency signup scenarios
 * 
 * Setup Required:
 * - Firebase Cloud Function listening to new employee documents
 * - Function generates unique ID and updates document
 * - See Firebase Cloud Functions documentation
 * 
 * Learn more: ./userManagement.deferred.ts
 */

/**
 * FILE 4: multiRoleUserManagement.ts (ADVANCED - 660 lines)
 * ========================================================
 * 
 * Purpose: Advanced multi-role user management
 * 
 * Key Features:
 * ✅ Users can have MULTIPLE roles simultaneously
 * ✅ Role transitions (customer → employee → both)
 * ✅ Role downgrade with archiving
 * ✅ Concurrent role management
 * ✅ Permissions system
 * ✅ Audit trail logging
 * 
 * Key Functions:
 * - createMultiRoleUser(uid, roles, data) → Create with multiple roles
 * - upgradeToEmployee(uid, employeeData) → Add employee role
 * - downgradeRole(uid, roleToRemove) → Remove role
 * - getRolePermissions(role) → Get role-specific permissions
 * - auditRoleChange(uid, change, reason) → Log role changes
 * - getFullUserProfile(uid) → Fetch all roles
 * 
 * Collections:
 * - users/{uid} → User metadata with all role types
 * - customers/{uid} → Customer profile
 * - employees/{uid} → Employee profile
 * - loyalty_programs/{uid} → Loyalty data (optional)
 * - subscriptions/{uid} → Subscription data (optional)
 * - role_audit/{uid}/changes/{changeId} → Audit trail
 * 
 * When to use:
 * - Users who are both customers AND employees
 * - Complex role hierarchies
 * - Permission-based access control needed
 * - Audit trail requirements
 * - Role transitions (customer upgrades to pro)
 * 
 * Example Flows:
 * 1. Customer signs up → Gets customer role
 * 2. Customer wants to become pro → Calls upgradeToEmployee()
 * 3. User now has BOTH roles → Can switch dashboards
 * 4. Customer decides to stop being pro → Calls downgradeRole()
 * 5. User back to customer only → Can switch roles
 * 
 * Learn more: ./multiRoleUserManagement.ts
 */

// ============================================================================
// DECISION GUIDE
// ============================================================================

/**
 * WHICH MODULE TO USE?
 * 
 * Question 1: Are you creating a new user account?
 * ├─ YES → Question 2
 * └─ NO → You need an UPDATE operation (all modules support this)
 * 
 * Question 2: Do you need maximum speed?
 * ├─ YES (employee signup, high volume)
 * │   ├─ Can wait 300-500ms extra? → Use DEFERRED (best UX)
 * │   └─ Need true instant? → Use OPTIMIZED (good UX)
 * └─ NO (customer signup, normal flow)
 *     └─ Use STANDARD (most reliable)
 * 
 * Question 3: Will this user have multiple roles?
 * ├─ YES → Use MULTI-ROLE
 * └─ NO → Use your choice from Question 2
 * 
 * Question 4: Do you need role transitions or audit trails?
 * ├─ YES → Use MULTI-ROLE
 * └─ NO → Your choice is final
 * 
 * ============================================================================
 * FINAL RECOMMENDATIONS
 * ============================================================================
 * 
 * CUSTOMER SIGNUP:
 * → Use STANDARD (userManagement.ts)
 * Reason: Customers don't need speed optimization, validation is important
 * 
 * EMPLOYEE/PRO SIGNUP:
 * → Use DEFERRED (userManagement.deferred.ts) [Recommended]
 * → OR Use OPTIMIZED (userManagement.optimized.ts)
 * Reason: Employees value speed, async ID is invisible to them
 * 
 * MULTI-ROLE MANAGEMENT:
 * → Use MULTI-ROLE (multiRoleUserManagement.ts)
 * Reason: Only module supporting concurrent roles and transitions
 * 
 * PROFILE UPDATES:
 * → Use STANDARD (userManagement.ts)
 * Reason: Updates are not speed-critical, validation important
 * 
 * CHECKING USER DATA:
 * → Use any module (all support queries)
 * Recommendation: Use MULTI-ROLE for comprehensive profile
 * 
 */

// ============================================================================
// INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example 1: Simple Customer Signup
 * 
 * import { createCustomerProfile } from '@/lib/userManagement'
 * 
 * async function handleCustomerSignup(uid: string, data: CustomerData) {
 *   await createCustomerProfile(uid, {
 *     email: data.email,
 *     firstName: data.firstName,
 *     lastName: data.lastName,
 *     phone: data.phone,
 *   })
 * }
 */

/**
 * Example 2: Fast Employee Signup (Deferred)
 * 
 * import { createEmployeeProfileDeferred } from '@/lib/userManagement.deferred'
 * 
 * async function handleEmployeeSignup(uid: string, data: EmployeeData) {
 *   // Returns instantly, ID generated async
 *   await createEmployeeProfileDeferred(uid, {
 *     email: data.email,
 *     firstName: data.firstName,
 *     ...data
 *   })
 * }
 */

/**
 * Example 3: Customer Upgrading to Employee
 * 
 * import { upgradeToEmployee } from '@/lib/multiRoleUserManagement'
 * 
 * async function handleCustomerToEmployee(uid: string, employeeData: EmployeeData) {
 *   // User keeps customer profile, adds employee profile
 *   await upgradeToEmployee(uid, employeeData)
 *   // Now user has BOTH roles
 * }
 */

/**
 * Example 4: Switching Dashboards
 * 
 * import { getFullUserProfile } from '@/lib/multiRoleUserManagement'
 * import DashboardSwitcher from '@/components/DashboardSwitcher'
 * 
 * async function getRoleInfo(uid: string) {
 *   const profile = await getFullUserProfile(uid)
 *   const hasCustomer = profile.customer ? true : false
 *   const hasEmployee = profile.employee ? true : false
 *   
 *   const roleType = hasCustomer && hasEmployee ? 'both' 
 *                  : hasEmployee ? 'employee' 
 *                  : 'customer'
 *   
 *   return <DashboardSwitcher currentRole={roleType} />
 * }
 */

export default {
  documentation: {
    main: './userManagement.ts',
    optimized: './userManagement.optimized.ts',
    deferred: './userManagement.deferred.ts',
    multiRole: './multiRoleUserManagement.ts',
  },
}
