-- Order proof photos for mobile Pro stage verification.
-- Photos are uploaded through the backend and exposed to signed-in order
-- participants through short-lived signed URLs.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS proof_photos JSONB DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_proof_photos
  ON public.orders USING gin(proof_photos);
