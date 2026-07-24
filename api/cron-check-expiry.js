import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error(`supabaseUrl is required.`);
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Basic security check: if CRON_SECRET is set in environment, check it
  const CRON_SECRET = process.env.CRON_SECRET;
  const requestAuth = req.headers.authorization || req.query.secret;
  
  if (CRON_SECRET && requestAuth !== `Bearer ${CRON_SECRET}` && requestAuth !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = getSupabaseClient();
    const nowISO = new Date().toISOString();

    console.log(`[Cron] Checking expired bookings at ${nowISO}...`);

    // 1. Fetch pending bookings that have expired
    const { data: expiredBookings, error: fetchErr } = await supabase
      .from('bookings')
      .select('id, name, item_name, expiry_time')
      .eq('status', 'pending')
      .lt('expiry_time', nowISO);

    if (fetchErr) throw fetchErr;

    if (!expiredBookings || expiredBookings.length === 0) {
      return res.status(200).json({ message: 'No expired bookings found.', processed: 0 });
    }

    const expiredIds = expiredBookings.map(b => b.id);
    console.log(`[Cron] Found ${expiredIds.length} expired bookings:`, expiredIds);

    // 2. Bulk update status to expired
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        status: 'expired',
        payment_status: 'expired',
        updated_at: nowISO
      })
      .in('id', expiredIds);

    if (updateErr) throw updateErr;

    return res.status(200).json({
      message: `Successfully expired ${expiredIds.length} bookings.`,
      processed: expiredIds.length,
      expired_bookings: expiredBookings
    });

  } catch (err) {
    console.error('[Cron] Error processing expired bookings:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
