# 📅 Scheduling Step Implementation Guide
## Booking Step 8: Pickup & Delivery Time Selection

**Status:** Ready to Integrate  
**Priority:** Critical for order confirmation  
**Location in Flow:** After Step 7 (Delivery Address) → Before Review & Confirm  
**Created:** May 1, 2026

---

## 📊 Updated Booking Flow (8 Steps)

```
Step 1: Select Service
Step 2: Pickup Location
Step 3: Laundry Care & Preferences
Step 4: Weight & Bag Count
Step 5: Delivery Speed
Step 6: Protection Plan
Step 7: Delivery Address
    ↓
** Step 8: Schedule Pickup & Delivery Times ** ← NEW
    ↓
Review & Confirm (Final Review)
    ↓
Stripe Checkout
```

---

## 🎨 Frontend Implementation

### 1. Update Steps Array

**File:** `/app/booking-hybrid/page.tsx`

```typescript
const steps = [
  { number: 1, title: 'Select Service', description: 'Choose your laundry service type' },
  { number: 2, title: 'Pickup Location', description: 'Where should we pick up your laundry?' },
  { number: 3, title: 'Laundry Care', description: 'Detergent & special care instructions' },
  { number: 4, title: 'Bag Count', description: 'How many bags are you sending?' },
  { number: 5, title: 'Delivery Speed', description: 'Choose your desired delivery speed' },
  { number: 6, title: 'Protection Plan', description: 'Washlee\'s Protection Plan covers damage & loss' },
  { number: 7, title: 'Delivery Address', description: 'Where should we deliver your laundry?' },
  { number: 8, title: 'Schedule Times', description: 'Choose your pickup and delivery times' },
  { number: 9, title: 'Review & Confirm', description: 'Review your order and complete checkout' },
]
```

### 2. Update BookingData State

```typescript
const [bookingData, setBookingData] = useState({
  // ... existing fields ...
  
  // Step 8: Scheduling (NEW)
  pickupDate: '',           // ISO date string: "2026-05-15"
  pickupTimeSlot: '',       // "08:00-10:00"
  deliveryDate: '',         // ISO date string
  deliveryTimeSlot: '',     // "14:00-16:00"
  selectedProId: '',        // Pro ID if specific pro selected
})
```

### 3. Add Scheduling-Related State

```typescript
const [availablePickupSlots, setAvailablePickupSlots] = useState<PickupSlot[]>([])
const [availableDeliverySlots, setAvailableDeliverySlots] = useState<DeliverySlot[]>([])
const [slotsLoading, setSlotsLoading] = useState(false)
const [slotsError, setSlotsError] = useState('')
const [selectedPickupDate, setSelectedPickupDate] = useState<string>('')
const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string>('')

interface PickupSlot {
  timeSlot: string
  availablePros: number
  estimated_eta_minutes?: number
}

interface DeliverySlot {
  timeSlot: string
  availablePros: number
  estimated_ready_time?: string
}
```

### 4. Fetch Available Slots Function

```typescript
const fetchAvailableSlots = async (pickupDate: string) => {
  setSlotsLoading(true)
  setSlotsError('')
  
  try {
    // Fetch pickup slots
    const pickupResponse = await fetch('/api/scheduling/pickup-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: pickupDate,
        address: bookingData.pickupAddress,
        duration_minutes: 30  // Estimated pickup duration
      })
    })
    
    if (!pickupResponse.ok) throw new Error('Failed to fetch pickup slots')
    const pickupData = await pickupResponse.json()
    setAvailablePickupSlots(pickupData.slots || [])
    
    // Calculate estimated delivery date based on delivery speed
    const pickupDateObj = new Date(pickupDate)
    let deliveryDateObj = new Date(pickupDateObj)
    
    if (bookingData.deliverySpeed === 'standard') {
      deliveryDateObj.setDate(deliveryDateObj.getDate() + 2) // 24-48 hours
    } else {
      deliveryDateObj.setDate(deliveryDateObj.getDate() + 1) // 12-18 hours
    }
    
    const deliveryDateStr = deliveryDateObj.toISOString().split('T')[0]
    
    // Fetch delivery slots
    const deliveryResponse = await fetch('/api/scheduling/delivery-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: deliveryDateStr,
        address: bookingData.deliveryAddress,
        duration_minutes: 30  // Estimated delivery duration
      })
    })
    
    if (!deliveryResponse.ok) throw new Error('Failed to fetch delivery slots')
    const deliveryData = await deliveryResponse.json()
    setAvailableDeliverySlots(deliveryData.slots || [])
    
    setSelectedDeliveryDate(deliveryDateStr)
  } catch (error) {
    setSlotsError(error instanceof Error ? error.message : 'Failed to load time slots')
  } finally {
    setSlotsLoading(false)
  }
}
```

