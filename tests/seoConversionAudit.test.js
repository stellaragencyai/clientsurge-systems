import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSeoConversionAudit,
  formatSeoConversionAuditMarkdown,
} from "../src/lib/seoConversionAudit.js";

const completeFiles = {
  "index.html": `
    <link rel="canonical" href="https://clientsurgesystems.com/" />
    <meta property="og:image" content="https://clientsurgesystems.com/og.png" />
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
    <script type="application/ld+json">{}</script>
  `,
  "public/sitemap.xml": `
    <urlset>
      ${[
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
      ].map((route) => `<url><loc>https://clientsurgesystems.com${route}</loc></url>`).join("")}
    </urlset>
  `,
  "public/robots.txt": "Disallow: /admin\nSitemap: https://clientsurgesystems.com/sitemap.xml",
  "src/App.jsx": "const NOINDEX_PREFIXES = ['/admin'];",
  "src/lib/seo.js": "export function setPageMetadata() {}",
  "src/lib/analytics.js": "window.gtag('event', eventName, params); trackEvent('purchase'); trackEvent('demo_booked'); trackEvent('lead_submitted');",
  "src/components/analytics/AutoCTAAnalytics.jsx": 'trackEvent("cta_click_auto", {})',
  "src/components/landing/IndustryTemplate.jsx": "setJsonLd('industry-faq', getFAQSchema([]));",
  "src/components/admin/SocialMediaEngine.jsx": "base44.functions.invoke('generateSocialContent')",
  "base44/functions/generateSocialContent/entry.ts": "async function generateBlogPost(){} SocialContentLog.create({})",
  "base44/automations/index": "weekly schedule generateSocialContent seo content blog",
};

test("seo conversion audit passes when core SEO and conversion automation pieces exist", () => {
  const audit = buildSeoConversionAudit(completeFiles);

  assert.equal(audit.summary.fail, 0);
  assert.equal(audit.summary.pass, audit.summary.total);
  assert.equal(audit.effectiveness_score_out_of_10, 10);
});

test("seo conversion audit flags the current high-value missing conversion pieces", () => {
  const audit = buildSeoConversionAudit({
    ...completeFiles,
    "index.html": '<link rel="canonical" href="https://clientsurgesystems.com/" /><!-- add your Measurement ID G-XXXXXXXXXX --><script type="application/ld+json">{}</script><meta property="og:image" content="https://media.base44.com/demo.png" />',
    "src/lib/analytics.js": "window.gtag('event', eventName, params);",
    "base44/automations/index": "",
  });

  const failed = new Set(audit.checks.filter((check) => check.status === "fail").map((check) => check.id));
  const warned = new Set(audit.checks.filter((check) => check.status === "warn").map((check) => check.id));

  assert.ok(failed.has("ga4-installed"));
  assert.ok(failed.has("conversion-events"));
  assert.ok(failed.has("scheduled-content-audit"));
  assert.ok(warned.has("og-image-owned"));
});

test("seo conversion audit markdown includes priority recommendations", () => {
  const audit = buildSeoConversionAudit({
    ...completeFiles,
    "src/lib/analytics.js": "window.gtag('event', eventName, params);",
  });
  const markdown = formatSeoConversionAuditMarkdown(audit);

  assert.match(markdown, /SEO \+ Conversion Automation Audit/);
  assert.match(markdown, /Primary conversion events are explicitly named/);
});
