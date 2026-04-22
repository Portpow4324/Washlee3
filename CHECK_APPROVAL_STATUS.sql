-- Check what was saved in pro_inquiries after approval
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  status,
  employee_id,
  comments,
  updated_at
FROM pro_inquiries
WHERE user_id = 'ae4b5696-e9d5-47d4-9351-94e3ee9bd598'
ORDER BY created_at DESC;

-- Check if employee record was created
SELECT 
  id,
  user_id,
  employee_id,
  email,
  first_name,
  last_name,
  status,
  created_at
FROM employees
WHERE user_id = 'ae4b5696-e9d5-47d4-9351-94e3ee9bd598'
ORDER BY created_at DESC;
