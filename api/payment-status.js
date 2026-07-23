import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/payment-status
 * Called by frontend after Midtrans Snap completes (success/pending/error).
 * Updates booking payment_status directly using booking_id + order_id.
 * This is a fallback for when webhook cannot find the booking by order_id.
 */

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error(`Supabase not configured: url=${url}, key=${!!key}`);
  return createClient(url, key, { auth: { persistSession: false } });
}

const VALID_STATUSES = ['pending', 'paid', 'failed', 'expired'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { booking_id, order_id, payment_status, payment_type } = req.body;

    if (!booking_id || !payment_status) {
      return res.status(400).json({ error: 'booking_id and payment_status are required' });
    }

    if (!VALID_STATUSES.includes(payment_status)) {
      return res.status(400).json({ error: `Invalid payment_status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const supabase = getSupabaseClient();

    // Build update payload
    const updatePayload = {
      payment_status,
      ...(order_id ? { order_id } : {}),
      ...(payment_type ? { payment_type } : {}),
      ...(payment_status === 'paid' ? {
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      } : {}),
      ...(payment_status === 'pending' ? { status: 'pending' } : {}),
      ...(payment_status === 'failed' ? { status: 'cancelled' } : {}),
    };

    console.log(`[payment-status] Updating booking #${booking_id}:`, JSON.stringify(updatePayload));

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', booking_id)
      .select('id, name, payment_status, status, customer_id, total_price')
      .single();

    if (error) {
      console.error('[payment-status] DB update failed:', error.message);
      return res.status(500).json({ error: 'Failed to update booking status' });
    }

    // Update Customer statistics if transaction is PAID
    if (data && payment_status === 'paid') {
      try {
        const customerId = data.customer_id;
        const priceStr = data.total_price || '0';
        if (customerId) {
          const cleanedPrice = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
          
          const { data: cust } = await supabase
            .from('customers')
            .select('total_bookings, total_spent, user_id')
            .eq('id', customerId)
            .single();
          
          if (cust) {
            const newTotalBookings = (cust.total_bookings || 0) + 1;
            const newTotalSpent = (cust.total_spent || 0) + cleanedPrice;
            const lastBookingDate = new Date().toISOString();
            
            await supabase
              .from('customers')
              .update({
                total_bookings: newTotalBookings,
                total_spent: newTotalSpent,
                last_booking_date: lastBookingDate
              })
              .eq('id', customerId);
            
            console.log(`[payment-status Stats] Updated customer stats: total_bookings=${newTotalBookings}, total_spent=${newTotalSpent}`);

            if (cust.user_id) {
              await supabase
                .from('profiles')
                .update({
                  total_bookings: newTotalBookings,
                  total_spent: newTotalSpent,
                  last_booking_date: lastBookingDate
                })
                .eq('id', cust.user_id);
            }
          }
        }
      } catch (statsErr) {
        console.error('[payment-status Stats] Error updating customer stats:', statsErr.message);
      }
    }

    console.log(`[payment-status] ✅ Booking #${data?.id} → payment_status=${data?.payment_status}, status=${data?.status}`);
    return res.status(200).json({ message: 'OK', booking: data });

  } catch (err) {
    console.error('[payment-status] Unexpected error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
