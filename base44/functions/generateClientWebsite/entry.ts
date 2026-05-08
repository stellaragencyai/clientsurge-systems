/**
 * generateClientWebsite — #416 (AI-powered rewrite)
 * Reads order → industry + brand assets + tier → calls AI to write copy → saves WebsiteSpec
 *
 * Starter = 1 page | Growth = 3 pages | Elite = 5 pages
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const PAGE_TEMPLATES = {
  starter: [
    { slug: "home", title: "Home", sections: ["hero", "services_overview", "lead_capture_form", "social_proof", "footer"] }
  ],
  growth: [
    { slug: "home",     title: "Home",     sections: ["hero", "services_overview", "social_proof", "cta_banner", "footer"] },
    { slug: "services", title: "Services", sections: ["services_detail", "pricing_snapshot", "faq", "footer"] },
    { slug: "contact",  title: "Contact",  sections: ["lead_capture_form", "map_embed", "footer"] },
  ],
  elite: [
    { slug: "home",          title: "Home",          sections: ["hero_video", "services_overview", "interactive_journey", "social_proof", "cta_banner", "footer"] },
    { slug: "services",      title: "Services",       sections: ["services_detail", "before_after", "pricing_full", "faq", "footer"] },
    { slug: "about",         title: "About",          sections: ["founder_story", "mission", "footer"] },
    { slug: "contact",       title: "Contact",        sections: ["lead_capture_form", "map_embed", "calendly_embed", "footer"] },
    { slug: "client-portal", title: "Client Portal",  sections: ["portal_login", "footer"] },
  ],
};

const INDUSTRY_PAIN_POINTS = {
  med_spa: "losing bookings to slow response and missed calls",
  dental: "losing new patient inquiries overnight and on weekends",
  hvac: "losing emergency service calls to faster-responding competitors",
  roofing: "losing storm-season leads before a quote can be scheduled",
  chiropractic: "missing new patient calls during treatment hours",
  contractors: "ghost estimates and leads that go cold before follow-up",
  general: "losing leads that never hear back quickly enough",
};

function getTier(packageKey = "") {
  const k = packageKey.toLowerCase();
  if (k.includes("elite")) return "elite";
  if (k.includes("growth")) return "growth";
  return "starter";
}

async function generateAICopy(base44, { businessName, industry, tone, targetAudience, tier }) {
  const painPoint = INDUSTRY_PAIN_POINTS[industry] || INDUSTRY_PAIN_POINTS.general;
  const toneDesc = tone === "warm" ? "warm and approachable" : tone === "energetic" ? "bold and energetic" : "professional and authoritative";
  const pageCount = { starter: 1, growth: 3, elite: 5 }[tier] || 1;

  const prompt = `You are a professional web copywriter for a local service business.

Business: "${businessName}"
Industry: ${industry}
Tone: ${toneDesc}
Target audience: ${targetAudience || "local homeowners and businesses"}
Pain point they solve: ${painPoint}
Website tier: ${tier} (${pageCount} pages)

Generate compelling website copy for this business. Return a JSON object with this exact structure:
{
  "home": {
    "hero_headline": "Compelling headline (max 10 words, no quotes)",
    "hero_subheading": "One powerful sentence explaining the core value prop (max 20 words)",
    "cta_text": "Primary CTA button text (max 5 words)",
    "proof_points": ["proof point 1", "proof point 2", "proof point 3"],
    "body_paragraphs": ["paragraph about the problem they solve", "paragraph about why choose them"]
  },
  "services": {
    "hero_headline": "Services page headline",
    "hero_subheading": "Services page subheading",
    "cta_text": "Get Started",
    "proof_points": ["service benefit 1", "service benefit 2", "service benefit 3"],
    "body_paragraphs": ["overview of services paragraph"]
  },
  "about": {
    "hero_headline": "About page headline",
    "hero_subheading": "Short mission statement",
    "cta_text": "Meet the Team",
    "proof_points": ["team value 1", "team value 2", "years of experience statement"],
    "body_paragraphs": ["founder story paragraph", "why we started paragraph"]
  },
  "contact": {
    "hero_headline": "Contact page headline",
    "hero_subheading": "Inviting subheading encouraging contact",
    "cta_text": "Send a Message",
    "proof_points": ["fast response promise", "availability statement", "local service area"],
    "body_paragraphs": ["contact encouragement paragraph"]
  }
}

Return ONLY valid JSON. No markdown, no explanation.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        home: { type: "object" },
        services: { type: "object" },
        about: { type: "object" },
        contact: { type: "object" },
      },
    },
  });

  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const tier = getTier(order.package_key || order.selected_package_type || "");
    const cfg = order.install_configuration || {};
    const brand = cfg.brand || cfg.shared || {};

    const industry = brand.industry || order.industry || "general";
    const businessName = brand.business_name || cfg.shared?.business_name || order.business_name || "Your Business";
    const tone = brand.tone_of_voice || "professional";
    const targetAudience = brand.target_audience || "";

    // Build pages from template
    const pageTemplates = PAGE_TEMPLATES[tier] || PAGE_TEMPLATES.starter;

    // Generate AI copy
    console.log(`[generateClientWebsite] Generating AI copy for ${businessName} (${industry}, ${tier})`);
    let aiCopy = {};
    try {
      aiCopy = await generateAICopy(base44, { businessName, industry, tone, targetAudience, tier });
    } catch (aiErr) {
      console.warn("[generateClientWebsite] AI copy generation failed, using defaults:", aiErr.message);
    }

    // Merge AI copy into page templates
    const pages = pageTemplates.map((page) => ({
      ...page,
      copy: aiCopy[page.slug] || {
        hero_headline: `${businessName} — ${industry.replace(/_/g, " ")} Experts`,
        hero_subheading: `Professional services for your local community.`,
        cta_text: "Get Started",
        proof_points: ["Fast Response", "Local Experts", "Proven Results"],
        body_paragraphs: [`${businessName} is proud to serve the local community with top-quality ${industry.replace(/_/g, " ")} services.`],
      },
    }));

    const spec = {
      order_id,
      package_key: tier,
      industry,
      pages,
      brand: {
        logo_url: brand.logo_url || "",
        primary_color: brand.primary_color || "#00AEEF",
        secondary_color: brand.secondary_color || "#003B8F",
        fonts: { heading: "Inter", body: "Inter" },
        business_name: businessName,
        tagline: brand.tagline || "",
        tone_of_voice: tone,
        target_audience: targetAudience,
      },
      status: "draft",
      revision_requested: false,
      revision_notes: "",
      approved_at: null,
      built_at: null,
      ai_generated: Object.keys(aiCopy).length > 0,
    };

    // Upsert — don't duplicate
    const existing = await base44.asServiceRole.entities.WebsiteSpec.filter({ order_id }, "-created_date", 1);
    let websiteSpec;
    if (existing?.length > 0) {
      websiteSpec = await base44.asServiceRole.entities.WebsiteSpec.update(existing[0].id, spec);
      console.log(`[generateClientWebsite] Updated WebsiteSpec ${existing[0].id}`);
    } else {
      websiteSpec = await base44.asServiceRole.entities.WebsiteSpec.create(spec);
      console.log(`[generateClientWebsite] Created WebsiteSpec ${websiteSpec.id}`);
    }

    return Response.json({ success: true, website_spec: websiteSpec, tier, page_count: pages.length, ai_generated: spec.ai_generated });
  } catch (err) {
    console.error("[generateClientWebsite] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});