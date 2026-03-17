-- Supabase Data Import Script for Washlee
-- Paste this entire script into SQL Editor and run once
-- This imports all sample data into all 11 tables at once

-- ============================================
-- INSERT USERS (5 records)
-- ============================================
INSERT INTO public.users (id, email, name, phone, user_type, is_admin, is_employee, is_loyalty_member, profile_picture_url, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'john@example.com', 'John Doe', '+1234567890', 'customer', false, false, false, null, '2024-03-17T10:00:00Z', '2024-03-17T10:00:00Z'),
  ('550e8400-e29b-41d4-a716-446655440001', 'jane@example.com', 'Jane Smith', '+1234567891', 'pro', false, true, false, null, '2024-03-17T10:01:00Z', '2024-03-17T10:01:00Z'),
  ('550e8400-e29b-41d4-a716-446655440002', 'admin@example.com', 'Admin User', '+1234567892', 'admin', true, false, false, null, '2024-03-17T10:02:00Z', '2024-03-17T10:02:00Z'),
  ('550e8400-e29b-41d4-a716-446655440003', 'mike@example.com', 'Mike Johnson', '+1234567893', 'customer', false, false, true, null, '2024-03-17T10:03:00Z', '2024-03-17T10:03:00Z'),
  ('550e8400-e29b-41d4-a716-446655440004', 'sarah@example.com', 'Sarah Williams', '+1234567894', 'pro', false, true, false, null, '2024-03-17T10:04:00Z', '2024-03-17T10:04:00Z');

-- ============================================
-- INSERT CUSTOMERS (2 records)
-- ============================================
INSERT INTO public.customers (id, subscription_active, subscription_plan, subscription_status, payment_status, delivery_address, preferences, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', true, 'professional', 'active', 'paid', '{"street":"123 Main St","city":"New York","state":"NY","zip":"10001"}', '{"notifications":true,"marketing":false}', '2024-03-17T10:00:00Z', '2024-03-17T10:00:00Z'),
  ('550e8400-e29b-41d4-a716-446655440003', false, 'free', 'inactive', 'pending', '{"street":"456 Oak Ave","city":"Los Angeles","state":"CA","zip":"90001"}', '{"notifications":true,"marketing":true}', '2024-03-17T10:03:00Z', '2024-03-17T10:03:00Z');

-- ============================================
-- INSERT EMPLOYEES (2 records)
-- ============================================
INSERT INTO public.employees (id, rating, total_reviews, completed_orders, earnings, availability_status, service_areas, bank_account, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 4.8, 45, 120, 2500.50, 'available', '["New York","New Jersey"]', '{"account_number":"****1234","routing":"021000021"}', '2024-03-17T10:01:00Z', '2024-03-17T10:01:00Z'),
  ('550e8400-e29b-41d4-a716-446655440004', 4.9, 38, 95, 1850.75, 'available', '["Los Angeles","Pasadena"]', '{"account_number":"****5678","routing":"121000248"}', '2024-03-17T10:04:00Z', '2024-03-17T10:04:00Z');

-- ============================================
-- INSERT ORDERS (2 records) - BEFORE wash_club_transactions
-- ============================================
INSERT INTO public.orders (id, user_id, status, items, total_price, delivery_address, pickup_address, scheduled_pickup_date, scheduled_delivery_date, actual_pickup_date, actual_delivery_date, pro_id, tracking_code, notes, wash_club_credits_applied, tier_discount, credits_earned, tier_at_order_time, reviewed, created_at, updated_at)
VALUES 
  ('990e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'delivered', '[{"item":"shirts","qty":5,"price":10.00}]', 50.00, '{"street":"123 Main St","city":"New York","state":"NY","zip":"10001"}', '{"street":"456 Park Ave","city":"New York","state":"NY","zip":"10002"}', '2024-03-17', '2024-03-19', '2024-03-17T08:00:00Z', '2024-03-19T18:00:00Z', '550e8400-e29b-41d4-a716-446655440001', 'WASH-ORD-001', null, 5.00, 2.50, 5.00, 2, true, '2024-03-17T10:05:00Z', '2024-03-19T18:00:00Z'),
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'in-transit', '[{"item":"pants","qty":3,"price":15.00}]', 45.00, '{"street":"789 Oak Ave","city":"Los Angeles","state":"CA","zip":"90001"}', '{"street":"321 Elm St","city":"Los Angeles","state":"CA","zip":"90002"}', '2024-03-18', '2024-03-20', '2024-03-18T09:00:00Z', null, '550e8400-e29b-41d4-a716-446655440004', 'WASH-ORD-002', null, 3.00, 1.50, 3.00, 1, false, '2024-03-18T11:00:00Z', '2024-03-18T15:00:00Z');

-- ============================================
-- INSERT WASH CLUBS (2 records)
-- ============================================
INSERT INTO public.wash_clubs (id, user_id, card_number, tier, credits_balance, earned_credits, redeemed_credits, total_spend, status, email_verified, terms_accepted, terms_accepted_at, join_date, last_updated, created_at, updated_at)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'WASH-1234-5678-9012', 2, 25.50, 50.00, 24.50, 250.00, 'active', true, true, '2024-03-17T10:00:00Z', '2024-03-17T10:00:00Z', '2024-03-17T10:00:00Z', '2024-03-17T10:00:00Z', '2024-03-17T10:00:00Z'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'WASH-2345-6789-0123', 1, 10.00, 10.00, 0.00, 100.00, 'active', true, true, '2024-03-17T10:03:00Z', '2024-03-17T10:03:00Z', '2024-03-17T10:03:00Z', '2024-03-17T10:03:00Z', '2024-03-17T10:03:00Z');

