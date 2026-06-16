/**
 * leadPipelineOrchestrator — Unified lead lifecycle management.
 * Handles: creation, scoring, intent classification, routing, follow-up sequences.
 * Replaces 6+ fragmented broken automations.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { event, data, lead_id, website_lead_id } = body;
  const base44 = createClientFromRequest(req);
  const tasks = [];

  try {
    // Determine lead source
    let lead = null;
    let leadSource = null;

    if (lead_id) {
      const leads = await base44.asServiceRole.entities.Leads.filter(
        { id: lead_id }, "-created_date", 1
      ).catch(() => []);
      lead = leads?.[0];
      leadSource = "crm_lead";
    } else if (website_lead_id) {
      const webLeads = await base44.asServiceRole.entities.WebsiteLead.filter(
        { id: website_lead_id }, "-created_date", 1
      ).catch(() => []);
      if (webLeads?.[0]) {
        lead = webLeads[0];
        leadSource = "website_lead";
      }
    } else if (data?.id) {
      lead = data;
      leadSource = event?.entity_name === "WebsiteLead" ? "website_lead" : "crm_lead";
    }

    if (!lead) {
      console.warn("[leadPipelineOrchestrator] No lead found", { lead_id, website_lead_id });
      return json({ success: false, reason: "lead_not_found" }, 404);
    }

    console.log("[leadPipelineOrchestrator] Processing lead", { lead_id: lead.id, leadSource, email: lead.email });

    // Step 1: Score the lead
    let leadScore = lead.lead_score || 0;
    if (!lead.lead_score || lead.lead_score === 0) {
      leadScore = Math.min(100, (lead.engagement_score || 0) + (lead.reply_sentiment === "Positive" ? 20 : 0) + 10);
      await base44.asServiceRole.entities[leadSource === "website_lead" ? "WebsiteLead" : "Leads"].update(
        lead.id, { lead_score: leadScore }
      ).catch(err => console.warn("[leadPipelineOrchestrator] Score update failed", { error: err.message }));
      tasks.push(`lead_scored: ${leadScore}`);
    }

    // Step 2: Classify intent
    let aiIntent = lead.ai_intent || "other";
    if (!lead.ai_intent || lead.ai_intent === "other") {
      if (lead.message && lead.message.toLowerCase().includes("price")) aiIntent = "pricing_interest";
      else if (lead.message && lead.message.toLowerCase().includes("available")) aiIntent = "availability_interest";
      else if (lead.requested_channels?.includes("booking")) aiIntent = "booking_ready";
      else if (lead.reply_sentiment === "Negative") aiIntent = "not_interested";
      else aiIntent = "question";

      await base44.asServiceRole.entities[leadSource === "website_lead" ? "WebsiteLead" : "Leads"].update(
        lead.id, { ai_intent: aiIntent }
      ).catch(err => console.warn("[leadPipelineOrchestrator] Intent update failed", { error: err.message }));
      tasks.push(`intent_classified: ${aiIntent}`);
    }

    // Step 3: Route to agent (if applicable)
    if (!lead.assigned_agent_name && lead.industry) {
      const agentMap = {
        "med_spa": "sales_rep_med_spa",
        "dental": "sales_rep_dental",
        "chiropractic": "sales_rep_chiropractic",
        "hvac": "sales_rep_hvac",
        "roofing": "sales_rep_roofing",
        "contractors": "sales_rep_contractors",
      };
      const agentName = agentMap[lead.industry] || null;
      if (agentName) {
        await base44.asServiceRole.entities[leadSource === "website_lead" ? "WebsiteLead" : "Leads"].update(
          lead.id, { assigned_agent_name: agentName }
        ).catch(err => console.warn("[leadPipelineOrchestrator] Agent assignment failed", { error: err.message }));
        tasks.push(`routed_to_agent: ${agentName}`);
      }
    }

    // Step 4: Start follow-up sequence (if hot and no reply yet)
    if ((leadScore >= 75 || aiIntent === "booking_ready") && !lead.next_follow_up_at) {
      const nextFollowUp = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min from now
      await base44.asServiceRole.entities[leadSource === "website_lead" ? "WebsiteLead" : "Leads"].update(
        lead.id, { 
          next_follow_up_at: nextFollowUp,
          cadence_mode: lead.cadence_mode || "auto",
          automation_enabled: true
        }
      ).catch(err => console.warn("[leadPipelineOrchestrator] Follow-up scheduling failed", { error: err.message }));
      tasks.push("follow_up_sequence_initiated");

      // Queue first follow-up message
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: lead.id,
        channel: "sms",
        direction: "outbound",
        event_type: "workflow_triggered",
        provider: "internal",
        status: "pending",
        subject: `Hot lead follow-up for ${lead.email || "unknown"}`,
        message_body: `Instant follow-up queued for hot lead ${lead.full_name || ""}. Score: ${leadScore}. Intent: ${aiIntent}.`,
        metadata_json: JSON.stringify({ leadScore, aiIntent, leadSource }),
      }).catch(() => null);
    }

    // Step 5: Log event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "processed",
      subject: `Lead orchestrator processed ${lead.email}`,
      message_body: `Lead ${lead.id} processed. Score: ${leadScore}, Intent: ${aiIntent}, Tasks: ${tasks.join(", ")}`,
      metadata_json: JSON.stringify({ leadScore, aiIntent, tasks, leadSource }),
    }).catch(() => null);

    console.log("[leadPipelineOrchestrator] Complete", { lead_id: lead.id, tasks });
    return json({ success: true, lead_id: lead.id, tasks });

  } catch (err) {
    console.error("[leadPipelineOrchestrator] Fatal error", { error: err.message });
    return json({ error: err.message }, 500);
  }
});