import supabase from './db-client.js';

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
      // Frontend can pass booking details directly to avoid needing service role key
      name,
      email,
      phone,
      item_name,
      total_price,
      booking_type,
    } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required' });
    }

    // Use data from request body if provided (avoids needing service role key)
    // Otherwise try fetching from Supabase (requires proper key setup)
    let customerName = name;
    let customerEmail = email;
    let customerPhone = phone;
    let itemName = item_name;
    let totalPrice = total_price;
    let bookingType = booking_type;

    if (!customerName || !customerEmail || !totalPrice) {
      // Try fetching from Supabase as fallback
      console.log('[Payment] Fetching booking from Supabase, id:', booking_id);
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .single();

      if (fetchErr || !booking) {
        console.error('[Payment] Booking not found:', fetchErr?.message);
        return res.status(404).json({ error: 'Booking not found. Please ensure booking data is complete.' });
      }

      customerName = booking.name;
      customerEmail = booking.email;
      customerPhone = booking.phone;
      itemName = booking.item_name;
      totalPrice = booking.total_price;
      bookingType = booking.booking_type;
    }

    // Generate unique order_id
    const order_id = `TRAVEL-${booking_id}-${Date.now()}`;

    // Parse total_price (remove "Rp", dots, spaces → integer)
    const rawPrice = String(totalPrice).replace(/[^0-9]/g, '');
    const amount = parseInt(rawPrice, 10) || 100000;

    console.log(`[Payment] Creating Snap token for booking #${booking_id}, amount: ${amount}`);

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
          name: String(itemName || 'Travel Package').substring(0, 50),
          category: bookingType === 'package' ? 'Tour Package' : 'Car Rental',
        },
      ],
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

    // Save order_id and snap_token to Supabase (best-effort, don't block)
    supabase
      .from('bookings')
      .update({ order_id, snap_token, payment_status: 'pending' })
      .eq('id', booking_id)
      .then(({ error }) => {
        if (error) console.error('[Payment] Failed to save order_id to Supabase:', error.message);
      });

    return res.status(200).json({ snap_token, redirect_url, order_id });

  } catch (err) {
    console.error('[Payment] Unexpected error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
