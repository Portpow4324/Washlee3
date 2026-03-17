# Multi-Role User Architecture - Complete Guide

## 🎯 Central Hub Concept

```
USERS/{uid} ← CENTRAL HUB (determines everything)
├── userTypes: ['customer', 'loyalty', 'subscription']
├── roles: {
│   customer: { status, joinedAt, metadata }
│   loyalty: { status, joinedAt, metadata }
│   subscription: { status, joinedAt, metadata }
│ }
└── All user access controlled from here
```

Every user has ONE `users/{uid}` document. It tells you:
- What roles they have
- Status of each role
- Which is primary
- Quick metadata for each role

---

## 📊 User Types & Their Storage

### Single Role Users

#### 1️⃣ Customer Only
```
User Signup: Customer Registration
         ↓
users/{uid}
├── userTypes: ['customer']
├── primaryUserType: 'customer'
└── roles.customer: { status: 'active' }
         ↓
customers/{uid} ← Full customer profile
```

#### 2️⃣ Employee Only
```
User Signup: Employee Registration
         ↓
users/{uid}
├── userTypes: ['employee']
├── primaryUserType: 'employee'
└── roles.employee: { status: 'pending' }
         ↓
employees/{uid} ← Full employee profile
```

---

### Multi-Role Users

#### 3️⃣ Customer + Loyalty
```
Customer Signs Up → Customer + Loyalty Member
         ↓
users/{uid}
├── userTypes: ['customer', 'loyalty']
├── primaryUserType: 'customer'
├── roles.customer: { status: 'active' }
└── roles.loyalty: { status: 'active', metadata: { tier: 'bronze', points: 0 } }
         ↓                              ↓
customers/{uid}                  loyalty_programs/{uid}
  (customer data)                  (loyalty data)
```

#### 4️⃣ Customer + Subscription
```
Customer Upgrades → Customer + Subscriber
         ↓
users/{uid}
├── userTypes: ['customer', 'subscription']
├── primaryUserType: 'customer'
├── roles.customer: { status: 'active' }
└── roles.subscription: { status: 'active', metadata: { plan: 'starter' } }
         ↓                                    ↓
customers/{uid}                      subscriptions/{uid}
  (customer data)                      (subscription data)
```

#### 5️⃣ Customer + Loyalty + Subscription (PREMIUM)
```
Customer Upgrades → Full Premium User
         ↓
users/{uid}
├── userTypes: ['customer', 'loyalty', 'subscription']
├── primaryUserType: 'customer'
├── roles.customer: { status: 'active' }
├── roles.loyalty: { status: 'active', metadata: { tier: 'silver', points: 0 } }
└── roles.subscription: { status: 'active', metadata: { plan: 'professional' } }
         ↓                    ↓                              ↓
customers/{uid}       loyalty_programs/{uid}         subscriptions/{uid}
  (customer data)       (loyalty data)              (subscription data)
```

#### 6️⃣ Employee + Customer (Dual Role)
```
Employee Wants to Order → Employee + Customer
         ↓
users/{uid}
├── userTypes: ['employee', 'customer']
├── primaryUserType: 'employee'
├── roles.employee: { status: 'active' }
└── roles.customer: { status: 'active' }
         ↓                    ↓
employees/{uid}        customers/{uid}
  (employee data)        (customer data)
```

---

## 🔍 How to Query Users

### Find by Single Role
```typescript
// Get all customers
const customers = await findUsersByRoles(['customer'])

// Get all loyalty members
const loyaltyMembers = await findUsersByRoles(['loyalty'])

// Get all subscribers
const subscribers = await findUsersByRoles(['subscription'])
```

### Find by Multiple Roles
```typescript
// Find users who are BOTH customer AND employee
const dualRoleUsers = await findUsersByRoles(['customer', 'employee'])

// Find premium users (customer + loyalty + subscription)
const premiumUsers = await findPremiumUsers()

// Check if user has loyalty
const profile = await getFullUserProfile(uid)
if (profile.metadata.userTypes.includes('loyalty')) {
  console.log('User has loyalty:', profile.loyalty)
}
```

---

## 📝 Real-World Scenarios

### Scenario 1: John is a Regular Customer
```javascript
// During signup
await createCustomerProfileOptimized(uid, {
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  personalUse: 'personal',
  // ...
})

// John's data:
users/john_uid
├── userTypes: ['customer']
└── primaryUserType: 'customer'

customers/john_uid
└── (all customer details)
```

### Scenario 2: Sarah Signs Up as Customer + Loyalty Member
```javascript
// During signup
await createCustomerWithLoyalty(uid, customerData, loyaltyData)

// Sarah's data:
users/sarah_uid
├── userTypes: ['customer', 'loyalty']
├── roles.customer: { status: 'active' }
└── roles.loyalty: { status: 'active', tier: 'bronze' }

customers/sarah_uid
└── (customer details)

loyalty_programs/sarah_uid
└── (loyalty details: points, tier, etc.)
```

