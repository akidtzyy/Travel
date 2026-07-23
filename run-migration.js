// Script untuk menjalankan SQL migration bookings ke Supabase
// Jalankan dengan: node run-migration.js

const SUPABASE_URL = 'https://muzvduhmlyldmpplxbhy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11enZkdWhtbHlsZG1wcGx4Ymh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDIxOTYsImV4cCI6MjA5OTAxODE5Nn0.vszqaU85QnAV5M1sED2uUcME7ppvIL2bhoeup32ZeeI';

const sql = `
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

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access to bookings" ON public.bookings;
CREATE POLICY "Admin full access to bookings" ON public.bookings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

async function runMigration() {
  console.log('Running bookings table migration...');
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  // Try alternative: using the SQL execution endpoint
  const response2 = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  console.log('API Status:', response2.status);
  
  // Test if bookings table exists
  const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?limit=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  const testData = await testResponse.text();
  console.log('Bookings table test (status):', testResponse.status);
  console.log('Response:', testData.substring(0, 200));
  
  if (testResponse.status === 200) {
    console.log('✅ bookings table already exists and is accessible!');
  } else if (testResponse.status === 404 || testResponse.status === 400) {
    console.log('❌ bookings table does NOT exist yet.');
    console.log('Please run the SQL in src/lib/supabase-bookings.sql manually in your Supabase dashboard.');
    console.log('Go to: https://supabase.com/dashboard/project/muzvduhmlyldmpplxbhy/sql/new');
  } else {
    console.log('⚠️ Unexpected status. Check credentials.');
  }
}

runMigration().catch(console.error);
