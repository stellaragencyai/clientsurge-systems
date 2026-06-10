/**
 * automationOrchestrator — Central automation hub for new leads.
 * Self-contained. Only calls functions that are confirmed to exist in this app.
 * Previously 500'd because it called 8+ non-existent functions.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

async function safeInvoke(base44, functionName, payload) {
  try {
    const result = await base44.asServiceRole.functions.invoke(functionName, payload);
    return { success: true, data: result?.data || result };
  } catch (err) {
    console.warn(`[automationOrchestrator] ${functionName} failed (non-blocking):`, err.message);
    return { success: false, error: err.message };
  }
}

Deno.serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { lead_id, trigger_event } = body;
  if (!lead_id) return json({ error: "lead_id required" }, 400);

  const base44 = createClientFromRequest(req);
  const steps = {};

  try {
    // Load lead
    const leads = await base44.asServiceRole.entities.Leads.filter(
      { id: lead_id }, "-created_date", 1
    ).catch(() => []);
    const lead = leads?.[0];
    if (!lead) {
      console.error("[automationOrchestrator] Lead not found", { lead_id });
      return json({ error: "Lead not found" }, 404);
    }

    console.log("[automationOrchestrator] Processing lead", { lead_id, trigger_event, email: lead.email });

    // Step 1: Score the lead
    steps.score = await safeInvoke(base44, "calculateLeadScore", { lead_id });
    const score = steps.score?.data?.score || lead.lead_score || 0;

    // Step 2: Enrich lead if not yet enriched
    if (!lead.enriched_at) {
      steps.enrich = await safeInvoke(base44, "enrichLeadWithAI", { lead_id });
    } else {
      steps.enrich = { success: true, data: { skipped: true, reason: "already_enriched" } };
    }

    // Step 3: Classify intent if message exists
    if (lead.problem || lead.description) {
      steps.intent = await safeInvoke(base44, "classifyLeadIntent", {
        lead_id,
        message_text: lead.problem || lead.description || "",
      });
    }

    const intent = steps.intent?.data?.intent || "general";

    // Step 4: Route lead to correct industry agent
    steps.route = await safeInvoke(base44, "routeLeadToIndustryAgent", { lead_id });

    // Step 5: Send instant lead response (SMS) if phone exists and not already contacted
    if (lead.phone && lead.status !== "Contacted") {
      steps.instant_sms = await safeInvoke(base44, "sendInstantLeadResponseSms", { lead_id });
    } else {
      steps.instant_sms = { success: true, data: { skipped: true, reason: lead.phone ? "already_contacted" : "no_phone" } };
    }

    // Step 6: Send lead confirmation email if email exists
    if (lead.email) {
      steps.confirmation_email = await safeInvoke(base44, "sendLeadConfirmationEmail", { lead_id });
    } else {
      steps.confirmation_email = { success: true, data: { skipped: true, reason: "no_email" } };
    }

    // Step 7: Schedule follow-up
    steps.followup = await safeInvoke(base44, "scheduleFollowUp", { lead_id });

    // Step 8: Admin notification
    steps.admin_notify = await safeInvoke(base44, "sendAdminLeadNotification", { lead_id });

    // Log completion CommunicationEvent
    const successCount = Object.values(steps).filter(s => s.success).length;
    const failCount = Object.values(steps).filter(s => !s.success).length;

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: failCount === 0 ? "processed" : "delivered",
      subject: `Automation workflow completed for lead ${lead_id}`,
      message_body: `Score: ${score} | Intent: ${intent} | Steps: ${successCount} ok, ${failCount} failed`,
      metadata_json: JSON.stringify({ lead_id, trigger_event, score, intent, steps_summary: Object.fromEntries(Object.entries(steps).map(([k, v]) => [k, v.success])) }),
    }).catch(() => null);

    console.log("[automationOrchestrator] Complete", {
      lead_id, steps_ok: successCount, steps_failed: failCount,
    });

    return json({
      success: true,
      lead_id,
      trigger_event,
      score,
      intent,
      steps_completed: successCount,
      steps_failed: failCount,
      steps,
    });

  } catch (err) {
    console.error("[automationOrchestrator] Fatal error", { error: err.message, lead_id });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "automationOrchestrator",
      status: "failed",
      subject: "AI workflow trigger failed",
      message_body: err.message,
      error_message: err.message,
      metadata_json: JSON.stringify({ lead_id, trigger_event, error: err.message }),
    }).catch(() => null);

    return json({ error: err.message, success: false, lead_id }, 500);
  }
});