-- ============================================================================
-- SCHEDULING SYSTEM - SQL MIGRATION
-- File: SCHEDULING_SYSTEM_MIGRATION.sql
-- Purpose: Add scheduling tables and functions for booking flow
-- Date: May 1, 2026
-- ============================================================================

-- ============================================================================
-- STEP 1: Update Orders Table with Scheduling Columns
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time_slot VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time_slot VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP DEFAULT NOW();

-- Create indexes for efficient scheduling queries
CREATE INDEX IF NOT EXISTS idx_orders_pickup_date ON orders(pickup_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_date_slot ON orders(pickup_date, pickup_time_slot);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date_slot ON orders(delivery_date, delivery_time_slot);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_at ON orders(scheduled_at);

-- ============================================================================
-- STEP 2: Create Availability Slots Table
-- ============================================================================
-- Stores available time slots for pickup and delivery
-- Allows dynamic slot management (admins can create/remove slots)
-- Tracks capacity per slot

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
  
  -- Location reference (for geographically-specific slots)
  service_area_zip VARCHAR(10),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_type ON availability_slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_availability_slots_available ON availability_slots(is_available, slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_zip ON availability_slots(service_area_zip);
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_slots_unique 
  ON availability_slots(slot_date, start_time, end_time, slot_type, COALESCE(service_area_zip, ''));

-- ============================================================================
-- STEP 3: Create Pro Slot Assignments Table
-- ============================================================================
-- Maps which pros are working which slots
-- Allows pros to have different capacity per slot (e.g., max 5 pickups in 8-10am)
-- Enables shift-based scheduling

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
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_pro ON pro_slot_assignments(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_slot ON pro_slot_assignments(slot_id);
CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_active ON pro_slot_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_pro_slot_assignments_capacity ON pro_slot_assignments(is_active, booked_slots, capacity_slots);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pro_slot_unique 
  ON pro_slot_assignments(slot_id, pro_id, assignment_type);

-- ============================================================================
-- STEP 4: Create Booking Slot Assignments Table
-- ============================================================================
-- Links orders to specific slots and pros
-- Immutable record of which order was scheduled with which pro at which time
-- Used for pro assignment and customer communication

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
  
  -- Status
  completed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_slot_order ON booking_slot_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_booking_slot_pro ON booking_slot_assignments(assigned_pro_id);
CREATE INDEX IF NOT EXISTS idx_booking_slot_scheduled ON booking_slot_assignments(scheduled_date, scheduled_time_slot);
CREATE INDEX IF NOT EXISTS idx_booking_slot_completed ON booking_slot_assignments(completed_at);
CREATE INDEX IF NOT EXISTS idx_booking_slot_pro_date ON booking_slot_assignments(assigned_pro_id, scheduled_date);

-- ============================================================================
-- STEP 5: Create PL/pgSQL Functions
-- ============================================================================

-- Function: Get available pickup slots for a given date and location
-- Returns time slots with count of available pros and remaining capacity
CREATE OR REPLACE FUNCTION get_available_pickup_slots(
  p_date DATE,
  p_zip VARCHAR(10)
) RETURNS TABLE (
  time_slot TEXT,
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
  LEFT JOIN pro_slot_assignments psa ON s.id = psa.slot_id AND psa.is_active = true
  WHERE s.slot_date = p_date
    AND s.slot_type = 'pickup'
    AND s.is_available = true
    AND (s.service_area_zip = p_zip OR s.service_area_zip IS NULL)
    AND (s.booked_count < s.total_capacity)
  GROUP BY s.id, s.start_time, s.end_time, s.start_time
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get available delivery slots for a given date and location
CREATE OR REPLACE FUNCTION get_available_delivery_slots(
  p_date DATE,
  p_zip VARCHAR(10)
) RETURNS TABLE (
  time_slot TEXT,
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
  LEFT JOIN pro_slot_assignments psa ON s.id = psa.slot_id AND psa.is_active = true
  WHERE s.slot_date = p_date
    AND s.slot_type = 'delivery'
    AND s.is_available = true
    AND (s.service_area_zip = p_zip OR s.service_area_zip IS NULL)
    AND (s.booked_count < s.total_capacity)
  GROUP BY s.id, s.start_time, s.end_time, s.start_time
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Assign a booking to a specific slot and pro
-- Handles validation, capacity checks, and updates
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
  v_slot_capacity INT;
  v_slot_booked INT;
BEGIN
  -- Validate input
  IF p_order_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Order ID is required'::TEXT;
    RETURN;
  END IF;
  
  IF p_pro_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Pro ID is required'::TEXT;
    RETURN;
  END IF;
  
  -- Get the pro slot assignment
  SELECT id INTO v_pro_slot_id
  FROM pro_slot_assignments
  WHERE slot_id = p_slot_id 
    AND pro_id = p_pro_id 
    AND is_active = true
  LIMIT 1;
  
  IF v_pro_slot_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'No available pro assignment for this slot'::TEXT;
    RETURN;
  END IF;
  
  -- Check pro's slot capacity
  SELECT booked_slots, capacity_slots INTO v_current_booked, v_capacity
  FROM pro_slot_assignments
  WHERE id = v_pro_slot_id;
  
  IF v_current_booked >= v_capacity THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Pro has reached capacity for this slot'::TEXT;
    RETURN;
  END IF;
  
  -- Check slot's overall capacity
  SELECT booked_count, total_capacity INTO v_slot_booked, v_slot_capacity
  FROM availability_slots
  WHERE id = p_slot_id;
  
  IF v_slot_booked >= v_slot_capacity THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Slot has reached total capacity'::TEXT;
    RETURN;
  END IF;
  
  BEGIN
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
    
    -- Increment pro's booked count
    UPDATE pro_slot_assignments
    SET booked_slots = booked_slots + 1, updated_at = NOW()
    WHERE id = v_pro_slot_id;
    
    -- Increment slot's overall booked count
    UPDATE availability_slots
    SET booked_count = booked_count + 1, updated_at = NOW()
    WHERE id = p_slot_id;
    
    RETURN QUERY SELECT true, v_pro_slot_id, 'Booking assigned successfully'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Error assigning booking: ' || SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function: Check if a slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
  p_slot_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_booked INT;
  v_capacity INT;
  v_is_available BOOLEAN;
BEGIN
  SELECT booked_count, total_capacity, is_available 
  INTO v_booked, v_capacity, v_is_available
  FROM availability_slots
  WHERE id = p_slot_id;
  
  IF v_is_available = false THEN
    RETURN false;
  END IF;
  
  IF v_booked >= v_capacity THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get pro assignments for a specific date
CREATE OR REPLACE FUNCTION get_pro_assignments_for_date(
  p_pro_id UUID,
  p_date DATE
) RETURNS TABLE (
  slot_id UUID,
  time_slot TEXT,
  assignment_type VARCHAR,
  booked_count INT,
  capacity INT,
  remaining_capacity INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    CONCAT(TO_CHAR(s.start_time, 'HH24:00'), '-', TO_CHAR(s.end_time, 'HH24:00')) as time_slot,
    psa.assignment_type,
    psa.booked_slots,
    psa.capacity_slots,
    (psa.capacity_slots - psa.booked_slots) as remaining_capacity
  FROM availability_slots s
  JOIN pro_slot_assignments psa ON s.id = psa.slot_id
  WHERE psa.pro_id = p_pro_id
    AND s.slot_date = p_date
    AND psa.is_active = true
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 6: Create Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_slot_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_slot_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (Supabase workaround)
DROP POLICY IF EXISTS "Anyone can view available slots" ON availability_slots;
DROP POLICY IF EXISTS "Admins manage all availability slots" ON availability_slots;
DROP POLICY IF EXISTS "Pros view own slot assignments" ON pro_slot_assignments;
DROP POLICY IF EXISTS "Admins manage all pro slot assignments" ON pro_slot_assignments;
DROP POLICY IF EXISTS "Users view own booking assignments" ON booking_slot_assignments;
DROP POLICY IF EXISTS "System inserts booking assignments" ON booking_slot_assignments;
DROP POLICY IF EXISTS "Admins update booking assignments" ON booking_slot_assignments;
DROP POLICY IF EXISTS "Customers view booking assignments for their orders" ON booking_slot_assignments;

-- Availability Slots Policies
-- Public: View available slots
CREATE POLICY "Anyone can view available slots"
  ON availability_slots FOR SELECT
  USING (is_available = true);

-- Admin: Full access
CREATE POLICY "Admins manage all availability slots"
  ON availability_slots FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Pro Slot Assignments Policies
-- Pros: View their own assignments
CREATE POLICY "Pros view own slot assignments"
  ON pro_slot_assignments FOR SELECT
  USING (pro_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Admin: Full access
CREATE POLICY "Admins manage all pro slot assignments"
  ON pro_slot_assignments FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Booking Slot Assignments Policies
-- Users: View their own bookings
CREATE POLICY "Users view own booking assignments"
  ON booking_slot_assignments FOR SELECT
  USING (
    assigned_pro_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Admins/System: Insert/Update
CREATE POLICY "System inserts booking assignments"
  ON booking_slot_assignments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins update booking assignments"
  ON booking_slot_assignments FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Customers can view their order's booking assignments
CREATE POLICY "Customers view booking assignments for their orders"
  ON booking_slot_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id AND orders.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 7: Sample Data for Testing (OPTIONAL)
-- ============================================================================

-- Create availability slots for next 30 days (5 time slots per day: 08:00-18:00 with 6pm cutoff)
-- Runs once - safe to run multiple times due to unique constraints
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
SELECT 
  dr.slot_date, 
  ts.start_time, 
  ts.end_time, 
  CASE 
    WHEN (EXTRACT(DOW FROM dr.slot_date)::INT % 2 = 0) THEN 'pickup' 
    ELSE 'delivery' 
  END as slot_type,
  10,
  NULL -- All service areas
FROM date_range dr
CROSS JOIN time_slots ts
WHERE EXTRACT(DOW FROM dr.slot_date)::INT NOT IN (0, 6) -- Exclude Sundays (0) and Saturdays (6)
ON CONFLICT DO NOTHING;

-- Assign real existing users to slots with realistic capacity (3-4 pros per slot, 3-5 capacity each)
-- This creates realistic availability for the booking flow
-- Only assigns if users actually exist in auth.users table
INSERT INTO pro_slot_assignments (slot_id, pro_id, assignment_type, capacity_slots, booked_slots, is_active)
SELECT DISTINCT
  s.id,
  u.id,
  s.slot_type,
  (RANDOM() * 2 + 3)::INT, -- Random capacity: 3-5
  0,
  true
FROM availability_slots s
CROSS JOIN (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'pro' OR raw_user_meta_data->>'role' = 'professional'
  LIMIT 4
) u
WHERE s.created_at > NOW() - INTERVAL '5 minutes' -- Only newly created slots
ON CONFLICT (slot_id, pro_id, assignment_type) DO NOTHING;

-- If no pros exist yet, create sample slots without assignments (will show 0 available_pros)
-- This is safe and won't cause errors - just means no pros are assigned yet

-- ============================================================================
-- STEP 8: Verify Creation
-- ============================================================================

-- Check all new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'availability_slots', 
  'pro_slot_assignments', 
  'booking_slot_assignments'
)
ORDER BY table_name;

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_available_pickup_slots',
  'get_available_delivery_slots',
  'assign_booking_to_slot',
  'is_slot_available',
  'get_pro_assignments_for_date'
)
ORDER BY routine_name;

-- Sample query: Get pickup slots for tomorrow in 10001 zip
SELECT * FROM get_available_pickup_slots(CURRENT_DATE + 1, '10001');

-- Sample query: Get delivery slots for tomorrow in 10001 zip
SELECT * FROM get_available_delivery_slots(CURRENT_DATE + 1, '10001');
