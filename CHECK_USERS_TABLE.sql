-- Check users table structure and constraints
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints on users table
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users' AND table_schema = 'public';

-- Check if there's a foreign key to auth.users
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'users' AND tc.table_schema = 'public';
