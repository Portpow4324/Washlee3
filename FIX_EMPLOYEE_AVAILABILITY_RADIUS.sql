-- Ensures employee availability can power booking slot counts.
-- Run this in Supabase SQL Editor if service radius is not saving.

ALTER TABLE public.employee_availability
ADD COLUMN IF NOT EXISTS availability_schedule JSONB DEFAULT '{
  "monday": {"available": true, "start": "09:00", "end": "17:00"},
  "tuesday": {"available": true, "start": "09:00", "end": "17:00"},
  "wednesday": {"available": true, "start": "09:00", "end": "17:00"},
  "thursday": {"available": true, "start": "09:00", "end": "17:00"},
  "friday": {"available": true, "start": "09:00", "end": "17:00"},
  "saturday": {"available": true, "start": "10:00", "end": "14:00"},
  "sunday": {"available": false, "start": "00:00", "end": "00:00"}
}'::JSONB;

ALTER TABLE public.employee_availability
ADD COLUMN IF NOT EXISTS service_radius_km INT DEFAULT 15;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_availability_employee_unique
ON public.employee_availability(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_availability_schedule
ON public.employee_availability USING gin (availability_schedule);
