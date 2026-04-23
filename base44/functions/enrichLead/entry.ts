import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "Missing lead_id" }, { status: 400 });
    }

    const lead = await base44.entities.Lead.filter({ id: lead_id });

    if (!lead || lead.length === 0) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const leadData = lead[0];
    const enrichedData = await enrichLeadData(leadData);

    await base44.entities.Lead.update(lead_id, {
      ...enrichedData,
      last_enriched_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      lead_id,
      enriched_data: enrichedData,
    });
  } catch (error) {
    const status = error instanceof AuthGuardError ? error.status : 500;
    const code = error instanceof AuthGuardError ? error.code : undefined;
    const message = error instanceof Error ? error.message : "Failed to enrich lead";

    return Response.json({ error: message, code }, { status });
  }
});

async function enrichLeadData(lead) {
  let score = lead.lead_score || 0;
  const insights = lead.outreach_insight ? lead.outreach_insight.split(" • ") : [];

  if (lead.has_website && lead.website_quality !== "unknown") {
    if (lead.website_quality === "high") {
      insights.push("Professional website suggests serious operation");
    } else if (lead.website_quality === "low") {
      insights.push("Outdated website = lead capture opportunity");
      score += 5;
    }
  }

  if (lead.has_social) {
    const totalFollowers =
      lead.social_links?.reduce((sum, link) => sum + (link.followers || 0), 0) || 0;

    if (totalFollowers > 3000) {
      insights.push(`Strong social reach (${totalFollowers.toLocaleString()} followers)`);
      score += 5;
    } else if (totalFollowers > 500) {
      insights.push("Moderate social engagement");
    } else {
      insights.push("Limited social following");
    }
  }

  if (lead.email) {
    insights.push("Email available for direct outreach");
  } else {
    insights.push("Email not available - phone/contact form priority");
  }

  score = Math.min(Math.max(score, 0), 100);

  return {
    lead_score: score,
    lead_quality_label: score >= 80 ? "High" : score >= 50 ? "Medium" : "Low",
    outreach_insight: insights.join(" • "),
  };
}
