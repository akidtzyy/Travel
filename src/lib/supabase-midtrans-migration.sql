-- ============================================================
-- Midtrans Payment Integration Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Add payment_status column if it doesn't exist yet
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- Step 2: Drop old constraint if exists (safe even if column was just added)
ALTER TABLE public.bookings 
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Step 3: Add new constraint with extended Midtrans states
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_payment_status_check 
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'expired', 'challenge'));

-- Step 4: Add other payment-related columns
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS snap_token TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;

-- Step 5: Create index for order_id lookups (webhook uses this heavily)
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON public.bookings (order_id);

-- ============================================================
-- Verify: run this SELECT to confirm columns exist
-- ============================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'bookings'
-- ORDER BY ordinal_position;

