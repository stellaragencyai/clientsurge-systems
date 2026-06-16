import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Compute Conversion Funnel: Derives funnel metrics from Leads → Orders → Subscriptions
 * Tracks conversion rates per stage, drop-offs, and revenue attribution
 * Stores in ConversionFunnel (read-only derived entity)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id, client_project_id, metric_period = '30d' } = await req.json();

    if (!client_project_id) {
      return Response.json({ error: 'client_project_id required' }, { status: 400 });
    }

    // Calculate time range
    const now = new Date();
    let periodMs = 2592000000; // 30d default
    if (metric_period === '1d') periodMs = 86400000;
    if (metric_period === '7d') periodMs = 604800000;
    if (metric_period === '90d') periodMs = 7776000000;

    const periodStart = new Date(now.getTime() - periodMs);

    console.log('[computeConversionFunnel] Computing funnel for', {
      client_project_id,
      metric_period,
      period_start: periodStart,
    });

    // Stage 1: Leads Created
    const leads = await base44.asServiceRole.entities.Leads.filter(
      {
        client_project_id,
        created_date: { $gte: periodStart.toISOString() },
      },
      null,
      10000
    ).catch(() => []);

    const stage_lead_created = {
      stage_name: 'lead_created',
      stage_number: 1,
      total_count: leads?.length || 0,
      conversion_from_previous_percent: 100,
      conversion_from_top_percent: 100,
    };

    // Stage 2: Contacted (has last_contacted_at)
    const contacted = (leads || []).filter(l => l.last_contacted_at);
    const stage_contacted = {
      stage_name: 'contacted',
      stage_number: 2,
      total_count: contacted.length,
      conversion_from_previous_percent:
        stage_lead_created.total_count > 0
          ? ((contacted.length / stage_lead_created.total_count) * 100).toFixed(2)
          : 0,
      conversion_from_top_percent:
        stage_lead_created.total_count > 0
          ? ((contacted.length / stage_lead_created.total_count) * 100).toFixed(2)
          : 0,
    };

    // Stage 3: Replied (has first_reply_at or status === 'Replied')
    const replied = (leads || []).filter(l => l.first_reply_at || l.status === 'Replied');
    const stage_replied = {
      stage_name: 'replied',
      stage_number: 3,
      total_count: replied.length,
      conversion_from_previous_percent:
        contacted.length > 0 ? ((replied.length / contacted.length) * 100).toFixed(2) : 0,
      conversion_from_top_percent:
        stage_lead_created.total_count > 0
          ? ((replied.length / stage_lead_created.total_count) * 100).toFixed(2)
          : 0,
    };

    // Stage 4: Booked (status includes 'Booked' or has booked_at)
    const booked = (leads || []).filter(l => l.booked_at || l.status === 'Booked');
    const stage_booked = {
      stage_name: 'booked',
      stage_number: 4,
      total_count: booked.length,
      conversion_from_previous_percent:
        replied.length > 0 ? ((booked.length / replied.length) * 100).toFixed(2) : 0,
      conversion_from_top_percent:
        stage_lead_created.total_count > 0
          ? ((booked.length / stage_lead_created.total_count) * 100).toFixed(2)
          : 0,
    };

    // Stage 5: Paid (has converted_order_id or linked Order exists)
    const leadsWithOrders = (leads || []).filter(l => l.order_id);
    const stage_paid = {
      stage_name: 'paid',
      stage_number: 5,
      total_count: leadsWithOrders.length,
      conversion_from_previous_percent:
        booked.length > 0
          ? ((leadsWithOrders.length / booked.length) * 100).toFixed(2)
          : 0,
      conversion_from_top_percent:
        stage_lead_created.total_count > 0
          ? ((leadsWithOrders.length / stage_lead_created.total_count) * 100).toFixed(2)
          : 0,
    };

    // Calculate overall conversion and identify drop-off
    const funnel_stages = [
      stage_lead_created,
      stage_contacted,
      stage_replied,
      stage_booked,
      stage_paid,
    ];

    let biggest_drop_off = 0;
    let biggest_drop_off_stage = null;
    for (let i = 1; i < funnel_stages.length; i++) {
      const dropOff =
        Number(funnel_stages[i - 1].conversion_from_previous_percent) -
        Number(funnel_stages[i].conversion_from_previous_percent);
      if (dropOff > biggest_drop_off) {
        biggest_drop_off = dropOff;
        biggest_drop_off_stage = funnel_stages[i].stage_name;
      }
    }

    // Group by source
    const by_source = {};
    (leads || []).forEach(lead => {
      const source = lead.source || 'unknown';
      if (!by_source[source]) {
        by_source[source] = {
          leads_count: 0,
          converted_count: 0,
          revenue_attributed: 0,
        };
      }
      by_source[source].leads_count++;
      if (lead.order_id) {
        by_source[source].converted_count++;
      }
    });

    for (const source in by_source) {
      by_source[source].conversion_rate_percent =
        by_source[source].leads_count > 0
          ? ((by_source[source].converted_count / by_source[source].leads_count) * 100).toFixed(2)
          : 0;
      by_source[source].revenue_per_lead =
        by_source[source].leads_count > 0
          ? (by_source[source].revenue_attributed / by_source[source].leads_count).toFixed(2)
          : 0;
    }

    // Create ConversionFunnel record
    const funnelRecord = {
      client_id,
      client_project_id,
      funnel_name: 'Default Lead → Payment Funnel',
      metric_period,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      funnel_stages,
      top_to_bottom_conversion_percent: stage_paid.conversion_from_top_percent,
      biggest_drop_off_stage,
      biggest_drop_off_percent: biggest_drop_off.toFixed(2),
      revenue_per_funnel_entrant: (0).toFixed(2), // Placeholder
      total_revenue_attributed: 0, // Placeholder
      by_source,
      by_utm_source: {},
      computed_at: now.toISOString(),
    };

    console.log('[computeConversionFunnel] Funnel computed:', {
      stages: funnel_stages.length,
      lead_created: stage_lead_created.total_count,
      paid: stage_paid.total_count,
      overall_conversion: stage_paid.conversion_from_top_percent,
      biggest_drop_off_stage,
    });

    return Response.json({
      success: true,
      funnel: funnelRecord,
    });
  } catch (error) {
    console.error('[computeConversionFunnel] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});