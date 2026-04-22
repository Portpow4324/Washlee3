# Delivery System - Visual Reference

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CUSTOMER BOOKING                         │
│                                                              │
│  Step 1: Service  →  Step 2: Pickup  →  Step 3: DELIVERY  │
│                                         ↑                   │
│                                    [Real-Time]              │
└──────────────────────────────────┬─────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
        ┌─────────────────────┐    ┌──────────────────────┐
        │  FRONTEND BOOKING   │    │  API LAYER           │
        │                     │    │                      │
        │  1. Load metrics    │───→│  GET /metrics        │
        │  2. Calculate ETAs  │    │  POST /track-cap     │
        │  3. Show options    │    │  GET /status/[id]    │
        │  4. Refresh every   │    │                      │
        │     5 minutes       │    │                      │
        └─────────────────────┘    └──────┬───────────────┘
                                          │
                    ┌─────────────────────┴─────────────────┐
                    ↓                                       ↓
        ┌────────────────────────┐         ┌──────────────────────┐
        │   DATABASE (Supabase)  │         │   CALCULATIONS       │
        │                        │         │                      │
        │ employees              │         │ Capacity =           │
        │ orders                 │────────→│   active_members × 60│
        │ capacity_logs          │         │                      │
        │                        │         │ Usage % =            │
        │                        │         │   orders_weight /    │
        │                        │         │   total_capacity     │
        └────────────────────────┘         └──────────────────────┘
```

---

## Customer Experience Flow

### Scenario 1: Low Capacity (15% Used)
```
Customer opens booking → Step 3
         ↓
    ┌─ GET /metrics ──┐
    ↓                 ↓
  API returns:    "8 members active
                   0.5 orders processing  
                   Capacity: 15%"
    ↓
  Frontend calculates:
    • Standard: 24 hours → Tomorrow 2:00 PM
    • Express: 4 hours → Today 6:00 PM ✅
    • Suggestion: Express (plenty of capacity)
    ↓
  Customer sees:
  ┌────────────────────────────────────────┐
  │ Active Team: 8 │ Capacity: 15% Used   │
  │                                        │
  │ 🚚 STANDARD (24h)                     │
  │    Wed, 2 Apr by 2:00pm               │
  │    Low demand - fastest available      │
  │                                        │
  │ ⚡ EXPRESS (4h) ← Recommended         │
  │    Tue, 1 Apr by 6:00pm               │
  │    Priority queue • Limited slots     │
  │    $12.50/kg (min $75)                │
  └────────────────────────────────────────┘