### 5. Step 8 UI Component

Add this after Step 7 (Delivery Address):

```typescript
{/* STEP 8: Schedule Pickup & Delivery Times */}
{currentStep === 8 && (
  <div className="max-w-3xl mx-auto">
    <Card className="p-8 mb-8">
      <h3 className="font-bold text-2xl text-dark mb-2">Schedule Your Times</h3>
      <p className="text-gray mb-8">Choose when we should pick up and deliver your laundry</p>
      
      {slotsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold flex items-center gap-2">
            <AlertCircle size={18} /> {slotsError}
          </p>
        </div>
      )}
      
      {/* Pickup Date & Time Selection */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-dark mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-primary" />
            Pickup Date & Time (required)
          </div>
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Date Picker */}
          <div>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              value={selectedPickupDate}
              onChange={(e) => {
                setSelectedPickupDate(e.target.value)
                setBookingData({ ...bookingData, pickupDate: e.target.value, pickupTimeSlot: '' })
                if (e.target.value) {
                  fetchAvailableSlots(e.target.value)
                }
              }}
              className="w-full border-2 border-gray rounded-lg p-3 focus:border-primary outline-none"
            />
          </div>
        </div>
        
        {/* Time Slots Grid */}
        {slotsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : availablePickupSlots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availablePickupSlots.map((slot) => (
              <button
                key={slot.timeSlot}
                onClick={() => setBookingData({ ...bookingData, pickupTimeSlot: slot.timeSlot })}
                className={`p-4 rounded-lg border-2 transition text-center ${
                  bookingData.pickupTimeSlot === slot.timeSlot
                    ? 'border-primary bg-mint text-dark font-semibold'
                    : 'border-gray hover:border-primary text-gray'
                }`}
              >
                <div className="font-semibold">{slot.timeSlot}</div>
                <div className="text-xs mt-1">
                  {slot.availablePros} pro{slot.availablePros !== 1 ? 's' : ''} available
                </div>
              </button>
            ))}
          </div>
        ) : selectedPickupDate && !slotsLoading ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">No available time slots for this date. Please choose another date.</p>
          </div>
        ) : null}
      </div>
      
      {/* Delivery Date & Time Selection */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-dark mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={18} className="text-primary" />
            Delivery Date & Time (required)
          </div>
        </label>
        
        <div className="mb-3 p-3 bg-mint rounded-lg">
          <p className="text-sm text-dark">
            {bookingData.deliverySpeed === 'standard' 
              ? '✓ Estimated delivery: 24-48 hours after pickup'
              : '✓ Estimated delivery: 12-18 hours after pickup'}
          </p>
        </div>
        
        {/* Time Slots Grid */}
        {slotsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : availableDeliverySlots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableDeliverySlots.map((slot) => (
              <button
                key={slot.timeSlot}
                onClick={() => setBookingData({ ...bookingData, deliveryTimeSlot: slot.timeSlot })}
                className={`p-4 rounded-lg border-2 transition text-center ${
                  bookingData.deliveryTimeSlot === slot.timeSlot
                    ? 'border-primary bg-mint text-dark font-semibold'
                    : 'border-gray hover:border-primary text-gray'
                }`}
              >
                <div className="font-semibold">{slot.timeSlot}</div>
                <div className="text-xs mt-1">
                  {slot.availablePros} pro{slot.availablePros !== 1 ? 's' : ''} available
                </div>
              </button>
            ))}
          </div>
        ) : selectedDeliveryDate && !slotsLoading ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">No available time slots for this date.</p>
          </div>
        ) : null}
      </div>
    </Card>
  </div>
)}
```

### 6. Update Validation Logic

```typescript
const isValidStep = (step: number): boolean => {
  switch (step) {
    // ... existing validations ...
    case 8:
      if (!bookingData.pickupDate) {
        setError('Please select a pickup date')
        return false
      }
      if (!bookingData.pickupTimeSlot) {
        setError('Please select a pickup time')
        return false
      }
      if (!bookingData.deliveryDate) {
        setError('Please select a delivery date')
        return false
      }
      if (!bookingData.deliveryTimeSlot) {
        setError('Please select a delivery time')
        return false
      }
      return true
    case 9: // Review & Confirm
      if (!agreedToTerms) {
        setError('Please agree to the Terms of Service')
        return false
      }
      return true
    default:
      return false
  }
}
```

### 7. Update handleSubmitOrder

Modify to use new step numbers:

