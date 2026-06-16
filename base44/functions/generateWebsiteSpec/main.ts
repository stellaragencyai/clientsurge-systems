import { secureJson } from "../_shared/response.ts";
/**
 * generateWebsiteSpec — #416a #416b #416c #416d
 * Generates a structured WebsiteSpec JSON for a client based on tier + industry.
 * Starter: 1-page | Growth: 3-page | Elite: 5-page
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// #416a: WebsiteSpec JSON schema
interface WebsiteSpec {
  order_id: string;
  package_key: string;
  industry: string;
  pages: Page[];
  brand: { primary_color: string; logo_url?: string; business_name: string };
  status: "draft" | "approved" | "built";
}

interface Page {
  name: string;
  slug: string;
  sections: Section[];
}

interface Section {
  type: string;
  copy_blocks?: Record<string, string>;
  cta?: string;
}

// #416b: Starter 1-page spec (Hero + Problem + Solution + 2 Automations)
function starterSpec(brand: any, industry: string): Page[] {
  return [{
    name: "Home",
    slug: "/",
    sections: [
      { type: "hero", copy_blocks: { headline: `AI Automation for ${brand.business_name}`, subheadline: "Respond to every lead instantly, 24/7 — no staff needed.", badge: "Phoenix's #1 AI Agency" }, cta: "Get Started Today" },
      { type: "problem", copy_blocks: { headline: "Still missing leads while you're working?", body: "Every unanswered call or form is a customer going to your competitor." } },
      { type: "solution", copy_blocks: { headline: "We automate your lead response", body: "Two AI systems working for you 24/7: instant response and missed call text-back." } },
      { type: "automations_overview", automations: ["Instant Lead Response", "Missed Call Text-Back"] },
      { type: "lead_capture_form", cta: "Free Automation Audit" },
    ],
  }];
}

// #416c: Growth 3-page spec (Home + Services + Book Now)
function growthSpec(brand: any, industry: string): Page[] {
  return [
    {
      name: "Home", slug: "/",
      sections: [
        { type: "hero", copy_blocks: { headline: `The AI Growth System for ${brand.business_name}`, subheadline: "4 AI automations. More bookings. Less manual work." }, cta: "See How It Works" },
        { type: "automations_overview", automations: ["Instant Response", "Missed Call Text-Back", "Follow-Up Sequences", "AI Appointment Booking"] },
        { type: "testimonials" },
        { type: "lead_capture_form", cta: "Free Automation Audit" },
      ],
    },
    {
      name: "Services", slug: "/services",
      sections: [
        { type: "services_grid", automations: ["Instant Response", "Missed Call Text-Back", "Follow-Up Sequences", "AI Appointment Booking"] },
        { type: "pricing_cta", cta: "Get Started" },
      ],
    },
    {
      name: "Book Now", slug: "/book",
      sections: [
        { type: "booking_embed", copy_blocks: { headline: "Book your free strategy call" } },
      ],
    },
  ];
}

// #416d: Elite 5-page spec (Home + Services + Industry Landing + Client Portal Login + Book)
function eliteSpec(brand: any, industry: string): Page[] {
  return [
    {
      name: "Home", slug: "/",
      sections: [
        { type: "hero", copy_blocks: { headline: `${brand.business_name} — Fully Automated`, subheadline: "6 AI systems. Every lead captured. Every client followed up. 24/7." }, cta: "See the Full System" },
        { type: "automations_overview", automations: ["Instant Response", "Missed Call Text-Back", "Follow-Up Sequences", "AI Appointment Booking", "Review Request AI", "Reactivation Campaign"] },
        { type: "social_proof" },
        { type: "lead_capture_form", cta: "Get My Full Demo" },
      ],
    },
    { name: "Services", slug: "/services", sections: [{ type: "services_detail" }, { type: "pricing_grid" }] },
    { name: industry.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()), slug: `/${industry}`, sections: [{ type: "industry_hero" }, { type: "industry_pain_points" }, { type: "industry_solution" }, { type: "lead_capture_form" }] },
    { name: "Client Portal", slug: "/client-portal", sections: [{ type: "portal_login" }] },
    { name: "Book Now", slug: "/book", sections: [{ type: "booking_embed" }] },
  ];
}

const SPEC_BY_TIER: Record<string, (brand: any, industry: string) => Page[]> = {
  starter: starterSpec,
  growth: growthSpec,
  elite: eliteSpec,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    const package_key = order.package_key || "starter";
    const industry = order.industry || "default";
    const brand = {
      business_name: order.client_name || "Your Business",
      primary_color: order.install_configuration?.brand?.primary_color || "#00D4FF",
      logo_url: order.install_configuration?.brand?.logo_url || null,
    };

    const pagesFn = SPEC_BY_TIER[package_key] || starterSpec;
    const pages = pagesFn(brand, industry);

    const spec: WebsiteSpec = { order_id, package_key, industry, pages, brand, status: "draft" };

    // Save to WebsiteSpec entity
    const existing = await base44.asServiceRole.entities.WebsiteSpec.filter({ order_id }).catch(() => []);
    let specId: string;
    if (existing?.length > 0) {
      await base44.asServiceRole.entities.WebsiteSpec.update(existing[0].id, { pages, brand, status: "draft" });
      specId = existing[0].id;
    } else {
      const created = await base44.asServiceRole.entities.WebsiteSpec.create({ order_id, package_key: package_key, industry, pages: JSON.stringify(pages), brand: JSON.stringify(brand), status: "draft" });
      specId = created.id;
    }

    // Advance workflow stage
    await base44.asServiceRole.entities.Order.update(order_id, { workflow_stage: "Website Spec Generated" });

    return secureJson({ success: true, spec_id: specId, spec, page_count: pages.length });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
