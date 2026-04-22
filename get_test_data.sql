-- Get a real order with user data for testing
SELECT 
  o.id as order_id,
  o.user_id,
  o.total_price as amount,
  u.email,
  u.first_name || ' ' || u.last_name as customer_name
FROM orders o
JOIN users u ON o.user_id = u.id
LIMIT 1;
