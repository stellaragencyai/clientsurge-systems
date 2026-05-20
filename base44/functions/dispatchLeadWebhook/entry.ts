import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─────────────────────────────────────────────
// INDUSTRY → SALES REP ROUTING MAP
// Each industry maps to a dedicated rep config
// ─────────────────────────────────────────────
const INDUSTRY_REPS = {
  med_spa: {
    rep_name: "Sarah",
    rep_email: "sarah@clientsurgesystems.com",
    rep_phone: "+16025843227",
    industry_label: "Med Spa & Aesthetics",
    keywords: ["med spa", "medspa", "aesthetic", "botox", "filler", "laser", "skin", "beauty clinic"],
  },
  dental: {
    rep_name: "Marcus",
    rep_email: "marcus@clientsurgesystems.com",
    rep_phone: "+16025843227",
    industry_label: "Dental & Orthodontics",
    keywords: ["dental", "dentist", "orthodont", "braces", "implant", "teeth", "oral"],
  },
  chiropractic: {
    rep_name: "Jordan",
    rep_email: "jordan@clientsurgesystems.com",
    rep_phone: "+16025843227",
    industry_label: "Chiropractic & Physical Therapy",
    keywords: ["chiro", "physical therapy", "pt clinic", "spine", "rehab", "massage therapy"],
  },
  hvac: {
    rep_name: "Tyler",
    rep_email: "tyler@clientsurgesystems.com",
    rep_phone: "+16025843227",
    industry_label: "HVAC & Home Services",
    keywords: ["hvac", "heating", "cooling", "plumb", "electric", "home service", "repair", "handyman"],
  },
  roofing: {
    rep_name: "Derek",
    rep_email: "derek@clientsurgesystems.com",
    rep_phone: "+16025843227",
    industry_label: "Roofing & Restoration",
    keywords: ["roof", "restor", "gutters", "siding", "storm damage", "contractor"],
  },
  contractors: {
    rep_name: "Alex",
    rep_email: "alex@clientsurgesystems.com",
    rep_phone: "+16025843227",
    industry_label: "Contractors & Trades",
    keywords: ["contractor", "construct", "build", "remodel", "paint", "flooring", "tile", "cabinet"],
  },
};

const DEFAULT_REP = {
  rep_name: "Nolan",
  rep_email: Deno.env.get("ADMIN_EMAIL") || "nolan@clientsurgesystems.com",
  rep_phone: "+16025843227",
  industry_label: "General",
};

// ─────────────────────────────────────────────
// PRIORITY TIER based on lead score
// ─────────────────────────────────────────────
function getPriorityTier(leadScore) {
  if (leadScore >= 75) return "HOT";
  if (leadScore >= 45) return "WARM";
  return "COLD";
}

// ─────────────────────────────────────────────
// BUSINESS SIZE bucket from business_type field
// ─────────────────────────────────────────────
function getBusinessSize(lead) {
  const bt = (lead.business_type || "").toLowerCase();
  if (bt.includes("solo") || bt.includes("single") || bt.includes("1 location")) return "solo";
  if (bt.includes("multi") || bt.includes("franchise") || bt.includes("chain")) return "enterprise";
  return "small_medium";
}

// ─────────────────────────────────────────────
// INDUSTRY DETECTION — checks business_type + problem fields
// ─────────────────────────────────────────────
function detectIndustry(lead) {
  const searchText = [
    lead.business_type || "",
    lead.problem || "",
    lead.source || "",
    lead.intake_type || "",
  ].join(" ").toLowerCase();

  for (const [key, rep] of Object.entries(INDUSTRY_REPS)) {
    if (rep.keywords.some((kw) => searchText.includes(kw))) {
      return { industryKey: key, rep };
    }
  }
  return { industryKey: "general", rep: DEFAULT_REP };
}

// ─────────────────────────────────────────────
// FOLLOW-UP URGENCY — determines how fast to respond
// ─────────────────────────────────────────────
function getFollowUpUrgency(priorityTier, businessSize) {
  if (priorityTier === "HOT") return { delay_minutes: 2, channel: "sms_first" };
  if (priorityTier === "WARM" && businessSize === "enterprise") return { delay_minutes: 5, channel: "sms_first" };
  if (priorityTier === "WARM") return { delay_minutes: 10, channel: "sms_first" };
  return { delay_minutes: 30, channel: "email_first" };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Fetch lead
    const leads = await base44.asServiceRole.entities.Leads.filter({ id: leadId });
    if (!leads || leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leads[0];

    // ── ROUTING LOGIC ──────────────────────────
    const { industryKey, rep } = detectIndustry(lead);
    const leadScore = lead.lead_score || 0;
    const priorityTier = getPriorityTier(leadScore);
    const businessSize = getBusinessSize(lead);
    const followUp = getFollowUpUrgency(priorityTier, businessSize);

    console.log(`[dispatchLeadWebhook] Lead: ${lead.full_name} | Industry: ${industryKey} | Score: ${leadScore} | Tier: ${priorityTier} | Size: ${businessSize} | Rep: ${rep.rep_name}`);

    // ── BUILD ENRICHED PAYLOAD ─────────────────
    const webhookPayload = {
      // Lead data
      name: lead.full_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      issue: lead.problem || '',
      source: lead.source || 'form',
      status: lead.status,
      timestamp: new Date().toISOString(),

      // Routing metadata
      routing: {
        industry_key: industryKey,
        industry_label: rep.industry_label,
        assigned_rep: rep.rep_name,
        rep_email: rep.rep_email,
        rep_phone: rep.rep_phone,
        priority_tier: priorityTier,
        lead_score: leadScore,
        business_size: businessSize,
        follow_up_delay_minutes: followUp.delay_minutes,
        follow_up_channel: followUp.channel,
        qualified: priorityTier !== "COLD",
        requires_priority_follow_up: priorityTier === "HOT",
      },
    };

    // ── UPDATE LEAD with routing info ──────────
    await base44.asServiceRole.entities.Leads.update(lead.id, {
      assigned_to: rep.rep_email,
      assigned_at: new Date().toISOString(),
      activation_priority: priorityTier === "HOT" ? "Hot" : priorityTier === "WARM" ? "High" : "Medium",
    });

    console.log(`[dispatchLeadWebhook] Assigned to ${rep.rep_name} (${rep.rep_email}) | Follow-up in ${followUp.delay_minutes}min via ${followUp.channel}`);

    // ── DISPATCH TO EXTERNAL WEBHOOK ──────────
    const webhookUrl = Deno.env.get('EXTERNAL_WEBHOOK_URL');
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });
      console.log(`[dispatchLeadWebhook] External webhook response: ${res.status}`);
    }

    return Response.json({ success: true, payload: webhookPayload });
  } catch (error) {
    console.error('[dispatchLeadWebhook] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});