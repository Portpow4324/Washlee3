-- ============================================
-- RATE LIMITING & IP WHITELIST CONFIGURATION
-- ============================================
-- Stores IP addresses that are whitelisted from rate limiting
-- Useful for testing and development

CREATE TABLE IF NOT EXISTS public.rate_limit_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_whitelist_ip ON public.rate_limit_whitelist(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_whitelist_active ON public.rate_limit_whitelist(is_active);

-- Seed with localhost for development
INSERT INTO public.rate_limit_whitelist (ip_address, description, is_active)
VALUES 
  ('127.0.0.1', 'Localhost development', true),
  ('::1', 'Localhost IPv6 development', true),
  ('localhost', 'Localhost hostname', true)
ON CONFLICT (ip_address) DO NOTHING;

-- Sample whitelisted IPs (uncomment and add your testing IPs)
-- INSERT INTO public.rate_limit_whitelist (ip_address, description, is_active)
-- VALUES 
--   ('192.168.1.100', 'Office network', true),
--   ('203.0.113.42', 'Testing IP 1', true),
--   ('203.0.113.43', 'Testing IP 2', true);

-- Query to view all whitelisted IPs
-- SELECT ip_address, description, created_at FROM public.rate_limit_whitelist WHERE is_active = true;

-- Query to add a new IP to whitelist
-- INSERT INTO public.rate_limit_whitelist (ip_address, description, is_active)
-- VALUES ('YOUR_IP_HERE', 'Description', true);

-- Query to disable an IP
-- UPDATE public.rate_limit_whitelist SET is_active = false WHERE ip_address = 'IP_TO_DISABLE';
