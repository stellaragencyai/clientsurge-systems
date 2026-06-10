/**
 * routeLeadToIndustryAgent — self-contained (no _shared imports)
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

const INDUSTRY_AGENT_MAP = {
  med_spa: {
    agent_name: "sales_rep_med_spa",
    rep_name: "Sarah",
    industry_label: "Med Spa & Aesthetics",
    keywords: ["med spa", "medspa", "aesthetic", "botox", "filler", "laser", "skin", "beauty clinic", "coolsculpting", "facial"],
  },
  dental: {
    agent_name: "sales_rep_dental",
    rep_name: "Marcus",
    industry_label: "Dental & Orthodontics",
    keywords: ["dental", "dentist", "orthodont", "braces", "implant", "teeth", "oral", "invisalign", "whitening"],
  },
  chiropractic: {
    agent_name: "sales_rep_chiropractic",
    rep_name: "Jordan",
    industry_label: "Chiropractic & Physical Therapy",
    keywords: ["chiro", "physical therapy", "pt clinic", "spine", "rehab", "massage therapy", "sports medicine"],
  },
  hvac: {
    agent_name: "sales_rep_hvac",
    rep_name: "Tyler",
    industry_label: "HVAC & Home Services",
    keywords: ["hvac", "heating", "cooling", "plumb", "electric", "home service", "repair", "handyman", "pest control"],
  },
  roofing: {
    agent_name: "sales_rep_roofing",
    rep_name: "Derek",
    industry_label: "Roofing & Restoration",
    keywords: ["roof", "restor", "gutters", "siding", "storm damage", "shingles", "tarp"],
  },
  contractors: {
    agent_name: "sales_rep_contractors",
    rep_name: "Alex",
    industry_label: "Contractors & Trades",
    keywords: ["contractor", "construct", "build", "remodel", "paint", "flooring", "tile", "cabinet", "landscap", "hardscape"],
  },
};

function detectIndustry(lead) {
  const searchText = [
    lead.business_type || "",
    lead.problem || "",
    lead.source || "",
    lead.intake_type || "",
    lead.business_name || "",
  ].join(" ").toLowerCase();

  for (const [key, config] of Object.entries(INDUSTRY_AGENT_MAP)) {
    if (config.keywords.some((kw) => searchText.includes(kw))) {
      return { industry_key: key, ...config };
    }
  }

  return { industry_key: "general", agent_name: "sales_rep_general", rep_name: "Nolan", industry_label: "General" };
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
    const routing = detectIndustry(lead);

    console.log(`[routeLeadToIndustryAgent] Lead: ${lead.full_name} | Industry: ${routing.industry_key} | Agent: ${routing.agent_name}`);

    await base44.asServiceRole.entities.Leads.update(lead_id, {
      assigned_agent_name: routing.agent_name,
    });

    return json({ success: true, lead_id, industry_key: routing.industry_key, agent_name: routing.agent_name, rep_name: routing.rep_name, industry_label: routing.industry_label });
  } catch (error) {
    console.error("[routeLeadToIndustryAgent] error:", error.message);
    return json({ error: error.message }, 500);
  }
});