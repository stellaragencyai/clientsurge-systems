import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const DEFAULT_BASE_URL = "https://clientsurgesystems.com";

const ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/store", changefreq: "weekly", priority: "0.9" },
  { path: "/industries", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/med-spa", changefreq: "monthly", priority: "0.8" },
  { path: "/dental", changefreq: "monthly", priority: "0.8" },
  { path: "/hvac", changefreq: "monthly", priority: "0.8" },
  { path: "/roofing", changefreq: "monthly", priority: "0.8" },
  { path: "/chiropractic", changefreq: "monthly", priority: "0.8" },
  { path: "/contractors", changefreq: "monthly", priority: "0.8" },
  { path: "/book", changefreq: "monthly", priority: "0.7" },
  { path: "/legal/privacy", changefreq: "yearly", priority: "0.4" },
  { path: "/legal/terms", changefreq: "yearly", priority: "0.4" },
];

function normalizeBaseUrl(value) {
  if (!value || typeof value !== "string") return DEFAULT_BASE_URL;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_BASE_URL;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/$/, "");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemapXml(baseUrl) {
  const urls = ROUTES.map(({ path, changefreq, priority }) => `  <url>\n    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1).catch(() => []);
    const settings = settingsRecords?.[0] || {};
    const baseUrl = normalizeBaseUrl(
      settings.website_url ||
      settings.site_url ||
      settings.app_base_url ||
      Deno.env.get("SITE_URL") ||
      Deno.env.get("APP_BASE_URL") ||
      Deno.env.get("VITE_BASE44_APP_BASE_URL") ||
      DEFAULT_BASE_URL
    );

    const xml = buildSitemapXml(baseUrl);

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "X-Frame-Options": "DENY",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate sitemap" },
      { status: 500 }
    );
  }
});
