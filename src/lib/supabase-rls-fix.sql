-- ============================================
-- Supabase Migration: RLS Policies for car_rentals & tour_packages
-- Run this in Supabase SQL Editor
-- ============================================

-- =====================
-- car_rentals
-- =====================

-- Enable RLS if not already enabled
ALTER TABLE car_rentals ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to READ car_rentals
DROP POLICY IF EXISTS "Public read access to car_rentals" ON car_rentals;
CREATE POLICY "Public read access to car_rentals" ON car_rentals
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users (admin) to INSERT
DROP POLICY IF EXISTS "Authenticated insert car_rentals" ON car_rentals;
CREATE POLICY "Authenticated insert car_rentals" ON car_rentals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users (admin) to UPDATE
DROP POLICY IF EXISTS "Authenticated update car_rentals" ON car_rentals;
CREATE POLICY "Authenticated update car_rentals" ON car_rentals
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (admin) to DELETE
DROP POLICY IF EXISTS "Authenticated delete car_rentals" ON car_rentals;
CREATE POLICY "Authenticated delete car_rentals" ON car_rentals
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================
-- tour_packages
-- =====================

-- Enable RLS if not already enabled
ALTER TABLE tour_packages ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to READ tour_packages
DROP POLICY IF EXISTS "Public read access to tour_packages" ON tour_packages;
CREATE POLICY "Public read access to tour_packages" ON tour_packages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users (admin) to INSERT
DROP POLICY IF EXISTS "Authenticated insert tour_packages" ON tour_packages;
CREATE POLICY "Authenticated insert tour_packages" ON tour_packages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users (admin) to UPDATE
DROP POLICY IF EXISTS "Authenticated update tour_packages" ON tour_packages;
CREATE POLICY "Authenticated update tour_packages" ON tour_packages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (admin) to DELETE
DROP POLICY IF EXISTS "Authenticated delete tour_packages" ON tour_packages;
CREATE POLICY "Authenticated delete tour_packages" ON tour_packages
  FOR DELETE
  TO authenticated
  USING (true);
