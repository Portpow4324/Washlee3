# Order System - Quick Reference Guide

## 🚀 Customer User Flow

### 1. Making an Order
```
Home Page → "Book Laundry Now" button
    ↓
Auth Check (must be logged in)
    ↓
Booking Wizard - Step 1: Schedule Pickup
    ├─ "ASAP" (2 hours) OR
    └─ "Schedule for later" (pick date/time)
    ↓
Step 2: Laundry Preferences
    ├─ Detergent (hypoallergenic, eco-friendly, scented)
    ├─ Water Temp (cold, warm, hot)
    ├─ Folding (folded, hanging)
    └─ Special Care (optional text)
    ↓
Step 3: Delivery Options
    ├─ Delivery Speed (standard/same-day)
    ├─ Address (required)
    └─ Notes (optional)
    ↓
Step 4: Review & Confirm
    ├─ Review all settings
    ├─ Agree to terms
    └─ Confirm & Pay
    ↓
✅ Success Screen
    ├─ Order ID: [UUID]
    ├─ Total Cost: $[amount]
    └─ Options: View in Dashboard / Back to Home
```

### 2. Viewing Orders
```
Dashboard → "Orders" Tab
    ↓
Active Orders List
    ├─ Order ID
    ├─ Status (pending/confirmed/picked_up/in_washing/ready_for_delivery/delivered)
    ├─ Weight & Cost
    ├─ Pickup & Delivery Info
    └─ "Track Order" button
```

### 3. Tracking Order
```
Dashboard Order Card → "Track Order"
    ↓
Tracking Page - Three Tabs:

📍 TRACKING TAB
    ├─ Visual Timeline (6 stages)
    ├─ Current Status Card
    ├─ Real-time Map Placeholder
    └─ Estimated Delivery Time

📋 DETAILS TAB
    ├─ Laundry Preferences
    ├─ Addresses
    ├─ Special Care Instructions
    └─ Pricing Breakdown

👤 YOUR PRO TAB (when assigned)
    ├─ Pro Name & Rating
    ├─ Contact Number
    ├─ Message Button
    └─ Call Button
```

## 💾 Database Structure

### Orders Collection
**Location**: `collections/orders/`

**Fields**:
- `userId` (string) - Customer's user ID
- `customerName` (string) - Full name
- `customerEmail` (string) - Email address
- `customerPhone` (string) - Phone number
- `status` (string) - Current order status
- `pickupTime` (string) - Pickup time ("ASAP" or datetime)
- `pickupAddress` (string) - Pickup location
- `detergent` (string) - Detergent choice
- `waterTemperature` (string) - Wash temperature
- `specialCare` (string) - Special instructions
- `foldingPreference` (string) - Folding style
- `estimatedWeight` (number) - Weight in kg
- `deliverySpeed` (string) - "standard" or "same-day"
- `deliveryAddress` (string) - Delivery location
- `deliveryNotes` (string) - Delivery instructions
- `baseCost` (number) - Laundry cost
- `deliveryCost` (number) - Delivery fee
- `subtotal` (number) - Total price
- `createdAt` (timestamp) - Order creation time
- `proName` (string) - Assigned Pro's name (optional)
- `proPhone` (string) - Pro's contact (optional)
- `proRating` (number) - Pro's rating (optional)

## 🔐 Firebase Firestore Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders - only read/write own orders
    match /orders/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Users - read/write own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## 💰 Pricing Breakdown

**Base Pricing**: $3.00 per kg
**Same-Day Delivery**: +$5.00
**Standard Delivery**: Included

### Example:
- 5 kg laundry @ $3/kg = $15.00
- Standard delivery = $0.00
- **Total: $15.00**

---

- 5 kg laundry @ $3/kg = $15.00
- Same-day delivery = $5.00
- **Total: $20.00**

## 🔄 Order Status Workflow

```
pending ──→ confirmed ──→ picked_up ──→ in_washing ──→ ready_for_delivery ──→ delivered
  ↑                                                                               ↓
  └─────────────────── (can cancel) ────────────────────────────────────────────┘
```

**Status Meanings**:
1. **pending** - Waiting for Pro acceptance
2. **confirmed** - Pro accepted, ready to pickup
3. **picked_up** - Laundry collected from customer
4. **in_washing** - At facility being processed
5. **ready_for_delivery** - Clean & packaged, ready to send
6. **delivered** - Successfully delivered to customer

## 🎨 UI Color Codes

| Status | Color | Hex |
|--------|-------|-----|
| pending | Yellow | #FCD34D |
| confirmed | Blue | #3B82F6 |
| picked_up | Purple | #A855F7 |
| in_washing | Orange | #F97316 |
| ready_for_delivery | Green | #10B981 |
| delivered | Mint | #48C9B0 |

## 🛠 Common Tasks

### Update Order Status (Admin)
In Firebase Console:
1. Go to Firestore
2. Navigate to `orders` collection
3. Click order document
4. Edit `status` field
5. Changes appear instantly on tracking page

### Add Pro Information
In Firebase Console:
1. Edit order document
2. Add fields:
   - `proName`: string
   - `proPhone`: string
   - `proRating`: number (1-5)
3. "Your Pro" tab appears on tracking page

### View Customer Orders
Firebase Query:
```javascript
// Get all orders for a customer
const q = query(collection(db, 'orders'), where('userId', '==', userId));
const snapshot = await getDocs(q);
```

## 📱 Mobile Support
- ✅ Responsive booking wizard
- ✅ Single-column layout on mobile
- ✅ Touch-friendly buttons
- ✅ Mobile menu navigation
- ✅ Full tracking experience

## 🚨 Troubleshooting

### Orders Not Showing in Dashboard
1. ✅ Check user is logged in
2. ✅ Verify Firebase connection
3. ✅ Check user ID matches in Firestore
4. ✅ Refresh page

### Tracking Page Shows Error
1. ✅ Order ID in URL is correct
2. ✅ User is authenticated
3. ✅ Order belongs to logged-in user
4. ✅ Check Firestore offline mode

### Real-time Updates Not Working
1. ✅ Firestore connection active
2. ✅ User has read permissions
3. ✅ Listeners properly set up
4. ✅ No browser console errors

## 📊 Analytics to Track
- Orders created per day
- Average order weight
- Delivery speed preference (standard vs same-day)
- Detergent preference
- Popular delivery times
- Repeat customer rate

## 🔗 Key Routes

| Route | Purpose |
|-------|---------|
| `/booking` | Create new order |
| `/dashboard/customer` | View all orders |
| `/tracking/[id]` | Track specific order |
| `/auth/login` | Customer login |
| `/auth/signup` | Customer registration |

---

**Last Updated**: January 20, 2025
**Version**: 1.0 (Production Ready)
