# ⚡ SCHEDULING SYSTEM - QUICK REFERENCE CARD

## 🎯 WHAT YOU NEED TO DO (Right Now)

### Step 1: Copy This SQL
```sql
-- STEP 1: Add columns to existing orders table
ALTER TABLE IF EXISTS orders 
ADD COLUMN IF NOT EXISTS pickup_date DATE,
ADD COLUMN IF NOT EXISTS pickup_time_slot VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivery_time_slot VARCHAR(20),
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_orders_pickup_date ON orders(pickup_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_date_slot ON orders(pickup_date, pickup_time_slot);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date_slot ON orders(delivery_date, delivery_time_slot);

-- STEP 2: Create availability_slots table
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type VARCHAR(20) NOT NULL CHECK (slot_type IN ('pickup', 'delivery')),
  total_capacity INT DEFAULT 10,
  booked_count INT DEFAULT 0,
  service_area_zip VARCHAR(10),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_type ON availability_slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_availability_slots_available ON availability_slots(is_available, slot_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_slots_unique 
  ON availability_slots(slot_date, start_time, end_time, slot_type, COALESCE(service_area_zip, ''));

-- STEP 3: Create pro_slot_assignments table
CREATE TABLE IF NOT EXISTS pro_slot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('pickup', 'delivery')),
  capacity_slots INT DEFAULT 5,
  booked_slots INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_pro ON pro_slot_assignments(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_slot ON pro_slot_assignments(slot_id);
CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_active ON pro_slot_assignments(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pro_slot_unique 
  ON pro_slot_assignments(slot_id, pro_id, assignment_type);

-- STEP 4: Create booking_slot_assignments table
CREATE TABLE IF NOT EXISTS booking_slot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pro_slot_assignment_id UUID NOT NULL REFERENCES pro_slot_assignments(id) ON DELETE CASCADE,
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('pickup', 'delivery')),
  assigned_pro_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_slot_assignments_order ON booking_slot_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_booking_slot_assignments_pro ON booking_slot_assignments(assigned_pro_id);
CREATE INDEX IF NOT EXISTS idx_booking_slot_assignments_assignment ON booking_slot_assignments(pro_slot_assignment_id);

-- STEP 5: Create PL/pgSQL functions
CREATE OR REPLACE FUNCTION get_available_pickup_slots(
  p_date DATE,
  p_zip VARCHAR,
  p_duration_minutes INT DEFAULT 30
)
RETURNS TABLE (
  time_slot VARCHAR,
  available_pros INT,
  remaining_capacity INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT(TO_CHAR(a.start_time, 'HH24:MI'), '-', TO_CHAR(a.end_time, 'HH24:MI'))::VARCHAR as time_slot,
    COUNT(DISTINCT psa.pro_id)::INT as available_pros,
    (a.total_capacity - a.booked_count)::INT as remaining_capacity
  FROM availability_slots a
  LEFT JOIN pro_slot_assignments psa ON a.id = psa.slot_id 
    AND psa.assignment_type = 'pickup' 
    AND psa.is_active = true
    AND psa.booked_slots < psa.capacity_slots
  WHERE 
    a.slot_date = p_date
    AND a.slot_type = 'pickup'
    AND a.is_available = true
    AND (a.service_area_zip = p_zip OR a.service_area_zip IS NULL)
    AND a.booked_count < a.total_capacity
  GROUP BY a.id, a.start_time, a.end_time, a.total_capacity, a.booked_count
  ORDER BY a.start_time;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_available_delivery_slots(
  p_date DATE,
  p_zip VARCHAR,
  p_duration_minutes INT DEFAULT 30
)
RETURNS TABLE (
  time_slot VARCHAR,
  available_pros INT,
  remaining_capacity INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT(TO_CHAR(a.start_time, 'HH24:MI'), '-', TO_CHAR(a.end_time, 'HH24:MI'))::VARCHAR as time_slot,
    COUNT(DISTINCT psa.pro_id)::INT as available_pros,
    (a.total_capacity - a.booked_count)::INT as remaining_capacity
  FROM availability_slots a
  LEFT JOIN pro_slot_assignments psa ON a.id = psa.slot_id 
    AND psa.assignment_type = 'delivery' 
    AND psa.is_active = true
    AND psa.booked_slots < psa.capacity_slots
  WHERE 
    a.slot_date = p_date
    AND a.slot_type = 'delivery'
    AND a.is_available = true
    AND (a.service_area_zip = p_zip OR a.service_area_zip IS NULL)
    AND a.booked_count < a.total_capacity
  GROUP BY a.id, a.start_time, a.end_time, a.total_capacity, a.booked_count
  ORDER BY a.start_time;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_booking_to_slot(
  p_order_id UUID,
  p_pro_id UUID,
  p_slot_id UUID,
  p_assignment_type VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM availability_slots 
    WHERE id = p_slot_id AND booked_count < total_capacity
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO booking_slot_assignments (
    order_id,
    pro_slot_assignment_id,
    assignment_type,
    assigned_pro_id
  )
  SELECT p_order_id, id, p_assignment_type, p_pro_id
  FROM pro_slot_assignments
  WHERE slot_id = p_slot_id AND pro_id = p_pro_id AND assignment_type = p_assignment_type;

  UPDATE availability_slots SET booked_count = booked_count + 1 WHERE id = p_slot_id;
  UPDATE pro_slot_assignments SET booked_slots = booked_slots + 1 
  WHERE slot_id = p_slot_id AND pro_id = p_pro_id AND assignment_type = p_assignment_type;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_slot_available(p_slot_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_available BOOLEAN;
BEGIN
  SELECT (booked_count < total_capacity) INTO v_available
  FROM availability_slots WHERE id = p_slot_id;
  RETURN COALESCE(v_available, false);
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Enable RLS
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_slot_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_slot_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability slots" 
  ON availability_slots FOR SELECT USING (true);

CREATE POLICY "Anyone can view pro assignments for available slots" 
  ON pro_slot_assignments FOR SELECT USING (is_active);

CREATE POLICY "Users can view their own slot assignments" 
  ON booking_slot_assignments FOR SELECT USING (
    auth.uid() = assigned_pro_id OR 
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );

-- STEP 7: Sample data
INSERT INTO availability_slots (slot_date, start_time, end_time, slot_type, total_capacity, is_available)
SELECT 
  CURRENT_DATE + (i || ' days')::INTERVAL,
  ('08:00'::TIME + (j * 120 || ' minutes')::INTERVAL),
  ('08:00'::TIME + ((j + 1) * 120 || ' minutes')::INTERVAL),
  CASE WHEN MOD(i + j, 2) = 0 THEN 'pickup' ELSE 'delivery' END,
  CASE WHEN MOD(i + j, 2) = 0 THEN 15 ELSE 12 END,
  true
FROM generate_series(1, 30) i, generate_series(0, 4) j
WHERE NOT EXISTS (
  SELECT 1 FROM availability_slots 
  WHERE slot_date = CURRENT_DATE + (i || ' days')::INTERVAL
);

SELECT 'Setup Complete! ✅' as status;
```

