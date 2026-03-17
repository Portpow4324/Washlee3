# WASHLEE - DETAILED CODE IMPLEMENTATION GUIDE

This document contains detailed code implementations and architectural patterns used throughout the Washlee project.

---

## 🏗 ARCHITECTURE PATTERNS

### 1. Multi-Role User System

**Concept**: A single user can have multiple roles simultaneously.

**Central Hub Model**:
```typescript
// users/{uid} - Central metadata document
{
  uid: "user123",
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890",
  
  // Multi-role array - user can be customer, employee, loyalty member, AND subscriber all at once
  userTypes: ["customer", "loyalty", "subscription"],
  
  // Primary role (default dashboard view)
  primaryUserType: "customer",
  
  // Role-specific metadata for quick access
  roles: {
    customer: {
      status: "active",
      joinedAt: Timestamp,
      metadata: { personalUse: "personal", totalOrders: 5 }
    },
    loyalty: {
      status: "active",
      joinedAt: Timestamp,
      metadata: { tier: "gold", points: 1500 }
    },
    subscription: {
      status: "active",
      joinedAt: Timestamp,
      metadata: { plan: "professional", renewalDate: Timestamp }
    }
  },
  
  preferences: {
    marketingTexts: true,
    accountTexts: true,
    emailNotifications: true
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Separate Collections** (one for each role):
```
customers/{uid}      - Detailed customer data
employees/{uid}      - Detailed employee data
loyalty_programs/{uid} - Loyalty membership data
subscriptions/{uid}  - Subscription details
```

**Example User Combinations**:
- Regular customer: `['customer']`
- Customer earning rewards: `['customer', 'loyalty']`
- Loyal subscriber: `['customer', 'loyalty', 'subscription']`
- Employee who uses service: `['employee', 'customer', 'subscription']`
- Admin: `['admin']` + custom claims

### 2. Authentication Context Pattern

**Purpose**: Global auth state management for entire app.

```typescript
// lib/AuthContext.tsx
interface AuthContextType {
  user: User | null              // Firebase Auth user
  userData: UserData | null       // Custom user data from Firestore
  loading: boolean               // Still loading user data?
  isAuthenticated: boolean       // Is user logged in?
}

// Use in components:
const { user, userData, loading, isAuthenticated } = useAuth()

if (loading) return <Spinner />
if (!isAuthenticated) return <SignInPrompt />

// User authenticated and data loaded
return <Dashboard user={userData} />
```

**Features**:
- Retry mechanism (up to 3 attempts) for Firestore race conditions
- Auto-creates user document if missing
- Handles offline mode gracefully
- Caches data in browser

### 3. Component Pattern

**All page components follow this pattern**:

```typescript
'use client'  // Client-side rendering

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import { useAuth } from '@/lib/AuthContext'

export default function MyPage() {
  const { userData, isAuthenticated, loading } = useAuth()
  const [state, setState] = useState('')

  if (loading) return <Spinner />

  return (
    <>
      <Header />
      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 py-20">
        <h1>My Page</h1>
        <Button size="lg" variant="primary">Click me</Button>
      </main>
      <Footer />
    </>
  )
}
```

### 4. Button Component System

```tsx
// Use in templates:
<Button size="lg" variant="primary">Book Now</Button>
<Button size="md" variant="outline">Learn More</Button>
<Button size="sm" variant="ghost">Skip</Button>

// Props:
type ButtonVariant = 'primary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

// Sizes:
// sm: px-4 py-2 text-base
// md: px-6 py-3 text-lg
// lg: px-8 py-4 text-xl

// Variants:
// primary: Teal background, white text
// outline: Border with teal text
// ghost: Transparent, teal text on hover
```

---

## 🔐 AUTHENTICATION FLOW

### Signup Flow (Customer)

```
1. User goes to /auth/signup-customer
2. Step 0: Email & Password
3. Step 1: Name & Phone
4. Step 2: Personal vs Business
5. Step 3: Choose Subscription Plan (optional)
6. Submit: Creates Firebase Auth account + Firestore user doc + customer doc
7. Redirected to /dashboard/customer
```

**Code Execution**:
```typescript
// On form submit (Step 3):
const userCredential = await createUserWithEmailAndPassword(
  auth,
  email,
  password
)

