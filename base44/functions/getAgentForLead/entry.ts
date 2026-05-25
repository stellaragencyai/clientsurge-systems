import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const AGENT_CONFIGS = {
  sales_rep_med_spa: {
    agent_name: "sales_rep_med_spa",
    rep_name: "Sarah",
    industry_key: "med_spa",
    industry_label: "Med Spa & Aesthetics",
  },
  sales_rep_dental: {
    agent_name: "sales_rep_dental",
    rep_name: "Marcus",
    industry_key: "dental",
    industry_label: "Dental & Orthodontics",
  },
  sales_rep_chiropractic: {
    agent_name: "sales_rep_chiropractic",
    rep_name: "Jordan",
    industry_key: "chiropractic",
    industry_label: "Chiropractic & Physical Therapy",
  },
  sales_rep_hvac: {
    agent_name: "sales_rep_hvac",
    rep_name: "Tyler",
    industry_key: "hvac",
    industry_label: "HVAC & Home Services",
  },
  sales_rep_roofing: {
    agent_name: "sales_rep_roofing",
    rep_name: "Derek",
    industry_key: "roofing",
    industry_label: "Roofing & Restoration",
  },
  sales_rep_contractors: {
    agent_name: "sales_rep_contractors",
    rep_name: "Alex",
    industry_key: "contractors",
    industry_label: "Contractors & Trades",
  },
  sales_rep_general: {
    agent_name: "sales_rep_general",
    rep_name: "Nolan",
    industry_key: "general",
    industry_label: "General",
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    const leads = await base44.asServiceRole.entities.Leads.filter({ id: lead_id });
    if (!leads?.length) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leads[0];
    const assignedAgentName = lead.assigned_agent_name || "sales_rep_general";
    const agent = AGENT_CONFIGS[assignedAgentName] || AGENT_CONFIGS.sales_rep_general;

    return Response.json({
      success: true,
      lead_id,
      assigned_agent_name: assignedAgentName,
      ...agent,
    });
  } catch (error) {
    console.error("[getAgentForLead] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
