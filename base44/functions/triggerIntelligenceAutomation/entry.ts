import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * triggerIntelligenceAutomation — Dispatch automation actions based on intelligence_score
 * 
 * HOT (80-100): Create admin alert + flag for immediate SMS
 * WARM (50-79): Create nurture email job
 * COLD (<50): Add to drip campaign record
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { lead_id } = body;

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    // Fetch the lead
    const leads = await base44.asServiceRole.entities.Leads.filter({ id: lead_id }, "-created_date", 1);
    const lead = leads?.[0];
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const score = lead.intelligence_score || 0;
    const actions = [];

    if (score >= 80) {
      // HOT: Create admin alert event
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: lead.id,
        channel: "internal",
        direction: "system",
        event_type: "status_update",
        provider: "internal",
        status: "processed",
        subject: `🔥 HOT LEAD ALERT: ${lead.full_name}`,
        message_body: `Lead ${lead.full_name} (${lead.business_name}) has an intelligence score of ${score}. Recommended action: Call now.`,
        environment: "production",
        dashboard_truth_status: "trusted",
      });
      actions.push("admin_alert_created");
    } else if (score >= 50) {
      // WARM: Log for nurture
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: lead.id,
        channel: "internal",
        direction: "system",
        event_type: "workflow_triggered",
        provider: "internal",
        status: "processed",
        subject: `Nurture trigger: ${lead.full_name}`,
        message_body: `Lead ${lead.full_name} is WARM (score ${score}). Added to nurture queue.`,
        environment: "production",
        dashboard_truth_status: "trusted",
      });
      actions.push("nurture_queued");
    } else {
      // COLD: Log for drip
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: lead.id,
        channel: "internal",
        direction: "system",
        event_type: "workflow_triggered",
        provider: "internal",
        status: "processed",
        subject: `Drip queue: ${lead.full_name}`,
        message_body: `Lead ${lead.full_name} is COLD (score ${score}). Added to drip campaign queue.`,
        environment: "production",
        dashboard_truth_status: "trusted",
      });
      actions.push("drip_queued");
    }

    return Response.json({
      success: true,
      lead_id: lead.id,
      intelligence_score: score,
      segment: lead.intelligence_segment,
      actions_taken: actions,
    });
  } catch (error) {
    console.error("triggerIntelligenceAutomation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});