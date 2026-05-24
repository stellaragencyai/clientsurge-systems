const CORE_ROUTES = [
  "/",
  "/automations",
  "/industries",
  "/roofing",
  "/hvac",
  "/dental",
  "/med-spa",
  "/chiropractic",
  "/contractors",
  "/book",
  "/contact",
  "/blog",
  "/privacy-policy",
];

function hasPattern(content, pattern) {
  return pattern.test(content || "");
}

function extractSitemapPaths(sitemap = "") {
  const matches = [...sitemap.matchAll(/<loc>https:\/\/(?:www\.)?clientsurgesystems\.com([^<]*)<\/loc>/g)];
  return matches.map((match) => match[1] || "/");
}

function buildCheck({ id, category, severity, passed, title, evidence, recommendation }) {
  return {
    id,
    category,
    severity,
    status: passed ? "pass" : severity === "low" ? "warn" : "fail",
    title,
    evidence,
    recommendation: passed ? "" : recommendation,
  };
}

export function buildSeoConversionAudit(files = {}) {
  const index = files["index.html"] || "";
  const sitemap = files["public/sitemap.xml"] || "";
  const robots = files["public/robots.txt"] || "";
  const app = files["src/App.jsx"] || "";
  const seoLib = files["src/lib/seo.js"] || "";
  const analyticsLib = files["src/lib/analytics.js"] || "";
  const autoCta = files["src/components/analytics/AutoCTAAnalytics.jsx"] || "";
  const industryTemplate = files["src/components/landing/IndustryTemplate.jsx"] || "";
  const socialEngine = files["src/components/admin/SocialMediaEngine.jsx"] || "";
  const socialFunction = files["base44/functions/generateSocialContent/entry.ts"] || "";
  const automations = files["base44/automations/index"] || "";
  const allSource = Object.values(files).join("\n");
  const sitemapPaths = extractSitemapPaths(sitemap);

  const missingRoutes = CORE_ROUTES.filter((route) => !sitemapPaths.includes(route));
  const hasGaPlaceholder = hasPattern(index, /G-XXXXXXXXXX|add your Measurement ID/i);
  const gaLoaded = hasPattern(index, /googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+/i) && !hasGaPlaceholder;
  const hasConversionEvents = ["purchase", "demo_booked", "lead_submitted"].every((eventName) =>
    hasPattern(allSource, new RegExp(`["']${eventName}["']`))
  );
  const hasScheduledSeoAutomation =
    hasPattern(automations, /generateSocialContent|seo|content|blog/i) &&
    hasPattern(automations, /schedule|daily|weekly|cron/i);

  const checks = [
    buildCheck({
      id: "metadata-helper",
      category: "technical_seo",
      severity: "high",
      passed: hasPattern(seoLib, /export function setPageMetadata/) && hasPattern(index, /<link rel="canonical"/),
      title: "Route metadata helper and canonical tag exist",
      evidence: "Checks index.html and src/lib/seo.js.",
      recommendation: "Keep all public routes using setPageMetadata or the static route metadata map.",
    }),
    buildCheck({
      id: "sitemap-core-routes",
      category: "technical_seo",
      severity: "high",
      passed: missingRoutes.length === 0,
      title: "Sitemap contains core conversion and industry routes",
      evidence: missingRoutes.length ? `Missing: ${missingRoutes.join(", ")}` : `${CORE_ROUTES.length} core routes found.`,
      recommendation: "Add missing public routes to public/sitemap.xml or the dynamic sitemap generator.",
    }),
    buildCheck({
      id: "robots-protection",
      category: "technical_seo",
      severity: "high",
      passed:
        hasPattern(robots, /Sitemap:\s*https:\/\/(?:www\.)?clientsurgesystems\.com\/sitemap\.xml/) &&
        hasPattern(robots, /Disallow:\s*\/admin/) &&
        hasPattern(app, /shouldNoindexRoute|NOINDEX_PREFIXES/),
      title: "Robots and noindex protections cover internal surfaces",
      evidence: "Checks robots.txt and App.jsx noindex guard.",
      recommendation: "Keep admin, setup, portal, dashboard, and internal lead routes out of search indexes.",
    }),
    buildCheck({
      id: "structured-data",
      category: "technical_seo",
      severity: "medium",
      passed:
        hasPattern(index, /application\/ld\+json/) &&
        hasPattern(industryTemplate, /setJsonLd/) &&
        hasPattern(industryTemplate, /getFAQSchema/),
      title: "Structured data exists for homepage and industry content",
      evidence: "Checks static homepage schema plus industry FAQ schema wiring.",
      recommendation: "Add LocalBusiness and Service schema to each industry route when the Base44 page structure is stable.",
    }),
    buildCheck({
      id: "og-image-owned",
      category: "technical_seo",
      severity: "low",
      passed: !hasPattern(index, /media\.base44\.com[^"']+/),
      title: "Open Graph image is owned outside temporary Base44 media",
      evidence: hasPattern(index, /media\.base44\.com/) ? "index.html references media.base44.com." : "No Base44 media URL detected.",
      recommendation: "Move the OG image to a durable ClientSurge-controlled asset URL.",
    }),
    buildCheck({
      id: "ga4-installed",
      category: "conversion_tracking",
      severity: "high",
      passed: gaLoaded,
      title: "GA4 measurement tag is installed",
      evidence: hasGaPlaceholder ? "GA4 snippet is present but commented/placeholder." : "No GA4 placeholder detected.",
      recommendation: "Replace the placeholder with the real GA4 measurement ID and publish the updated head.",
    }),
    buildCheck({
      id: "analytics-helper",
      category: "conversion_tracking",
      severity: "medium",
      passed: hasPattern(analyticsLib, /window\.gtag/) && hasPattern(autoCta, /trackEvent\("cta_click_auto"/),
      title: "CTA analytics helper exists",
      evidence: "Checks analytics helper and automatic CTA observer.",
      recommendation: "Keep CTA events flowing through one helper so GA4/GTM can receive consistent payloads.",
    }),
    buildCheck({
      id: "conversion-events",
      category: "conversion_tracking",
      severity: "high",
      passed: hasConversionEvents,
      title: "Primary conversion events are explicitly named",
      evidence: hasConversionEvents
        ? "purchase, demo_booked, and lead_submitted event names found."
        : "One or more primary event names are missing.",
      recommendation: "Emit purchase, demo_booked, and lead_submitted through trackEvent at checkout, booking, and lead submission success points.",
    }),
    buildCheck({
      id: "content-engine",
      category: "content_marketing",
      severity: "medium",
      passed:
        hasPattern(socialEngine, /generateSocialContent/) &&
        hasPattern(socialFunction, /generateBlogPost/) &&
        hasPattern(socialFunction, /SocialContentLog/),
      title: "AI blog/social draft engine exists",
      evidence: "Checks admin SocialMediaEngine and generateSocialContent backend function.",
      recommendation: "Keep generated posts in draft/approval states before publishing or repurposing externally.",
    }),
    buildCheck({
      id: "scheduled-content-audit",
      category: "content_marketing",
      severity: "medium",
      passed: hasScheduledSeoAutomation,
      title: "Scheduled SEO/content audit automation exists",
      evidence: hasScheduledSeoAutomation ? "Automation manifest references SEO/content scheduling." : "No scheduled SEO/content automation manifest detected.",
      recommendation: "Add a weekly approved automation that runs this audit and creates draft recommendations, not automatic page edits.",
    }),
  ];

  const summary = checks.reduce(
    (acc, check) => {
      acc.total += 1;
      acc[check.status] += 1;
      if (check.status !== "pass") acc.open.push(check.id);
      return acc;
    },
    { total: 0, pass: 0, warn: 0, fail: 0, open: [] }
  );

  const effectivenessScore = Math.round((summary.pass / summary.total) * 10);
  const priority = checks
    .filter((check) => check.status === "fail")
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.severity] - rank[b.severity];
    })
    .map((check) => ({
      id: check.id,
      title: check.title,
      recommendation: check.recommendation,
    }));

  return {
    generated_at: new Date().toISOString(),
    workflow: "seo_conversion_growth_engine",
    effectiveness_score_out_of_10: effectivenessScore,
    summary,
    checks,
    priority,
  };
}

export function formatSeoConversionAuditMarkdown(audit) {
  const lines = [
    "# SEO + Conversion Automation Audit",
    "",
    `Generated: ${audit.generated_at}`,
    `Score: ${audit.effectiveness_score_out_of_10}/10`,
    `Checks: ${audit.summary.pass} pass, ${audit.summary.warn} warn, ${audit.summary.fail} fail`,
    "",
    "## Priority Fixes",
  ];

  if (audit.priority.length === 0) {
    lines.push("", "No failing high/medium priority checks.");
  } else {
    for (const item of audit.priority) {
      lines.push("", `- **${item.title}** (${item.id})`, `  ${item.recommendation}`);
    }
  }

  lines.push("", "## Checks");
  for (const check of audit.checks) {
    lines.push(
      "",
      `- **${check.status.toUpperCase()}** ${check.title}`,
      `  Category: ${check.category}; severity: ${check.severity}.`,
      `  Evidence: ${check.evidence}`
    );
    if (check.recommendation) lines.push(`  Recommendation: ${check.recommendation}`);
  }

  return `${lines.join("\n")}\n`;
}
