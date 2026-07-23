import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Create Supabase admin client directly inside the function
 * so it always reads env vars at request time, not module load time.
 * Falls back to anon key if service role key is not set.
 */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(`supabaseUrl is required. NEXT_PUBLIC_SUPABASE_URL=${url}, key=${!!key}`);
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

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
  // Always return 200 to Midtrans — it retries on non-200 responses
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

  try {
    const body = req.body;

    // Detailed log for debugging in Vercel Functions tab
    console.log('[Midtrans Webhook] Received:', JSON.stringify({
      order_id: body?.order_id,
      transaction_status: body?.transaction_status,
      fraud_status: body?.fraud_status,
      status_code: body?.status_code,
      gross_amount: body?.gross_amount,
      has_server_key: !!MIDTRANS_SERVER_KEY,
      has_supabase_url: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
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
      console.warn('[Midtrans Webhook] Missing required fields in body');
      return res.status(200).json({ message: 'Missing fields, ignored' });
    }

    // Verify signature
    if (MIDTRANS_SERVER_KEY && signature_key) {
      const valid = verifySignature(order_id, status_code, gross_amount, signature_key, MIDTRANS_SERVER_KEY);
      if (!valid) {
        console.warn('[Midtrans Webhook] ❌ Invalid signature for order:', order_id);
        return res.status(200).json({ message: 'Invalid signature, ignored' });
      }
      console.log('[Midtrans Webhook] ✅ Signature verified for order:', order_id);
    } else if (!MIDTRANS_SERVER_KEY) {
      console.warn('[Midtrans Webhook] ⚠️ MIDTRANS_SERVER_KEY not set — skipping signature check');
    }

    const payment_status = mapPaymentStatus(transaction_status, fraud_status);
    const paid_at = payment_status === 'paid'
      ? (transaction_time ? new Date(transaction_time).toISOString() : new Date().toISOString())
      : null;

    console.log(`[Midtrans Webhook] Mapping: transaction_status=${transaction_status}, fraud_status=${fraud_status} → payment_status=${payment_status}`);

    // Build update payload
    const updatePayload = {
      payment_status,
      payment_type: payment_type || null,
      paid_at,
    };

    // Auto-confirm booking when payment is successful
    if (payment_status === 'paid') {
      updatePayload.status = 'confirmed';
    } else if (payment_status === 'failed' || payment_status === 'expired') {
      updatePayload.status = 'cancelled';
    }

    // ── Parse booking_id from order_id ─────────────────────────────
    // order_id format: TRAVEL-{booking_id}-{timestamp}
    // e.g. TRAVEL-34-1753276123456 → booking_id = 34
    let numericBookingId = null;
    const orderIdMatch = order_id.match(/^TRAVEL-(\d+)-\d+$/);
    if (orderIdMatch) {
      numericBookingId = parseInt(orderIdMatch[1], 10);
      console.log(`[Midtrans Webhook] Parsed booking_id=${numericBookingId} from order_id=${order_id}`);
    } else {
      console.warn(`[Midtrans Webhook] ⚠️ Cannot parse booking_id from order_id: ${order_id}`);
    }

    // Create Supabase client at request time
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (clientErr) {
      console.error('[Midtrans Webhook] ❌ Cannot create Supabase client:', clientErr.message);
      return res.status(200).json({ message: 'DB config error logged' });
    }

    // ── Update booking ──────────────────────────────────────────────
    // Try by booking_id first (most reliable), fallback to order_id
    let updated = null;
    let updateErr = null;

    if (numericBookingId) {
      const result = await supabase
        .from('bookings')
        .update({ ...updatePayload, order_id })  // also save order_id for future lookups
        .eq('id', numericBookingId)
        .select('id, name, payment_status, status')
        .single();
      updated = result.data;
      updateErr = result.error;
      console.log(`[Midtrans Webhook] Update by booking_id=${numericBookingId}:`, updateErr ? `❌ ${updateErr.message}` : `✅ OK`);
    }

    // Fallback: try by order_id
    if (!updated && !updateErr) {
      const result = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('order_id', order_id)
        .select('id, name, payment_status, status')
        .maybeSingle();
      updated = result.data;
      updateErr = result.error;
      console.log(`[Midtrans Webhook] Update by order_id=${order_id}:`, updateErr ? `❌ ${updateErr.message}` : updated ? `✅ OK` : `⚠️ Not found`);
    }

    if (updateErr) {
      console.error('[Midtrans Webhook] ❌ Supabase update failed:', updateErr.message);
      return res.status(200).json({ message: 'DB update error logged' });
    }

    if (!updated) {
      console.warn(`[Midtrans Webhook] ⚠️ No booking found for order_id=${order_id}`);
      return res.status(200).json({ message: 'Booking not found, ignored' });
    }

    console.log(`[Midtrans Webhook] ✅ Updated booking #${updated?.id} (${updated?.name}) → payment_status=${updated?.payment_status}, status=${updated?.status}`);
    return res.status(200).json({
      message: 'OK',
      payment_status: updated?.payment_status,
      booking_id: updated?.id,
    });


  } catch (err) {
    console.error('[Midtrans Webhook] ❌ Unexpected error:', err.message, err.stack);
    return res.status(200).json({ message: 'Error logged' });
  }
}
