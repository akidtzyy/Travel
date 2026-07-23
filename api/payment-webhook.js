import crypto from 'crypto';
import supabase from './db-client.js';

/**
 * Verify Midtrans signature key
 * Formula: SHA512(order_id + status_code + gross_amount + server_key)
 */
function verifySignature(orderId, statusCode, grossAmount, receivedSig, serverKey) {
  if (!serverKey) return false;
  const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  return expected === receivedSig;
}

/**
 * Map Midtrans transaction_status → our payment_status
 */
function mapPaymentStatus(transactionStatus, fraudStatus) {
  if (transactionStatus === 'capture') {
    return fraudStatus === 'accept' ? 'paid' : 'challenge';
  }
  if (transactionStatus === 'settlement') return 'paid';
  if (transactionStatus === 'pending') return 'pending';
  if (['deny', 'cancel', 'failure'].includes(transactionStatus)) return 'failed';
  if (transactionStatus === 'expire') return 'expired';
  return 'pending';
}

export default async function handler(req, res) {
  // Always return 200 to prevent Midtrans retries on our errors
  // Midtrans will retry if it gets 5xx or 4xx

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read server key at request time (not module load time)
  // This ensures it's available even if loaded lazily
  const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

  try {
    const body = req.body;

    // Log incoming webhook for debugging
    console.log('[Midtrans Webhook] Received:', JSON.stringify({
      order_id: body?.order_id,
      transaction_status: body?.transaction_status,
      status_code: body?.status_code,
      has_server_key: !!MIDTRANS_SERVER_KEY,
    }));

    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      status_code,
      gross_amount,
      signature_key,
      transaction_time,
    } = body || {};

    if (!order_id || !transaction_status) {
      console.warn('[Midtrans Webhook] Missing required fields');
      return res.status(200).json({ message: 'Missing fields, ignored' });
    }

    // Verify signature — skip if server key not configured (dev/test mode)
    if (MIDTRANS_SERVER_KEY && signature_key) {
      const valid = verifySignature(order_id, status_code, gross_amount, signature_key, MIDTRANS_SERVER_KEY);
      if (!valid) {
        console.warn('[Midtrans Webhook] Invalid signature for order:', order_id);
        // Return 200 so Midtrans doesn't retry, but log the rejection
        return res.status(200).json({ message: 'Invalid signature, ignored' });
      }
    } else if (!MIDTRANS_SERVER_KEY) {
      console.warn('[Midtrans Webhook] MIDTRANS_SERVER_KEY not set — skipping signature check');
    }

    const payment_status = mapPaymentStatus(transaction_status, fraud_status);
    const paid_at = payment_status === 'paid'
      ? (transaction_time ? new Date(transaction_time).toISOString() : new Date().toISOString())
      : null;

    console.log(`[Midtrans Webhook] ${order_id} → ${transaction_status} → ${payment_status}`);

    // Update booking in Supabase
    const { data, error } = await supabase
      .from('bookings')
      .update({
        payment_status,
        payment_type: payment_type || null,
        paid_at,
        ...(payment_status === 'paid' ? { status: 'confirmed' } : {}),
      })
      .eq('order_id', order_id)
      .select('id, name, email, item_name')
      .single();

    if (error) {
      console.error('[Midtrans Webhook] Supabase update failed:', error.message, '| order_id:', order_id);
      // Still return 200 to prevent Midtrans retries
      return res.status(200).json({ message: 'DB error logged, will not retry' });
    }

    console.log(`[Midtrans Webhook] ✅ Updated booking #${data?.id} (${data?.name}) → ${payment_status}`);
    return res.status(200).json({ message: 'OK', payment_status, booking_id: data?.id });

  } catch (err) {
    console.error('[Midtrans Webhook] Unexpected error:', err.message);
    return res.status(200).json({ message: 'Error logged' });
  }
}
