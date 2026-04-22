-- Check RLS status on pro_inquiries table
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'pro_inquiries';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'pro_inquiries';
