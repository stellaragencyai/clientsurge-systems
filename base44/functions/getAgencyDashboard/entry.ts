import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Get Agency Dashboard: Returns aggregated metrics for an agency and all owned clients
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const agencyId = url.searchParams.get('agency_id');

    if (!agencyId) {
      return Response.json({ error: 'agency_id required' }, { status: 400 });
    }

    // Fetch agency details
    const agency = await base44.asServiceRole.entities.Agency.filter(
      { id: agencyId },
      null,
      1
    ).then(results => results?.[0]).catch(() => null);

    if (!agency) {
      return Response.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Fetch branding config
    const branding = await base44.asServiceRole.entities.AgencyBrandingConfig.filter(
      { agency_id: agencyId },
      null,
      1
    ).then(results => results?.[0]).catch(() => null);

    // Fetch all client mappings for this agency
    const mappings = await base44.asServiceRole.entities.AgencyClientMapping.filter(
      { agency_id: agencyId, is_active: true },
      null,
      1000
    ).catch(() => []);

    const clientIds = mappings?.map(m => m.client_id) || [];

    // Fetch latest metrics snapshot
    const metrics = await base44.asServiceRole.entities.AgencyMetricsSnapshot.filter(
      { agency_id: agencyId },
      '-snapshot_date',
      1
    ).then(results => results?.[0]).catch(() => null);

    // Get active subscriptions for revenue calculation
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      { client_id: { $in: clientIds || [] } },
      null,
      1000
    ).catch(() => []);

    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
    const totalMRR = activeSubscriptions.reduce((sum, s) => sum + (s.monthly_amount || 0), 0);

    return Response.json({
      success: true,
      agency: {
        id: agency.id,
        name: agency.agency_name,
        owner: agency.owner_email,
        status: agency.status,
        plan: agency.billing_plan,
        white_label_enabled: agency.white_label_enabled,
        custom_domain: agency.custom_domain,
      },
      branding: branding ? {
        brand_name: branding.brand_name_override || agency.agency_name,
        logo_url: branding.logo_url,
        primary_color: branding.primary_color,
        app_domain: branding.app_domain,
      } : null,
      metrics: metrics ? {
        period: metrics.metric_period,
        total_clients: metrics.total_clients,
        active_clients: metrics.active_clients,
        onboarding_clients: metrics.onboarding_clients,
        total_leads: metrics.total_leads_captured,
        total_automations: metrics.total_automations_active,
        total_messages: metrics.total_messages_sent,
        revenue_mtd: metrics.revenue_mtd,
        revenue_ytd: metrics.revenue_ytd,
        churn_rate: metrics.churn_rate_percent,
        nrr: metrics.nrr_percent,
      } : {
        total_clients: clientIds.length,
        active_subscriptions: activeSubscriptions.length,
        total_mrr: totalMRR,
      },
      clients: {
        total: clientIds.length,
        active_count: activeSubscriptions.length,
        mapped_count: mappings?.length || 0,
      },
    });
  } catch (error) {
    console.error('[getAgencyDashboard] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});