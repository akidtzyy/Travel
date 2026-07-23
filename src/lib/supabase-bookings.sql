-- Create bookings table if not exists
CREATE TABLE IF NOT EXISTS public.bookings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('package', 'car')),
  item_name TEXT NOT NULL,
  date DATE NOT NULL,
  duration TEXT NOT NULL,
  notes TEXT DEFAULT '',
  total_price TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'paid', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid', 'paid')),
  ktp_url TEXT DEFAULT NULL,
  sim_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add ktp_url and sim_url columns if not exists (for existing tables)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS ktp_url TEXT DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS sim_url TEXT DEFAULT NULL;

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create insert policy for public
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Create full access policy for admin
DROP POLICY IF EXISTS "Admin full access to bookings" ON public.bookings;
CREATE POLICY "Admin full access to bookings" ON public.bookings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Storage Bucket for Booking Documents (KTP & SIM)
-- Run this in Supabase SQL Editor (requires superuser or service_role)
-- ============================================================

-- Create the storage bucket for booking documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-documents',
  'booking-documents',
  true,
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to booking-documents
DROP POLICY IF EXISTS "Authenticated can upload booking documents" ON storage.objects;
CREATE POLICY "Authenticated can upload booking documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'booking-documents');

-- Allow public to read/view booking documents
DROP POLICY IF EXISTS "Public can view booking documents" ON storage.objects;
CREATE POLICY "Public can view booking documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'booking-documents');

-- Allow authenticated users to delete their uploaded booking documents
DROP POLICY IF EXISTS "Authenticated can delete booking documents" ON storage.objects;
CREATE POLICY "Authenticated can delete booking documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'booking-documents');

-- Function to reset bookings table identity sequence when empty
CREATE OR REPLACE FUNCTION public.reset_bookings_sequence()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.bookings) THEN
    ALTER SEQUENCE public.bookings_id_seq RESTART WITH 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
