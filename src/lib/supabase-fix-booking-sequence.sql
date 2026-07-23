-- ============================================================
-- Fix: Auto-reset booking ID sequence
-- - If table is EMPTY  → reset ID to start from 1
-- - If table has data  → continue from max(id) + 1 (no gaps)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop old simple reset function
DROP FUNCTION IF EXISTS public.reset_bookings_sequence();

-- Step 2: Create smarter reset function that handles both cases
CREATE OR REPLACE FUNCTION public.reset_bookings_sequence()
RETURNS void AS $$
DECLARE
  max_id BIGINT;
BEGIN
  SELECT MAX(id) INTO max_id FROM public.bookings;
  
  IF max_id IS NULL THEN
    -- Table is empty → reset to 1
    PERFORM setval(pg_get_serial_sequence('public.bookings', 'id'), 1, false);
  ELSE
    -- Table has data → set sequence to max(id) so next insert = max(id) + 1
    PERFORM setval(pg_get_serial_sequence('public.bookings', 'id'), max_id, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger function that auto-resets sequence on DELETE
CREATE OR REPLACE FUNCTION public.auto_reset_bookings_sequence()
RETURNS TRIGGER AS $$
DECLARE
  max_id BIGINT;
BEGIN
  SELECT MAX(id) INTO max_id FROM public.bookings;
  
  IF max_id IS NULL THEN
    -- All rows deleted → reset to 1
    PERFORM setval(pg_get_serial_sequence('public.bookings', 'id'), 1, false);
  ELSE
    -- Some rows remain → set to current max (removes gap from deleted row)
    PERFORM setval(pg_get_serial_sequence('public.bookings', 'id'), max_id, true);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Attach trigger to bookings table (fires after any DELETE)
DROP TRIGGER IF EXISTS trigger_reset_booking_sequence ON public.bookings;
CREATE TRIGGER trigger_reset_booking_sequence
  AFTER DELETE ON public.bookings
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.auto_reset_bookings_sequence();

-- Step 5: Run once now to sync current sequence with actual data
SELECT public.reset_bookings_sequence();

-- ============================================================
-- Verify: Check current sequence value
-- ============================================================
-- SELECT last_value FROM bookings_id_seq;
-- SELECT MAX(id) FROM public.bookings;
