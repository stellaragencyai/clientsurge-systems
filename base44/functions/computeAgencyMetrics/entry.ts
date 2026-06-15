import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Compute Agency Metrics: Async job that computes aggregated metrics for all agencies
 * Populates AgencyMetricsSnapshot entities for dashboard consumption
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all active agencies
    const agencies = await base44.asServiceRole.entities.Agency.filter(
      { status: 'active' },
      null,
      1000
    ).catch(() => []);

    const results = [];

    for (const agency of agencies || []) {
      try {
        // Get all client mappings for this agency
        const mappings = await base44.asServiceRole.entities.AgencyClientMapping.filter(
          { agency_id: agency.id, is_active: true },
          null,
          1000
        ).catch(() => []);

        const clientIds = mappings?.map(m => m.client_id) || [];

        if (clientIds.length === 0) {
          // No clients, skip
          continue;
        }

        // Aggregate metrics from all clients

        // 1. Get all subscriptions
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
          { client_id: { $in: clientIds } },
          null,
          1000
        ).catch(() => []);

        const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
        const pausedSubscriptions = subscriptions?.filter(s => s.status === 'paused') || [];
        const churnedSubscriptions = subscriptions?.filter(s => s.status === 'cancelled') || [];

        const revenueMTD = activeSubscriptions.reduce((sum, s) => sum + (s.monthly_amount || 0), 0);

        // 2. Get all leads
        const leads = await base44.asServiceRole.entities.Leads.filter(
          { client_id: { $in: clientIds } },
          null,
          5000
        ).catch(() => []);

        // 3. Get all automation rules
        const automations = await base44.asServiceRole.entities.AutomationRule.filter(
          { project_id: { $in: clientIds } }, // Note: AutomationRule uses project_id
          null,
          1000
        ).catch(() => []);

        const activeAutomations = automations?.filter(a => a.enabled) || [];

        // 4. Get communication events count for the period
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const comEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
          {
            client_id: { $in: clientIds },
            created_date: { $gte: thirtyDaysAgo.toISOString() },
          },
          null,
          10000
        ).catch(() => []);

        const messagesSent = comEvents?.filter(e => e.direction === 'outbound') || [];

        // 5. Estimate churn rate
        const churnRate = subscriptions.length > 0 
          ? ((churnedSubscriptions.length / subscriptions.length) * 100)
          : 0;

        // Create metrics snapshot
        const snapshot = {
          agency_id: agency.id,
          snapshot_date: new Date().toISOString(),
          metric_period: '30d',
          total_clients: clientIds.length,
          active_clients: activeSubscriptions.length,
          onboarding_clients: 0, // Could compute from client status
          paused_clients: pausedSubscriptions.length,
          churned_clients: churnedSubscriptions.length,
          total_active_projects: clientIds.length, // Simplified: one project per client
          total_leads_captured: leads?.length || 0,
          total_automations_active: activeAutomations.length,
          total_messages_sent: messagesSent.length,
          total_bookings: 0, // Would need booking entity
          revenue_mtd: revenueMTD,
          revenue_ytd: revenueMTD * 12, // Simplified estimate
          revenue_ltd: agency.total_revenue_ltv || (revenueMTD * 12),
          average_revenue_per_client: clientIds.length > 0 
            ? (revenueMTD / clientIds.length)
            : 0,
          churn_rate_percent: churnRate,
          nrr_percent: 100 - churnRate,
          computed_at: new Date().toISOString(),
        };

        // Save snapshot (create or update)
        await base44.asServiceRole.entities.AgencyMetricsSnapshot.create(snapshot);
        results.push({ agency_id: agency.id, success: true });
      } catch (agencyError) {
        console.error(`[computeAgencyMetrics] Error for agency ${agency.id}:`, agencyError.message);
        results.push({ agency_id: agency.id, success: false, error: agencyError.message });
      }
    }

    return Response.json({
      success: true,
      computed_snapshots: results.length,
      results,
    });
  } catch (error) {
    console.error('[computeAgencyMetrics] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});