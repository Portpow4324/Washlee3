# 🗺️ Google Maps + Dashboards - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WASHLEE APP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │  CUSTOMER SIDE   │        │    PRO SIDE      │              │
│  ├──────────────────┤        ├──────────────────┤              │
│  │                  │        │                  │              │
│  │ /auth/signup     │        │ /auth/signup     │              │
│  │ (customer)       │        │ (pro)            │              │
│  │      ↓           │        │      ↓           │              │
│  │ /dashboard       │        │ /pro/dashboard   │              │
│  │ - Active Orders  │        │ - Active Jobs    │              │
│  │ - Stats Cards    │        │ - Earnings       │              │
│  │ - Recent Orders  │        │ - Performance    │              │
│  │                  │        │                  │              │
│  │ /booking         │        │ /pro/jobs/:id    │              │
│  │ Create Order     │        │ View Job Details │              │
│  │      ↓           │        │      ↓           │              │
│  │ /checkout       │◄──────►│ Accept/Complete  │              │
│  │ Payment (Stripe) │        │                  │              │
│  │      ↓           │        └──────────────────┘              │
│  │ Order Created    │                                          │
│  │      ↓           │                                          │
│  │ /tracking?id=X   │        ← Tracking Page                 │
│  │ Live Map         │          (Both can view)                │
│  │ - Pro Location   │                                          │
│  │ - Route          │        ┌──────────────────┐             │
│  │ - Status         │        │  GOOGLE MAPS API │             │
│  │                  │        │  Maps JS Library │             │
│  └──────────────────┘        │  Real-time Data  │             │
│                              └──────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              ↓↓↓
        ┌─────────────────────────────────────────┐
        │      SUPABASE BACKEND                   │
        ├─────────────────────────────────────────┤
        │                                         │
        │  ┌───────────────────────────────────┐ │
        │  │  ORDERS TABLE                     │ │
        │  │ - id, user_id, pro_id            │ │
        │  │ - status, created_at             │ │
        │  │ - total_price, weight            │ │
        │  │ - delivery_address               │ │
        │  │ - scheduled_pickup_date          │ │
        │  └───────────────────────────────────┘ │
        │                                         │
        │  ┌───────────────────────────────────┐ │
        │  │  USERS TABLE                      │ │
        │  │ - id, email, name                 │ │
        │  │ - user_type (customer/pro)        │ │
        │  │ - phone, address                  │ │
        │  └───────────────────────────────────┘ │
        │                                         │
        │  ┌───────────────────────────────────┐ │
        │  │  EMPLOYEES TABLE (Pros)           │ │
        │  │ - id (user_id of pro)             │ │
        │  │ - name, phone, rating             │ │
        │  │ - earnings, acceptance_rate       │ │
        │  └───────────────────────────────────┘ │
        │                                         │
        │  ┌───────────────────────────────────┐ │
        │  │  REAL-TIME SUBSCRIPTIONS          │ │
        │  │ - Listen for order changes        │ │
        │  │ - Auto-refresh dashboards         │ │
        │  │ - Update maps instantly           │ │
        │  └───────────────────────────────────┘ │
        │                                         │
        └─────────────────────────────────────────┘
```

## Data Flow: Creating & Tracking Order

```
STEP 1: Customer Creates Order
┌──────────────┐
│ /booking     │
│ 7-Step Form  │
└──────┬───────┘
       ↓
┌──────────────────────────┐
│ Order Data:              │
│ - weight, address        │
│ - service_type           │
│ - total_price            │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ /checkout                │
│ Stripe Payment           │
└──────┬───────────────────┘
       ↓
       Webhook from Stripe
       ↓
STEP 2: Order Saved to Supabase
┌──────────────────────────┐
│ INSERT into orders       │
│ - user_id = customer     │
│ - status = 'pending'     │
│ - created_at = NOW       │
└──────┬───────────────────┘
       ↓
STEP 3: Dashboards Update Automatically
┌──────────────────┐  ┌──────────────────┐
│ Customer         │  │ Pro Dashboard    │
│ Dashboard        │  │ (not yet)        │
│ Order appears in │  │                  │
│ Recent Orders    │  │ (waiting for     │
└──────────────────┘  │  assignment)     │
                      └──────────────────┘
       ↓ (Manual or Auto Assignment)
STEP 4: Admin Assigns Pro
┌──────────────────────────┐
│ UPDATE orders            │
│ WHERE id = ORDER_ID      │
│ SET pro_id = PRO_ID      │
│ SET status = 'confirmed' │
└──────┬───────────────────┘
       ↓
Real-Time Event Fired
       ↓
