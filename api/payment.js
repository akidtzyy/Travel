import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error(`supabaseUrl is required. url=${url}`);
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read server key at request time (not module load time)
  const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
  const MIDTRANS_API_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  if (!MIDTRANS_SERVER_KEY) {
    console.error('[Payment] MIDTRANS_SERVER_KEY is not set');
    return res.status(500).json({ error: 'Payment gateway not configured' });
  }

  try {
    const {
      booking_id,
      name,
      email,
      phone,
      item_name,
      total_price,
      booking_type,
      payment_type = 'FULL',
      is_final_payment = false,
    } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required' });
    }

    const supabase = getSupabaseClient();
    
    // Fetch latest booking data from DB
    console.log('[Payment] Fetching booking from Supabase, id:', booking_id);
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    let customerName = name;
    let customerEmail = email;
    let customerPhone = phone;
    let itemName = item_name;
    let bookingType = booking_type;
    let dbPaymentType = payment_type;
    let totalPriceVal = total_price;

    if (booking) {
      customerName = booking.name;
      customerEmail = booking.email;
      customerPhone = booking.phone;
      itemName = booking.item_name;
      bookingType = booking.booking_type;
      dbPaymentType = booking.payment_type || payment_type;
      totalPriceVal = booking.total_price;
    } else {
      console.warn('[Payment] Booking not found in DB, using request body parameters.');
    }

    // Parse total_price (remove "Rp", dots, spaces → integer)
    const rawTotalPrice = String(totalPriceVal || '0').replace(/[^0-9]/g, '');
    const totalAmount = parseInt(rawTotalPrice, 10) || 0;

    // Calculate transaction amount and unique order_id
    let amount = 0;
    let order_id = '';
    let updateData = {};

    // Expiry time (30 minutes from now)
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    if (is_final_payment) {
      // Final payment (paying off remaining balance)
      const remainingBalance = booking && booking.remaining_balance !== null 
        ? Number(booking.remaining_balance) 
        : Math.round(totalAmount / 2);
        
      if (remainingBalance <= 0) {
        return res.status(400).json({ error: 'This booking has no remaining balance to pay.' });
      }
      amount = remainingBalance;
      order_id = `TRAVEL-${booking_id}-FINAL-${Date.now()}`;
      updateData = {
        expiry_time: expiryTime,
        order_id: order_id
      };
    } else {
      // Initial payment
      amount = dbPaymentType === 'DP' ? Math.round(totalAmount / 2) : totalAmount;
      order_id = `TRAVEL-${booking_id}-INITIAL-${Date.now()}`;
      updateData = {
        payment_type: dbPaymentType,
        total_amount: totalAmount,
        remaining_balance: totalAmount, // Reduced upon notification settlement
        expiry_time: expiryTime,
        order_id: order_id
      };
    }

    console.log(`[Payment] Creating Snap token for booking #${booking_id}, type: ${is_final_payment ? 'FINAL' : 'INITIAL'}, amount: ${amount}`);

    // Determine base URL
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://travel-eosin-seven.vercel.app';

    // Build Midtrans Snap request payload
    const snapPayload = {
      transaction_details: {
        order_id,
        gross_amount: amount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: customerName || 'Customer',
        email: customerEmail || 'customer@example.com',
        phone: customerPhone || '08000000000',
      },
      item_details: [
        {
          id: `booking-${booking_id}`,
          price: amount,
          quantity: 1,
          name: String((is_final_payment ? 'Pelunasan - ' : (dbPaymentType === 'DP' ? 'DP 50% - ' : '')) + (itemName || 'Travel Package')).substring(0, 50),
          category: bookingType === 'package' ? 'Tour Package' : 'Car Rental',
        },
      ],
      expiry: {
        unit: 'minutes',
        duration: 30
      },
      callbacks: {
        finish: `${baseUrl}/`,
      },
    };

    // Call Midtrans Snap API
    const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
    const midtransRes = await fetch(MIDTRANS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(snapPayload),
    });

    const midtransData = await midtransRes.json();

    if (!midtransRes.ok) {
      console.error('[Payment] Midtrans error:', JSON.stringify(midtransData));
      return res.status(midtransRes.status).json({
        error: 'Midtrans API error',
        details: midtransData,
      });
    }

    const { token: snap_token, redirect_url } = midtransData;

    console.log(`[Payment] Snap token generated for order ${order_id}`);

    // Save updateData and snap_token to Supabase
    try {
      await supabase
        .from('bookings')
        .update({
          ...updateData,
          snap_token,
          payment_status: 'pending',
          payment_link: redirect_url
        })
        .eq('id', booking_id);
    } catch (e) {
      console.warn('[Payment] Could not save snap token to DB:', e.message);
    }

    return res.status(200).json({ snap_token, redirect_url, order_id });

  } catch (err) {
    console.error('[Payment] Unexpected error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
