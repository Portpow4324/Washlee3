# Order Data Architecture - Visual Guide

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BOOKING FORM (7 Steps)                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   Step 1-2            Step 3              Step 4-7
   Pickup &      Laundry Care &        Weight, Speed,
   Addresses     Special Care          Protection,
                                        Delivery
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                ┌──────────────────────┐
                │  BookingData Object  │
                │  (26 fields)         │
                └──────────┬───────────┘
                           │
                POST /api/orders
                           ▼
        ┌──────────────────────────────────┐
        │  /api/orders/route.ts            │
        │  - Maps to createOrder format    │
        │  - Spreads ...bookingData        │
        └──────────────┬───────────────────┘
                       ▼
        ┌──────────────────────────────────┐
        │  createOrder()                   │
        │  - Validates data                │
        │  - Ensures user profile exists   │
        │  - Builds orderRecord            │
        │  - Saves 8 new columns           │
        └──────────────┬───────────────────┘
                       ▼
        ┌──────────────────────────────────┐
        │  orders table (Supabase)         │
        │                                  │
        │  ✓ pickup_spot                   │
        │  ✓ pickup_instructions           │
        │  ✓ detergent                     │
        │  ✓ delicate_cycle                │
        │  ✓ returns_on_hangers            │
        │  ✓ additional_requests           │
        │  ✓ delivery_instructions         │
        │  ✓ hang_dry                      │
        │  + 17 other fields (existing)    │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────────┐      ┌─────────────────────┐
│  EMPLOYEE SEES       │      │  CUSTOMER SEES      │
│  /employee/orders    │      │  /dashboard/        │
│                      │      │  customer/orders    │
│  ✓ Pickup Spot       │      │                     │
│  ✓ Pickup Instr.     │      │  ✓ All Details      │
│  ✓ All Laundry Prefs │      │  ✓ Edit Pickup In.  │
│  ✓ Special Requests  │      │  ✓ Edit Delivery In.│
│  ✓ Delivery Instr.   │      │  ✓ View Timeline    │
│  ✓ Status & Earnings │      │  ✓ Track Status     │
│                      │      │                     │
│  🔄 Accepts Job      │      │  🔧 Edit Fields     │
│  📍 Navigates        │      │  ✏️  Update Notes    │
│  🧺 Processes Order  │      │  📋 View History    │
└──────────────────────┘      └─────────────────────┘
```

## Booking Form Structure → Database Mapping

### Step 1: Service Selection
```
bookingData.selectedService
        │
        └─> items.service_type (JSON column)
```

### Step 2: Pickup Location
```
bookingData.pickupAddress ────────────> orders.pickup_address
bookingData.pickupAddressDetails ─┐
bookingData.pickupSpot ───────────┼──> orders.pickup_spot
bookingData.pickupInstructions ───┼──> orders.pickup_instructions (editable)
bookingData.addPickupInstructions─┘
```

### Step 3: Laundry Care & Preferences
```
bookingData.detergent ─────────────────> orders.detergent
bookingData.delicateCycle ─────────────> orders.delicate_cycle
bookingData.returnsOnHangers ─────────> orders.returns_on_hangers
bookingData.hangDry ───────────────────> orders.hang_dry (+ items JSON)
bookingData.additionalRequests ──────> orders.additional_requests
bookingData.additionalRequestsText ──┘
```

### Step 4: Weight & Items
```
bookingData.bagCount
bookingData.customWeight ──────────────> items.weight (JSON column)
bookingData.oversizedItems ────────────> items.oversizedItems
```

### Step 5: Delivery Speed
```
bookingData.deliverySpeed ────────────> items.delivery_speed (JSON column)
```

### Step 6: Protection Plan
```
bookingData.protectionPlan ───────────> items.protection_plan (JSON column)
                                      > total_price (calculated)
```

### Step 7: Delivery Address
```
bookingData.deliveryAddress ────────────> orders.delivery_address
bookingData.deliveryAddressDetails ─┐
bookingData.deliveryInstructions ───┼──> orders.delivery_instructions (editable)
                                    └──> (for future use)