```typescript
const handleSubmitOrder = async () => {
  setIsLoading(true)
  setError('')

  try {
    if (!user) throw new Error('User not found')

    const orderTotal = calculateTotal()
    
    const orderPayload = {
      customer_id: user.id,
      customer_email: user.email,
      customer_name: user.user_metadata?.name || 'Customer',
      delivery_address: bookingData.deliveryAddress,
      weight: bookingData.bagCount * 2.5, // Estimate
      status: 'pending-pickup',
      pickup_address: bookingData.pickupAddress,
      pickup_date: bookingData.pickupDate,           // NEW
      pickup_time_slot: bookingData.pickupTimeSlot,  // NEW
      delivery_date: bookingData.deliveryDate,       // NEW
      delivery_time_slot: bookingData.deliveryTimeSlot, // NEW
      // ... rest of existing fields ...
    }
    
    // Create order via API
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    })
    
    if (!orderResponse.ok) {
      throw new Error('Failed to create order')
    }
    
    const orderResult = await orderResponse.json()
    const createdOrderId = orderResult.data?.orderId || orderResult.orderId
    
    setOrderId(createdOrderId)
    setOrderConfirmed(true)
    setCurrentStep(10) // Proceed to payment after confirm
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Failed to submit order')
  } finally {
    setIsLoading(false)
  }
}
```

---

## 🗄️ Backend SQL Implementation

### 1. Update Orders Table Schema

**File:** `DATABASE_SCHEMA_MIGRATION.sql`

```sql
-- Add scheduling columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time_slot VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time_slot VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP DEFAULT NOW();

-- Create indexes for scheduling queries
CREATE INDEX IF NOT EXISTS idx_orders_pickup_date ON orders(pickup_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_date_slot ON orders(pickup_date, pickup_time_slot);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date_slot ON orders(delivery_date, delivery_time_slot);
```

### 2. Create Availability Slots Table

```sql
-- New table to track available time slots
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Slot identification
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type VARCHAR(20) NOT NULL CHECK (slot_type IN ('pickup', 'delivery')),
  
  -- Capacity tracking
  total_capacity INT DEFAULT 10,
  booked_count INT DEFAULT 0,
  
  -- Location reference (for pickup/delivery slots)
  service_area_zip VARCHAR(10),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  
  timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_type ON availability_slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_availability_slots_available ON availability_slots(is_available, slot_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_slots_unique ON availability_slots(slot_date, start_time, end_time, slot_type);
```

### 3. Create Pro Slot Assignments Table

```sql
-- Track which pros are assigned to which slots
CREATE TABLE IF NOT EXISTS pro_slot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  slot_id UUID NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assignment details
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('pickup', 'delivery')),
  capacity_slots INT DEFAULT 5,
  booked_slots INT DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_pro ON pro_slot_assignments(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_slot ON pro_slot_assignments(slot_id);
CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_active ON pro_slot_assignments(is_active);
```

### 4. Create Booking Slot Assignments Table

```sql
-- Track which order is booked in which slot with which pro
CREATE TABLE IF NOT EXISTS booking_slot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  pro_slot_assignment_id UUID NOT NULL REFERENCES pro_slot_assignments(id) ON DELETE CASCADE,
  
  -- Booking details
  booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('pickup', 'delivery')),
  assigned_pro_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timeline
  scheduled_date DATE NOT NULL,
  scheduled_time_slot VARCHAR(20) NOT NULL,
  
  timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_slot_order ON booking_slot_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_booking_slot_pro ON booking_slot_assignments(assigned_pro_id);
CREATE INDEX IF NOT EXISTS idx_booking_slot_scheduled ON booking_slot_assignments(scheduled_date, scheduled_time_slot);
```

### 5. Helper Functions

