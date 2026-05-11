# ⚡ Scheduling Integration - Quick Start Guide

**Status:** Step-by-step instructions ready to implement  
**Time Estimate:** 2-3 hours total  
**Complexity:** Medium

---

## 🚀 Implementation Order

### Phase 1: Database Setup (15 minutes)

1. **Go to Supabase SQL Editor**
2. **Create new query**
3. **Copy entire contents of:** `SCHEDULING_SYSTEM_MIGRATION.sql`
4. **Click RUN** and wait for "Executed successfully"
5. **Verify** by running sample query at bottom

✅ All tables, functions, and policies now created

---

### Phase 2: Backend API Routes (30 minutes)

Create two API endpoints:

**File 1: `/app/api/scheduling/pickup-slots/route.ts`**

```typescript
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

    // Extract ZIP from address
    const zipMatch = address.match(/(\d{5})/)
    const zip = zipMatch ? zipMatch[1] : '00000'

    // Query function
    const { data, error } = await supabaseAdmin.rpc(
      'get_available_pickup_slots',
      { p_date: date, p_zip: zip }
    )

    if (error) throw error

    const slots = data.map((slot: any) => ({
      timeSlot: slot.time_slot,
      availablePros: Number(slot.available_pros),
      remainingCapacity: Number(slot.remaining_capacity)
    }))

    return NextResponse.json({ success: true, date, slots })
  } catch (error) {
    console.error('[Scheduling] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
  }
}
```

**File 2: `/app/api/scheduling/delivery-slots/route.ts`**

```typescript
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

    // Extract ZIP from address
    const zipMatch = address.match(/(\d{5})/)
    const zip = zipMatch ? zipMatch[1] : '00000'

    // Query function
    const { data, error } = await supabaseAdmin.rpc(
      'get_available_delivery_slots',
      { p_date: date, p_zip: zip }
    )

    if (error) throw error

    const slots = data.map((slot: any) => ({
      timeSlot: slot.time_slot,
      availablePros: Number(slot.available_pros),
      remainingCapacity: Number(slot.remaining_capacity)
    }))

    return NextResponse.json({ success: true, date, slots })
  } catch (error) {
    console.error('[Scheduling] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
  }
}
```

---

### Phase 3: Frontend Integration (1.5 hours)

**In `/app/booking-hybrid/page.tsx`:**

#### 1. Update Steps Array (Line ~80-90)

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

#### 2. Update BookingData State (Line ~55-75)

Add these fields after `deliveryAddressDetails`:

```typescript
// Step 8: Scheduling
pickupDate: '',
pickupTimeSlot: '',
deliveryDate: '',
deliveryTimeSlot: '',
selectedProId: '',
```

#### 3. Add State Variables (Line ~30-40)

Add these new state declarations:

```typescript
const [availablePickupSlots, setAvailablePickupSlots] = useState<any[]>([])
const [availableDeliverySlots, setAvailableDeliverySlots] = useState<any[]>([])
const [slotsLoading, setSlotsLoading] = useState(false)
const [slotsError, setSlotsError] = useState('')
const [selectedPickupDate, setSelectedPickupDate] = useState<string>('')
const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string>('')
```

