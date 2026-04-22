-- Add booking details columns to orders table
-- Captures customer preferences and special instructions from the booking form

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS pickup_spot TEXT DEFAULT 'front-door',
ADD COLUMN IF NOT EXISTS pickup_instructions TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS detergent TEXT DEFAULT 'classic-scented',
ADD COLUMN IF NOT EXISTS delicate_cycle BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS returns_on_hangers BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS additional_requests TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS hang_dry BOOLEAN DEFAULT FALSE;

-- Create comments on new columns for documentation
COMMENT ON COLUMN public.orders.pickup_spot IS 'Where to pick up laundry (e.g., front-door, gate, side-entrance)';
COMMENT ON COLUMN public.orders.pickup_instructions IS 'Custom pickup instructions (e.g., "Leave at back gate", "Ring bell twice")';
COMMENT ON COLUMN public.orders.detergent IS 'Customer preferred detergent scent (e.g., classic-scented, unscented, etc.)';
COMMENT ON COLUMN public.orders.delicate_cycle IS 'Whether to use delicate wash cycle for clothes';
COMMENT ON COLUMN public.orders.returns_on_hangers IS 'Whether items should be returned on hangers';
COMMENT ON COLUMN public.orders.additional_requests IS 'Any additional customer requests or special notes';
COMMENT ON COLUMN public.orders.delivery_instructions IS 'Custom delivery address instructions';
COMMENT ON COLUMN public.orders.hang_dry IS 'Whether hang dry service was selected (add-on)';