// Create user documents in batch
await createCustomerProfileOptimized(uid, {
  email,
  firstName,
  lastName,
  phone,
  personalUse: 'personal' | 'business',
  preferenceMarketingTexts: true,
  preferenceAccountTexts: true,
  selectedPlan: 'none' | 'starter' | 'professional' | 'washly'
})

// Wait 1500ms for AuthContext to pick up new user
setTimeout(() => {
  router.push('/dashboard/customer')
}, 1500)
```

### Login Flow

```
1. User goes to /auth/signin
2. Enters email & password
3. Firebase Auth verifies credentials
4. AuthContext picks up authenticated user
5. Firestore loads user data
6. Redirected based on userType:
   - 'customer' → /dashboard/customer
   - 'pro' → /dashboard/pro/dashboard
   - 'admin' → /admin
```

### Token Refresh

```typescript
// In AuthContext, on login:
const idTokenResult = await firebaseUser.getIdTokenResult(true)
console.log('Custom claims:', idTokenResult.claims)
// claims can include: { admin: true, subscription_plan: 'professional' }
```

---

## 💳 STRIPE INTEGRATION

### Subscription Checkout Flow

```
User clicks "Upgrade to Plan" on /subscriptions
  ↓
handleSelectPlan() called with plan ID
  ↓
API call to /api/subscriptions/create-checkout-session
  ↓
Stripe session created with plan details
  ↓
User redirected to Stripe Hosted Checkout
  ↓
User enters payment details
  ↓
Payment processed
  ↓
Success: Redirect to /dashboard/subscription/success
Cancel: Redirect to /subscriptions?cancelled=true
```

**API Implementation**:
```typescript
// /api/subscriptions/create-checkout-session/route.ts
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Professional Plan',
          description: 'Unlimited orders with exclusive benefits'
        },
        unit_amount: 1999, // $19.99 in cents
        recurring: {
          interval: 'month',
          interval_count: 1
        }
      },
      quantity: 1
    }
  ],
  mode: 'subscription',
  success_url: `${baseUrl}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/subscriptions?cancelled=true`,
  customer_email: userEmail,
  metadata: {
    plan: 'professional',
    userId: uid
  }
})

return NextResponse.json({ sessionId: session.id })
```

**Frontend Integration**:
```typescript
// /app/subscriptions/page.tsx
const handleSelectPlan = async (planId: string) => {
  const response = await fetch('/api/subscriptions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: planId })
  })

  const { sessionId } = await response.json()
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  
  await stripe.redirectToCheckout({ sessionId })
}
```

### Order Payment Flow

```
User completes booking
  ↓
Checkout page shows order summary
  ↓
User clicks "Confirm & Pay"
  ↓
API call to /api/checkout
  ↓
Stripe session created for order (one-time payment)
  ↓
Redirect to Stripe Hosted Checkout
  ↓
User enters card details
  ↓
Payment processed
  ↓
Success: /checkout/success
Failure: /checkout/cancel
```

---

## 📊 DATABASE OPERATIONS

### Creating a Customer with Loyalty

```typescript
// lib/multiRoleUserManagement.ts
export async function createCustomerWithLoyalty(
  uid: string,
  customerData: CustomerProfile,
  loyaltyData: Partial<LoyaltyProgram>
) {
  const batch = writeBatch(db)

  // 1. Update users/{uid} central hub
  batch.set(doc(db, 'users', uid), {
    userTypes: arrayUnion('customer', 'loyalty'),
    roles: {
      customer: {
        status: 'active',
        joinedAt: Timestamp.now(),
        metadata: { personalUse: customerData.personalUse }
      },
      loyalty: {
        status: 'active',
        joinedAt: Timestamp.now(),
        metadata: { tier: 'bronze', points: 0 }
      }
    }
  }, { merge: true })

  // 2. Create customers/{uid}
  batch.set(doc(db, 'customers', uid), customerData)

  // 3. Create loyalty_programs/{uid}
  batch.set(doc(db, 'loyalty_programs', uid), {
    uid,
    tier: 'bronze',
    points: 0,
    joinedAt: Timestamp.now(),
    ...loyaltyData
  })

  // Commit all in one batch (atomic operation)
  await batch.commit()
}
```

### Querying Multi-Role Users

```typescript
// Find all users with both customer AND loyalty roles
export async function findLoyaltyMembers() {
  const q = query(
    collection(db, 'users'),
    where('userTypes', 'array-contains', 'loyalty')
  )
  
  const docs = await getDocs(q)
  return docs.docs.map(doc => doc.data() as UserMetadata)
}