### Step 2: Paste in Supabase
1. Go to: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Paste entire SQL above
5. Click **Run** (Cmd+Enter on Mac)
6. Wait for: "Setup Complete! ✅"

### Step 3: Test Locally
```bash
cd /Users/lukaverde/Desktop/Website.BUsiness
npm run dev
# Go to: http://localhost:3000/booking-hybrid
```

### Step 4: Verify
- [ ] SQL ran successfully in Supabase
- [ ] New tables appear in Table Editor
- [ ] Dev server running
- [ ] Booking flow loads
- [ ] Step 8 shows date picker
- [ ] Step 8 shows time slots
- [ ] Can select times
- [ ] Step 9 shows scheduled times

---

## 📁 FILES CREATED

```
/app/api/scheduling/pickup-slots.ts      ← API endpoint
/app/api/scheduling/delivery-slots.ts    ← API endpoint
SCHEDULING_ACTION_NOW.md                 ← Quick action guide
SCHEDULING_IMPLEMENTATION_COMPLETE.md    ← Full implementation
SCHEDULING_COMPLETE_SUMMARY.md           ← This summary
MOBILE_APP_SCHEDULING_STEP.md            ← Mobile app code
```

---

## 📊 WHAT GETS CREATED IN DATABASE

| Table | Purpose |
|-------|---------|
| `availability_slots` | Available time windows (pickup & delivery) |
| `pro_slot_assignments` | Which pros work which slots |
| `booking_slot_assignments` | Which order assigned to which pro |
| `orders` (updated) | 4 new columns for scheduling |

---

## 🔌 API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scheduling/pickup-slots` | POST | Get pickup times for date |
| `/api/scheduling/delivery-slots` | POST | Get delivery times for date |

**Request:**
```json
{
  "date": "2026-05-15",
  "address": "123 Main St, Sydney NSW 2000",
  "duration_minutes": 30
}
```

**Response:**
```json
{
  "success": true,
  "slots": [
    {
      "timeSlot": "08:00-10:00",
      "availablePros": 3,
      "remainingCapacity": 5
    }
  ]
}
```

---

## ✨ BOOKING FLOW

```
Step 1-7: Normal (pickup location, care, weight, etc)
    ↓
Step 8: Pick times (NEW)
    ├─ Select pickup date
    ├─ Select pickup time
    ├─ Delivery date auto-calculated
    └─ Select delivery time
    ↓
Step 9: Review & pay
    └─ Shows all details including times
```

---

## 🧪 TEST

```bash
# Test API directly
curl -X POST http://localhost:3000/api/scheduling/pickup-slots \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-15","address":"123 Main St, Sydney NSW 2000"}'
```

---

## 🚀 DEPLOYMENT

1. ✅ Frontend: Already done
2. ✅ API: Already done  
3. ⏳ Database: Run SQL in Supabase
4. ⏳ Test: Walk through locally
5. ⏳ Deploy: Push to production

---

## 📞 NEXT STEPS

1. **Now:** Run the SQL above in Supabase
2. **Then:** Test locally (`npm run dev`)
3. **Finally:** Deploy to production
4. **Mobile:** Use `MOBILE_APP_SCHEDULING_STEP.md` code

---

**Status:** Ready to Deploy ✅  
**Created:** May 1, 2026