```sql
-- Get available pickup slots for a given date and location
CREATE OR REPLACE FUNCTION get_available_pickup_slots(
  p_date DATE,
  p_zip VARCHAR(10)
) RETURNS TABLE (
  time_slot VARCHAR,
  available_pros BIGINT,
  remaining_capacity BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT(TO_CHAR(s.start_time, 'HH24:00'), '-', TO_CHAR(s.end_time, 'HH24:00')) as time_slot,
    COUNT(DISTINCT psa.pro_id) as available_pros,
    SUM(psa.capacity_slots - psa.booked_slots) as remaining_capacity
  FROM availability_slots s
  LEFT JOIN pro_slot_assignments psa ON s.id = psa.slot_id
  WHERE s.slot_date = p_date
    AND s.slot_type = 'pickup'
    AND s.is_available = true
    AND (s.service_area_zip = p_zip OR s.service_area_zip IS NULL)
    AND (psa.capacity_slots - psa.booked_slots) > 0
  GROUP BY s.id, s.start_time, s.end_time
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get available delivery slots for a given date and location
CREATE OR REPLACE FUNCTION get_available_delivery_slots(
  p_date DATE,
  p_zip VARCHAR(10)
) RETURNS TABLE (
  time_slot VARCHAR,
  available_pros BIGINT,
  remaining_capacity BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT(TO_CHAR(s.start_time, 'HH24:00'), '-', TO_CHAR(s.end_time, 'HH24:00')) as time_slot,
    COUNT(DISTINCT psa.pro_id) as available_pros,
    SUM(psa.capacity_slots - psa.booked_slots) as remaining_capacity
  FROM availability_slots s
  LEFT JOIN pro_slot_assignments psa ON s.id = psa.slot_id
  WHERE s.slot_date = p_date
    AND s.slot_type = 'delivery'
    AND s.is_available = true
    AND (s.service_area_zip = p_zip OR s.service_area_zip IS NULL)
    AND (psa.capacity_slots - psa.booked_slots) > 0
  GROUP BY s.id, s.start_time, s.end_time
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- Assign booking to a specific slot
CREATE OR REPLACE FUNCTION assign_booking_to_slot(
  p_order_id UUID,
  p_slot_id UUID,
  p_pro_id UUID,
  p_booking_type VARCHAR,
  p_scheduled_date DATE,
  p_scheduled_time_slot VARCHAR
) RETURNS TABLE (
  success BOOLEAN,
  assignment_id UUID,
  message TEXT
) AS $$
DECLARE
  v_pro_slot_id UUID;
  v_current_booked INT;
  v_capacity INT;
BEGIN
  -- Get the pro slot assignment
  SELECT id INTO v_pro_slot_id
  FROM pro_slot_assignments
  WHERE slot_id = p_slot_id AND pro_id = p_pro_id AND is_active = true
  LIMIT 1;
  
  IF v_pro_slot_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'No available pro for this slot'::TEXT;
    RETURN;
  END IF;
  
  -- Check capacity
  SELECT booked_slots, capacity_slots INTO v_current_booked, v_capacity
  FROM pro_slot_assignments
  WHERE id = v_pro_slot_id;
  
  IF v_current_booked >= v_capacity THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Slot is full'::TEXT;
    RETURN;
  END IF;
  
  -- Create booking assignment
  INSERT INTO booking_slot_assignments (
    order_id,
    pro_slot_assignment_id,
    booking_type,
    assigned_pro_id,
    scheduled_date,
    scheduled_time_slot
  ) VALUES (
    p_order_id,
    v_pro_slot_id,
    p_booking_type,
    p_pro_id,
    p_scheduled_date,
    p_scheduled_time_slot
  ) RETURNING id INTO v_pro_slot_id;
  
  -- Increment booked count
  UPDATE pro_slot_assignments
  SET booked_slots = booked_slots + 1
  WHERE id = v_pro_slot_id;
  
  RETURN QUERY SELECT true, v_pro_slot_id, 'Booking assigned successfully'::TEXT;
END;
$$ LANGUAGE plpgsql VOLATILE;
```

---

## 🔌 Backend API Endpoints

### 1. POST /api/scheduling/pickup-slots

**Purpose:** Get available pickup time slots for a date

