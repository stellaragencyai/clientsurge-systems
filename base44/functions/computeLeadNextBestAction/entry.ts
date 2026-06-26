import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json().catch(() => ({}));

    if (!lead_id) return json({ error: "lead_id required" }, 400);

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id).catch(() => null);
    if (!lead) return json({ error: "Lead not found" }, 404);

    // Check for existing NBA
    const existing = await base44.asServiceRole.entities.LeadNextBestAction.filter(
      { lead_id }, "-created_date", 1
    ).catch(() => []);

    // Use LLM to compute predictive next-best-action
    const nbaResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a predictive lead value engine. Analyze this lead and calculate the next-best-action.

Lead Data:
- Name: ${lead.full_name || lead.owner_contact_name || "Unknown"}
- Email: ${lead.email || "None"}
- Phone: ${lead.phone || "None"}
- Business: ${lead.business_name || "Unknown"}
- Industry: ${lead.industry || lead.business_type || "Unknown"}
- Source: ${lead.source || "Unknown"}
- Problem: ${lead.problem || "Not specified"}
- Status: ${lead.status || "New"}
- CRM Stage: ${lead.crm_stage || "Not Contacted"}
- Lead Score: ${lead.lead_score || 0}
- Intelligence Score: ${lead.intelligence_score || 0}
- Segment: ${lead.segment || "Unknown"}
- Revenue Impact: ${lead.revenue_impact_estimate || 0}
- Last Contacted: ${lead.last_contacted_at || "Never"}

Calculate:
1. lead_intent (what does this lead want?)
2. urgency (low/medium/high/critical based on recency, source, problem urgency)
3. estimated_opportunity (dollar value estimate)
4. likelihood_to_book (0-100%)
5. risk_of_going_cold (0-100%)
6. best_next_action (specific action recommendation)
7. human_should_call (boolean — should a human call within 10 minutes?)
8. automation_should_continue (boolean — should automation keep nurturing?)
9. confidence_score (0-100)
10. reason_summary (1-2 sentence explanation)

Example: "Sarah M. — Home valuation lead — Urgent — Recommended action: call within 10 minutes — Reason: valuation page + seller intent + provided phone + urgent wording."`,
      response_json_schema: {
        type: "object",
        properties: {
          lead_intent: { type: "string" },
          urgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
          estimated_opportunity: { type: "number" },
          likelihood_to_book: { type: "number" },
          risk_of_going_cold: { type: "number" },
          best_next_action: { type: "string" },
          human_should_call: { type: "boolean" },
          automation_should_continue: { type: "boolean" },
          confidence_score: { type: "number" },
          reason_summary: { type: "string" },
        },
      },
    });

    const nbaData = {
      ...nbaResponse,
      lead_id,
      client_id: lead.client_id || "",
      client_project_id: lead.client_project_id || "",
      lead_name: lead.full_name || lead.owner_contact_name || "",
      lead_email: lead.email || "",
      lead_phone: lead.phone || "",
      calculated_at: new Date().toISOString(),
    };

    let nba;
    if (existing?.length > 0) {
      nba = await base44.asServiceRole.entities.LeadNextBestAction.update(existing[0].id, nbaData);
    } else {
      nba = await base44.asServiceRole.entities.LeadNextBestAction.create(nbaData);
    }

    return json({ success: true, next_best_action: nba });
  } catch (error) {
    console.error("[computeLeadNextBestAction] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});