// Find users with customer AND subscription (paying subscribers)
export async function findPayingSubscribers() {
  const q = query(
    collection(db, 'users'),
    where('userTypes', 'array-contains', 'subscription')
  )
  
  const docs = await getDocs(q)
  return docs.docs.map(doc => doc.data() as UserMetadata)
}
```

---

## 🔒 SECURITY RULES

### Firestore Rules Pattern

```plaintext
// Own document access
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
}

// Cross-document access (employees can read customers)
match /customers/{uid} {
  allow read, write: if request.auth.uid == uid;
  allow read: if exists(/databases/$(database)/documents/employees/$(request.auth.uid));
}

// Admin override
match /{document=**} {
  allow read: if request.auth.token.admin == true;
  allow write: if request.auth.token.admin == true && 
                  request.path.matches(/users\/.*/) ||
                  request.path.matches(/orders\/.*/);
}
```

---

## 📧 EMAIL NOTIFICATIONS

### Email Service

```typescript
// lib/emailService.ts
export async function sendOrderConfirmation(
  userEmail: string,
  orderDetails: Order
) {
  await fetch('/api/emails/send', {
    method: 'POST',
    body: JSON.stringify({
      to: userEmail,
      subject: `Order Confirmed #${orderDetails.orderId}`,
      template: 'order-confirmation',
      data: {
        orderId: orderDetails.orderId,
        pickupTime: orderDetails.pickup.time,
        deliveryTime: orderDetails.delivery.time,
        total: orderDetails.pricing.total
      }
    })
  })
}
```

---

## 🎯 PRICING ENGINE

### Dynamic Pricing Calculation

```typescript
// lib/pricing-engine.ts
export function calculateOrderPrice(
  weight: number,        // kg
  serviceType: 'standard' | 'express' = 'standard',
  addOns: string[] = []
) {
  // Base: $3.00 per kg
  let subtotal = weight * 3.0

  // Service type multiplier
  if (serviceType === 'express') {
    subtotal *= 1.5  // 50% markup for express
  }

  // Add-ons
  const addonPrices: Record<string, number> = {
    'hang-dry': 2.50,
    'delicates': 1.50,
    'comforters': 5.00,
    'stain-treatment': 3.00
  }

  let addonTotal = 0
  addOns.forEach(addon => {
    addonTotal += addonPrices[addon] || 0
  })

  // Delivery fee
  const deliveryFee = 5.00

  // Total
  const total = subtotal + addonTotal + deliveryFee

  // Apply subscription discount if applicable
  let discount = 0
  if (userSubscription?.plan === 'professional') {
    discount = total * 0.15  // 15% off
  } else if (userSubscription?.plan === 'starter') {
    discount = total * 0.10  // 10% off
  }

  return {
    subtotal,
    addOns: addonTotal,
    delivery: deliveryFee,
    discount,
    total: Math.max(0, total - discount)
  }
}
```

---

## 🔄 STATE MANAGEMENT PATTERNS

### Form State Pattern

```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  personalUse: '',
  selectedPlan: 'none'
})

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  setFormData(prev => ({
    ...prev,
    [name]: value
  }))
}

const handleSelectPlan = (planId: string) => {
  setFormData(prev => ({
    ...prev,
    selectedPlan: planId
  }))
}
```

### Loading State Pattern

```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

const handleSubmit = async () => {
  setLoading(true)
  setError('')
  
  try {
    // API call
    const result = await someAsyncOperation()
    // Handle success
  } catch (err: any) {
    setError(err.message || 'Something went wrong')
  } finally {
    setLoading(false)
  }
}

// In JSX:
{error && <div className="bg-red-50 text-red-600 p-3">{error}</div>}
<button disabled={loading}>
  {loading ? 'Loading...' : 'Submit'}
</button>
```

---

## 🎨 STYLING PATTERNS

### Tailwind Class Organization

```tsx
// Layout
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"