```typescript
// File: /app/api/scheduling/pickup-slots/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, address, duration_minutes } = body

    if (!date || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: date, address' },
        { status: 400 }
      )
    }

    // Extract ZIP code from address (simplified - improve with Google Places API)
    const zipMatch = address.match(/(\d{5})/)
    const zip = zipMatch ? zipMatch[1] : '00000'

    // Query available slots
    const { data, error } = await supabaseAdmin.rpc(
      'get_available_pickup_slots',
      {
        p_date: date,
        p_zip: zip
      }
    )

    if (error) {
      console.error('[Scheduling] Error fetching slots:', error)
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      )
    }

    // Format response
    const slots = data.map((slot: any) => ({
      timeSlot: slot.time_slot,
      availablePros: slot.available_pros,
      estimatedEta: null
    }))

    return NextResponse.json({
      success: true,
      date,
      slots,
      totalAvailable: slots.length
    })
  } catch (error) {
    console.error('[Scheduling] Pickup slots error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 2. POST /api/scheduling/delivery-slots

**Purpose:** Get available delivery time slots for a date

```typescript
// File: /app/api/scheduling/delivery-slots/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, address, duration_minutes } = body

    if (!date || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: date, address' },
        { status: 400 }
      )
    }

    // Extract ZIP code
    const zipMatch = address.match(/(\d{5})/)
    const zip = zipMatch ? zipMatch[1] : '00000'

    // Query available slots
    const { data, error } = await supabaseAdmin.rpc(
      'get_available_delivery_slots',
      {
        p_date: date,
        p_zip: zip
      }
    )

    if (error) {
      console.error('[Scheduling] Error fetching slots:', error)
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      )
    }

    // Format response
    const slots = data.map((slot: any) => ({
      timeSlot: slot.time_slot,
      availablePros: slot.available_pros,
      estimatedReadyTime: null
    }))

    return NextResponse.json({
      success: true,
      date,
      slots,
      totalAvailable: slots.length
    })
  } catch (error) {
    console.error('[Scheduling] Delivery slots error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3. POST /api/orders (Updated)

**Changes:** Add scheduling fields to order creation

```typescript
// Add to /app/api/orders/route.ts

const orderPayload = {
  // ... existing fields ...
  pickup_date: body.pickup_date,           // NEW
  pickup_time_slot: body.pickup_time_slot, // NEW
  delivery_date: body.delivery_date,       // NEW
  delivery_time_slot: body.delivery_time_slot, // NEW
  scheduled_at: new Date().toISOString()   // NEW
}

// After order creation, assign to slot:
if (body.pickup_date && body.pickup_time_slot) {
  await supabaseAdmin.rpc('assign_booking_to_slot', {
    p_order_id: createdOrder.id,
    p_slot_id: selectedSlotId, // Need to find based on date/time
    p_pro_id: assignedProId,
    p_booking_type: 'pickup',
    p_scheduled_date: body.pickup_date,
    p_scheduled_time_slot: body.pickup_time_slot
  })
}
```

---

## 📦 Database Seeding (Test Data)

```sql
-- Insert sample availability slots for next 30 days
WITH RECURSIVE date_range AS (
  SELECT CURRENT_DATE + 1 as slot_date
  UNION ALL
  SELECT slot_date + 1 FROM date_range
  WHERE slot_date < CURRENT_DATE + 31
),
time_slots AS (
  SELECT '08:00'::TIME as start_time, '10:00'::TIME as end_time
  UNION ALL
  SELECT '10:00'::TIME, '12:00'::TIME
  UNION ALL
  SELECT '12:00'::TIME, '14:00'::TIME
  UNION ALL
  SELECT '14:00'::TIME, '16:00'::TIME
  UNION ALL
  SELECT '16:00'::TIME, '18:00'::TIME
)
INSERT INTO availability_slots (slot_date, start_time, end_time, slot_type, total_capacity, service_area_zip)
SELECT dr.slot_date, ts.start_time, ts.end_time, 
  CASE WHEN (EXTRACT(DOW FROM dr.slot_date)::INT % 2 = 0) THEN 'pickup' ELSE 'delivery' END,
  10, '10001'
FROM date_range dr
CROSS JOIN time_slots ts
WHERE EXTRACT(DOW FROM dr.slot_date)::INT NOT IN (0, 6); -- Skip Sundays and Saturdays
```

---

## ✅ Implementation Checklist

**Database:**
- [ ] Add `pickup_date`, `pickup_time_slot`, `delivery_date`, `delivery_time_slot` columns to orders table
- [ ] Create `availability_slots` table
- [ ] Create `pro_slot_assignments` table
- [ ] Create `booking_slot_assignments` table
- [ ] Create PL/pgSQL functions: `get_available_pickup_slots`, `get_available_delivery_slots`, `assign_booking_to_slot`
- [ ] Run seeding script for test data
- [ ] Create RLS policies for new tables

**API:**
- [ ] Create `/api/scheduling/pickup-slots` endpoint
- [ ] Create `/api/scheduling/delivery-slots` endpoint
- [ ] Update `/api/orders` to save scheduling fields
- [ ] Add webhook handler to call `assign_booking_to_slot` function

**Frontend:**
- [ ] Update steps array (8 steps total)
- [ ] Add scheduling state variables
- [ ] Create `fetchAvailableSlots` function
- [ ] Add Step 8 UI component
- [ ] Update validation logic for new steps
- [ ] Rename final review to "Review & Confirm" (Step 9)
- [ ] Update button navigation logic

**Testing:**
- [ ] Test pickup slot fetching
- [ ] Test delivery slot fetching
- [ ] Test slot selection and validation
- [ ] Test order creation with scheduling data
- [ ] Test pro assignment to slots
- [ ] Test capacity management

---

**Document Version:** 1.0  
**Status:** Ready to Implement  
**Last Updated:** May 1, 2026