#### 4. Add fetchAvailableSlots Function (Before render)

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
        duration_minutes: 30
      })
    })
    
    if (!pickupResponse.ok) throw new Error('Failed to fetch pickup slots')
    const pickupData = await pickupResponse.json()
    setAvailablePickupSlots(pickupData.slots || [])
    
    // Calculate delivery date
    const pickupDateObj = new Date(pickupDate)
    let deliveryDateObj = new Date(pickupDateObj)
    
    if (bookingData.deliverySpeed === 'standard') {
      deliveryDateObj.setDate(deliveryDateObj.getDate() + 2)
    } else {
      deliveryDateObj.setDate(deliveryDateObj.getDate() + 1)
    }
    
    const deliveryDateStr = deliveryDateObj.toISOString().split('T')[0]
    
    // Fetch delivery slots
    const deliveryResponse = await fetch('/api/scheduling/delivery-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: deliveryDateStr,
        address: bookingData.deliveryAddress,
        duration_minutes: 30
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

#### 5. Add Step 8 UI (Before Step 7 currentStep === 7)

Find the line `{/* STEP 7: Review & Confirm */}` and add this before it:

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
      
      {/* Pickup Date & Time */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-dark mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-primary" />
            Pickup Date & Time
          </div>
        </label>
        
        <input
          type="date"
          min={new Date().toISOString().split('T')[0]}
          value={selectedPickupDate}
          onChange={(e) => {
            setSelectedPickupDate(e.target.value)
            setBookingData({ ...bookingData, pickupDate: e.target.value, pickupTimeSlot: '' })
            if (e.target.value) {
              fetchAvailableSlots(e.target.value)
            }
          }}
          className="w-full border-2 border-gray rounded-lg p-3 focus:border-primary outline-none mb-4"
        />
        
        {slotsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : availablePickupSlots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availablePickupSlots.map((slot: any) => (
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
                <div className="text-xs mt-1">{slot.availablePros} pro{slot.availablePros !== 1 ? 's' : ''} available</div>
              </button>
            ))}
          </div>
        ) : selectedPickupDate && !slotsLoading ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">No available slots for this date.</p>
          </div>
        ) : null}
      </div>
      
      {/* Delivery Date & Time */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-dark mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={18} className="text-primary" />
            Delivery Date & Time
          </div>
        </label>
        
        <div className="mb-3 p-3 bg-mint rounded-lg">
          <p className="text-sm text-dark">
            ✓ Estimated: {bookingData.deliverySpeed === 'standard' ? '24-48 hours' : '12-18 hours'}
          </p>
        </div>
        
        {slotsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : availableDeliverySlots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableDeliverySlots.map((slot: any) => (
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
                <div className="text-xs mt-1">{slot.availablePros} pro{slot.availablePros !== 1 ? 's' : ''} available</div>
              </button>
            ))}
          </div>
        ) : selectedDeliveryDate && !slotsLoading ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">No available slots for this date.</p>
          </div>
        ) : null}
      </div>
    </Card>
  </div>
)}
```

#### 6. Update Validation (Find `isValidStep`)

Add this case before the default:

```typescript
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
```

#### 7. Update handleSubmitOrder

Modify order payload to include:

```typescript
const orderPayload = {
  // ... existing fields ...
  pickup_date: bookingData.pickupDate,
  pickup_time_slot: bookingData.pickupTimeSlot,
  delivery_date: bookingData.deliveryDate,
  delivery_time_slot: bookingData.deliveryTimeSlot,
  // ... rest ...
}
```

---

## ✅ Verification Checklist

- [ ] Database migration ran successfully
- [ ] Sample slot query returns data
- [ ] Two API endpoints created and accessible
- [ ] Steps array updated in booking page
- [ ] BookingData state includes scheduling fields
- [ ] fetchAvailableSlots function integrated
- [ ] Step 8 UI renders correctly
- [ ] Date picker works and loads slots
- [ ] Time slot buttons select correctly
- [ ] Validation prevents incomplete steps
- [ ] Order submission includes scheduling data
- [ ] Test booking flow end-to-end

---

## 🧪 Quick Test

1. Go to `/booking-hybrid`
2. Complete steps 1-7
3. On Step 8, select a pickup date
4. Verify slots load and show available pros
5. Select pickup and delivery times
6. Proceed to review and confirm
7. Check Supabase to see order with scheduling data

---

## 📊 File Summary

| File | Purpose | Status |
|------|---------|--------|
| `SCHEDULING_SYSTEM_MIGRATION.sql` | Database schema & functions | Ready |
| `/api/scheduling/pickup-slots/route.ts` | API endpoint for pickup slots | Create |
| `/api/scheduling/delivery-slots/route.ts` | API endpoint for delivery slots | Create |
| `/app/booking-hybrid/page.tsx` | Frontend integration | Update |

---

**Last Updated:** May 1, 2026  
**Estimated Time:** 2-3 hours  
**Difficulty:** Medium
