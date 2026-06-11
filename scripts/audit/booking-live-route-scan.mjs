#!/usr/bin/env node

const DEFAULT_URL = "https://clientsurgesystems.com/book";
const targetUrl = process.argv[2] || process.env.BOOKING_SCAN_URL || DEFAULT_URL;

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function extractAssetHashes(html) {
  return [...html.matchAll(/\/assets\/(?:index-)?([A-Za-z0-9_-]+)\.(?:js|css)/g)]
    .map((match) => match[1])
    .filter(Boolean)
    .slice(0, 12);
}

function hasAny(html, patterns) {
  return patterns.some((pattern) => pattern.test(html));
}

async function main() {
  const response = await fetch(targetUrl, {
    redirect: "follow",
    headers: {
      "user-agent": "ClientSurge booking readiness scanner",
      accept: "text/html,application/xhtml+xml",
    },
  });

  const html = await response.text();
  const lower = html.toLowerCase();
  const routeError = hasAny(lower, [
    /page not found/,
    /route not found/,
    /application error/,
    /vite.*error/,
    /cannot get \/book/,
  ]);

  const result = {
    url: targetUrl,
    final_url: response.url,
    status: response.status,
    ok: response.ok,
    title: extractTitle(html),
    has_free_automation_audit: /free automation audit/i.test(html),
    has_date_signal: hasAny(html, [/type=["']date["']/i, /audit date/i, /select date/i, /scheduled_date/i]),
    has_time_signal: hasAny(html, [/scheduled_time/i, /audit time/i, /select time/i, /choose a time/i]),
    has_current_scheduler_signal: hasAny(html, [/free automation audit scheduler/i, /audit request path/i, /demo-booking-inline/i]),
    has_demo_first_language: hasAny(html, [
      /book your free demo/i,
      /book free demo/i,
      /free demo/i,
      /schedule demo/i,
      /demo call/i,
    ]),
    asset_hashes: extractAssetHashes(html),
    route_error: routeError,
  };

  const pass =
    result.ok &&
    result.has_free_automation_audit &&
    result.has_date_signal &&
    result.has_time_signal &&
    !result.has_demo_first_language &&
    !result.route_error;

  console.log(JSON.stringify({ pass, result }, null, 2));
  process.exit(pass ? 0 : 1);
}

main().catch((error) => {
  console.error(JSON.stringify({ pass: false, error: error.message }, null, 2));
  process.exit(1);
});
