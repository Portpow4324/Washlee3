-- Check existing pro_inquiries data
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  status,
  created_at,
  updated_at
FROM pro_inquiries
ORDER BY created_at DESC
LIMIT 5;