-- ============================================
-- INSERT WASH CLUB VERIFICATION (2 records)
-- ============================================
INSERT INTO public.wash_club_verification (id, user_id, email, code, verified, expires_at, created_at, updated_at)
VALUES 
  ('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'john@example.com', '123456', true, '2024-03-24T10:00:00Z', '2024-03-17T10:00:00Z', '2024-03-17T10:00:00Z'),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'mike@example.com', '654321', true, '2024-03-24T10:03:00Z', '2024-03-17T10:03:00Z', '2024-03-17T10:03:00Z');

-- ============================================
-- INSERT WASH CLUB TRANSACTIONS (3 records)
-- ============================================
INSERT INTO public.wash_club_transactions (id, user_id, wash_club_id, type, amount, description, order_id, tier_level, balance_before, balance_after, created_at)
VALUES 
  ('880e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'sign_up_bonus', 10.00, 'New member signup bonus', null, 1, 0.00, 10.00, '2024-03-17T10:00:00Z'),
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'order_earnings', 15.00, 'Order completion earnings', '990e8400-e29b-41d4-a716-446655440000', 2, 10.00, 25.00, '2024-03-17T10:05:00Z'),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'sign_up_bonus', 10.00, 'New member signup bonus', null, 1, 0.00, 10.00, '2024-03-17T10:03:00Z');

-- ============================================
-- INSERT REVIEWS (1 record)
-- ============================================
INSERT INTO public.reviews (id, order_id, customer_id, pro_id, rating, title, comment, categories, status, moderation_notes, created_at, updated_at)
VALUES 
  ('aa0e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 5, 'Great Service', 'Professional and timely delivery.', '{"speed":5,"quality":5,"communication":5}', 'approved', null, '2024-03-19T18:00:00Z', '2024-03-19T18:00:00Z');

-- ============================================
-- INSERT INQUIRIES (2 records)
-- ============================================
INSERT INTO public.inquiries (id, type, user_id, email, name, phone, company_name, inquiry_type, message, status, admin_notes, submitted_at, updated_at)
VALUES 
  ('bb0e8400-e29b-41d4-a716-446655440000', 'pro_application', '550e8400-e29b-41d4-a716-446655440001', 'jane@example.com', 'Jane Smith', '+1234567891', null, null, 'I want to become a Washlee Pro', 'approved', 'Verified credentials - approved', '2024-03-15T10:00:00Z', '2024-03-17T10:00:00Z'),
  ('bb0e8400-e29b-41d4-a716-446655440001', 'customer_inquiry', null, 'inquiry@example.com', 'Test User', '+1234567895', null, null, 'How does the washing process work?', 'pending', 'Needs response', '2024-03-16T14:30:00Z', '2024-03-16T14:30:00Z');

-- ============================================
-- INSERT TRANSACTIONS (2 records)
-- ============================================
INSERT INTO public.transactions (id, user_id, order_id, type, amount, currency, status, payment_method, stripe_transaction_id, description, created_at, updated_at)
VALUES 
  ('cc0e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440000', 'payment', 50.00, 'USD', 'completed', 'card', 'pi_1234567890', 'Order payment', '2024-03-17T10:05:00Z', '2024-03-17T10:05:00Z'),
  ('cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440001', 'payment', 45.00, 'USD', 'completed', 'card', 'pi_0987654321', 'Order payment', '2024-03-18T11:00:00Z', '2024-03-18T11:00:00Z');

-- ============================================
-- INSERT VERIFICATION CODES (3 records)
-- ============================================
INSERT INTO public.verification_codes (id, user_id, type, code, verified, expires_at, created_at, updated_at)
VALUES 
  ('dd0e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'email', '123456', true, '2024-03-24T10:00:00Z', '2024-03-17T10:00:00Z', '2024-03-17T10:00:00Z'),
  ('dd0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'email', '654321', true, '2024-03-24T10:03:00Z', '2024-03-17T10:03:00Z', '2024-03-17T10:03:00Z'),
  ('dd0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'phone', '789012', false, '2024-03-24T10:01:00Z', '2024-03-17T10:01:00Z', '2024-03-17T10:01:00Z');

-- ============================================
-- SUCCESS - All data imported!
-- ============================================
-- Total records inserted:
-- users: 5
-- customers: 2
-- employees: 2
-- wash_clubs: 2
-- wash_club_verification: 2
-- orders: 2
-- reviews: 1
-- inquiries: 2
-- transactions: 2
-- verification_codes: 3
-- wash_club_transactions: 3
-- TOTAL: 26 records
-- 
-- Next: Verify data was inserted by running:
-- SELECT COUNT(*) FROM public.users;
-- SELECT COUNT(*) FROM public.orders;
-- SELECT COUNT(*) FROM public.wash_clubs;
