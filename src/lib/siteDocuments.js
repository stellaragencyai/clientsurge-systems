import {
  BLOG_SITEMAP_PATHS,
  ROBOTS_DISALLOW_PATHS,
} from "./publicRouteMetadata.js";

const CANONICAL_ORIGIN = "https://clientsurgesystems.com";

const SITEMAP_ROUTE_META = {
  "/": { changefreq: "weekly", priority: "1.0" },
  "/start": { changefreq: "monthly", priority: "0.8" },
  "/store": { changefreq: "monthly", priority: "0.9" },
  "/automations": { changefreq: "monthly", priority: "0.9" },
  "/industries": { changefreq: "monthly", priority: "0.8" },
  "/about": { changefreq: "monthly", priority: "0.7" },
  "/contact": { changefreq: "monthly", priority: "0.8" },
  "/blog": { changefreq: "weekly", priority: "0.7" },
  "/book": { changefreq: "monthly", priority: "0.7" },
  "/privacy-policy": { changefreq: "yearly", priority: "0.4" },
  "/terms": { changefreq: "yearly", priority: "0.4" },
};

const SITEMAP_SECTIONS = [
  ["/", "/start", "/store", "/automations", "/industries", "/about", "/contact", "/blog"],
  BLOG_SITEMAP_PATHS,
  [
    "/med-spa",
    "/dental",
    "/hvac",
    "/plumbing",
    "/roofing",
    "/chiropractic",
    "/contractors",
    "/lead-capture-automation",
    "/missed-call-text-back",
    "/ai-lead-follow-up",
    "/appointment-booking-automation",
    "/review-automation",
    "/customer-reactivation",
    "/book",
    "/privacy-policy",
    "/terms",
  ],
];

function sitemapMetaFor(pathname) {
  if (SITEMAP_ROUTE_META[pathname]) return SITEMAP_ROUTE_META[pathname];
  if (pathname.startsWith("/blog/")) return { changefreq: "monthly", priority: "0.7" };
  return { changefreq: "monthly", priority: "0.8" };
}

export function buildSitemapXml() {
  const entries = SITEMAP_SECTIONS.flat().map((pathname) => {
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
