import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Convert Outbound Lead: Handles conversion event in funnel
 * Updates OutboundLead status, links to Order, records conversion in ConversionOptimizationSignal
 * Non-breaking: does not modify existing Order or CommunicationEvent schema
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      outbound_lead_id,
      order_id,
      client_id,
      client_project_id,
      revenue_amount,
      conversion_source,
    } = await req.json();

    if (!outbound_lead_id || !order_id) {
      return Response.json(
        { error: 'outbound_lead_id and order_id required' },
        { status: 400 }
      );
    }

    console.log('[convertOutboundLead] Processing conversion:', {
      outbound_lead_id,
      order_id,
      client_project_id,
    });

    // Update OutboundLead status to converted
    const convertedAt = new Date().toISOString();
    await base44.asServiceRole.entities.OutboundLead.update(outbound_lead_id, {
      outreach_status: 'converted',
      conversion_at: convertedAt,
      converted_order_id: order_id,
      converted_client_id: client_id,
      last_activity_at: convertedAt,
    }).catch(err => console.error('[convertOutboundLead] OutboundLead update failed:', err.message));

    // Record conversion event in OutboundActivity
    await base44.asServiceRole.entities.OutboundActivity.create({
      outbound_lead_id,
      client_id,
      activity_type: 'conversion_event',
      channel: 'system',
      status: 'completed',
      occurred_at: convertedAt,
    }).catch(err => console.error('[convertOutboundLead] Activity log failed:', err.message));

    // Generate conversion signal if revenue detected
    if (revenue_amount && revenue_amount > 0) {
      await base44.asServiceRole.entities.ConversionOptimizationSignal.create({
        client_id,
        client_project_id,
        signal_type: 'success_pattern_detected',
        severity: 'low',
        title: `High-Value Conversion: $${revenue_amount} from ${conversion_source || 'outbound'}`,
        description: `Lead converted successfully with ${revenue_amount} MRR/ARR attributed to this outbound sequence`,
        metric_affected: 'revenue_per_lead',
        status: 'active',
        first_detected_at: convertedAt,
      }).catch(err => console.error('[convertOutboundLead] Signal creation failed:', err.message));
    }

    console.log('[convertOutboundLead] Conversion recorded:', {
      lead: outbound_lead_id,
      order: order_id,
    });

    return Response.json({
      success: true,
      converted_at: convertedAt,
      message: 'Outbound lead converted successfully',
    });
  } catch (error) {
    console.error('[convertOutboundLead] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});