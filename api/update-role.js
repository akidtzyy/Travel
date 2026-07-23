import { createClient } from '@supabase/supabase-js';

// Valid roles that can be assigned by super_admin
// Note: 'super_admin' cannot be assigned via this API — must be done directly in DB
const ASSIGNABLE_ROLES = ['user', 'admin'];

// Service role client — bypasses RLS
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase admin credentials not configured');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { target_user_id, new_role, requester_id } = req.body;

    // ── 1. Input validation ──────────────────────────────────────────
    if (!target_user_id || !new_role || !requester_id) {
      return res.status(400).json({ error: 'target_user_id, new_role, and requester_id are required' });
    }

    if (!ASSIGNABLE_ROLES.includes(new_role)) {
      return res.status(400).json({
        error: `Invalid role. Can only assign: ${ASSIGNABLE_ROLES.join(', ')}. super_admin must be set directly in database.`,
      });
    }

    // ── 2. Self-change guard ─────────────────────────────────────────
    if (requester_id === target_user_id) {
      return res.status(403).json({ error: 'You cannot change your own role' });
    }

    const adminClient = getAdminClient();

    // ── 3. Verify requester is super_admin ───────────────────────────
    const { data: requesterProfile, error: reqErr } = await adminClient
      .from('profiles')
      .select('role, email')
      .eq('id', requester_id)
      .single();

    if (reqErr || !requesterProfile) {
      return res.status(403).json({ error: 'Could not verify requester identity' });
    }

    if (requesterProfile.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Only Super Admin can change user roles',
      });
    }

    // ── 4. Verify target user exists ─────────────────────────────────
    const { data: targetProfile, error: targetErr } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', target_user_id)
      .single();

    if (targetErr || !targetProfile) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // ── 5. Protect super_admin accounts — cannot be demoted via API ──
    if (targetProfile.role === 'super_admin') {
      return res.status(403).json({
        error: 'Super Admin accounts cannot be modified via this API. Change directly in database.',
      });
    }

    // ── 6. Skip if role is already the same ──────────────────────────
    if (targetProfile.role === new_role) {
      return res.status(200).json({
        message: 'Role unchanged (already set to this value)',
        user: targetProfile,
      });
    }

    // ── 7. Update role via service_role (bypasses RLS) ───────────────
    const { error: updateErr } = await adminClient
      .from('profiles')
      .update({ role: new_role, updated_at: new Date().toISOString() })
      .eq('id', target_user_id);

    if (updateErr) {
      console.error('[update-role] DB update error:', updateErr.message);
      return res.status(500).json({ error: 'Failed to update role' });
    }

    console.log(
      `[update-role] ✅ ${targetProfile.email}: ${targetProfile.role} → ${new_role}` +
      ` | by super_admin: ${requesterProfile.email}`
    );

    return res.status(200).json({
      message: `Role updated to '${new_role}' successfully`,
      user: {
        id: target_user_id,
        email: targetProfile.email,
        full_name: targetProfile.full_name,
        old_role: targetProfile.role,
        new_role,
      },
    });

  } catch (err) {
    console.error('[update-role] Unexpected error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
