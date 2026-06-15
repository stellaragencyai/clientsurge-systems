import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Track Outbound Reply: Handles inbound reply from outbound lead
 * Updates OutboundLead status, sentiment analysis, and tracks in OutboundActivity
 * Integrates with existing CommunicationEvent via provider_message_id
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      outbound_lead_id,
      client_id,
      client_project_id,
      reply_text,
      channel,
      provider_message_id,
    } = await req.json();

    if (!outbound_lead_id || !reply_text) {
      return Response.json({ error: 'outbound_lead_id and reply_text required' }, { status: 400 });
    }

    console.log('[trackOutboundReply] Processing reply:', {
      outbound_lead_id,
      channel,
      length: reply_text.length,
    });

    const occurredAt = new Date().toISOString();

    // Classify sentiment of reply
    let sentiment = 'neutral';
    const lowerReply = reply_text.toLowerCase();
    if (
      lowerReply.includes('interested') ||
      lowerReply.includes('yes') ||
      lowerReply.includes('great') ||
      lowerReply.includes('love')
    ) {
      sentiment = 'positive';
    } else if (
      lowerReply.includes('no thanks') ||
      lowerReply.includes('not interested') ||
      lowerReply.includes('unsubscribe')
    ) {
      sentiment = 'negative';
    }

    // Update OutboundLead
    await base44.asServiceRole.entities.OutboundLead.update(outbound_lead_id, {
      outreach_status: 'replied',
      first_reply_at: occurredAt,
      total_replies: { $inc: 1 },
      last_activity_at: occurredAt,
    }).catch(err => console.error('[trackOutboundReply] Lead update failed:', err.message));

    // Record in OutboundActivity
    await base44.asServiceRole.entities.OutboundActivity.create({
      outbound_lead_id,
      client_id,
      client_project_id,
      activity_type: 'reply_received',
      channel,
      message_preview: reply_text.substring(0, 100),
      reply_text: reply_text,
      reply_sentiment: sentiment,
      provider_message_id,
      status: 'received',
      occurred_at: occurredAt,
    }).catch(err => console.error('[trackOutboundReply] Activity log failed:', err.message));

    // If negative sentiment, create signal
    if (sentiment === 'negative') {
      await base44.asServiceRole.entities.ConversionOptimizationSignal.create({
        client_id,
        client_project_id,
        signal_type: 'high_intent_missed',
        severity: 'low',
        title: `Negative Reply: Lead may be unsubscribing`,
        description: `Outbound lead ${outbound_lead_id} sent negative sentiment reply. May need to pause outreach.`,
        metric_affected: 'response_rate',
        status: 'active',
        first_detected_at: occurredAt,
      }).catch(err => console.error('[trackOutboundReply] Signal failed:', err.message));
    }

    console.log('[trackOutboundReply] Reply tracked:', {
      lead: outbound_lead_id,
      sentiment,
    });

    return Response.json({
      success: true,
      occurred_at: occurredAt,
      sentiment_detected: sentiment,
    });
  } catch (error) {
    console.error('[trackOutboundReply] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});