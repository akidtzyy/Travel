-- ============================================================
-- Fix: Update payment_status constraint to support all Midtrans statuses
-- Run this in Supabase SQL Editor
-- ============================================================

-- Expand payment_status values to match what Midtrans webhook sends
ALTER TABLE public.bookings 
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'expired', 'challenge'));

-- Also add paid_at and payment_type columns if not exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS order_id TEXT DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS snap_token TEXT DEFAULT NULL;

-- Verify
-- SELECT id, name, payment_status, status, order_id FROM public.bookings ORDER BY id DESC LIMIT 10;
