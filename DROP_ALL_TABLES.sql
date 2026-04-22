-- DROP ALL TABLES IN REVERSE ORDER (to handle foreign keys)
-- Run this FIRST if you have partial tables from failed migrations

DROP TABLE IF EXISTS public.wash_club_transactions CASCADE;
DROP TABLE IF EXISTS public.wash_club_verification CASCADE;
DROP TABLE IF EXISTS public.wash_clubs CASCADE;
DROP TABLE IF EXISTS public.verification_codes CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Now run the main schema migration