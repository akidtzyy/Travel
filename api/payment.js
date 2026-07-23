import supabase from './db-client.js';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_API_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required' });
    }

    // Fetch booking from Supabase
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (fetchErr || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Generate unique order_id
    const order_id = `TRAVEL-${booking_id}-${Date.now()}`;

    // Parse total_price (remove "Rp", dots, etc. → integer)
    const rawPrice = String(booking.total_price).replace(/[^0-9]/g, '');
    const amount = parseInt(rawPrice, 10) || 100000;

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
        first_name: booking.name,
        email: booking.email,
        phone: booking.phone,
      },
      item_details: [
        {
          id: `booking-${booking_id}`,
          price: amount,
          quantity: 1,
          name: booking.item_name.substring(0, 50), // Midtrans max 50 chars
          category: booking.booking_type === 'package' ? 'Tour Package' : 'Car Rental',
        },
      ],
      callbacks: {
        finish: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'}/payment/finish`,
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
      console.error('Midtrans error:', midtransData);
      return res.status(midtransRes.status).json({
        error: 'Midtrans API error',
        details: midtransData,
      });
    }

    const { token: snap_token, redirect_url } = midtransData;

    // Save order_id and snap_token to Supabase
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ order_id, snap_token, payment_status: 'unpaid' })
      .eq('id', booking_id);

    if (updateErr) {
      console.error('Failed to update booking with order_id:', updateErr);
      // Don't block — still return snap_token to frontend
    }

    return res.status(200).json({ snap_token, redirect_url, order_id });
  } catch (err) {
    console.error('Payment API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
