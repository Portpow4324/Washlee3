# 🚀 Mobile App - Website Transfer Guide

**Created:** April 26, 2026  
**Purpose:** Identify correct services, ordering flow, UI patterns, and configuration needed to sync mobile app with Washlee website

---

## 📋 Table of Contents
1. [Correct Supabase Account](#correct-supabase-account)
2. [Services Available in Ordering](#services-available-in-ordering)
3. [Complete Ordering Flow (Website)](#complete-ordering-flow-website)
4. [UI Components & Patterns](#ui-components--patterns)
5. [API Endpoints Required](#api-endpoints-required)
6. [Configuration & Environment Variables](#configuration--environment-variables)
7. [Authentication System](#authentication-system)
8. [Key Data Models](#key-data-models)
9. [Integration Checklist](#integration-checklist)

---

## ✅ Correct Supabase Account

### **This is the Production Supabase Account:**

```
URL: https://hygktikkjggkgmlpxefp.supabase.co
ANON_KEY: sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI
SERVICE_ROLE_KEY: sb_secret_qXA2QNAt019Aanc7kaopCg_QSTm7Gzb
```

### **How to Ensure Correct Setup:**

1. **In Mobile App `.env` file:**
   ```
   SUPABASE_URL=https://hygktikkjggkgmlpxefp.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI
   ```

2. **Verify Connection:**
   - In Flutter/React Native, create test call to `/api/services` endpoint
   - Response should return 6 service types (see below)
   - If 401/403 errors → wrong Supabase keys
   - If connection refused → wrong Supabase URL

3. **Test Authentication:**
   ```
   POST /api/auth/signup
   Body: { email, password, name, phone, user_type: 'customer' }
   Success: Returns user object with user_metadata
   ```

---

## 💰 Pricing Structure

Washlee uses a simple, transparent pricing model with TWO delivery speed options:

### **Standard Delivery**
- **Price:** $7.50/kg
- **Duration:** 24-48 hours (next day)
- **Description:** Fast laundry service with standard turnaround
- **Pickup:** Flexible scheduling
- **Delivery:** By 6pm next day
- **Icon:** ✓

### **Express Delivery**
- **Price:** $12.50/kg
- **Duration:** 12-18 hours (same-day/overnight)
- **Description:** Premium fast service for urgent needs
- **Pickup:** Priority scheduling
- **Delivery:** By 8pm same day (if ordered by 9am)
- **Icon:** ⚡

### **Add-ons Available**
- **Hang Dry (Air Dry Service):** +$16.50
- Description: Air-dry instead of machine dry for delicate items

### **Minimum Order**
- **Minimum:** $75 per order
- Equivalent to: ~10kg at standard rate
- Ensures service profitability

### **Protection Plans**
- **Basic:** $0 (no protection)
- **Premium:** +$3.50 flat (damage protection)
- **Premium Plus:** +$8.50 flat (comprehensive protection)

---

## 📱 Complete Ordering Flow (Website)

This is the **exact 7-step flow** the website uses. Mobile app **MUST replicate this**:

### **Step 1: Pickup Location**
- User enters pickup address (REQUIRED)
- Address autocomplete via Google Places API
- Option to add pickup instructions (optional)
- **Pickup spot options:**
  - Front door (default)
  - Back door
  - Side entrance
  - Under mat
  - Custom location

```tsx
{
  pickupAddress: string,           // Full address
  pickupAddressDetails: {           // Parsed address
    street: string,
    city: string,
    state: string,
    zip: string
  },
  pickupSpot: "front-door" | "back-door" | "side-entrance" | "under-mat" | "custom",
  pickupInstructions?: string,     // Optional notes
  addPickupInstructions: boolean
}
```

**Mobile UI Notes:**
- Use Google Places autocomplete (same as website)
- Show address on map (optional but helpful)
- Validate address format before proceeding
- Allow saving address for future orders

---

### **Step 3: Laundry Care Preferences**
- User selects detergent preference (REQUIRED)
- Optional add-ons and special requests
- **Detergent options:**
  - Classic Scented (default)
  - Hypoallergenic
  - Unscented
  - Eco-friendly
  - Custom (user provides text)

```tsx
{
  detergent: "classic-scented" | "hypoallergenic" | "unscented" | "eco-friendly" | "custom",
  detergentCustom?: string,        // If custom detergent
  delicateCycle: boolean,          // Use delicate wash cycle
  hangDry: boolean,                // Air dry instead of machine dry
  returnsOnHangers: boolean,       // Return on hangers (add $1.50)
  additionalRequests: boolean,     // Has special requests
  additionalRequestsText?: string  // User special notes
}
```

**Add-ons:**
- Hang Dry (Air Dry Service): +$16.50

---

### **Step 2: Delivery Speed**
- User chooses delivery timeline
- **Two options:**
  - **Standard:** $7.50/kg (24-48 hours)
  - **Express:** $12.50/kg (12-18 hours)
- **Minimum order:** $75

```tsx
{
  deliverySpeed: "standard" | "express"
}
```

**Pricing Example:**
```
10kg Standard: 10kg × $7.50 = $75.00 (minimum met)
10kg Express: 10kg × $12.50 = $125.00
20kg Standard: 20kg × $7.50 = $150.00
20kg Express: 20kg × $12.50 = $250.00
```

---

### **Step 3: Laundry Care Preferences**
- User selects detergent preference (REQUIRED)
- Optional add-ons (hang dry)
- **Detergent options:**
  - Classic Scented (default)
  - Hypoallergenic
  - Unscented
  - Eco-friendly
  - I Will Provide (custom)

```tsx
{
  detergent: "classic-scented" | "hypoallergenic" | "unscented" | "eco-friendly" | "custom",
  detergentCustom?: string,        // If custom detergent
  hangDry: boolean,                // Air dry instead of machine dry (+$16.50)
  additionalRequests: boolean,     // Has special requests
  additionalRequestsText?: string  // User special notes
}
```

**Add-ons:**
- Hang Dry (Air Dry Service): +$16.50

---

### **Step 4: Weight & Quantity**
- User specifies quantity of laundry
- **Two options:**
  - **Bag Count:** 1-4.5 bags (estimated 10kg per bag)
  - **Custom Weight:** User enters exact kg (10-45 kg)
- **Minimum:** 10kg (1 bag or $75 order minimum)
- **Maximum:** 45kg (4.5 bags)

```tsx
{
  bagCount: number,        // 1-4.5 bags
  customWeight: number,    // kg, 10-45
  estimatedWeight: number  // Final calculated weight
}
```

**Price Calculation Logic:**
- If `bagCount` selected: `weight = bagCount * 10`
- If `customWeight` selected: `weight = customWeight`
- **Total Service Cost** = `(weight * deliverySpeedRate) + addOns`
- Apply minimum $75 if total is less

**Example Calculation:**
```
Delivery Speed: Standard ($7.50/kg)
Weight: 2 bags → 20kg
Base Cost: 20kg × $7.50 = $150.00
Add-ons: Hang Dry = $16.50
Total: $166.50
```

---

### **Step 5: Protection Plan**
- User chooses damage protection level
- **Three options:**
  1. **Basic:** $0 (no protection)
  2. **Premium:** +$3.50 (flat rate)
  3. **Premium Plus:** +$8.50 (flat rate, comprehensive)

```tsx
{
  protectionPlan: "basic" | "premium" | "premium-plus"
}
```

**Example:**
```
Order Total: $166.50
Premium Plan: +$3.50
Final Total: $170.00
```

---

### **Step 6: Pickup Address**
- User enters pickup address (REQUIRED)
- Address autocomplete via Google Places API
- Option to add pickup instructions (optional)
- **Pickup spot options:**
  - Front door (default)
  - Back door
  - Side entrance
  - Under mat
  - Custom location

```tsx
{
  pickupAddress: string,           // Full address
  pickupAddressDetails: {          // Parsed address
    street: string,
    city: string,
    state: string,
    zip: string
  },
  pickupSpot: "front-door" | "back-door" | "side-entrance" | "under-mat" | "custom",
  pickupInstructions?: string      // Optional notes
}
```

---

### **Step 7: Delivery Address**
- User enters delivery address (REQUIRED)
- Address autocomplete via Google Places API
- Can be same as pickup address

```tsx
{
  deliveryAddress: string,         // Full address
  deliveryAddressDetails: {        // Parsed address
    street: string,
    city: string,
    state: string,
    zip: string
  }
}
```

---

### **Order Summary Before Payment**
After Step 7, show:
- Service type & pricing
- Weight/quantity
- All add-ons with costs
- Delivery speed
- Protection plan
- **Order Total** (final price)
- Pickup & delivery addresses
- Estimated pickup time
- Estimated delivery time

**Then proceed to Stripe payment (see API section)**

---

## 🎨 UI Components & Patterns

### **1. Delivery Speed Selection Card**
Website uses reusable `Card` component with:
- Delivery speed icon (✓ or ⚡)
- Speed name (heading)
- Price and time estimate (subtext)
- Brief description
- Click to select (highlighted on selection)

```tsx
// Mobile equivalent structure:
<DeliverySpeedCard
  icon="✓"
  name="Standard Delivery"
  price="$7.50/kg"
  duration="24-48 hours"
  description="Fast and reliable service"
  isSelected={deliverySpeed === 'standard'}
  onSelect={() => setDeliverySpeed('standard')}
/>
```

### **2. Address Input with Autocomplete**
- Text input field with Google Places autocomplete
- Shows predictions as user types
- Click prediction to auto-fill address
- Validation: must match full address format

```tsx
<AddressAutocomplete
  value={pickupAddress}
  onChange={setPickupAddress}
  onPredictionSelect={handleAddressSelected}
  placeholder="Enter pickup address"
/>
```

### **3. Stepper/Progress Indicator**
Website shows step indicator:
- Current step highlighted (green)
- Previous steps checked (✓)
- Future steps grayed out
- Shows 1/7, 2/7, etc.

```tsx
<StepIndicator
  currentStep={currentStep}
  totalSteps={7}
  onStepClick={goToStep}  // Allow clicking previous steps
/>
```

### **4. Price Breakdown Widget**
Show cost composition:
```
Delivery (20kg × $7.50)    $150.00
Add-ons:
  Hang Dry               +$16.50
Protection Plan          +$3.50
─────────────────────────────
Total                    $170.00
```

### **5. Weight Input Pattern**
- Slider input (10-45kg, 0.5kg increments)
- Custom text input with validation
- Shows bag equivalent (weight / 10)

### **6. Modal/Info Dialogs**
Website shows info icons (ⓘ) that open modals explaining:
- Weight: bags vs custom kg
- Delivery speeds and pricing
- Protection plans
- Add-ons (hang dry details)

---

## 🔌 API Endpoints Required

### **1. Create Order**
```
POST /api/orders
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "uid": "{user_id}",
  "email": "user@example.com",
  "customerName": "John Doe",
  "orderTotal": 170.00,
  "bookingData": {
    "deliverySpeed": "standard",
    "pickupAddress": "123 Main St, City, ST 12345",
    "pickupAddressDetails": {
      "street": "123 Main St",
      "city": "City",
      "state": "ST",
      "zip": "12345"
    },
    "pickupSpot": "front-door",
    "pickupInstructions": "Ring doorbell twice",
    "detergent": "classic-scented",
    "hangDry": true,
    "estimatedWeight": 20,
    "protectionPlan": "premium",
    "deliveryAddress": "456 Oak Ave, City, ST 12345",
    "deliveryAddressDetails": {
      "street": "456 Oak Ave",
      "city": "City",
      "state": "ST",
      "zip": "12345"
    }
  }
}

Response:
{
  "data": {
    "id": "{order_id}",
    "orderId": "{order_id}",
    "user_id": "{user_id}",
    "delivery_speed": "standard",
    "total_price": 170.00,
    "status": "pending",
    "created_at": "2026-04-26T...",
    "weight": 20,
    "pickup_address": "123 Main St, City, ST 12345",
    "delivery_address": "456 Oak Ave, City, ST 12345"
  }
}
```

### **2. Get User Orders**
```
GET /api/orders
Headers:
  Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": "{order_id}",
      "delivery_speed": "standard",
      "total_price": 170.00,
      "status": "in_progress",
      "weight": 20,
      "pickup_date": "2026-04-27",
      "delivery_date": "2026-04-28",
      "pickup_address": "...",
      "delivery_address": "...",
      "created_at": "2026-04-26T..."
    },
    // ... more orders
  ]
}
```

### **3. Authentication - Signup**
```
POST /api/auth/signup
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "John Doe",
  "phone": "+1234567890",
  "userType": "customer"
}

Response:
{
  "success": true,
  "user": {
    "id": "{user_id}",
    "email": "user@example.com",
    "user_metadata": {
      "first_name": "John",
      "last_name": "Doe",
      "name": "John Doe",
      "phone": "+1234567890",
      "user_type": "customer",
      "created_at": "2026-04-26T..."
    }
  }
}
```

### **4. Authentication - Login**
```
POST /api/auth/signin
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "securePassword123!"
}

Response:
{
  "success": true,
  "user": {
    "id": "{user_id}",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### **5. Create Stripe Checkout Session**
```
POST /api/stripe/create-checkout-session
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "orderId": "{order_id}",
  "orderTotal": 170.00,
  "successUrl": "your-app://success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "your-app://cancel"
}

Response:
{
  "sessionId": "{stripe_session_id}",
  "clientSecret": "...",
  "publishableKey": "pk_test_..."
}
```

---

## ⚙️ Configuration & Environment Variables

### **Mobile App `.env` File Setup:**

```env
# Supabase (PRODUCTION - VERIFIED CORRECT)
SUPABASE_URL=https://hygktikkjggkgmlpxefp.supabase.co
SUPABASE_ANON_KEY=sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI

# API Base URL
API_BASE_URL=https://washlee.com/api
# For local testing:
# API_BASE_URL=http://localhost:3000/api

# Stripe Keys (Test Environment)
STRIPE_PUBLISHABLE_KEY=pk_test_51StlVu38bIfbwMU6AxPVmVw4LledOTJ81le8rNUeMH9cnvRDQ909bJ42iSWUFxxDvdkkMy5GkVB1yKbRXHatAd5y00epXjzqjo

# Google APIs
GOOGLE_MAPS_API_KEY=AIzaSyDhKr9c9U9eftZeFzuKMVrd_JHxRYg21-E
GOOGLE_PLACES_API_KEY=AIzaSyDhKr9c9U9eftZeFzuKMVrd_JHxRYg21-E

# App Configuration
APP_NAME=Washlee
APP_VERSION=1.0.0
ENVIRONMENT=production
```

### **How to Verify Configuration is Correct:**

1. **Test Supabase Connection:**
   ```
   POST /api/auth/signup
   Expected: 200 OK with user object
   If 401/403: Wrong Supabase keys
   ```

2. **Test Services Endpoint:**
   ```
   GET /api/services
   Expected: Array of 6 services
   If 404: Wrong API base URL
   ```

3. **Test Google Places:**
   ```
   Make address autocomplete request
   Expected: List of address suggestions
   If 403: Wrong Google Maps API key
   ```

---

## 🔐 Authentication System

### **How Website Auth Works:**

1. **Email/Password Signup:**
   - Creates Supabase Auth user
   - Stores metadata: name, phone, address, user_type
   - Creates user profile record

2. **Session Management:**
   - Supabase manages JWT tokens
   - Auto-refresh on expiry
   - Persist session in localStorage/secure storage

3. **User Types:**
   - `customer`: Can place orders
   - `pro`: Can accept jobs
   - `admin`: Admin panel access

### **Mobile Implementation:**

```dart
// Flutter example structure
class AuthService {
  final SupabaseClient supabase;
  
  Future<void> signup({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    // 1. Create Supabase Auth user
    final response = await supabase.auth.signUp(
      email: email,
      password: password,
      data: {
        'name': name,
        'phone': phone,
        'user_type': 'customer',
      },
    );
    
    // 2. User is now authenticated
    // 3. Session auto-managed by Supabase
  }
  
  Future<void> login({
    required String email,
    required String password,
  }) async {
    await supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }
}
```

---

## 📊 Key Data Models

### **Order Model:**
```typescript
interface Order {
  id: string                    // UUID
  user_id: string              // FK to auth.users
  delivery_speed: string       // standard, express
  total_price: number          // Final amount in USD
  status: string               // pending, confirmed, picked_up, in_progress, delivered
  
  // Pickup info
  pickup_address: string       // Full address
  pickup_date: string          // ISO date
  pickup_time: string          // HH:MM format
  pickup_spot: string          // front-door, back-door, etc.
  pickup_instructions: string  // Optional notes
  
  // Delivery info
  delivery_address: string     // Full address
  delivery_date: string        // ISO date
  delivery_time: string        // Estimated HH:MM
  
  // Laundry details
  weight: number              // kg
  estimatedWeight: number     // Calculated weight
  detergent_type: string      // classic-scented, hypoallergenic, unscented, eco-friendly, custom
  hang_dry: boolean           // Air dry? (+$16.50)
  additionalRequests: boolean // Has special requests?
  additionalRequestsText?: string
  
  // Protection
  protection_plan: string     // basic, premium, premium-plus
  
  // Payment
  stripe_payment_intent_id: string
  payment_status: string      // pending, succeeded, failed
  
  // Timestamps
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
}
```

### **User Model:**
```typescript
interface UserProfile {
  id: string                  // UUID, matches auth.users.id
  email: string              // From auth.users.email
  first_name: string
  last_name: string
  phone: string
  address: string            // Default address
  
  user_type: 'customer' | 'pro' | 'admin'
  
  // Customer specific
  subscription_plan?: string
  subscription_status?: string
  loyalty_points?: number
  
  // Pro specific (if user_type='pro')
  pro_status?: 'pending' | 'approved' | 'rejected'
  avg_rating?: number
  total_reviews?: number
  
  created_at: string
  updated_at: string
}
```

---

## ✅ Integration Checklist

Use this checklist when building mobile app features:

### **Phase 1: Authentication**
- [ ] Signup flow implemented
- [ ] Login flow implemented
- [ ] Session persistence (token storage)
- [ ] Logout functionality
- [ ] Password reset
- [ ] Test with Supabase URL: `https://hygktikkjggkgmlpxefp.supabase.co`
- [ ] Test with Supabase ANON key

### **Phase 2: Ordering - Steps 1-3**
- [ ] Step 1: Delivery speed selection (Standard $7.50/kg vs Express $12.50/kg)
- [ ] Step 2: Pickup address (with Google Places autocomplete)
- [ ] Step 3: Laundry care preferences & detergent selection
- [ ] Show running price total
- [ ] Validate inputs before proceeding

### **Phase 3: Ordering - Steps 4-5**
- [ ] Step 4: Weight/bag count selection (10-45kg range)
- [ ] Step 5: Protection plan selection (basic, premium, premium-plus)
- [ ] Dynamic price recalculation
- [ ] Apply minimum order ($75) if needed

### **Phase 4: Ordering - Steps 6-7**
- [ ] Step 6: Pickup address (with special instructions)
- [ ] Step 7: Delivery address (with autocomplete)
- [ ] Show order summary screen
- [ ] Display final total with all costs

### **Phase 5: Payment & Order Creation**
- [ ] Create order via `/api/orders` POST
- [ ] Send correct booking data structure
- [ ] Get Stripe session from `/api/stripe/create-checkout-session`
- [ ] Initialize Stripe payment sheet
- [ ] Handle payment success/failure
- [ ] Show order confirmation
- [ ] Save order ID for tracking

### **Phase 6: Order Management**
- [ ] Fetch user's orders from `/api/orders` GET
- [ ] Display active orders
- [ ] Display order history
- [ ] Show order status (pending, picked_up, in_progress, delivered)
- [ ] Show weight, price, and timing
- [ ] Allow order cancellation (if status permits)

### **Phase 7: UI Polish**
- [ ] Match website color scheme (teal #48C9B0, dark #1f2d2b)
- [ ] Use website's icon set (Lucide React icons)
- [ ] Implement step progress indicators (1/7, 2/7, etc)
- [ ] Add loading states
- [ ] Add error handling & messaging
- [ ] Mobile-responsive layout
- [ ] Dark mode support (optional)

### **Phase 8: Testing**
- [ ] Test signup/login flows
- [ ] Complete order flow (all 7 steps)
- [ ] Test pricing calculations ($7.50 and $12.50 rates)
- [ ] Test minimum order enforcement ($75)
- [ ] Test payment processing
- [ ] Test with real and test card numbers
- [ ] Check order creation in Supabase
- [ ] Verify confirmation email sent

### **Phase 9: Deployment**
- [ ] Use production Supabase URL
- [ ] Use production Stripe publishable key
- [ ] Use production API base URL
- [ ] Set up app signing (iOS/Android)
- [ ] Test on real devices
- [ ] Set up app store listing
- [ ] Create privacy policy & terms

---

## 🎯 Quick Start: First API Call

To verify everything is working, make this test request from your mobile app:

```bash
# Test Order Creation Endpoint
curl -X POST \
  "https://washlee.com/api/orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user-id",
    "email": "test@washlee.com",
    "customerName": "Test User",
    "orderTotal": 170.00,
    "bookingData": {
      "deliverySpeed": "standard",
      "estimatedWeight": 20,
      "hangDry": true,
      "protectionPlan": "premium"
    }
  }'

# Expected Response:
{
  "data": {
    "id": "order-id",
    "user_id": "user-id",
    "delivery_speed": "standard",
    "total_price": 170.00,
    "status": "pending"
  }
}
```
  ]
}
```

If this works → Your mobile app is ready to integrate with Washlee website services!

---

## 📞 Support & Troubleshooting

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| 401/403 Auth errors | Check Supabase keys in .env |
| 404 on API calls | Verify API_BASE_URL is correct |
| Address autocomplete not working | Verify Google Places API key |
| Orders not appearing | Check user_id is being sent to API |
| Payment failed | Verify Stripe publishable key |
| Wrong pricing shown | Verify: Standard $7.50/kg, Express $12.50/kg, Min $75 |

### **Debug Endpoints:**
- Auth test: `POST /api/auth/signup` 
- Order creation: `POST /api/orders` (requires authentication)
- User orders: `GET /api/orders` (requires authentication)

---

## 📝 Summary: What to Transfer from Website to App

### **✅ Correct Pricing Structure:**
1. **Standard Delivery:** $7.50/kg (24-48 hours)
2. **Express Delivery:** $12.50/kg (12-18 hours)
3. **Minimum Order:** $75
4. **Hang Dry Add-on:** +$16.50
5. **Protection Plans:** Basic ($0), Premium (+$3.50), Premium Plus (+$8.50)

### **✅ Complete Ordering Flow (7 Steps):**
1. Step 1: Delivery Speed (Standard vs Express)
2. Step 2: Pickup Address
3. Step 3: Laundry Care & Detergent
4. Step 4: Weight/Bag Count
5. Step 5: Protection Plan
6. Step 6: Pickup Address & Instructions
7. Step 7: Delivery Address

### **✅ Transfer These API Endpoints:**
- POST /api/orders (create order with booking data)
- GET /api/orders (fetch user orders)
- POST /api/auth/signup (sign up)
- POST /api/auth/signin (sign in)
- POST /api/stripe/create-checkout-session (payment)

### **✅ Transfer This UI Pattern:**
- Delivery speed selection cards (not service cards)
- Address autocomplete with Google Places
- 7-step progress indicator
- Weight slider (10-45kg) + custom input
- Price breakdown widget
- Modal info dialogs

### **⚠️ Ensure Correct Configuration:**
```
SUPABASE_URL=https://hygktikkjggkgmlpxefp.supabase.co
SUPABASE_ANON_KEY=sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI
```

### **❌ DO NOT Transfer:**
- Service selection step (removed from flow)
- Multiple service types ($3-$8/kg pricing)
- Percentage-based protection plans
- Add-ons like stain treatment, delicates, comforter service
- Services endpoint API call

---

**Document Version:** 2.0 (Updated)  
**Last Updated:** April 26, 2026  
**Status:** Corrected - Ready for Mobile App Implementation
