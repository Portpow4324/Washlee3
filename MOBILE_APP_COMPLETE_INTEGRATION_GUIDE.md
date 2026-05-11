# 📱 Mobile App - Complete Integration Guide
## Dashboard, Ordering, Stripe Payments & Backend Setup

**Created:** April 29, 2026  
**Purpose:** Comprehensive guide to implement customer dashboard, ordering flow, Stripe payments, and backend integration for iOS/Android mobile apps

---

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Authentication System](#authentication-system)
3. [Ordering Flow](#ordering-flow)
4. [Stripe Payment Integration](#stripe-payment-integration)
5. [Customer Dashboard](#customer-dashboard)
6. [Backend API Endpoints](#backend-api-endpoints)
7. [Database Schema](#database-schema)
8. [Subscription Plans](#subscription-plans)
9. [Error Handling & Edge Cases](#error-handling--edge-cases)
10. [Implementation Checklist](#implementation-checklist)

---

## 🏗️ Architecture Overview

### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (iOS/Android)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐       ┌──────────────────┐            │
│  │  Auth Screen     │       │  Booking Screen  │            │
│  │  (Login/Signup)  │──────→│  (7 Steps)       │            │
│  └──────────────────┘       └──────────────────┘            │
│         │                          │                        │
│         ↓                          ↓                        │
│  ┌──────────────────┐       ┌──────────────────┐            │
│  │ Auth Context     │       │  Order State     │            │
│  │ (Token + User)   │       │  (Booking Data)  │            │
│  └──────────────────┘       └──────────────────┘            │
│         │                          │                        │
│         └──────────┬───────────────┘                        │
│                    ↓                                        │
│  ┌──────────────────────────────────┐                      │
│  │  API Client (Axios/Fetch)        │                      │
│  │  - Auth Headers                  │                      │
│  │  - Error Handling                │                      │
│  │  - Retry Logic                   │                      │
│  └──────────────────────────────────┘                      │
│                    ↓                                        │
└─────────────────────────────────────────────────────────────┘
              ↓              ↓              ↓
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │  Auth API    │ │ Orders API   │ │ Stripe API   │
      │  (Supabase)  │ │ (Next.js)    │ │ (Checkout)   │
      └──────────────┘ └──────────────┘ └──────────────┘
              ↓              ↓              ↓
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │  Auth Tokens │ │ Supabase DB  │ │ Stripe SDK   │
      │  + Sessions  │ │ (Orders)     │ │ (Payment)    │
      └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔐 Authentication System

### Login/Signup Flow

```
1. User enters email/password
         ↓
2. POST /api/auth/signin (or signup)
         ↓
3. Supabase validates & creates session
         ↓
4. Response: { access_token, refresh_token, user }
         ↓
5. Store tokens securely:
   - iOS: Keychain
   - Android: EncryptedSharedPreferences
         ↓
6. Add to request headers: Authorization: Bearer {access_token}
         ↓
7. Save user to local state for UI
```

### Implementation (Flutter/React Native Example)

```dart
// lib/services/auth_service.dart
class AuthService {
  final SupabaseClient supabase;
  final SecureStorage secureStorage;
  
  Future<void> signup({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    try {
      final response = await supabase.auth.signUp(
        email: email,
        password: password,
        data: {
          'name': name,
          'phone': phone,
          'user_type': 'customer',
        },
      );
      
      // Save tokens securely
      await secureStorage.write(
        key: 'access_token',
        value: response.session?.accessToken ?? '',
      );
      
      // Emit user state
      _userController.add(response.user);
    } catch (e) {
      rethrow;
    }
  }
  
  Future<void> login({
    required String email,
    required String password,
  }) async {
    final response = await supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
    
    // Save tokens
    await secureStorage.write(
      key: 'access_token',
      value: response.session?.accessToken ?? '',
    );
    
    _userController.add(response.user);
  }
  
  Future<void> logout() async {
    await supabase.auth.signOut();
    await secureStorage.delete(key: 'access_token');
    _userController.add(null);
  }
}
```

### API Endpoints

#### Signup
```
POST /api/auth/signup
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "phone": "+1234567890",
  "userType": "customer"
}

Response (201):
{
  "success": true,
  "user": {
    "id": "{user_id}",
    "email": "user@example.com",
    "user_metadata": {
      "name": "John Doe",
      "phone": "+1234567890",
      "user_type": "customer"
    }
  }
}
```

#### Login
```
POST /api/auth/signin
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "success": true,
  "user": {
    "id": "{user_id}",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "refresh_token_value",
    "expires_in": 3600
  }
}
```

---

## 🛒 Ordering Flow

### 7-Step Booking Process

The mobile app follows the exact same 7-step flow as the website:

```
Step 1: Delivery Speed
  ├─ Standard ($7.50/kg, 24-48 hours)
  └─ Express ($12.50/kg, 12-18 hours)
       ↓
Step 2: Pickup Address
  ├─ Google Places Autocomplete
  ├─ Address Validation
  └─ Special Instructions (optional)
       ↓
Step 3: Laundry Care & Detergent
  ├─ Detergent Choice (Classic, Hypoallergenic, Eco, Custom)
  └─ Add-ons (Hang Dry +$16.50)
       ↓
Step 4: Weight/Bag Count
  ├─ Slider (10-45kg)
  └─ Custom Text Input
       ↓
Step 5: Protection Plan
  ├─ Basic ($0)
  ├─ Premium (+$3.50)
  └─ Premium Plus (+$8.50)
       ↓
Step 6: Pickup Details
  └─ Confirm Address & Instructions
       ↓
Step 7: Delivery Address
  ├─ Google Places Autocomplete
  └─ Validation
       ↓
Order Summary & Review
  └─ Confirm All Details & Total Price
       ↓
Proceed to Payment (Stripe)
```

### State Management

```dart
// lib/models/booking_state.dart
class BookingState {
  // Step 1: Delivery Speed
  DeliverySpeed deliverySpeed = DeliverySpeed.standard; // $7.50/kg
  
  // Step 2: Pickup
  String pickupAddress = '';
  String pickupInstructions = '';
  PickupSpot pickupSpot = PickupSpot.frontDoor;
  
  // Step 3: Care
  String detergent = 'classic-scented';
  String? detergentCustom;
  bool hangDry = false;
  String additionalRequests = '';
  
  // Step 4: Weight
  double weight = 10.0; // kg
  int bagCount = 1; // weight / 10
  
  // Step 5: Protection
  ProtectionPlan protectionPlan = ProtectionPlan.basic;
  
  // Step 6: Pickup (confirm)
  
  // Step 7: Delivery
  String deliveryAddress = '';
  
  // Calculated
  double get basePrice => weight * deliverySpeed.rate;
  double get hangDryPrice => hangDry ? 16.50 : 0;
  double get protectionPrice => protectionPlan.price;
  double get total => basePrice + hangDryPrice + protectionPrice;
}

enum DeliverySpeed {
  standard(7.50),
  express(12.50);
  
  final double rate;
  const DeliverySpeed(this.rate);
}

enum ProtectionPlan {
  basic(0),
  premium(3.50),
  premiumPlus(8.50);
  
  final double price;
  const ProtectionPlan(this.price);
}
```

### Order Creation API Call

```
POST /api/orders
Headers:
  Authorization: Bearer {access_token}
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

Response (201):
{
  "data": {
    "id": "{order_id}",
    "user_id": "{user_id}",
    "delivery_speed": "standard",
    "total_price": 170.00,
    "status": "pending",
    "weight": 20,
    "created_at": "2026-04-29T...",
    "pickup_address": "123 Main St, City, ST 12345",
    "delivery_address": "456 Oak Ave, City, ST 12345"
  }
}
```

---

## 💳 Stripe Payment Integration

### Complete Payment Flow

```
1. User completes booking form
   └─ Order data validated
        ↓
2. Order created: POST /api/orders
   └─ Returns orderId
        ↓
3. Create Stripe Checkout Session: POST /api/stripe/create-checkout-session
   └─ Returns sessionId & clientSecret
        ↓
4. Initialize Stripe Payment Sheet
   └─ Configure with sessionId
        ↓
5. User enters payment details
   └─ Card info handled by Stripe (PCI compliant)
        ↓
6. Complete payment
   └─ Stripe processes & charges card
        ↓
7. Webhook fires: checkout.session.completed
   └─ Backend updates order status
        ↓
8. Success page/redirect
   └─ Show order confirmation
```

### Stripe SDK Setup

#### iOS (Swift)

```swift
import StripePaymentSheet

class PaymentService {
    let stripePublishableKey = "pk_test_YOUR_KEY"
    
    func setupPaymentSheet(
        clientSecret: String,
        customerEmail: String
    ) -> PaymentSheet? {
        var configuration = PaymentSheet.Configuration()
        configuration.merchantDisplayName = "Washlee"
        configuration.customer = .init(
            id: userId,
            ephemeralKeySecret: ephemeralKey
        )
        configuration.returnURL = "washlee://payment-return"
        
        return PaymentSheet(paymentIntentClientSecret: clientSecret, configuration: configuration)
    }
    
    func presentPaymentSheet(
        amount: Double,
        orderId: String
    ) {
        // Present Stripe Payment Sheet to user
        // Handles payment details securely
        // Returns success/failure
    }
}
```

#### Android (Kotlin)

```kotlin
import com.stripe.android.PaymentConfiguration
import com.stripe.android.payments.PaymentFlowResult
import com.stripe.android.payments.paymentlauncher.PaymentLauncher

class PaymentService {
    fun setupStripe() {
        PaymentConfiguration.init(
            context,
            publishableKey = "pk_test_YOUR_KEY"
        )
    }
    
    fun launchPaymentSheet(
        clientSecret: String,
        customerEmail: String
    ) {
        paymentLauncher.presentPaymentSheet(
            PaymentSheet.ClientSecret(clientSecret),
            configuration = PaymentSheetConfiguration(
                merchantDisplayName = "Washlee",
                customer = PaymentSheet.CustomerConfiguration(
                    id = userId,
                    ephemeralKeySecret = ephemeralKey
                ),
                returnUrl = "washlee://payment-return"
            )
        )
    }
}
```

### Create Checkout Session API

```
POST /api/stripe/create-checkout-session
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Body:
{
  "orderId": "{order_id}",
  "orderTotal": 170.00,
  "successUrl": "washlee://payment-success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "washlee://payment-cancel"
}

Response (200):
{
  "sessionId": "cs_test_...",
  "clientSecret": "pi_test_...",
  "publishableKey": "pk_test_..."
}
```

### Complete Payment Example (React Native)

```javascript
// app/services/PaymentService.js
import { stripe } from '@react-native-stripe-sdk';

export const PaymentService = {
  async createCheckoutSession(orderId, orderTotal) {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        orderTotal,
        successUrl: 'washlee://payment-success',
        cancelUrl: 'washlee://payment-cancel',
      }),
    });
    
    const data = await response.json();
    return data;
  },
  
  async presentPaymentSheet(clientSecret) {
    const { error, paymentIntent } = await stripe.presentPaymentSheet();
    
    if (error) {
      console.error('Payment failed:', error);
      return null;
    }
    
    return paymentIntent;
  },
};
```

### Webhook Handler (Backend)

The backend webhook automatically:
1. Receives payment completion event from Stripe
2. Verifies webhook signature
3. Updates order status to "confirmed"
4. Stores payment details (sessionId, paymentId)
5. Triggers email confirmation
6. Auto-assigns order to available pro

```javascript
// backend/routes/webhook.routes.js
async function handleCheckoutSessionCompleted(session) {
  const uid = session.metadata.userId;
  const orderId = session.metadata.orderId;
  
  // Update order status
  await updateOrderStatus(orderId, 'confirmed', 'Payment received');
  
  // Store payment info
  await savePaymentInfo(orderId, {
    stripeSessionId: session.id,
    paymentIntentId: session.payment_intent,
    amountPaid: session.amount_total / 100,
  });
  
  // Send confirmation email
  await sendEmail(session.customer_email, 'order_confirmation', {
    orderId,
    amount: session.amount_total / 100,
  });
  
  // Assign to available pro (background job)
  scheduleProAssignment(orderId);
}
```

---

## 📊 Customer Dashboard

### Dashboard Structure

The mobile dashboard mirrors the website but optimized for mobile:

```
┌──────────────────────────────────┐
│         Dashboard Home           │
├──────────────────────────────────┤
│  👤 User Profile Section         │
│  ├─ Name                         │
│  ├─ Email                        │
│  └─ Phone                        │
├──────────────────────────────────┤
│  📊 Quick Stats                  │
│  ├─ Active Orders (count)        │
│  ├─ Completed Orders (count)     │
│  ├─ Total Spent (lifetime $)     │
│  └─ Savings (loyalty/discounts)  │
├──────────────────────────────────┤
│  🎯 Quick Actions                │
│  ├─ [Book New Order] Button      │
│  ├─ [View All Orders] Button     │
│  └─ [Manage Account] Button      │
├──────────────────────────────────┤
│  📦 Recent Orders (3-5)          │
│  ├─ Order #1 [>]                 │
│  ├─ Order #2 [>]                 │
│  └─ Order #3 [>]                 │
└──────────────────────────────────┘
```

### Dashboard Data Structure

```dart
class DashboardData {
  final User user;
  final List<Order> activeOrders;
  final List<Order> completedOrders;
  final double totalSpent;
  final double savingsAmount;
  
  // Stats
  int get activeOrderCount => activeOrders.length;
  int get completedOrderCount => completedOrders.length;
  
  // Recently
  List<Order> get recentOrders => [
    ...activeOrders.take(3),
    ...completedOrders.take(3),
  ].sorted((a, b) => b.createdAt.compareTo(a.createdAt));
}

class Order {
  final String id;
  final String status; // pending, confirmed, picked_up, in_washing, delivered
  final double totalPrice;
  final double weight; // kg
  final String deliverySpeed; // standard, express
  final DateTime createdAt;
  final DateTime? estimatedDeliveryDate;
  final String pickupAddress;
  final String deliveryAddress;
  final Map<String, dynamic>? bookingData;
}
```

### API Endpoints for Dashboard

#### Get Dashboard Metrics
```
GET /api/dashboard/metrics
Headers:
  Authorization: Bearer {access_token}

Response (200):
{
  "user": {
    "id": "{user_id}",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "stats": {
    "activeOrders": 2,
    "completedOrders": 8,
    "totalSpent": 456.75,
    "savingsAmount": 45.68
  },
  "recentOrders": [
    {
      "id": "order_123",
      "status": "in_washing",
      "totalPrice": 75.00,
      "weight": 10,
      "deliverySpeed": "standard",
      "createdAt": "2026-04-28T10:00:00Z",
      "estimatedDeliveryDate": "2026-04-29T18:00:00Z",
      "pickupAddress": "123 Main St, City, ST 12345",
      "deliveryAddress": "456 Oak Ave, City, ST 12345"
    }
  ]
}
```

#### Get All User Orders
```
GET /api/orders?status=all&limit=20&offset=0
Headers:
  Authorization: Bearer {access_token}

Response (200):
{
  "data": [
    {
      "id": "order_123",
      "status": "delivered",
      "totalPrice": 75.00,
      "weight": 10,
      "deliverySpeed": "standard",
      "createdAt": "2026-04-28T10:00:00Z",
      "pickupAddress": "123 Main St",
      "deliveryAddress": "456 Oak Ave"
    },
    // ... more orders
  ],
  "total": 8,
  "hasMore": false
}
```

#### Get Order Details
```
GET /api/orders/{orderId}
Headers:
  Authorization: Bearer {access_token}

Response (200):
{
  "data": {
    "id": "order_123",
    "status": "delivered",
    "totalPrice": 75.00,
    "weight": 10,
    "deliverySpeed": "standard",
    "createdAt": "2026-04-28T10:00:00Z",
    "estimatedDeliveryDate": "2026-04-29T18:00:00Z",
    "pickupAddress": "123 Main St, City, ST 12345",
    "deliveryAddress": "456 Oak Ave, City, ST 12345",
    "bookingData": {
      "detergent": "classic-scented",
      "hangDry": true,
      "protectionPlan": "premium"
    },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2026-04-28T10:00:00Z",
        "message": "Order pending payment"
      },
      {
        "status": "confirmed",
        "timestamp": "2026-04-28T10:05:00Z",
        "message": "Payment received, order confirmed"
      },
      {
        "status": "picked_up",
        "timestamp": "2026-04-28T14:00:00Z",
        "message": "Laundry picked up"
      },
      {
        "status": "in_washing",
        "timestamp": "2026-04-28T15:00:00Z",
        "message": "Laundry being processed"
      },
      {
        "status": "delivered",
        "timestamp": "2026-04-29T18:00:00Z",
        "message": "Delivered to customer"
      }
    ]
  }
}
```

### Dashboard Implementation

```dart
// lib/screens/dashboard_screen.dart
class DashboardScreen extends StatefulWidget {
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late DashboardData dashboardData;
  bool loading = true;
  
  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }
  
  Future<void> _loadDashboard() async {
    try {
      setState(() => loading = true);
      
      final response = await http.get(
        Uri.parse('${API_BASE}/api/dashboard/metrics'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          dashboardData = DashboardData.fromJson(data);
          loading = false;
        });
      }
    } catch (e) {
      setState(() => loading = false);
      showErrorSnackbar('Failed to load dashboard');
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    return Scaffold(
      appBar: AppBar(title: Text('Dashboard')),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          // User profile
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(dashboardData.user.name, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text(dashboardData.user.email),
                ],
              ),
            ),
          ),
          
          // Quick stats
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            children: [
              StatCard(label: 'Active Orders', value: dashboardData.activeOrderCount.toString()),
              StatCard(label: 'Completed', value: dashboardData.completedOrderCount.toString()),
              StatCard(label: 'Total Spent', value: '\$${dashboardData.totalSpent.toStringAsFixed(2)}'),
              StatCard(label: 'Savings', value: '\$${dashboardData.savingsAmount.toStringAsFixed(2)}'),
            ],
          ),
          
          // Quick actions
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/booking'),
            child: Text('Book New Order'),
          ),
          
          // Recent orders
          SizedBox(height: 16),
          Text('Recent Orders', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ListView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: dashboardData.recentOrders.length,
            itemBuilder: (context, index) {
              final order = dashboardData.recentOrders[index];
              return OrderListTile(
                order: order,
                onTap: () => _viewOrderDetails(order.id),
              );
            },
          ),
        ],
      ),
    );
  }
  
  void _viewOrderDetails(String orderId) {
    Navigator.pushNamed(context, '/order-details', arguments: orderId);
  }
}
```

---

## 🔌 Backend API Endpoints

### Authentication Endpoints

```
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/logout
POST /api/auth/refresh-token
GET  /api/auth/me (current user)
```

### Orders Endpoints

```
POST   /api/orders              # Create new order
GET    /api/orders              # Get user's orders (with filters)
GET    /api/orders/{orderId}    # Get specific order
PATCH  /api/orders/{orderId}    # Update order
DELETE /api/orders/{orderId}    # Cancel order (soft delete)
POST   /api/orders/{orderId}/review  # Submit order review
```

### Payment Endpoints

```
POST /api/stripe/create-checkout-session  # Get checkout URL
POST /api/webhooks/stripe                 # Stripe webhook
GET  /api/payment-status/{sessionId}      # Check payment status
```

### Dashboard Endpoints

```
GET /api/dashboard/metrics               # Dashboard home data
GET /api/dashboard/orders/active         # Active orders only
GET /api/dashboard/orders/completed      # Completed orders only
GET /api/dashboard/spending/summary      # Spending analytics
```

### Subscription Endpoints

```
GET  /api/subscriptions/plans            # Available plans
POST /api/subscriptions/create-checkout  # Upgrade subscription
GET  /api/subscriptions/current          # Current subscription
POST /api/subscriptions/cancel           # Cancel subscription
```

---

## 📊 Database Schema

### Orders Table (Supabase)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Pricing
  total_price DECIMAL(10, 2) NOT NULL,
  weight_kg DECIMAL(8, 2) NOT NULL,
  
  -- Delivery
  delivery_speed VARCHAR(20) NOT NULL, -- 'standard', 'express'
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  
  -- Laundry details
  items JSONB, -- { weight: 20, detergent: "...", hangDry: true, ... }
  booking_data JSONB, -- Full booking details
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- pending, confirmed, picked_up, in_washing, delivered, cancelled
  
  -- Payment
  stripe_session_id VARCHAR(255),
  stripe_payment_id VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending',
  
  -- Pro assignment
  pro_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  estimated_delivery TIMESTAMP,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at DESC)
);
```

### Order Items (Detail)

```javascript
// items JSON structure
{
  "weight": 20,                    // kg
  "detergent": "classic-scented",
  "hangDry": true,
  "delicateCycle": false,
  "protectionPlan": "premium",
  "deliverySpeed": "standard",
  "additionalRequests": "No bleach on colors"
}
```

### Users Table (Supabase Auth Extensions)

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  
  -- Personal
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  date_of_birth DATE,
  
  -- Address
  default_address_line1 TEXT,
  default_address_line2 TEXT,
  default_city VARCHAR(100),
  default_state VARCHAR(50),
  default_postcode VARCHAR(20),
  
  -- Subscription
  subscription_plan VARCHAR(50), -- 'none', 'starter', 'professional', 'washly'
  subscription_status VARCHAR(50), -- 'active', 'cancelled', 'paused'
  subscription_expires_at TIMESTAMP,
  
  -- Loyalty
  loyalty_points INT DEFAULT 0,
  loyalty_tier VARCHAR(50), -- 'bronze', 'silver', 'gold', 'platinum'
  
  -- Preferences
  preferred_detergent VARCHAR(100),
  marketing_emails BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💳 Subscription Plans

### Plan Structure

```typescript
interface SubscriptionPlan {
  id: string;           // 'starter', 'professional', 'washly'
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  discountPercentage: number;  // e.g., 15% for starter
}

const plans: SubscriptionPlan[] = [
  {
    id: 'none',
    name: 'Pay Per Order',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['No subscription fee', 'Pay only for orders'],
    discountPercentage: 0,
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      '15% discount on all services',
      'Unlimited pickups & deliveries',
      'Priority support',
      'Free basic protection',
    ],
    discountPercentage: 15,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 59,
    annualPrice: 590,
    features: [
      '20% discount on all services',
      'Unlimited pickups & deliveries',
      'Priority support + Express lane',
      'Free premium protection',
      'Monthly loyalty bonus',
    ],
    discountPercentage: 20,
  },
  {
    id: 'washly',
    name: 'Washly Premium',
    monthlyPrice: 99,
    annualPrice: 990,
    features: [
      '25% discount on all services',
      'Unlimited pickups & deliveries',
      '24/7 dedicated support',
      'Free premium+ protection',
      'Triple loyalty points',
      'Monthly laundry credit',
      'VIP member benefits',
    ],
    discountPercentage: 25,
  },
];
```

### Subscription Endpoints

```
GET /api/subscriptions/plans
Response:
{
  "plans": [
    { id: "starter", name: "Starter", price: 29, ... },
    { id: "professional", name: "Professional", price: 59, ... },
    { id: "washly", name: "Washly Premium", price: 99, ... }
  ]
}

POST /api/subscriptions/create-checkout-session
Body: { plan: "starter" }
Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/...",
  "clientSecret": "pi_test_..."
}

GET /api/subscriptions/current
Response:
{
  "plan": "starter",
  "status": "active",
  "expiresAt": "2026-05-29T...",
  "renewalDate": "2026-05-29T...",
  "discount": 15
}
```

---

## ⚠️ Error Handling & Edge Cases

### Common Errors & Solutions

#### 1. Authentication Errors

```
Error: 401 Unauthorized
Cause: Invalid or expired token

Solution:
if (response.status === 401) {
  // Try to refresh token
  const newToken = await refreshAccessToken();
  if (newToken) {
    // Retry request with new token
    return retryRequest(originalRequest, newToken);
  } else {
    // Logout user
    logout();
    navigateToLogin();
  }
}
```

#### 2. Network Errors

```
Error: Network timeout
Cause: Slow internet or server unreachable

Solution:
const maxRetries = 3;
const retryDelay = 1000; // 1 second

async function fetchWithRetry(url, options, retries = 0) {
  try {
    const response = await fetch(url, { timeout: 10000, ...options });
    return response;
  } catch (error) {
    if (retries < maxRetries) {
      await new Promise(r => setTimeout(r, retryDelay));
      return fetchWithRetry(url, options, retries + 1);
    }
    throw error;
  }
}
```

#### 3. Payment Errors

```
Error: Payment declined
Cause: Card validation failed, insufficient funds

Solution:
try {
  const result = await stripe.presentPaymentSheet();
  if (result.error) {
    showErrorDialog(
      'Payment Failed',
      result.error.localizedMessage ??
      'Your payment could not be processed. Please try again or use a different payment method.'
    );
    return;
  }
} catch (e) {
  showErrorDialog('Payment Error', 'An unexpected error occurred during payment.');
}
```

#### 4. Address Validation

```
Error: Invalid address
Cause: User entered address not formatted correctly

Solution:
// Use Google Places Autocomplete
// Only allow verified addresses
// Validate before submission

if (!selectedAddress || !selectedAddress.id) {
  showError('Please select a valid address from the suggestions');
  return;
}
```

#### 5. Weight Validation

```
Error: Weight out of range
Cause: User entered 0kg or >45kg

Solution:
const MIN_WEIGHT = 10;
const MAX_WEIGHT = 45;

if (weight < MIN_WEIGHT) {
  showError(`Minimum weight is ${MIN_WEIGHT}kg`);
  return;
}
if (weight > MAX_WEIGHT) {
  showError(`Maximum weight is ${MAX_WEIGHT}kg`);
  return;
}
```

#### 6. Minimum Order Value

```
Error: Order total below minimum
Cause: Total price < $75

Solution:
const MIN_ORDER = 75;

if (orderTotal < MIN_ORDER) {
  showWarning(
    `Minimum order is $${MIN_ORDER}. Current total: $${orderTotal.toFixed(2)}`
  );
  // Suggest increasing weight
  return;
}
```

---

## ✅ Implementation Checklist

### Phase 1: Setup & Foundation
- [ ] Configure Supabase project
- [ ] Set up Stripe account & get keys
- [ ] Configure environment variables (.env)
- [ ] Set up secure storage (Keychain/EncryptedSharedPreferences)
- [ ] Create API client with auth interceptor

### Phase 2: Authentication
- [ ] Implement signup screen
- [ ] Implement login screen
- [ ] Test with Supabase credentials
- [ ] Token storage & refresh logic
- [ ] Session persistence (survives app restart)
- [ ] Logout functionality

### Phase 3: Booking Flow (7 Steps)
- [ ] Step 1: Delivery speed selection
- [ ] Step 2: Pickup address (with Google Places)
- [ ] Step 3: Laundry care & detergent
- [ ] Step 4: Weight/bag count
- [ ] Step 5: Protection plan
- [ ] Step 6: Pickup address confirmation
- [ ] Step 7: Delivery address
- [ ] Order summary screen
- [ ] State management between steps

### Phase 4: Order Creation & Validation
- [ ] Validate all booking data before submission
- [ ] Create order: POST /api/orders
- [ ] Handle errors (network, validation, etc.)
- [ ] Store orderId for payment
- [ ] Add loading indicators

### Phase 5: Stripe Payment Integration
- [ ] Configure Stripe SDK (iOS/Android)
- [ ] Create checkout session: POST /api/stripe/create-checkout-session
- [ ] Initialize payment sheet with clientSecret
- [ ] Handle payment success/failure
- [ ] Parse success URL parameters
- [ ] Store transaction details

### Phase 6: Customer Dashboard
- [ ] Fetch dashboard metrics: GET /api/dashboard/metrics
- [ ] Display user profile info
- [ ] Show quick stats (active, completed, spent)
- [ ] List recent orders
- [ ] Implement pull-to-refresh
- [ ] Add loading states

### Phase 7: Order History & Details
- [ ] Fetch all orders: GET /api/orders
- [ ] Implement pagination/infinite scroll
- [ ] Order list filtering (active, completed, cancelled)
- [ ] Order detail view
- [ ] Display timeline
- [ ] Show estimated delivery

### Phase 8: Account Management
- [ ] View profile
- [ ] Edit profile (name, phone, email)
- [ ] Manage addresses
- [ ] View payment methods
- [ ] Change password
- [ ] 2FA setup (optional)

### Phase 9: Subscriptions
- [ ] Fetch available plans: GET /api/subscriptions/plans
- [ ] Display plan comparison UI
- [ ] Create checkout session for plan upgrade
- [ ] Show current subscription status
- [ ] Cancel subscription
- [ ] Track discount application

### Phase 10: Error Handling & Polish
- [ ] Network error handling with retry
- [ ] Input validation on all forms
- [ ] Error messages (user-friendly)
- [ ] Loading indicators for all async operations
- [ ] Offline detection & messaging
- [ ] Try-catch for all API calls

### Phase 11: Testing
- [ ] Test signup/login with real Supabase
- [ ] Complete booking flow with test data
- [ ] Test Stripe with test card numbers:
  - Success: 4242 4242 4242 4242
  - Decline: 4000 0000 0000 0002
  - 3D Secure: 4000 0025 0000 3155
- [ ] Verify order creation in database
- [ ] Test dashboard with real orders
- [ ] Test error scenarios

### Phase 12: Deployment
- [ ] iOS: Code signing & provisioning profiles
- [ ] Android: Keystore & app signing
- [ ] App store listing (screenshots, description)
- [ ] Privacy policy & terms of service
- [ ] Push notifications setup (optional)
- [ ] Analytics tracking (optional)

---

## 🚀 Quick Start Summary

### To Get Running Fast:

1. **Supabase Setup**
   ```
   URL: https://hygktikkjggkgmlpxefp.supabase.co
   ANON_KEY: sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI
   ```

2. **Stripe Setup**
   ```
   PUBLISHABLE_KEY: pk_test_...4
   SECRET_KEY: sk_test_...
   ```

3. **Test Auth**
   ```
   POST /api/auth/signin
   { email: "test@washlee.com", password: "Test123!" }
   ```

4. **Create Order**
   ```
   POST /api/orders
   { uid, email, customerName, orderTotal, bookingData }
   ```

5. **Create Payment**
   ```
   POST /api/stripe/create-checkout-session
   { orderId, orderTotal }
   ```

---

**Document Version:** 1.0  
**Status:** Complete & Ready for Implementation  
**Last Updated:** April 29, 2026
