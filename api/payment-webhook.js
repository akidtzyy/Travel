import crypto from 'crypto';
import supabase from './db-client.js';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

/**
 * Verify Midtrans signature key
 * Formula: SHA512(order_id + status_code + gross_amount + server_key)
 */
function verifySignature(orderId, statusCode, grossAmount, receivedSig) {
  const raw = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
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
  // Midtrans only sends POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      status_code,
      gross_amount,
      signature_key,
      transaction_time,
    } = req.body;

    // Verify signature to ensure request is from Midtrans
    if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
      console.warn('Invalid Midtrans signature for order:', order_id);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const payment_status = mapPaymentStatus(transaction_status, fraud_status);
    const paid_at = payment_status === 'paid' ? (transaction_time || new Date().toISOString()) : null;

    // Update booking in Supabase
    const { data, error } = await supabase
      .from('bookings')
      .update({
        payment_status,
        payment_type: payment_type || null,
        paid_at,
        // Also update main status when paid
        ...(payment_status === 'paid' ? { status: 'confirmed' } : {}),
      })
      .eq('order_id', order_id)
      .select('id, name, email, item_name')
      .single();

    if (error) {
      console.error('Supabase update failed for order:', order_id, error);
      // Return 200 to prevent Midtrans from retrying
      return res.status(200).json({ message: 'Processed (db error logged)' });
    }

    console.log(`✅ Webhook: ${order_id} → ${payment_status} (booking #${data?.id})`);

    return res.status(200).json({ message: 'OK', payment_status });
  } catch (err) {
    console.error('Webhook handler error:', err);
    // Always return 200 to Midtrans to avoid infinite retries
    return res.status(200).json({ message: 'Error logged' });
  }
}
