/**
 * generateClientWebsite — #416
 * Generates a structured WebsiteSpec for a paid order.
 *
 * Starter = 1-page landing page
 * Growth  = 3-page site
 * Elite   = 5-page interactive site
 *
 * Writes spec to WebsiteSpec entity.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const PAGE_TEMPLATES: Record<string, Record<string, object[]>> = {
  starter: {
    default: [
      { slug: "home", title: "Home", sections: ["hero", "services_overview", "lead_capture_form", "social_proof", "footer"] }
    ],
  },
  growth: {
    default: [
      { slug: "home",     title: "Home",     sections: ["hero", "services_overview", "social_proof", "cta_banner", "footer"] },
      { slug: "services", title: "Services", sections: ["services_detail", "pricing_snapshot", "faq", "footer"] },
      { slug: "contact",  title: "Contact",  sections: ["lead_capture_form", "map_embed", "footer"] },
    ],
  },
  elite: {
    default: [
      { slug: "home",          title: "Home",           sections: ["hero_video", "services_overview", "interactive_journey", "social_proof", "cta_banner", "footer"] },
      { slug: "services",      title: "Services",       sections: ["services_detail", "before_after", "pricing_full", "faq", "footer"] },
      { slug: "about",         title: "About",          sections: ["founder_story", "team", "mission", "footer"] },
      { slug: "contact",       title: "Contact",        sections: ["lead_capture_form", "map_embed", "calendly_embed", "footer"] },
      { slug: "client-portal", title: "Client Portal",  sections: ["portal_login", "footer"] },
    ],
  },
};

function getTier(packageKey = "") {
  const k = packageKey.toLowerCase();
  if (k.includes("elite")) return "elite";
  if (k.includes("growth")) return "growth";
  return "starter";
}

function getIndustryPages(tier: string, industry: string, templates: typeof PAGE_TEMPLATES) {
  const tierTemplates = templates[tier] || templates["starter"];
  // Return industry-specific if exists, else default
  return tierTemplates[industry.toLowerCase()] || tierTemplates["default"];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const tier = getTier(order.package_key || "");
    const cfg = order.install_configuration || {};
    const brand = cfg.brand || {};

    const industry = brand.industry || order.industry || "general";
    const pages = getIndustryPages(tier, industry, PAGE_TEMPLATES);

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
        business_name: brand.business_name || order.business_name || "",
        tagline: brand.tagline || "",
      },
      status: "draft",
      revision_requested: false,
      revision_notes: "",
      approved_at: null,
      built_at: null,
    };

    // Check for existing spec for this order
    const existing = await base44.asServiceRole.entities.WebsiteSpec.filter({ order_id }, "-created_date", 1);
    let websiteSpec;
    if (existing?.length > 0) {
      websiteSpec = await base44.asServiceRole.entities.WebsiteSpec.update(existing[0].id, spec);
      console.log(`[generateClientWebsite] Updated existing WebsiteSpec ${existing[0].id}`);
    } else {
      websiteSpec = await base44.asServiceRole.entities.WebsiteSpec.create(spec);
      console.log(`[generateClientWebsite] Created WebsiteSpec ${websiteSpec.id}`);
    }

    // Update Order with website_spec_id
    await base44.asServiceRole.entities.Order.update(order_id, {
      website_spec_id: websiteSpec.id,
      website_tier: tier,
      website_page_count: pages.length,
    });

    return Response.json({ success: true, website_spec: websiteSpec, tier, page_count: pages.length });
  } catch (err) {
    console.error("[generateClientWebsite] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
