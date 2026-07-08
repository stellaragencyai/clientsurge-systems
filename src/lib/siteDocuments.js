import {
  ROBOTS_DISALLOW_PATHS,
  SITEMAP_STATIC_PATHS,
} from "./publicRouteMetadata.js";

const CANONICAL_ORIGIN = "https://clientsurgesystems.com";

const SITEMAP_ROUTE_META = {
  "/": { changefreq: "weekly", priority: "1.0" },
  "/pricing": { changefreq: "monthly", priority: "0.9" },
  "/automations": { changefreq: "monthly", priority: "0.85" },
  "/industries": { changefreq: "monthly", priority: "0.8" },
  "/how-it-works": { changefreq: "monthly", priority: "0.8" },
  "/proof": { changefreq: "monthly", priority: "0.75" },
  "/faq": { changefreq: "monthly", priority: "0.75" },
  "/about": { changefreq: "monthly", priority: "0.7" },
  "/blog": { changefreq: "weekly", priority: "0.65" },
  "/testimonials": { changefreq: "monthly", priority: "0.55" },
  "/roadmap": { changefreq: "monthly", priority: "0.55" },
  "/contact": { changefreq: "monthly", priority: "0.8" },
  "/privacy": { changefreq: "yearly", priority: "0.4" },
  "/terms": { changefreq: "yearly", priority: "0.4" },
  "/sms-terms": { changefreq: "yearly", priority: "0.4" },
  "/refund-policy": { changefreq: "yearly", priority: "0.4" },
};

function sitemapMetaFor(pathname) {
  return SITEMAP_ROUTE_META[pathname] || { changefreq: "monthly", priority: "0.7" };
}

export function buildSitemapXml() {
  const entries = SITEMAP_STATIC_PATHS.map((pathname) => {
    const meta = sitemapMetaFor(pathname);
    return [
      "  <url>",
      `    <loc>${CANONICAL_ORIGIN}${pathname}</loc>`,
      `    <changefreq>${meta.changefreq}</changefreq>`,
      `    <priority>${meta.priority}</priority>`,
      "  </url>",
    ].join("\n");
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

export function buildRobotsTxt() {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "",
    ...ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`,
  ];

  return `${lines.join("\n")}\n`;
}
