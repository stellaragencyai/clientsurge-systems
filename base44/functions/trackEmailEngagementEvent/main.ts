/**
 * Task 16 — Email open/click engagement tracking
 * Called from receiveResendWebhook to update lead engagement score
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOOST_MAP = { 'email.opened': 5, 'email.clicked': 8 };
const FIELD_MAP = { 'email.opened': 'email_opened_count', 'email.clicked': 'email_clicked_count' };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, event_type } = await req.json();

    if (!lead_id || !event_type) {
      return Response.json({ error: 'lead_id and event_type required' }, { status: 400 });
    }

    const boost = BOOST_MAP[event_type];
    if (!boost) {
      return Response.json({ success: true, skipped: true, reason: 'Non-tracked event type' });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    const countField = FIELD_MAP[event_type];
    const currentCount = (lead[countField] ?? 0) + 1;
    const currentScore = lead.lead_score ?? 0;
    const newScore = Math.min(100, currentScore + boost);

    await base44.asServiceRole.entities.Leads.update(lead_id, {
      [countField]: currentCount,
      lead_score: newScore,
      last_activity_at: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      event_type: 'email_sent',
      channel: 'email',
      direction: 'inbound',
      provider: 'resend',
      status: 'processed',
      subject: event_type,
      metadata_json: JSON.stringify({ event_type, score_boost: boost, new_score: newScore }),
    }).catch((e) => console.error('Log failed:', e.message));

    return Response.json({ success: true, new_score: newScore, [countField]: currentCount });
  } catch (error) {
    console.error('trackEmailEngagementEvent error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});