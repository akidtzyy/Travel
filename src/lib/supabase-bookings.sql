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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
