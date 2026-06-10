/**
 * getAutomationAlerts — Admin-only. Returns actionable system alerts.
 * Self-contained — no local imports.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Admin-only
  let user = null;
  try {
    user = await base44.auth.me();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!user || user.role !== "admin") {
    return json({ error: "Admin access required" }, 403);
  }

  try {
    const now = Date.now();
    const alerts = [];

    // 1. Failed CommunicationEvents in last 24 hours
    const recentFailed = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { status: "failed" }, "-created_date", 200
    ).catch(() => []);
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentFailedFiltered = (recentFailed || []).filter(e =>
      new Date(e.created_date).getTime() > oneDayAgo
    );

    // Group by provider
    const byProvider = {};
    for (const evt of recentFailedFiltered) {
      const key = evt.provider || "unknown";
      if (!byProvider[key]) byProvider[key] = [];
      byProvider[key].push(evt);
    }
    for (const [provider, failures] of Object.entries(byProvider)) {
      const count = failures.length;
      const latest = failures[0];
      const errorMsg = (latest.error_message || "No error details").slice(0, 200);
      alerts.push({
        id: `provider_failure_${provider}`,
        type: "provider_failure",
        severity: count >= 5 ? "critical" : "warning",
        title: `${count} ${provider} failure${count > 1 ? "s" : ""} (last 24h)`,
        description: `Latest: ${errorMsg}`,
        entity_id: latest.id,
        entity_type: "CommunicationEvent",
        fix_action: "check_integration",
        fix_label: "Check Integration",
        created_at: latest.created_date,
        metadata: { provider, failure_count: count, event_ids: failures.slice(0, 5).map(e => e.id) },
      });
    }

    // 2. Orders stuck at pending_payment for more than 1 hour
    const pendingOrders = await base44.asServiceRole.entities.Order.filter(
      { payment_status: "pending" }, "-created_date", 50
    ).catch(() => []);
    const oneHourAgo = now - 60 * 60 * 1000;
    const stalledOrders = (pendingOrders || []).filter(o =>
      new Date(o.created_date).getTime() < oneHourAgo && o.stripe_session_id
    );
    if (stalledOrders.length > 0) {
      alerts.push({
        id: "stalled_orders",
        type: "payment_stalled",
        severity: "critical",
        title: `${stalledOrders.length} order${stalledOrders.length > 1 ? "s" : ""} stuck at pending_payment`,
        description: `${stalledOrders.length} order(s) have a Stripe session but payment_status is still 'pending'. Stripe webhook may not be processing.`,
        entity_id: stalledOrders[0].id,
        entity_type: "Order",
        fix_action: "check_stripe_webhook",
        fix_label: "Check Stripe Webhook",
        created_at: stalledOrders[0].created_date,
        metadata: { order_ids: stalledOrders.map(o => o.id), count: stalledOrders.length },
      });
    }

    // 3. Stalled AutomationJobs (queued for too long)
    const stalledJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { status: "queued" }, "-scheduled_for", 50
    ).catch(() => []);
    const STALL_THRESHOLDS = {
      instant_sms: 60 * 60 * 1000,
      confirmation_email: 3 * 60 * 60 * 1000,
      admin_notification: 2 * 60 * 60 * 1000,
      nurture_sequence: 6 * 60 * 60 * 1000,
      webhook_dispatch: 4 * 60 * 60 * 1000,
    };
    const stalledJobsList = (stalledJobs || []).filter(job => {
      const scheduledAt = job.scheduled_for
        ? new Date(job.scheduled_for).getTime()
        : new Date(job.created_date).getTime();
      const threshold = STALL_THRESHOLDS[job.job_type] || 4 * 60 * 60 * 1000;
      return (now - scheduledAt) > threshold;
    });
    if (stalledJobsList.length > 0) {
      const ageHours = Math.round(((now - new Date(stalledJobsList[0].created_date).getTime()) / (60 * 60 * 1000)) * 10) / 10;
      alerts.push({
        id: "stalled_automation_jobs",
        type: "stalled_automation",
        severity: stalledJobsList.length >= 3 ? "critical" : "warning",
        title: `${stalledJobsList.length} stalled automation job${stalledJobsList.length > 1 ? "s" : ""}`,
        description: `Jobs queued but not processed. Oldest: ${ageHours}h ago. Types: ${[...new Set(stalledJobsList.map(j => j.job_type))].join(", ")}`,
        entity_id: stalledJobsList[0].id,
        entity_type: "AutomationJob",
        fix_action: "retry_job",
        fix_label: "Retry Jobs",
        created_at: stalledJobsList[0].created_date,
        metadata: { count: stalledJobsList.length, oldest_hours: ageHours },
      });
    }

    // 4. Recently failed AutomationJobs (last 6h)
    const failedJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { status: "failed" }, "-updated_date", 50
    ).catch(() => []);
    const sixHoursAgo = now - 6 * 60 * 60 * 1000;
    const recentlyFailed = (failedJobs || []).filter(j =>
      new Date(j.updated_date || j.created_date).getTime() > sixHoursAgo
    );
    if (recentlyFailed.length > 0) {
      const types = [...new Set(recentlyFailed.map(j => j.job_type || "unknown"))];
      alerts.push({
        id: "failed_automation_jobs",
        type: "automation_failed",
        severity: recentlyFailed.length >= 3 ? "critical" : "warning",
        title: `${recentlyFailed.length} automation job${recentlyFailed.length > 1 ? "s" : ""} failed (last 6h)`,
        description: `Types: ${types.join(", ")}. Last error: ${(recentlyFailed[0]?.last_error || "Unknown").slice(0, 120)}`,
        entity_id: recentlyFailed[0]?.id,
        entity_type: "AutomationJob",
        fix_action: "retry_all_failed",
        fix_label: "Retry All Failed",
        created_at: recentlyFailed[0]?.updated_date || recentlyFailed[0]?.created_date,
        metadata: { count: recentlyFailed.length, types },
      });
    }

    // 5. New Leads with no initial contact after 2 hours
    const newLeads = await base44.asServiceRole.entities.Leads.filter(
      { status: "New" }, "-created_date", 50
    ).catch(() => []);
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    const uncontactedLeads = (newLeads || []).filter(l =>
      new Date(l.created_date).getTime() < twoHoursAgo && !l.last_contacted_at
    );
    if (uncontactedLeads.length > 0) {
      alerts.push({
        id: "uncontacted_leads",
        type: "lead_flow_blocked",
        severity: uncontactedLeads.length >= 3 ? "critical" : "warning",
        title: `${uncontactedLeads.length} lead${uncontactedLeads.length > 1 ? "s" : ""} not contacted (2h+)`,
        description: `New leads haven't been automatically contacted. Check Twilio/Resend configuration and automation triggers.`,
        entity_id: uncontactedLeads[0]?.id,
        entity_type: "Leads",
        fix_action: "check_integration",
        fix_label: "Check Integrations",
        created_at: uncontactedLeads[0]?.created_date,
        metadata: { count: uncontactedLeads.length, lead_ids: uncontactedLeads.slice(0, 5).map(l => l.id) },
      });
    }

    // Sort: critical first, then by recency
    alerts.sort((a, b) => {
      if (a.severity === "critical" && b.severity !== "critical") return -1;
      if (b.severity === "critical" && a.severity !== "critical") return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return json({
      alerts,
      total: alerts.length,
      critical_count: alerts.filter(a => a.severity === "critical").length,
      warning_count: alerts.filter(a => a.severity === "warning").length,
      generated_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[getAutomationAlerts] Error:", err.message);
    return json({ error: err.message }, 500);
  }
});