STEP 5: Both Dashboards Update
┌──────────────────┐  ┌──────────────────┐
│ Customer         │  │ Pro Dashboard    │
│ Dashboard        │  │ shows order      │
│ status changes   │  │ in Active Jobs   │
│ to 'confirmed'   │  │                  │
└──────────────────┘  └──────────────────┘
       ↓                      ↓
STEP 6: Customer Clicks Track
┌────────────────────────────────────┐
│ /tracking?id=ORDER_ID              │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ GOOGLE MAP                   │  │
│ │ ┌────────────┐               │  │
│ │ │            │ Pro (Teal)    │  │
│ │ │  ╱─────╲   │               │  │
│ │ │ ╱       ╲  │ Route         │  │
│ │ │╱         ╲ │               │  │
│ │ │           ╲│               │  │
│ │ │          ● │ Customer      │  │
│ │ │            │ (Orange)      │  │
│ │ └────────────┘               │  │
│ │                              │  │
│ │ Status: In Transit ✓         │  │
│ │ Pro: John (⭐ 4.9/5)         │  │
│ │ ETA: 8 mins                  │  │
│ └──────────────────────────────┘  │
│                                    │
│ [Call Pro] [Message]              │
└────────────────────────────────────┘
       ↓ (When status updates)
STEP 7: Real-Time Status Updates
Map updates instantly as:
- Pro moves (location updates)
- Status changes (in washing, etc.)
- Delivery scheduled
- Completed
```

## Components & Files

```
FRONTEND FILES:
├── /app
│   ├── /auth/signup           ← Create account (customer or pro)
│   ├── /dashboard             ← Customer dashboard
│   ├── /pro/dashboard         ← Pro dashboard
│   ├── /booking               ← Create order
│   ├── /checkout              ← Payment
│   ├── /tracking              ← Live map tracking
│   └── /api
│       ├── /orders            ← Get/create orders
│       ├── /auth              ← Auth endpoints
│       └── /checkout          ← Stripe webhooks
│
├── /components
│   ├── LiveTracking.tsx        ← Google Maps component
│   ├── Header.tsx              ← Navigation
│   ├── Footer.tsx              ← Footer
│   ├── Button.tsx              ← Button component
│   └── Card.tsx                ← Card component
│
├── /lib
│   ├── supabaseClient.ts       ← Supabase connection
│   ├── AuthContext.tsx         ← Auth state
│   └── firebase.ts             ← Backup auth
│
└── .env.local
    ├── NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ✅
    ├── NEXT_PUBLIC_SUPABASE_URL ✅
    ├── NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
    └── STRIPE & EMAIL configs ✅
```

## Real-Time Flow

```
ORDER STATUS CHANGES IN DATABASE
              ↓
         Webhook Event
              ↓
    ┌────────┴────────┐
    ↓                 ↓
Customer          Pro
Dashboard        Dashboard
Updates            Updates
(if assigned)      (if assigned)
              ↓
    ┌────────┴────────┐
    ↓                 ↓
Live Tracking    Pro's Mobile
Map Updates       App Updates
                  (if integrated)
```

## Status Badge Colors

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| confirmed | 🟡 Yellow | Package | Ready for pickup |
| in-transit | 🔵 Blue | Clock | On the way |
| in_washing | 🔵 Blue | Clock | Being washed |
| completed | 🟢 Green | Check | Done! |
| pending-payment | 🟡 Yellow | Alert | Waiting for payment |

## Features Checklist

```
✅ Google Maps Integration
  ├─ API Key Setup
  ├─ Map Display
  ├─ Pro Marker (Teal)
  ├─ Customer Marker (Orange)
  ├─ Route Line
  ├─ Info Windows
  └─ Click-to-Call

✅ Customer Dashboard
  ├─ Stats Cards
  ├─ Recent Orders
  ├─ Order Details
  ├─ Quick Actions
  ├─ Account Info
  └─ Real-Time Updates

✅ Pro Dashboard
  ├─ Active Jobs List
  ├─ Stats Cards
  ├─ Weekly Earnings
  ├─ Acceptance Rate
  ├─ Job Details
  └─ Real-Time Updates

✅ Live Tracking
  ├─ Map Display
  ├─ Pro Info Card
  ├─ Status Timeline
  ├─ Address Info
  ├─ Call Pro Button
  └─ Real-Time Updates

✅ Real-Time Subscriptions
  ├─ Customer Dashboard
  ├─ Pro Dashboard
  ├─ Tracking Page
  └─ Automatic Refresh
```

---

**Architecture**: Decoupled Frontend + Real-Time Backend  
**Database**: Supabase PostgreSQL  
**Maps**: Google Maps JavaScript API  
**Payment**: Stripe (Webhook based)  
**Real-Time**: Supabase Realtime Subscriptions  
