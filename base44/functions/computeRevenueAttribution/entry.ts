import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Compute Revenue Attribution: Maps revenue back through funnel stages
 * Attributes revenue to lead sources, UTM campaigns, and message templates
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
    let periodMs = 2592000000;
    if (metric_period === '1d') periodMs = 86400000;
    if (metric_period === '7d') periodMs = 604800000;
    if (metric_period === '90d') periodMs = 7776000000;

    const periodStart = new Date(now.getTime() - periodMs);

    console.log('[computeRevenueAttribution] Fetching orders and subscriptions...');

    // Fetch orders with revenue data
    const orders = await base44.asServiceRole.entities.Order.filter(
      {
        client_project_id,
        created_date: { $gte: periodStart.toISOString() },
      },
      null,
      10000
    ).catch(() => []);

    // Fetch lead outcomes to link leads to conversions
    const leadOutcomes = await base44.asServiceRole.entities.LeadOutcomeAnalytics.filter(
      {
        client_id,
        outcome_type: 'booking_completed',
      },
      null,
      10000
    ).catch(() => []);

    // Build attribution map
    const attributionBySource = {};
    const attributionByUTM = {};
    let totalRevenue = 0;

    // Calculate revenue from actual order amounts
    for (const order of orders || []) {
      // Use actual order totals: setup fee + first month of monthly fees
      const setupRevenue = order.total_setup || order.pricing_summary?.total_setup || 0;
      const monthlyRevenue = order.total_monthly || order.pricing_summary?.total_monthly || 0;
      const orderRevenue = setupRevenue + monthlyRevenue;
      totalRevenue += orderRevenue;

      // Attribute to lead source if linked
      const source = order.lead_id ? 'lead_pipeline' : 'direct';
      if (!attributionBySource[source]) {
        attributionBySource[source] = {
          revenue_total: 0,
          conversion_count: 0,
          average_order_value: 0,
        };
      }
      attributionBySource[source].revenue_total += orderRevenue;
      attributionBySource[source].conversion_count++;

      // Attribute by UTM if available
      if (order.utm_source) {
        const utmKey = order.utm_source;
        if (!attributionByUTM[utmKey]) {
          attributionByUTM[utmKey] = {
            revenue_total: 0,
            conversion_count: 0,
            average_order_value: 0,
          };
        }
        attributionByUTM[utmKey].revenue_total += orderRevenue;
        attributionByUTM[utmKey].conversion_count++;
      }
    }

    // Calculate AOV
    for (const source in attributionBySource) {
      attributionBySource[source].average_order_value = (
        attributionBySource[source].revenue_total / attributionBySource[source].conversion_count
      ).toFixed(2);
    }

    console.log('[computeRevenueAttribution] Attribution computed:', {
      total_revenue: totalRevenue,
      sources: Object.keys(attributionBySource).length,
      orders: orders?.length || 0,
    });

    return Response.json({
      success: true,
      attribution: {
        period: metric_period,
        period_start: periodStart.toISOString(),
        period_end: now.toISOString(),
        total_revenue_attributed: totalRevenue,
        attribution_by_source: attributionBySource,
        attribution_by_utm: attributionByUTM,
        computed_at: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('[computeRevenueAttribution] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});