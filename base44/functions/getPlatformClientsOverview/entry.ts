import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Platform SaaS Admin — Aggregated multi-tenant client overview
 * Returns per-client usage, health, and pipeline metrics
 * READ-ONLY — admin only
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch core data in parallel
    const [
      clientConfigs,
      allClients,
      allOrders,
      allLeads,
      allEvents,
    ] = await Promise.all([
      base44.asServiceRole.entities.ClientAccountConfig.filter({}, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.Client.filter({}, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.Order.filter({ payment_status: 'paid' }, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.Leads.filter({}, '-created_date', 5000).catch(() => []),
      base44.asServiceRole.entities.CommunicationEvent.filter({}, '-created_date', 2000).catch(() => []),
    ]);

    // Build per-client aggregated metrics
    const clientMetrics = {};

    // Seed from Client records
    allClients.forEach(c => {
      if (!c.id) return;
      const key = c.id;
      clientMetrics[key] = {
        client_id: c.id,
        business_name: c.business_name || 'Unknown',
        email: c.email || '',
        industry: c.industry || 'Unknown',
        status: c.lifecycle_stage || 'unknown',
        leads_total: 0,
        events_total: 0,
        messages_sent: 0,
        revenue_total: 0,
        plan_type: 'unknown',
        workspace_status: 'unknown',
        health_score: 0,
        churn_risk: 'low',
      };
    });

    // Overlay from ClientAccountConfig
    clientConfigs.forEach(cfg => {
      const key = cfg.client_id;
      if (key && clientMetrics[key]) {
        clientMetrics[key].plan_type = cfg.plan_type || 'starter';
        clientMetrics[key].workspace_status = cfg.workspace_status || 'unknown';
        clientMetrics[key].health_score = cfg.health_score || 0;
        clientMetrics[key].churn_risk = cfg.churn_risk || 'low';
        clientMetrics[key].usage = cfg.usage_current_month || {};
        clientMetrics[key].feature_flags = cfg.feature_flags || {};
      } else if (key) {
        // Config exists but no matching Client record
        clientMetrics[key] = {
          client_id: key,
          business_name: cfg.business_name || 'Unknown',
          email: cfg.client_email || '',
          industry: cfg.industry || 'Unknown',
          status: cfg.workspace_status || 'unknown',
          plan_type: cfg.plan_type || 'starter',
          workspace_status: cfg.workspace_status || 'unknown',
          health_score: cfg.health_score || 0,
          churn_risk: cfg.churn_risk || 'low',
          leads_total: 0,
          events_total: 0,
          messages_sent: 0,
          revenue_total: 0,
          usage: cfg.usage_current_month || {},
        };
      }
    });

    // Aggregate lead counts per client_id
    allLeads.forEach(l => {
      if (l.client_id && clientMetrics[l.client_id]) {
        clientMetrics[l.client_id].leads_total++;
      }
    });

    // Aggregate event counts per client_id
    allEvents.forEach(e => {
      if (e.client_id && clientMetrics[e.client_id]) {
        clientMetrics[e.client_id].events_total++;
        if (e.event_type === 'sms_sent' || e.event_type === 'email_sent') {
          clientMetrics[e.client_id].messages_sent++;
        }
      }
    });

    // Revenue from paid orders
    allOrders.forEach(o => {
      if (o.client_id && clientMetrics[o.client_id]) {
        const orderRevenue = (o.total_setup || 0) + (o.total_monthly || 0);
        clientMetrics[o.client_id].revenue_total += orderRevenue;
      }
    });

    // Platform-level aggregates
    const clientList = Object.values(clientMetrics);
    const totalClients = clientList.length;
    const activeClients = clientList.filter(c => c.workspace_status === 'active' || c.status === 'live').length;
    const totalLeads = clientList.reduce((s, c) => s + c.leads_total, 0);
    const totalRevenue = clientList.reduce((s, c) => s + c.revenue_total, 0);
    const highChurnRisk = clientList.filter(c => c.churn_risk === 'high').length;

    // Plan distribution
    const planDistribution = {};
    clientList.forEach(c => {
      const plan = c.plan_type || 'unknown';
      planDistribution[plan] = (planDistribution[plan] || 0) + 1;
    });

    return Response.json({
      timestamp: new Date().toISOString(),
      platform_summary: {
        total_clients: totalClients,
        active_clients: activeClients,
        total_leads_across_clients: totalLeads,
        total_revenue: totalRevenue,
        high_churn_risk_count: highChurnRisk,
        plan_distribution: planDistribution,
      },
      clients: clientList
        .sort((a, b) => b.leads_total - a.leads_total)
        .slice(0, 100),
    });
  } catch (error) {
    console.error('[getPlatformClientsOverview]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});