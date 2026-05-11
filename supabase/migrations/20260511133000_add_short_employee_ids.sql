-- Short human-readable Pro login IDs.
-- Internal relations keep using employees.id (UUID). This display/login code
-- lets Pros sign in with a memorable 6-digit ID instead of the UUID.

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

DO $$
DECLARE
  employee_record RECORD;
  candidate TEXT;
BEGIN
  FOR employee_record IN
    SELECT id
    FROM public.employees
    WHERE employee_id IS NULL OR btrim(employee_id) = ''
  LOOP
    LOOP
      candidate := lpad(floor(random() * 1000000)::integer::text, 6, '0');
      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM public.employees
        WHERE employee_id = candidate
      );
    END LOOP;

    UPDATE public.employees
    SET employee_id = candidate,
        updated_at = COALESCE(updated_at, NOW())
    WHERE id = employee_record.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_employee_id_unique
  ON public.employees(employee_id)
  WHERE employee_id IS NOT NULL;
