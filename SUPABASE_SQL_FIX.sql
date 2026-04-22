-- ========================================
-- WASHLEE DATABASE FIX
-- Run this in Supabase SQL Editor
-- ========================================

-- ISSUE: Foreign key constraint on pro_jobs.pro_id references non-existent employees table
-- SYMPTOM: Employee job acceptance fails with "FK constraint violation"
-- STATUS: Blocking pro_id assignment, but job status updates work fine

-- ========================================
-- SOLUTION: Choose ONE option below
-- ========================================

-- ========================================
-- OPTION A: Drop the Foreign Key (Simplest)
-- ========================================
-- This removes the constraint entirely
-- Use if you don't need strict FK validation
ALTER TABLE pro_jobs DROP CONSTRAINT IF EXISTS pro_jobs_pro_id_fkey;

-- Verify it's dropped:
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name='pro_jobs' AND constraint_type='FOREIGN KEY';
-- Should return empty result


-- ========================================
-- OPTION B: Create Employees Table (Recommended)
-- ========================================
-- Uncomment to use this option instead of A
-- This maintains data integrity with proper FK

/*
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert existing employees from users table
INSERT INTO employees (id) VALUES
('ae4b5696-e9d5-47d4-9351-94e3ee9bd598'),
('a0392f42-e63a-4f46-b022-16730081c346'),
('00000000-0000-0000-0000-000000000001');

-- Verify:
SELECT id, created_at FROM employees;
*/


-- ========================================
-- AFTER RUNNING ONE OF ABOVE:
-- ========================================
-- Test that job acceptance now works:
-- 1. Go to /employee/jobs page
-- 2. Click "Accept Job"
-- 3. Job should now update with employee ID

-- Verify in pro_jobs table:
SELECT id, order_id, pro_id, status, accepted_at FROM pro_jobs 
WHERE status = 'accepted' 
LIMIT 5;
