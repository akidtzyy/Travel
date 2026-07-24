-- SQL Migration: Expiration, DP 50%, and Payment Tracking
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Add expiration and financial columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS expiry_time TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'FULL' CHECK (payment_type IN ('FULL', 'DP'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC DEFAULT 0;

-- 2. Populate existing bookings with financial amounts
-- Parse numeric value from total_price text column (remove non-digits)
UPDATE public.bookings
SET 
  total_amount = COALESCE(NULLIF(regexp_replace(total_price, '[^0-9]', '', 'g'), '')::numeric, 0),
  amount_paid = CASE WHEN payment_status = 'paid' THEN COALESCE(NULLIF(regexp_replace(total_price, '[^0-9]', '', 'g'), '')::numeric, 0) ELSE 0 END,
  remaining_balance = CASE WHEN payment_status = 'paid' THEN 0 ELSE COALESCE(NULLIF(regexp_replace(total_price, '[^0-9]', '', 'g'), '')::numeric, 0) END
WHERE total_amount = 0;

-- 3. Update payment_status check constraint to support partially_paid
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'partially_paid', 'failed', 'expired', 'refunded'));
