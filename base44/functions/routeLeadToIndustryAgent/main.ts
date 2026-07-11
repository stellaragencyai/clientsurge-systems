import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import {
  buildIndustryDataQualityFlags,
  classifyLeadIndustry,
} from "../_shared/industryClassifier.ts";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json().catch(() => ({}));
    if (!lead_id) return json({ error: "lead_id required" }, 400);

    const leads = await base44.asServiceRole.entities.Leads.filter({ id: lead_id });
    if (!leads?.length) return json({ error: "Lead not found" }, 404);

    const lead = leads[0];
    const classification = classifyLeadIndustry(lead);
    const now = new Date().toISOString();
    const industry = classification.status === "classified"
      ? classification.industry_label
      : classification.status === "excluded_test"
        ? "Internal Test / Excluded"
        : "Needs Manual Review";

    const tags = Array.isArray(lead.industry_tags) ? lead.industry_tags.filter(Boolean).map(String) : [];
    if (!tags.some((tag) => tag.toLowerCase() === industry.toLowerCase())) {
      tags.unshift(industry);
    }

    const assignedAgent = classification.status === "review_required"
      ? (lead.assigned_agent_name || "sales_rep_general")
      : classification.routing.agent_name;

    await base44.asServiceRole.entities.Leads.update(lead_id, {
      industry,
      industry_tags: tags.slice(0, 8),
      assigned_agent_name: assignedAgent,
      data_quality_flags: buildIndustryDataQualityFlags(lead.data_quality_flags, classification),
      data_quality_checked_at: now,
      audited_at: now,
    });

    console.log(
      `[routeLeadToIndustryAgent] Lead ${lead_id} | ${industry} | ${classification.status} | ${classification.confidence}% | ${assignedAgent}`,
    );

    return json({
      success: true,
      lead_id,
      industry_key: classification.industry_key,
      industry_label: industry,
      candidate_industry: classification.industry_label,
      classification_status: classification.status,
      confidence: classification.confidence,
      conflict: classification.conflict,
      reason: classification.reason,
      agent_name: assignedAgent,
      rep_name: classification.routing.rep_name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lead routing failed";
    console.error("[routeLeadToIndustryAgent]", error);
    return json({ error: message }, 500);
  }
});
