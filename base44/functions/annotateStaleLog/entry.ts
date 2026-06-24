import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * ANNOTATE STALE/WRONG COMMUNICATION LOG
 *
 * Creates an audit annotation for the old CommunicationLog record
 * that used the stale/wrong phone 6055874608 instead of the correct
 * 6025874608 (canonical E.164: +16025874608).
 *
 * If the old CommunicationLog record still exists, it adds a superseded_note.
 * If it doesn't exist (deleted/in different DB), it creates a CommunicationEvent
 * audit note documenting the correction.
 *
 * Admin-only.
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return json({ error: 'Admin only' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const old_log_id = body.old_log_id || '6a3b22bc5eb46602c67da518';
    const correct_lead_id = body.correct_lead_id || '6a38d0b4ae4b42c2c3e76799';

    const SUPERSEDED_NOTE =
      'This log used stale/raw phone 6055874608 and is NOT valid proof for corrected number 6025874608. ' +
      'Corrected canonical target is +16025874608. ' +
      'Superseded by later regression/production send records using +16025874608.';

    // 1. Try to update the old CommunicationLog record directly
    let logUpdated = false;
    try {
      await base44.asServiceRole.entities.CommunicationLog.update(old_log_id, {
        superseded_note: SUPERSEDED_NOTE,
      });
      logUpdated = true;
      console.log(`[annotateStaleLog] Updated CommunicationLog ${old_log_id} with superseded note`);
    } catch (e) {
      console.log(`[annotateStaleLog] Could not update CommunicationLog ${old_log_id}: ${e.message}`);
    }

    // 2. Always create a CommunicationEvent audit note (regardless of whether log update succeeded)
    const auditEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: correct_lead_id,
      channel: 'sms',
      direction: 'system',
      event_type: 'status_update',
      provider: 'internal',
      status: 'processed',
      subject: 'AUDIT: Stale phone correction annotation',
      message_body: SUPERSEDED_NOTE,
      metadata_json: JSON.stringify({
        audit_type: 'stale_phone_correction',
        old_communication_log_id: old_log_id,
        stale_phone_used: '6055874608',
        wrong_normalized: '+16055874608',
        correct_raw_phone: '6025874608',
        correct_canonical_e164: '+16025874608',
        corrected_lead_id: correct_lead_id,
        log_record_updated: logUpdated,
        note: 'Old CommunicationLog used stale phone 6055874608 (normalized to +16055874608 by Twilio). This is the WRONG number. All new SMS paths now enforce canonical E.164 normalization: 6025874608 → +16025874608.',
        timestamp: new Date().toISOString(),
      }),
      dashboard_excluded: false,
      dashboard_truth_status: 'trusted',
    }).catch(e => {
      console.warn(`[annotateStaleLog] Failed to create audit CommunicationEvent: ${e.message}`);
      return null;
    });

    return json({
      success: true,
      old_log_id,
      log_record_updated: logUpdated,
      audit_event_id: auditEvent?.id || null,
      superseded_note: SUPERSEDED_NOTE,
      message: logUpdated
        ? 'Old CommunicationLog annotated with superseded note. Audit CommunicationEvent also created.'
        : 'Old CommunicationLog not found or could not be updated. Audit CommunicationEvent created as fallback.',
    });
  } catch (error) {
    console.error('[annotateStaleLog]', error);
    return json({ error: error.message, success: false }, { status: 500 });
  }
});