// Typography
className="text-4xl font-bold text-dark"

// Colors
className="bg-primary text-white"
className="border-2 border-gray rounded-lg"

// Responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Hover/Transitions
className="hover:shadow-lg transition duration-300"

// Flex/Grid
className="flex items-center justify-between gap-4"
className="grid grid-cols-3 auto-rows-max"
```

### Color System

```css
--primary: #48C9B0;      /* Teal - main brand color */
--light: #f7fefe;        /* Off-white - backgrounds */
--dark: #1f2d2b;         /* Dark gray - text */
--gray: #6b7b78;         /* Medium gray - secondary text */
--mint: #E8FFFB;         /* Light mint - hover backgrounds */
--accent: #7FE3D3;       /* Light teal - accents */
--lavender: #F0E5FF;     /* Lavender - secondary accents */
```

---

## 📱 RESPONSIVE DESIGN BREAKPOINTS

```
Mobile First (default): Single column, touch-friendly
sm: 640px - Small optimizations
md: 768px - 2-column layouts
lg: 1024px - 3-4 column grids
xl: 1280px - Full width designs
```

**Example**:
```tsx
<div className="
  grid
  grid-cols-1            /* Mobile: 1 column */
  md:grid-cols-2         /* Tablet: 2 columns */
  lg:grid-cols-4         /* Desktop: 4 columns */
  gap-4                  /* Space between items */
">
  {/* Items */}
</div>
```

---

## 🧪 TESTING PATTERNS

### Manual Testing Checklist

- [ ] Signup flow (all 4 steps)
- [ ] Login with existing account
- [ ] Multi-step form validation
- [ ] Error handling (invalid email, weak password, etc)
- [ ] Loading states display
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Navigation works in header/mobile menu
- [ ] Logout functionality
- [ ] Database saves data correctly
- [ ] Stripe checkout (use test card: 4242 4242 4242 4242)

### Test Data

```typescript
// Stripe test card
Number: 4242 4242 4242 4242
Exp: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)

// Firebase test users
Email: test@washlee.com
Password: Test@1234
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Environment variables set in Vercel
- [ ] Firebase Firestore live rules deployed
- [ ] Stripe live keys configured
- [ ] Database backup strategy in place
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Analytics enabled (Google Analytics)
- [ ] SSL certificate active
- [ ] Robots.txt and sitemap.xml created
- [ ] SEO meta tags optimized
- [ ] Performance tested (Lighthouse > 90)
- [ ] Mobile responsiveness verified
- [ ] All links working
- [ ] Forms submit successfully
- [ ] Payments process correctly

---

## 🔗 KEY DEPENDENCIES & VERSIONS

```json
{
  "next": "16.1.3",                      // Latest Next.js
  "react": "19.2.3",                     // Latest React
  "typescript": "5",                     // TypeScript 5
  "firebase": "12.8.0",                  // Firebase SDK
  "firebase-admin": "13.7.0",            // Firebase Admin
  "@stripe/react-stripe-js": "^5.4.1",  // Stripe React
  "@stripe/stripe-js": "^8.6.4",         // Stripe JS
  "stripe": "^20.2.0",                   // Stripe Server
  "tailwindcss": "^3.4.19",              // Tailwind CSS
  "next-auth": "^4.24.13",               // Authentication
  "lucide-react": "^0.562.0",            // Icons
  "react-hot-toast": "^2.6.0",           // Notifications
  "axios": "^1.13.2",                    // HTTP client
  "@sendgrid/mail": "^8.1.6"             // Email service
}
```

---

## 📞 TROUBLESHOOTING COMMON ISSUES

### Issue: User data not loading after signup
**Solution**: Increase delay in signup redirect (already set to 1500ms)

### Issue: Stripe checkout not loading
**Solution**: Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is correct

### Issue: Firebase permission denied errors
**Solution**: Check firestore.rules are deployed and correct

### Issue: Forms not submitting
**Solution**: Check console for errors, verify API endpoints exist

### Issue: Images not loading
**Solution**: Verify image domains are in next.config.ts remotePatterns

---

**Last Updated**: March 4, 2026
**Project**: Washlee - Laundry Service Marketplace
**Status**: Production Ready ✅
