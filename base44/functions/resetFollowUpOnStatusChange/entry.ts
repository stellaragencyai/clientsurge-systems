/**
 * Task 11 — Follow-up step reset when lead status changes back to new/ignored
 * Call after any lead status update to ensure cadence is consistent
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const RESET_STATUSES = ['New', 'new', 'ignored'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { lead_id, new_status } = await req.json();
    if (!lead_id || !new_status) {
      return Response.json({ error: 'lead_id and new_status required' }, { status: 400 });
    }

    if (!RESET_STATUSES.includes(new_status)) {
      return Response.json({ success: true, reset: false, reason: 'Status does not require reset' });
    }

    await base44.asServiceRole.entities.Leads.update(lead_id, {
      follow_up_step: 0,
      next_follow_up_at: null,
      last_message_sent: null,
      cadence_paused: false,
    });

    console.log(`Follow-up reset for lead ${lead_id} on status change to ${new_status}`);
    return Response.json({ success: true, reset: true, lead_id });
  } catch (error) {
    console.error('resetFollowUpOnStatusChange error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});