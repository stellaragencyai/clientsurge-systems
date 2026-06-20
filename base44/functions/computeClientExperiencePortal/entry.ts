import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * COMPUTE CLIENT EXPERIENCE PORTAL
 * Aggregates data from all source systems into a unified client-facing portal view.
 * 
 * Triggered by:
 * - Order payment completion
 * - OnboardingOrchestration updates
 * - ClientInstallationOS stage changes
 * - Lead activity (daily batch or per-lead)
 * 
 * Reads from (never modifies):
 * - OnboardingOrchestration (canonical onboarding state)
 * - ClientInstallationOS (activation state)
 * - Leads (lead activity for this client)
 * - RevenueTracking (financial outcomes)
 * - ConversionFunnel (performance metrics)
 * - CommunicationEvent (system activity)
 * 
 * Writes to: ClientExperiencePortal (single upsert per client)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id, client_project_id, order_id, force_recompute } = await req.json();

    if (!client_id && !order_id) {
      return Response.json({ error: 'Provide client_id or order_id' }, { status: 400 });
    }

    // ── Resolve client context ────────────────────────────────────────────
    let cid = client_id;
    let cPid = client_project_id;
    let oid = order_id;

    if (oid) {
      const order = await base44.asServiceRole.entities.Order.get(oid).catch(() => null);
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
      cid = order.client_id;
      cPid = order.client_project_id;
    } else if (!cid) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // ── Fetch source systems in parallel ──────────────────────────────────
    const [orchestration, installOS, order, subscription, leads, revenue, funnel, healthEvents] = await Promise.all([
      base44.asServiceRole.entities.OnboardingOrchestration?.filter({ client_id: cid }, '-created_date', 1)
        .then(r => r?.[0] ?? null).catch(() => null),
      base44.asServiceRole.entities.ClientInstallationOS?.filter({ client_id: cid }, '-created_date', 1)
        .then(r => r?.[0] ?? null).catch(() => null),
      oid ? base44.asServiceRole.entities.Order?.get(oid).catch(() => null) : null,
      base44.asServiceRole.entities.Subscription?.filter({ client_id: cid }, '-created_date', 1)
        .then(r => r?.[0] ?? null).catch(() => null),
      base44.asServiceRole.entities.Leads?.filter({ client_id: cid }, '-created_date', 100)
        .catch(() => []),
      base44.asServiceRole.entities.RevenueTracking?.filter({ client_id: cid }, '-created_date', 100)
        .catch(() => []),
      base44.asServiceRole.entities.ConversionFunnel?.filter({ client_id: cid }, '-created_date', 1)
        .then(r => r?.[0] ?? null).catch(() => null),
      base44.asServiceRole.entities.CommunicationEvent?.filter(
        { client_id: cid, event_type: { $in: ['provider_send_succeeded', 'provider_send_failed'] } },
        '-created_date', 200
      ).catch(() => []),
    ]);

    // ── Compute live metrics ──────────────────────────────────────────────
    const totalLeads = (leads || []).length;
    const leadsContacted = (leads || []).filter(l => l.last_contacted_at).length;
    const leadsBooked = (leads || []).filter(l => l.status === 'Booked').length;
    const conversionRate = totalLeads > 0 ? Math.round((leadsBooked / totalLeads) * 100) : 0;

    // Revenue from RevenueTracking records
    const totalRevenue = (revenue || []).reduce((sum, r) => sum + (r.revenue_amount || 0), 0);

    // Avg response time from CommunicationEvent timestamps
    const responseTimes = (leads || [])
      .filter(l => l.created_date && l.last_contacted_at)
      .map(l => {
        const created = new Date(l.created_date).getTime();
        const contacted = new Date(l.last_contacted_at).getTime();
        return (contacted - created) / (1000 * 60); // minutes
      })
      .filter(t => t > 0);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // ── Compute onboarding + activation state ──────────────────────────
    const onboardingStage = orchestration?.unified_stage || installOS?.workflow_stage || 'intake_received';
    const checklistCompletion = orchestration?.completion_metrics?.completion_percentage || 0;
    const activationStatus = installOS?.activation_status || 'not_ready';
    const blockersCount = orchestration?.blockers?.length || 0;

    // ── Compute health status from recent events ───────────────────────
    const last7DaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentSuccessful = (healthEvents || []).filter(e =>
      e.event_type === 'provider_send_succeeded' && e.created_date > last7DaysAgo
    ).length;
    const recentFailed = (healthEvents || []).filter(e =>
      e.event_type === 'provider_send_failed' && e.created_date > last7DaysAgo
    ).length;

    let automationHealthStatus = 'unknown';
    if (recentSuccessful > 0 && recentFailed === 0) {
      automationHealthStatus = 'healthy';
    } else if (recentSuccessful > 0 && recentFailed > 0) {
      const failureRate = recentFailed / (recentSuccessful + recentFailed);
      automationHealthStatus = failureRate > 0.1 ? 'degraded' : 'healthy';
    } else if (recentFailed > 0) {
      automationHealthStatus = 'failed';
    }

    // ── Generate AI summaries (optional) ──────────────────────────────
    let aiSummary = null;
    let aiRecommendations = null;

    if (orchestration || installOS) {
      // Simple pattern-based summaries; can invoke LLM for more sophistication
      if (activationStatus === 'live') {
        aiSummary = `Your automation system is live and processing leads. You've received ${totalLeads} leads with a ${conversionRate}% booking rate.`;
      } else if (activationStatus === 'testing') {
        aiSummary = `Your automations are in testing. Setup is ${checklistCompletion}% complete.`;
      } else {
        aiSummary = `Your setup is in progress. Next step: ${orchestration?.missing_setup_items?.[0] || 'complete remaining setup'}`;
      }

      if (blockersCount > 0) {
        aiRecommendations = `You have ${blockersCount} item(s) to resolve before going live. Review the blockers below.`;
      } else if (conversionRate < 20 && totalLeads > 10) {
        aiRecommendations = 'Your booking rate could be improved. Consider optimizing your booking flow or follow-up messaging.';
      } else if (conversionRate > 50) {
        aiRecommendations = 'Great conversion rate! Continue monitoring your automation performance.';
      }
    }

    // ── Upsert ClientExperiencePortal ────────────────────────────────
    const existing = await base44.asServiceRole.entities.ClientExperiencePortal?.filter(
      { client_id: cid, client_project_id: cPid },
      '-created_date', 1
    ).then(r => r?.[0] ?? null).catch(() => null);

    const portalPayload = {
      client_id: cid,
      client_project_id: cPid,
      order_id: oid,
      subscription_id: subscription?.id,
      business_name: order?.business_name || installOS?.business_name || 'Unknown',
      total_leads_received: totalLeads,
      leads_contacted: leadsContacted,
      leads_booked: leadsBooked,
      revenue_generated: totalRevenue,
      conversion_rate: conversionRate,
      avg_response_time_minutes: avgResponseTime,
      onboarding_stage: onboardingStage,
      onboarding_completion_percent: checklistCompletion,
      activation_status: activationStatus,
      blockers_count: blockersCount,
      automation_health_status: automationHealthStatus,
      event_pipeline_status: 'unknown', // Could compute from EventQueue health
      recent_activity_summary: `${leadsBooked} bookings from ${totalLeads} leads | ${conversionRate}% conversion | ${avgResponseTime}min avg response`,
      ai_summary: aiSummary,
      ai_recommendations: aiRecommendations,
      last_synced_at: new Date().toISOString(),
    };

    let result;
    if (existing?.id) {
      result = await base44.asServiceRole.entities.ClientExperiencePortal.update(existing.id, portalPayload);
    } else {
      result = await base44.asServiceRole.entities.ClientExperiencePortal.create({
        ...portalPayload,
        portal_status: 'draft',
        portal_access_enabled: false,
        created_at: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      client_id: cid,
      portal_id: result?.id ?? existing?.id,
      metrics: {
        total_leads: totalLeads,
        booked: leadsBooked,
        conversion_rate: conversionRate,
        revenue: totalRevenue,
        onboarding_complete: `${checklistCompletion}%`,
        activation_status: activationStatus,
      },
    });
  } catch (error) {
    console.error('[computeClientExperiencePortal]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});