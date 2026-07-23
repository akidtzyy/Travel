-- ============================================================
-- Fix: Add missing updated_at column to bookings table
-- This column is required by the update_bookings_updated_at trigger
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add updated_at column if missing
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill existing rows (set updated_at = created_at for existing data)
UPDATE public.bookings 
  SET updated_at = created_at 
  WHERE updated_at IS NULL OR updated_at = '1970-01-01';

-- Make sure the trigger function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger to be safe
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Verify: should show updated_at column
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'bookings' ORDER BY ordinal_position;
