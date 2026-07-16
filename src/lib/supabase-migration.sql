-- ============================================
-- Supabase Migration: Customers Table
-- For Admin Panel — Customer Database
-- ============================================

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  home_address TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  booking_status TEXT NOT NULL DEFAULT 'interested'
    CHECK (booking_status IN ('interested', 'booked', 'completed', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add is_available column to car_rentals (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'car_rentals' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE car_rentals ADD COLUMN is_available BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Add is_available column to tour_packages (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tour_packages' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE tour_packages ADD COLUMN is_available BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users (admin) full access
CREATE POLICY "Admin full access to customers" ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon to insert (for public sign-up form if needed)
CREATE POLICY "Public can insert customers" ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_booking_status ON customers(booking_status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
