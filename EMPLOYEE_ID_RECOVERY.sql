-- MANUAL RECOVERY: Save Employee ID to Backend
-- If you remember the Employee ID that was generated, you can use this script

-- First, check the current pro_inquiries status
SELECT 
  id,
  user_id,
  email,
  status,
  employee_id,
  comments,
  updated_at
FROM pro_inquiries
WHERE user_id = 'ae4b5696-e9d5-47d4-9351-94e3ee9bd598'
LIMIT 1;

-- Then, if you remember the Employee ID (e.g., EMP-1743465098000-XXXXX):
-- Update the pro_inquiries table with the employee_id
-- Uncomment and replace EMPLOYEE_ID_HERE with your actual ID

/*
UPDATE pro_inquiries
SET employee_id = 'EMPLOYEE_ID_HERE'
WHERE user_id = 'ae4b5696-e9d5-47d4-9351-94e3ee9bd598'
AND status = 'approved';
*/

-- Also create/update the employee record
-- If you remember the Employee ID, run this:

/*
INSERT INTO employees (
  user_id,
  employee_id,
  first_name,
  last_name,
  email,
  phone,
  state,
  status,
  created_at,
  updated_at
) VALUES (
  'ae4b5696-e9d5-47d4-9351-94e3ee9bd598',
  'EMPLOYEE_ID_HERE',
  'Luka',
  'Verde',
  'lukaverde6@gmail.com',
  '+61412458144',
  'VIC',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  employee_id = 'EMPLOYEE_ID_HERE',
  updated_at = NOW();
*/