### Scenario 3: Mike is Employee + Customer + Subscriber
```javascript
// Employee signs up
await createEmployeeProfileOptimized(uid, employeeData)

// Later, employee wants to order AND subscribe
await addSubscriptionToCustomer(uid, subscriptionData)
await addLoyaltyToCustomer(uid)

// Mike's data:
users/mike_uid
├── userTypes: ['employee', 'customer', 'loyalty', 'subscription']
├── primaryUserType: 'employee'
└── roles: { employee, customer, loyalty, subscription }

employees/mike_uid
├── (employee details)
└── hasCustomerProfile: true

customers/mike_uid
├── (customer details)
├── hasEmployeeProfile: true
├── hasSubscription: true
└── hasLoyaltyProfile: true

subscriptions/mike_uid
└── (subscription details)

loyalty_programs/mike_uid
└── (loyalty details)
```

### Scenario 4: Sarah Downgrades (Remove Loyalty)
```javascript
// Sarah wants to cancel loyalty
await removeLoyaltyFromUser(uid)

// Sarah's data NOW:
users/sarah_uid
├── userTypes: ['customer', 'subscription']  // ← loyalty removed
└── roles.loyalty: null

// loyalty_programs/sarah_uid
└── DELETED

customers/sarah_uid
└── hasLoyaltyProfile: false
```

---

## 🎯 Key Rules

### Rule 1: Primary Role Determines Dashboard
```typescript
if (userMetadata.primaryUserType === 'customer') {
  // Show customer dashboard
} else if (userMetadata.primaryUserType === 'employee') {
  // Show employee dashboard
}
```

### Rule 2: Check userTypes Array for Features
```typescript
// Check if user can earn loyalty points
if (userMetadata.userTypes.includes('loyalty')) {
  earnLoyaltyPoints(uid, points)
}

// Check if user is subscribed
if (userMetadata.userTypes.includes('subscription')) {
  applySubscriptionDiscount()
}
```

### Rule 3: Load Only Needed Documents
```typescript
// Fast - load metadata first
const metadata = await getUserMetadata(uid)

// Then load only the role documents you need
if (metadata.userTypes.includes('subscription')) {
  const sub = await getDoc(doc(db, 'subscriptions', uid))
}
```

---

## 📈 Scaling Patterns

### Add New Role (e.g., Referral Program)
```typescript
// users/{uid}
{
  userTypes: ['customer', 'loyalty', 'subscription', 'referral'],
  roles: {
    referral: { status: 'active', joinedAt: timestamp, metadata: { code: 'JOHN123' } }
  }
}

// Create new collection
referral_programs/{uid}
```

### Add New Collection Type (e.g., VIP Program)
```typescript
// Same pattern - just add new role and new collection
users/{uid}
├── userTypes: [..., 'vip']
└── roles.vip: { status: 'active' }

vip_members/{uid}
└── (vip-specific data)
```

---

## 🔐 Firestore Rules

```typescript
// Allow users to access their data
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
}

match /customers/{uid} {
  allow read, write: if request.auth.uid == uid;
}

match /employees/{uid} {
  allow read, write: if request.auth.uid == uid;
}

match /loyalty_programs/{uid} {
  allow read, write: if request.auth.uid == uid;
}

match /subscriptions/{uid} {
  allow read, write: if request.auth.uid == uid;
}

// Admin can read all (for analytics/management)
match /{document=**} {
  allow read: if request.auth.token.admin == true;
}
```

---

## ✅ Benefits Summary

| Aspect | Benefit |
|--------|---------|
| **Organization** | Central hub (`users/{uid}`) tells you everything about a user |
| **Flexibility** | Any combination of roles is supported |
| **Performance** | Load metadata first, then only needed collections |
| **Scalability** | Add new roles/programs without changing existing structure |
| **Isolation** | Each role's data is separate, no mixing |
| **Queries** | Easy to find users by role combination |
| **Downgrades** | Remove roles without deleting user |

---

## 📚 Implementation Functions

### Create Users
- `createCustomerWithLoyalty()` - Customer + Loyalty
- `createCustomerWithSubscription()` - Customer + Subscription
- `createPremiumUser()` - Customer + Loyalty + Subscription

### Add Roles
- `addLoyaltyToCustomer()` - Upgrade to loyalty
- `addSubscriptionToCustomer()` - Upgrade to subscription

### Remove Roles
- `removeLoyaltyFromUser()` - Downgrade loyalty
- `removeSubscriptionFromUser()` - Cancel subscription

### Get User Data
- `getUserMetadata()` - Quick role check
- `getFullUserProfile()` - Complete user with all roles
- `findUsersByRoles()` - Query users by role(s)