```

### Scenario 2: High Capacity (85% Used)
```
Customer opens booking → Step 3
         ↓
    ┌─ GET /metrics ──┐
    ↓                 ↓
  API returns:    "8 members active
                   25+ orders processing  
                   Capacity: 85%"
    ↓
  Frontend calculates:
    • Standard: 36 hours → Day after tomorrow
    • Express: UNAVAILABLE ❌
    • Suggestion: Standard (we're busy!)
    ↓
  Customer sees:
  ┌────────────────────────────────────────┐
  │ Active Team: 8 │ Capacity: 85% Used   │
  │ Processing: 25 orders                  │
  │                                        │
  │ 🚚 STANDARD (36h) ← Recommended       │
  │    Thu, 3 Apr by 2:00pm               │
  │    High demand - expect wait times    │
  │    $7.50/kg • No minimum              │
  │                                        │
  │ ⚡ EXPRESS ← Unavailable              │
  │    Our team is at capacity.           │
  │    Choose Standard or try later.      │
  └────────────────────────────────────────┘
```

---

## Real-Time Data Updates

```
                   First Load
                       ↓
          ┌─────────────────────────┐
          │ GET /api/delivery/metrics│
          └──────────────┬──────────┘
                         ↓
             Display options to customer
                    ↓    ↓    ↓
          5 minutes pass (auto-refresh)
                    ↓
          ┌─────────────────────────┐
          │ GET /api/delivery/metrics│
          │ (updated with new orders)│
          └──────────────┬──────────┘
                         ↓
             Re-calculate delivery windows
             Maybe suggest different option
                    ↓    ↓    ↓
          5 minutes pass (auto-refresh)
                    ↓
          ... repeats until order placed
```

---

## Database Query Flow

### Getting Metrics

```
[Frontend: GET /api/delivery/metrics]
          ↓
[Backend: Look up employees]
    SELECT COUNT(*) FROM employees 
    WHERE status = 'active'
    → Result: 8
          ↓
[Backend: Look up active orders]
    SELECT weight_kg FROM orders
    WHERE status IN ['pending', 'processing', 'in_transit']
    → Result: [12, 14, 10] = 36 kg total
          ↓
[Backend: Calculate]
    Total Capacity = 8 × 60 = 480 kg
    Used = 36 kg
    Capacity % = 36 / 480 = 7.5%
          ↓
[Backend: Determine windows]
    If < 30% capacity:
      - Standard: 24 hours
      - Express: 4 hours ✅
    Suggestion: Express
          ↓
[Return to Frontend]
    {
      activeMembers: 8,
      activeOrders: 3,
      capacityUsage: 7.5,
      standardDeliveryHours: 24,
      expressDeliveryHours: 4
    }
```

### Recording Order

```
[Customer: Confirms order with Express delivery]
          ↓
[Frontend: POST /api/delivery/track-capacity]
    {
      orderId: "order_abc123",
      weightKg: 15,
      deliverySpeed: "express"
    }
          ↓
[Backend: Updates orders table]
    UPDATE orders
    SET weight_kg = 15, delivery_speed = 'express'
    WHERE id = 'order_abc123'
          ↓
[Backend: Logs to capacity_logs (analytics)]
    INSERT INTO capacity_logs
    VALUES (order_abc123, 15, 'express', now())
          ↓
[Next Customer Booking]
    Active orders now includes this new 15kg order
    Capacity % goes from 7.5% → 10%
    Different customers might see different options!
```

---

## Capacity Threshold Explained

```
┌─────────────────────────────────────────────────────────┐
│  CAPACITY %  │  STANDARD   │  EXPRESS  │  RECOMMENDED  │
├──────────────┼─────────────┼───────────┼───────────────┤
│   0-30%      │   24h ✅    │   4h ⭐   │  EXPRESS      │
│              │  Tomorrow   │  Today    │ (Fast!)       │
│              │             │           │               │
│  30-60%      │  24-30h ✅  │   6h ✅   │  EXPRESS      │
│              │  Tomorrow   │  Today    │ (Good)        │
│              │             │           │               │
│  60-80%      │  36h ✅     │  12h ⚠️   │  STANDARD     │
│              │  Day+2      │  Tomorrow │ (Slower now)  │
│              │             │           │               │
│   >80%       │  48h ✅     │  ❌       │  STANDARD     │
│              │  Day+2      │  Not ok   │ (Must use)    │
│              │             │           │               │
└─────────────────────────────────────────────────────────┘

Why the thresholds?
- 80%: Above this, we can't safely process Express
       orders without delays. Better to say "not available"
       
- 60%: At this point, express gets slower (12h vs 4h)
       Some teams suggest Standard to spread load
       
- 30%: Below this, express is super fast (4h)
       No bottleneck, recommend Express
```

---

## API Response Examples

### Metrics Response (Low Capacity)

```json
{
  "metrics": {
    "activeMembers": 8,
    "activeOrders": 2,
    "averageOrderWeight": 12.5,
    "totalCapacity": 480,
    "availableCapacity": 455,
    "capacityUsage": 5.2,
    "standardDeliveryHours": 24,
    "expressDeliveryHours": 4,
    "lastUpdated": "2026-03-31T14:30:00Z"
  }
}
```

### Metrics Response (High Capacity)

```json
{
  "metrics": {
    "activeMembers": 8,
    "activeOrders": 28,
    "averageOrderWeight": 15,
    "totalCapacity": 480,
    "availableCapacity": 60,
    "capacityUsage": 87.5,
    "standardDeliveryHours": 48,
    "expressDeliveryHours": 12,
    "lastUpdated": "2026-03-31T17:45:00Z"
  }
}
```

### Order Status Response

```json
{
  "status": {
    "orderId": "order_xyz789",
    "currentStatus": "processing",
    "deliverySpeed": "express",
    "weightKg": 12,
    "createdAt": "2026-03-31T08:00:00Z",
    "elapsedHours": 2.5,
    "estimatedDeliveryHours": 6,
    "progressPercent": 41.7,
    "assignedPro": {
      "id": "emp_456",
      "first_name": "Sarah",
      "phone": "+61 2 XXXX XXXX"
    },
    "statusMessage": "Your laundry is being processed (2.5/6 hours). On track for delivery!",
    "nextStep": "Your laundry is being cleaned",
    "estimatedDeliveryDate": "Wed, 31 Mar",
    "estimatedDeliveryTimeStr": "02:00 PM"
  }
}
```

---

## Component UI Flow

```
Booking Page
├── Step 1: Service
├── Step 2: Pickup  
└── Step 3: DELIVERY SPEED
    │
    ├─ useEffect (on mount)
    │  ├─ Fetch metrics from /api/delivery/metrics
    │  ├─ Calculate windows using deliveryService
    │  └─ Set refresh interval (5 minutes)
    │
    ├─ Status Dashboard (New!)
    │  ├─ "Active Team: X"
    │  ├─ "Capacity: Y%"
    │  └─ "Processing: Z orders"
    │
    ├─ Standard Option
    │  ├─ Show real date/time
    │  ├─ Show hours to process
    │  ├─ Show capacity reason
    │  └─ Badge: "Recommended" if suggested
    │
    ├─ Express Option  
    │  ├─ Show real date/time (if available)
    │  ├─ Show hours to process
    │  ├─ DISABLE if capacity > 80%
    │  └─ Show reason why unavailable
    │
    └─ Next Button
       └─ Proceeds to Step 4
```

---

## Timeline: Order from Placement to Delivery

```
Customer Booking Start
        ↓
   [Step 1-2: 2 min]
        ↓
   STEP 3: DELIVERY SPEED (Now Dynamic!)
        │
        ├─→ System: "Check capacity"
        │   ↓
        │   GET /api/delivery/metrics
        │   ↓
        │   "Capacity: 45%, suggest Express"
        │
        ├─→ Customer: Selects "Express Delivery"
        │   ↓
        │   See: "Wed 2 Apr by 8:15am (6 hours)"
        │
        └─→ Customer: Clicks Next
            ↓
   [Step 4-7: Review & Checkout]
        ↓
   Customer Confirms Order
        ↓
   SYSTEM ACTION:
   POST /api/delivery/track-capacity
   {orderId, 15kg, 'express'}
        ↓
   [Database Updated]
   - orders table: weight_kg=15, delivery_speed='express'
   - capacity_logs: logged for analytics
   - Next customer sees higher capacity usage!
        ↓
   Email sent to customer:
   "Your order confirmed! Estimated delivery: Wed 8:15am"
        ↓
   Pro assigned order
        ↓
   Order Status: pending → processing → in_transit → delivered
        ↓
   GET /api/delivery/status/order_id shows progress:
   ✓ Assigned: Sarah (Toyota Corolla)
   ✓ Progress: 41% complete (2.5/6 hours)
   ✓ ETA: Wed 8:15am
        ↓
   DELIVERY! 🎉
        ↓
   Customer asked to rate experience
```

---

## Performance Numbers

```
API Response Times (Target: <500ms)
├─ /api/delivery/metrics
│  └─ Query employees + orders: ~50ms
│     Calculate metrics: ~10ms
│     Return JSON: ~5ms
│     TOTAL: ~65ms ✅
│
├─ /api/delivery/track-capacity  
│  └─ Update orders: ~30ms
│     Insert log: ~20ms
│     TOTAL: ~50ms ✅
│
└─ /api/delivery/status/[id]
   └─ Query order + pro: ~40ms
      Calculate progress: ~5ms
      Return JSON: ~5ms
      TOTAL: ~50ms ✅

Frontend Render
├─ Load metrics: <500ms
├─ Calculate windows: <50ms
├─ Render UI: <100ms
└─ TOTAL: <650ms ✅

Auto-Refresh (Every 5 minutes)
├─ Request new metrics
├─ Update state if changed
├─ Re-render (only if different)
└─ Minimal impact on performance ✅
```

---

## Success Metrics to Track

```
┌──────────────────────────────────────────┐
│  What to Monitor in Production           │
├──────────────────────────────────────────┤
│ ✓ Average response time for /metrics     │
│ ✓ Cache hit rate (if caching added)      │
│ ✓ Error rate for database queries        │
│ ✓ Express availability % (should be 70%) │
│ ✓ Standard/Express ratio                 │
│ ✓ Capacity peaks (what time of day?)     │
│ ✓ Team utilization efficiency            │
│ ✓ Customer satisfaction (via reviews)    │
└──────────────────────────────────────────┘

Usage Analytics
├─ Peak hours (when is capacity fullest?)
├─ Average order weight
├─ Express vs Standard split
├─ Repeat customer preset usage
├─ Delivery time accuracy
└─ Pro assignment efficiency
```

---

## Scaling Considerations

```
Current Setup (Single Region)
├─ 8 team members max
├─ ~50 concurrent orders max
├─ API response: <100ms
└─ Suitable for: Growing local business

Scaling to 2+ Regions
├─ Add region selector
├─ Separate metrics per region
├─ Route to nearest region
├─ Each region tracks independently
└─ Combine for dashboard view

Scaling to High Volume (1000+ orders/day)
├─ Cache metrics (5-min valid)
├─ WebSocket for real-time instead of polling
├─ Database indexing on status, created_at
├─ Read replicas for metrics queries
├─ Scheduled job for capacity_logs cleanup
└─ Consider microservice for order processing
```

---

This is your complete visual reference! 🎯
