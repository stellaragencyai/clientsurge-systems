#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_BASE_URL = "https://clientsurgesystems.com";
const PRODUCTION_APP_ID = "69dc4a79656fdba136d413d3";
const REPO_FULL_NAME = "stellaragencyai/clientsurge-systems";
const STAGING_APP_IDS = ["69f959e2bc665e019e19840c", "6a15f1424f4856ba4e9ed90b"];

const ROUTES = ["/", "/admin", "/login", "/pricing", "/automations", "/store", "/contact", "/proof", "/roofing", "/hvac", "/plumbing"];

const GENERATED_PAGES_HEADING_PATTERN = /<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>|>\s*Pages\s*</i;
const GENERATED_BASE44_DIRECTORY_COPY_PATTERN = /ClientSurge Systems manages \d+ data types|organize, track, and share your work in 1 place|including launch gates|Premium AI-driven automation systems built to increase bookings/i;
const INTERNAL_ROUTE_EXPOSURE_PATTERN = /href=["']\/(?:admin|dashboard|client-portal|client-dashboard|client-saas|dashboard-entry|setup|internal|functions?|mission-control|observability|reconciliation|saas\/admin)[^"']*["']|Admin\s*(?:\/\s*)?(?:Dashboard|AI Status Dashboard|System Runbook|Task Status Dashboard|Conversion Insights)|Business Setup|Client Portal|System Observability|Function Audit|Mission Control/i;

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const baseUrl = getArg("base-url", process.env.CLIENTSURGE_PROOF_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
const expectedSha = getArg("expected-sha", process.env.GITHUB_SHA || "manual-main-sha-required");
const writeReport = process.argv.includes("--write-report");
const selfTest = process.argv.includes("--self-test");
const selfTestRouteExposure = process.argv.includes("--self-test-route-exposure");

function hasStagingLeak(html = "") {
  return STAGING_APP_IDS.some((id) => html.includes(id));
}

function hasGeneratedPagesExposure(html = "") {
  const text = String(html || "");
  if (!GENERATED_PAGES_HEADING_PATTERN.test(text)) return false;
  return GENERATED_BASE44_DIRECTORY_COPY_PATTERN.test(text) || INTERNAL_ROUTE_EXPOSURE_PATTERN.test(text);
}

function extractAssetHints(html = "") {
  const scripts = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)).map((match) => match[1]);
  const styles = Array.from(html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["']/gi)).map((match) => match[1]);
  return { scripts, styles };
}

async function fetchRoute(route) {
  if (selfTestRouteExposure) {
    const exposedHtml = `<!doctype html><html><body><div id="root"><main><h1>ClientSurge Systems</h1><p>ClientSurge Systems manages 5 data types including launch gates.</p><h2>Pages</h2><ul><li><a href="/admin">Admin Dashboard</a></li><li><a href="/client-portal">Client Portal</a></li></ul><section><p>Automate Your Lead Flow</p></section></main></div></body></html>`;
    return {
      route,
      url: `${baseUrl}${route}`,
      statusCode: 200,
      contentType: "text/html; charset=utf-8",
      cacheControl: "no-cache",
      html: route === "/" ? exposedHtml : '<!doctype html><html><body><div id="root"></div></body></html>',
    };
  }

  if (selfTest) {
    return {
      route,
      url: `${baseUrl}${route}`,
      statusCode: 200,
      contentType: "text/html; charset=utf-8",
      cacheControl: "no-cache",
      html: '<!doctype html><html><head><script src="/assets/index-test.js"></script></head><body><div id="root"></div></body></html>',
    };
  }

  const url = `${baseUrl}${route}`;
  const response = await fetch(url, {
    headers: { Accept: "text/html", "Cache-Control": "no-cache", Pragma: "no-cache" },
    redirect: "follow",
  });
  const html = await response.text();
  return {
    route,
    url,
    statusCode: response.status,
    contentType: response.headers.get("content-type") || "",
    cacheControl: response.headers.get("cache-control") || "",
    html,
  };
}

function evaluateRoute(result) {
  const failures = [];
  const looksLikeHtml = result.contentType.includes("text/html") || result.html.includes("<html");
  const appShellPresent = result.html.includes('id="root"') || result.html.includes("id='root'");
  const stagingLeak = hasStagingLeak(result.html);
  const generatedPagesExposure = hasGeneratedPagesExposure(result.html);
  const assetHints = extractAssetHints(result.html);

  if (result.statusCode < 200 || result.statusCode >= 400) failures.push(`HTTP ${result.statusCode}`);
  if (!looksLikeHtml) failures.push(`not HTML: ${result.contentType || "missing content-type"}`);
  if (!appShellPresent) failures.push("missing React app shell root");
  if (stagingLeak) failures.push("staging or donor Base44 app ID leaked into production HTML");
  if (generatedPagesExposure) failures.push("generated Base44 Pages directory exposed in production HTML");

  return {
    route: result.route,
    url: result.url,
    status: failures.length ? "fail" : "pass",
    http_status: result.statusCode,
    content_type: result.contentType,
    cache_control: result.cacheControl,
    generated_pages_exposure: generatedPagesExposure,
    script_assets: assetHints.scripts.slice(0, 5),
    stylesheet_assets: assetHints.styles.slice(0, 5),
    failures,
  };
}

function buildMarkdown(report) {
  const lines = [];
  lines.push("# Production Release Proof", "");
  lines.push(`Generated: ${report.generated_at}`);
  lines.push(`Repo: ${report.repo}`);
  lines.push(`Expected main SHA: ${report.expected_main_sha}`);
  lines.push(`Base URL: ${report.base_url}`);
  lines.push(`Production Base44 app: ${report.production_base44_app_id}`, "");
  lines.push("## Result", "");
  lines.push(`Status: **${report.status.toUpperCase()}**`);
  lines.push(`Routes checked: ${report.checked_count}`);
  lines.push(`Passed: ${report.pass_count}`);
  lines.push(`Failed: ${report.fail_count}`, "");
  lines.push("## Route evidence", "");
  for (const route of report.routes) {
    lines.push(`- ${route.status === "pass" ? "PASS" : "FAIL"} ${route.route} (${route.http_status})`);
    if (route.failures.length) lines.push(`  - ${route.failures.join("; ")}`);
  }
  lines.push("", "## Manual evidence required", "");
  for (const item of report.manual_evidence_required) lines.push(`- [ ] ${item}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const routeResults = [];
  for (const route of ROUTES) {
    try {
      routeResults.push(evaluateRoute(await fetchRoute(route)));
    } catch (error) {
      routeResults.push({
        route,
        url: `${baseUrl}${route}`,
        status: "fail",
        http_status: 0,
        content_type: "",
        cache_control: "",
        generated_pages_exposure: false,
        script_assets: [],
        stylesheet_assets: [],
        failures: [`request error: ${error.message}`],
      });
    }
  }

  const failed = routeResults.filter((result) => result.status !== "pass");
  const report = {
    generated_at: new Date().toISOString(),
    repo: REPO_FULL_NAME,
    expected_main_sha: expectedSha,
    base_url: baseUrl,
    production_base44_app_id: PRODUCTION_APP_ID,
    status: failed.length ? "fail" : "pass",
    checked_count: routeResults.length,
    pass_count: routeResults.length - failed.length,
    fail_count: failed.length,
    routes: routeResults,
    manual_evidence_required: [
      "GitHub main equals the expected SHA above.",
      "ClientSurge Release Gate passed for the expected SHA.",
      "ClientSurge Base44 Sync Control passed for the expected SHA.",
      "Base44 publisher ran after the expected SHA was on main.",
      "Live public routes do not expose the generated Base44 Pages directory.",
      "Live admin mobile route opens without stale UI after a hard refresh.",
      "Screenshot proof captured for live desktop and mobile admin.",
    ],
  };

  if (writeReport) {
    const dir = join(process.cwd(), "logs", "release-proof");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "latest-production-release-proof.json"), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(join(dir, "latest-production-release-proof.md"), buildMarkdown(report));
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

await main();
