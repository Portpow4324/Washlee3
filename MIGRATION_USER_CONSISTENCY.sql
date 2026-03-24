-- MIGRATION: Ensure User Consistency
-- Purpose: Ensure every customer and employee has a corresponding user record
-- Date: 2026-03-24

-- Step 1: Check for orphaned customers (customers without users records)
SELECT COUNT(*) as orphaned_customers
FROM customers c
LEFT JOIN users u ON c.id = u.id
WHERE u.id IS NULL;

-- Step 2: Check for orphaned employees (employees without users records)
SELECT COUNT(*) as orphaned_employees
FROM employees e
LEFT JOIN users u ON e.id = u.id
WHERE u.id IS NULL;

-- Step 3: Create missing user records for existing customers
INSERT INTO users (id, email, user_type)
SELECT c.id, c.email, 'customer'
FROM customers c
LEFT JOIN users u ON c.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create missing user records for existing employees
INSERT INTO users (id, email, user_type)
SELECT e.id, e.email, 'pro'
FROM employees e
LEFT JOIN users u ON e.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify all customers have users
SELECT 
  c.id,
  c.email,
  CASE WHEN u.id IS NULL THEN 'MISSING USER RECORD' ELSE 'OK' END as status
FROM customers c
LEFT JOIN users u ON c.id = u.id
WHERE u.id IS NULL;

-- Step 6: Verify all employees have users
SELECT 
  e.id,
  e.email,
  CASE WHEN u.id IS NULL THEN 'MISSING USER RECORD' ELSE 'OK' END as status
FROM employees e
LEFT JOIN users u ON e.id = u.id
WHERE u.id IS NULL;

-- Step 7: Verify consistency summary
WITH user_summary AS (
  SELECT 
    'customers' as table_name,
    COUNT(DISTINCT c.id) as total_records,
    COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN c.id END) as with_user_record
  FROM customers c
  LEFT JOIN users u ON c.id = u.id
  UNION ALL
  SELECT 
    'employees',
    COUNT(DISTINCT e.id),
    COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN e.id END)
  FROM employees e
  LEFT JOIN users u ON e.id = u.id
)
SELECT * FROM user_summary;
