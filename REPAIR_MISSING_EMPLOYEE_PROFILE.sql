-- Repair a user that is marked as employee/pro but is missing from public.employees.
-- This targets the id you mentioned:
-- a0392f42-e63a-4f46-b022-16730081c346

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

DO $$
DECLARE
  target_lookup_id UUID := 'a0392f42-e63a-4f46-b022-16730081c346';
  target_profile_id UUID;
  target_email TEXT;
  target_name TEXT;
  target_phone TEXT;
  employee_columns TEXT[];
  insert_columns TEXT[] := ARRAY['id'];
  insert_values TEXT[];
  user_columns TEXT[];
  update_parts TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT
    u.id,
    u.email,
    'Washlee Pro',
    NULL::TEXT
  INTO target_profile_id, target_email, target_name, target_phone
  FROM public.users u
  WHERE u.id = target_lookup_id
  LIMIT 1;

  IF target_email IS NULL THEN
    RAISE EXCEPTION 'No public.users row found for %', target_lookup_id;
  END IF;

  insert_values := ARRAY[quote_literal(target_profile_id::TEXT) || '::uuid'];

  SELECT ARRAY_AGG(column_name::TEXT)
  INTO employee_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'employees';

  IF 'email' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'email');
    insert_values := array_append(insert_values, quote_nullable(target_email));
  END IF;

  IF 'name' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'name');
    insert_values := array_append(insert_values, quote_nullable(target_name));
  END IF;

  IF 'first_name' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'first_name');
    insert_values := array_append(insert_values, quote_nullable(SPLIT_PART(target_name, ' ', 1)));
  END IF;

  IF 'last_name' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'last_name');
    insert_values := array_append(insert_values, quote_nullable(NULLIF(SUBSTRING(target_name FROM POSITION(' ' IN target_name) + 1), target_name)));
  END IF;

  IF 'phone' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'phone');
    insert_values := array_append(insert_values, quote_nullable(target_phone));
  END IF;

  IF 'availability_status' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'availability_status');
    insert_values := array_append(insert_values, quote_literal('available'));
  END IF;

  IF 'account_status' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'account_status');
    insert_values := array_append(insert_values, quote_literal('active'));
  END IF;

  IF 'status' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'status');
    insert_values := array_append(insert_values, quote_literal('active'));
  END IF;

  IF 'role' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'role');
    insert_values := array_append(insert_values, quote_literal('employee'));
  END IF;

  IF 'service_areas' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'service_areas');
    insert_values := array_append(insert_values, quote_literal('[]') || '::jsonb');
  END IF;

  IF 'created_at' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'created_at');
    insert_values := array_append(insert_values, 'NOW()');
  END IF;

  IF 'updated_at' = ANY(employee_columns) THEN
    insert_columns := array_append(insert_columns, 'updated_at');
    insert_values := array_append(insert_values, 'NOW()');
  END IF;

  EXECUTE FORMAT(
    'INSERT INTO public.employees (%s) VALUES (%s) ON CONFLICT (id) DO UPDATE SET %s',
    ARRAY_TO_STRING(insert_columns, ', '),
    ARRAY_TO_STRING(insert_values, ', '),
    ARRAY_TO_STRING(
      ARRAY(
        SELECT FORMAT('%I = EXCLUDED.%I', col, col)
        FROM UNNEST(insert_columns) AS col
        WHERE col <> 'id'
      ),
      ', '
    )
  );

  SELECT ARRAY_AGG(column_name::TEXT)
  INTO user_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users';

  IF 'user_type' = ANY(user_columns) THEN
    update_parts := array_append(update_parts, 'user_type = CASE WHEN user_type IN (''pro'', ''employee'') THEN user_type ELSE ''pro'' END');
  END IF;

  IF 'is_employee' = ANY(user_columns) THEN
    update_parts := array_append(update_parts, 'is_employee = true');
  END IF;

  IF 'role' = ANY(user_columns) THEN
    update_parts := array_append(update_parts, 'role = ''employee''');
  END IF;

  IF 'updated_at' = ANY(user_columns) THEN
    update_parts := array_append(update_parts, 'updated_at = NOW()');
  END IF;

  IF ARRAY_LENGTH(update_parts, 1) > 0 THEN
    EXECUTE FORMAT(
      'UPDATE public.users SET %s WHERE id = %L::uuid',
      ARRAY_TO_STRING(update_parts, ', '),
      target_profile_id::TEXT
    );
  END IF;

  INSERT INTO public.employee_availability (
    employee_id,
    availability_schedule,
    service_radius_km,
    created_at,
    updated_at
  )
  VALUES (
    target_profile_id,
    '{
      "monday": {"available": true, "start": "09:00", "end": "17:00"},
      "tuesday": {"available": true, "start": "09:00", "end": "17:00"},
      "wednesday": {"available": true, "start": "09:00", "end": "17:00"},
      "thursday": {"available": true, "start": "09:00", "end": "17:00"},
      "friday": {"available": true, "start": "09:00", "end": "17:00"},
      "saturday": {"available": true, "start": "10:00", "end": "14:00"},
      "sunday": {"available": false, "start": "00:00", "end": "00:00"}
    }'::jsonb,
    15,
    NOW(),
    NOW()
  )
  ON CONFLICT (employee_id) DO UPDATE
  SET
    availability_schedule = EXCLUDED.availability_schedule,
    service_radius_km = EXCLUDED.service_radius_km,
    updated_at = NOW();
END $$;

SELECT
  u.id AS user_id,
  u.email,
  u.user_type,
  e.id AS employee_table_id,
  ea.service_radius_km,
  ea.availability_schedule
FROM public.users u
LEFT JOIN public.employees e ON e.id = u.id
LEFT JOIN public.employee_availability ea ON ea.employee_id = u.id
WHERE u.id = 'a0392f42-e63a-4f46-b022-16730081c346';