```

## Employee Orders Page - What's Displayed

```
┌─────────────────────────────────────────────────────┐
│  SELECTED ORDER DETAIL CARD                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ORDER #12AB34CD           [CONFIRMED Status Badge] │
│                                                     │
│  ┌─── CUSTOMER ─────────────────────────────────┐  │
│  │ John Smith                                   │  │
│  │ 📧 john@example.com                         │  │
│  │ 📞 0412 345 678                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─── PICKUP ────────────────────────────────────┐ │
│  │ 📍 90 Victoria Parade, East Melbourne...    │ │
│  │ Spot: Front Door                             │ │
│  │ Instructions: "Leave at back gate"           │ │
│  └─────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── DELIVERY ──────────────────────────────────┐ │
│  │ 📍 123 Smith Street, Carlton VIC 3053...    │ │
│  │ Instructions: "Ring bell twice, wait 5min"   │ │
│  └─────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── ORDER DETAILS ─────────────────────────────┐ │
│  │ Weight: 10.0 kg                              │ │
│  │ Service: Standard                            │ │
│  │ Delivery: Express                            │ │
│  └─────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── LAUNDRY PREFERENCES ───────────────────────┐ │
│  │ ● Detergent: Classic Scented                 │ │
│  │ ● Hang Dry Service Selected                  │ │
│  │ ● Delicate Cycle Required                    │ │
│  │ ● Return Items on Hangers                    │ │
│  │                                               │ │
│  │ Special Requests:                            │ │
│  │ "Please be extra careful with silks,         │ │
│  │  they are vintage and delicate"              │ │
│  └─────────────────────────────────────────────┘ │
│                                                     │
│  YOUR EARNINGS: $80.00                            │
│                                                     │
│  ┌─────────────────────────────────────────────┐ │
│  │  [MARK PICKUP COMPLETE]                     │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Customer Orders Dashboard - What's Displayed

```
┌──────────────────────────────────────────────────────┐
│  MY ORDERS                                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ORDERS LIST              │  ORDER DETAILS           │
│  ──────────────────────   │  ─────────────────────  │
│  [#12AB34CD]              │  ORDER #12AB34CD         │
│  🟢 CONFIRMED             │  [CONFIRMED]             │
│  $133.50                  │                          │
│  15 Apr 2026              │  💰 $133.50              │
│                           │                          │
│  [#98XY76ZA]              │  ┌─ PICKUP ────────────┐ │
│  🟡 IN-PROGRESS           │  │ 📍 90 Victoria...   │ │
│  $100.00                  │  │ Front Door          │ │
│  10 Apr 2026              │  │                     │ │
│                           │  │ ✎ Instructions:     │ │
│  [#55PQ99MM]              │  │ "Leave at gate"     │ │
│  🟢 COMPLETED             │  │                     │ │
│  $85.00                   │  │ [EDIT] [SAVE]       │ │
│  05 Apr 2026              │  └─────────────────────┘ │
│                           │                          │
│                           │  ┌─ DELIVERY ───────────┐ │
│                           │  │ 📍 123 Smith St...  │ │
│                           │  │                     │ │
│                           │  │ ✎ Instructions:     │ │
│                           │  │ "Ring bell twice"   │ │
│                           │  │                     │ │
│                           │  │ [EDIT] [SAVE]       │ │
│                           │  └─────────────────────┘ │
│                           │                          │
│                           │  🧺 PREFERENCES         │ │
│                           │  • Detergent: Classic   │ │
│                           │  • Hang Dry             │ │
│                           │  • Delicate Cycle       │ │
│                           │  • Hangers              │ │
│                           │                          │
│                           │  📝 Special Requests    │ │
│                           │  "Please be careful..." │ │
│                           │                          │
│                           │  ⏰ Placed on Apr 15... │ │
│                           │                          │
└──────────────────────────────────────────────────────┘
```

## Database Columns Summary

```
orders table now has:

EXISTING COLUMNS (17):
├─ id, user_id, status, total_price
├─ pickup_address, delivery_address
├─ tracking_code, items (JSON), notes
├─ created_at, updated_at, pro_id
├─ scheduled_pickup/delivery, actual_pickup/delivery
├─ credits fields, tier fields
└─ review fields

NEW COLUMNS (8):
├─ pickup_spot (TEXT)                    ✓ Visible in both views
├─ pickup_instructions (TEXT)            ✓ Visible & editable in customer
├─ detergent (TEXT)                      ✓ Visible in both views
├─ delicate_cycle (BOOLEAN)              ✓ Visible in both views
├─ returns_on_hangers (BOOLEAN)          ✓ Visible in both views
├─ additional_requests (TEXT)            ✓ Visible in both views
├─ delivery_instructions (TEXT)          ✓ Visible & editable in customer
└─ hang_dry (BOOLEAN)                    ✓ Visible in both views

TOTAL: 25 columns in orders table
```

## Editing Capabilities

```
CUSTOMER CAN EDIT (2 fields, when status='confirmed'):
├─ pickup_instructions
│  └─ Purpose: Add/modify pickup location details
│  └─ Example: "Will be home after 5pm, leave at side gate"
│
└─ delivery_instructions
   └─ Purpose: Add/modify delivery location details
   └─ Example: "Apartment 5B, don't leave outside"

CUSTOMER CANNOT EDIT (but can see):
├─ Detergent choice (set during booking)
├─ Special care options (delicate cycle, hangers)
├─ Hang dry service status
├─ Additional requests (set during booking)
├─ Pickup spot (set during booking)
└─ All order details (weight, service, speed, price)

ONCE ORDER STATUS CHANGES from 'confirmed':
└─ All fields become read-only for customer
   └─ Employee has already picked up
   └─ Can't modify mid-service
```

---

**Key Insight:** The system now captures, stores, and displays complete booking information, enabling:
1. Employees to execute orders accurately
2. Customers to manage their order preferences
3. Transparency throughout the entire order lifecycle
