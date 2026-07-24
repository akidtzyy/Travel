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

    // Create Supabase client at request time
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (clientErr) {
      console.error('[Midtrans Webhook] ❌ Cannot create Supabase client:', clientErr.message);
      return res.status(200).json({ message: 'DB config error logged' });
    }

    // ── Parse booking_id and payment type from order_id ───────────────
    // order_id formats:
    // 1. TRAVEL-{booking_id}-INITIAL-{timestamp}
    // 2. TRAVEL-{booking_id}-FINAL-{timestamp}
    // 3. TRAVEL-{booking_id}-{timestamp} (legacy)
    let numericBookingId = null;
    let isFinalPayment = false;
    const orderIdMatch = order_id.match(/^TRAVEL-(\d+)(?:-(INITIAL|FINAL))?-\d+$/);
    if (orderIdMatch) {
      numericBookingId = parseInt(orderIdMatch[1], 10);
      isFinalPayment = orderIdMatch[2] === 'FINAL';
      console.log(`[Midtrans Webhook] Parsed booking_id=${numericBookingId}, isFinalPayment=${isFinalPayment} from order_id=${order_id}`);
    } else {
      console.warn(`[Midtrans Webhook] ⚠️ Cannot parse booking_id from order_id: ${order_id}`);
    }

    // Fetch current booking data to determine DP and Expiry details
    let booking = null;
    if (numericBookingId) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', numericBookingId)
        .maybeSingle();
      booking = data;
    }

    const payment_status = mapPaymentStatus(transaction_status, fraud_status);
    const paid_at = payment_status === 'paid'
      ? (transaction_time ? new Date(transaction_time).toISOString() : new Date().toISOString())
      : null;

    console.log(`[Midtrans Webhook] Mapping: transaction_status=${transaction_status}, fraud_status=${fraud_status} → payment_status=${payment_status}`);

    // Build update payload dynamically based on DP rules
    let finalPaymentStatus = payment_status;
    let amountPaidVal = booking ? Number(booking.amount_paid || 0) : 0;
    let remainingBalanceVal = booking ? Number(booking.remaining_balance || 0) : 0;
    let bookingStatusVal = booking ? booking.status : 'pending';

    if (payment_status === 'paid') {
      const totalAmt = booking ? Number(booking.total_amount || 0) : 0;
      if (isFinalPayment) {
        finalPaymentStatus = 'paid';
        amountPaidVal = totalAmt;
        remainingBalanceVal = 0;
        bookingStatusVal = 'confirmed'; // automatically confirm when fully paid
      } else {
        const paymentType = booking ? booking.payment_type : 'FULL';
        if (paymentType === 'DP') {
          finalPaymentStatus = 'partially_paid';
          amountPaidVal = Math.round(totalAmt / 2);
          remainingBalanceVal = totalAmt - amountPaidVal;
        } else {
          finalPaymentStatus = 'paid';
          amountPaidVal = totalAmt;
          remainingBalanceVal = 0;
        }
      }
    } else if (payment_status === 'expired' || payment_status === 'failed') {
      // If initial payment expires/fails, set booking status to expired
      if (!isFinalPayment && (!booking || booking.payment_status === 'pending' || booking.payment_status === 'unpaid')) {
        bookingStatusVal = 'expired';
      }
    }

    const updatePayload = {
      payment_status: finalPaymentStatus,
      amount_paid: amountPaidVal,
      remaining_balance: remainingBalanceVal,
      status: bookingStatusVal,
      paid_at,
    };

    // ── Update booking ──────────────────────────────────────────────
    let updated = null;
    let updateErr = null;

    if (numericBookingId) {
      const result = await supabase
        .from('bookings')
        .update({ ...updatePayload, order_id })  // also save order_id for future lookups
        .eq('id', numericBookingId)
        .select('id, name, payment_status, status, customer_id, total_price')
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
        .select('id, name, payment_status, status, customer_id, total_price')
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

    // Update Customer statistics if transaction is PAID
    if (updated && payment_status === 'paid') {
      try {
        const customerId = updated.customer_id;
        const priceStr = updated.total_price || '0';
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
            
            console.log(`[Midtrans Webhook Stats] Updated customer stats: total_bookings=${newTotalBookings}, total_spent=${newTotalSpent}`);

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
        console.error('[Midtrans Webhook Stats] Error updating customer stats:', statsErr.message);
      }
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
