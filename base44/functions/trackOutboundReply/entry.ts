import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Track Outbound Reply: Detects and logs replies to outbound messages
 * Triggered when inbound SMS/email received (webhook integration point)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { from_email, from_phone, message_text, original_message_id } = await req.json();

    const results = {
      reply_tracked: false,
      lead_updated: false,
      reply_id: null,
    };

    // Find outbound lead by email or phone
    let lead = null;
    if (from_email) {
      const leads = await base44.asServiceRole.entities.OutboundLead.filter(
        { email: from_email },
        '-created_date',
        1
      ).catch(() => []);
      lead = leads?.[0];
    } else if (from_phone) {
      const leads = await base44.asServiceRole.entities.OutboundLead.filter(
        { phone: from_phone },
        '-created_date',
        1
      ).catch(() => []);
      lead = leads?.[0];
    }

    if (!lead) {
      return Response.json({
        success: true,
        ...results,
        reason: 'lead_not_found',
      });
    }

    // Log reply activity
    const activity = await base44.asServiceRole.entities.OutboundActivity.create({
      outbound_lead_id: lead.id,
      client_id: lead.client_id,
      sequence_id: lead.sequence_id,
      activity_type: 'reply_received',
      channel: from_email ? 'email' : 'sms',
      reply_text: message_text,
      reply_sentiment: 'unclassified',
      occurred_at: new Date().toISOString(),
    }).catch(() => null);

    if (activity) {
      results.reply_tracked = true;
      results.reply_id = activity.id;
    }

    // Update lead status
    await base44.asServiceRole.entities.OutboundLead.update(lead.id, {
      outreach_status: 'replied',
      first_reply_at: new Date().toISOString(),
      total_replies: (lead.total_replies || 0) + 1,
      last_activity_at: new Date().toISOString(),
    }).catch(() => {});

    results.lead_updated = true;

    console.log(`[trackOutboundReply] Reply tracked for lead:`, lead.id);

    return Response.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[trackOutboundReply] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});