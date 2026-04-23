import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const { niche, city, state, radius = 25, require_website = false, min_rating = 0 } =
      await req.json();

    if (!niche || !city || !state) {
      return Response.json(
        { error: "Missing required fields: niche, city, state" },
        { status: 400 }
      );
    }

    const job = await base44.entities.LeadDiscoveryJob.create({
      niche,
      location_city: city,
      location_state: state,
      location_radius_miles: radius,
      require_website,
      min_rating,
      status: "running",
      started_at: new Date().toISOString(),
    });

    const discoveredLeads = await simulateLeadDiscovery({
      niche,
      city,
      state,
      radius,
      require_website,
      min_rating,
    });

    let leadsNew = 0;
    let leadsUpdated = 0;

    for (const leadData of discoveredLeads) {
      const phoneHash = hashPhone(leadData.phone);
      const domain = extractDomain(leadData.website);

      const existing = await base44.entities.Lead.filter({
        $or: [{ phone_hash: phoneHash }, domain ? { domain } : {}],
      });

      if (existing.length > 0) {
        await base44.entities.Lead.update(existing[0].id, {
          ...leadData,
          last_enriched_at: new Date().toISOString(),
        });
        leadsUpdated++;
      } else {
        const scoredLead = await scoreLead(leadData);
        await base44.entities.Lead.create({
          ...scoredLead,
          phone_hash: phoneHash,
          domain,
          source: "agent",
          niche,
          last_enriched_at: new Date().toISOString(),
        });
        leadsNew++;
      }
    }

    await base44.entities.LeadDiscoveryJob.update(job.id, {
      status: "completed",
      leads_discovered: discoveredLeads.length,
      leads_new: leadsNew,
      leads_updated: leadsUpdated,
      completed_at: new Date().toISOString(),
    });

    await updateAnalytics(base44, leadsNew);

    return Response.json({
      success: true,
      job_id: job.id,
      leads_discovered: discoveredLeads.length,
      leads_new: leadsNew,
      leads_updated: leadsUpdated,
    });
  } catch (error) {
    const status = error instanceof AuthGuardError ? error.status : 500;
    const code = error instanceof AuthGuardError ? error.code : undefined;
    const message = error instanceof Error ? error.message : "Failed to discover leads";

    return Response.json({ error: message, code }, { status });
  }
});

async function simulateLeadDiscovery({ niche, city, state, require_website }) {
  const industries = {
    "med spa": ["Aesthetic Clinic", "Beauty Studio", "Wellness Center", "Cosmetic Center"],
    "real estate": ["Realty Group", "Property Management", "Real Estate Office", "Broker"],
    dental: ["Dental Practice", "Teeth Whitening", "Orthodontics", "Dental Care"],
    hvac: ["HVAC Services", "Heating & Cooling", "Climate Control", "Mechanical Services"],
    plumbing: ["Plumbing Services", "Water Systems", "Pipe Services", "Drainage"],
  };

  const niches = industries[niche.toLowerCase()] || [niche];
  const platforms = ["instagram", "facebook", "linkedin"];

  const leads = [];
  const count = Math.floor(Math.random() * 15) + 5;

  for (let index = 0; index < count; index += 1) {
    const hasWebsite = Math.random() > 0.3;
    const hasSocial = Math.random() > 0.4;

    if (require_website && !hasWebsite) continue;

    const socialLinks = hasSocial
      ? [
          {
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            url: `https://${platforms[0]}.com/business${Math.random().toString(36).slice(7)}`,
            followers: Math.floor(Math.random() * 5000) + 100,
          },
        ]
      : [];

    leads.push({
      business_name: `${
        niches[Math.floor(Math.random() * niches.length)]
      } ${Math.random().toString(36).slice(7).toUpperCase()}`,
      phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      email: `contact@business${Math.random().toString(36).slice(7)}.com`,
      website: hasWebsite ? `https://business${Math.random().toString(36).slice(7)}.com` : null,
      address: `${Math.floor(Math.random() * 9999)} Main St`,
      city,
      state,
      niche,
      social_links: socialLinks,
      has_website: hasWebsite,
      has_social: hasSocial,
      social_activity: hasSocial ? (Math.random() > 0.5 ? "active" : "inactive") : "unknown",
      website_quality: hasWebsite
        ? Math.random() > 0.6
          ? "high"
          : Math.random() > 0.3
            ? "medium"
            : "low"
        : "unknown",
    });
  }

  return leads;
}

async function scoreLead(lead) {
  let score = 0;
  const insights = [];
  const missingSystems = [];

  if (lead.has_website) {
    score += 20;
    insights.push("Has professional website");
  } else {
    score -= 10;
    missingSystems.push("No website");
  }

  if (lead.website_quality === "high") {
    score += 15;
  } else if (lead.website_quality === "low") {
    score += 10;
    insights.push("Website needs modernization");
  }

  if (lead.has_social) {
    score += 15;
  } else {
    missingSystems.push("No social presence");
  }

  if (lead.social_activity === "active") {
    score += 25;
    insights.push("Active social media presence");
  } else if (lead.social_activity === "inactive") {
    score += 5;
    insights.push("Social media exists but inactive");
  }

  const hasFollowUpSystems = lead.has_website && lead.has_social;
  const estimatedResponsiveness = hasFollowUpSystems
    ? "medium"
    : lead.has_website
      ? "low"
      : "unknown";

  if (!hasFollowUpSystems) {
    score += 10;
    missingSystems.push("Limited follow-up systems");
    insights.push("Likely losing leads due to limited follow-up infrastructure");
  }

  score = Math.min(Math.max(score, 0), 100);

  return {
    ...lead,
    lead_score: score,
    lead_quality_label: score >= 80 ? "High" : score >= 50 ? "Medium" : "Low",
    estimated_responsiveness: estimatedResponsiveness,
    missing_systems: missingSystems,
    outreach_insight: insights.join(" • "),
  };
}

function hashPhone(phone) {
  if (!phone) return null;
  return phone.replace(/\D/g, "");
}

function extractDomain(website) {
  if (!website) return null;

  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname;
  } catch {
    return null;
  }
}

async function updateAnalytics(base44, newLeads) {
  const today = new Date().toISOString().split("T")[0];
  const existing = await base44.entities.LeadAnalytics.filter({ date: today });

  if (existing.length > 0) {
    await base44.entities.LeadAnalytics.update(existing[0].id, {
      new_leads: (existing[0].new_leads || 0) + newLeads,
    });
  } else {
    await base44.entities.LeadAnalytics.create({
      date: today,
      new_leads: newLeads,
    });
  }
}
