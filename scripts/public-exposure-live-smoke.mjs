#!/usr/bin/env node

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const target = getArg("--url", process.env.VERIFY_URL || "https://clientsurgesystems.com");
const maxAttempts = Number(getArg("--attempts", process.env.PUBLIC_EXPOSURE_ATTEMPTS || "18"));
const delayMs = Number(getArg("--delay-ms", process.env.PUBLIC_EXPOSURE_DELAY_MS || "5000"));
const routePaths = getArg(
  "--paths",
  process.env.PUBLIC_EXPOSURE_PATHS || "/,/pricing,/automations,/industries,/how-it-works,/contact,/privacy,/terms",
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const EDGE_GUARD_SCRIPT_ID = "clientsurge-edge-route-exposure-guard";
const INTERNAL_TEXT = /Admin Dashboard|Business Setup|Client Portal|Client Dashboard|Setup Status|Website Preview|Function Audit|System Observability|Reconciliation|Mission Control|SaaS Admin|AI Status Dashboard|Onboarding Pipeline/i;
const GENERATED_PAGES = /(?:<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>|>\s*Pages\s*<)/i;
const GENERATED_DIRECTORY_COPY = /ClientSurge Systems manages \d+ data types|data types and \d+ pages|organize, track, and share your work in 1 place|including launch gates|Premium AI-driven automation systems built to increase bookings/i;
const INTERNAL_HREF = /href=["']\/(admin|dashboard|client|client-portal|client-dashboard|setup|internal|functions|function|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|["'?])/i;
const REQUIRED_HOME_HREFS = ["/pricing", "/automations", "/contact", "/privacy", "/terms"];
const REACT_BOOTSTRAP = /<script\b[^>]*type=["']module["'][^>]*src=["'][^"']+["'][^>]*><\/script>/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripNonVisibleContent(html = "") {
  return String(html)
    .replace(new RegExp(`<script id="${EDGE_GUARD_SCRIPT_ID}">[\\s\\S]*?<\\/script>`, "gi"), "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

function expectedCanonical(baseUrl, pathname) {
  const url = new URL(baseUrl);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, pathname === "/" ? "/" : "");
}

async function checkRoute(pathname, attempt) {
  const url = new URL(pathname, target);
  url.searchParams.set("v", `${Date.now()}-${attempt}`);

  const response = await fetch(url, {
    headers: {
      accept: "text/html",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
  });

  const html = await response.text();
  const visibleHtml = stripNonVisibleContent(html);
  const sanitizerHeader = response.headers.get("x-clientsurge-route-exposure-sanitized");
  const safeEntryVersion = response.headers.get("x-clientsurge-safe-entry-version");
  const appShellFallback = response.headers.get("x-clientsurge-app-shell-fallback");
  const findings = [];

  if (!response.ok) {
    findings.push(`Failed to fetch live page: HTTP ${response.status}`);
  }
  if (/\bcache miss\b/i.test(visibleHtml)) {
    findings.push("Base44 cache-miss response is visible instead of the public app shell.");
  }
  if (GENERATED_PAGES.test(visibleHtml) && INTERNAL_TEXT.test(visibleHtml)) {
    findings.push("Generated Pages directory text is present in visible HTML.");
  }
  if (INTERNAL_HREF.test(visibleHtml)) {
    findings.push("Internal/admin route href is present in visible HTML.");
  }
  if (INTERNAL_TEXT.test(visibleHtml) && GENERATED_DIRECTORY_COPY.test(visibleHtml)) {
    findings.push("Base44 app-builder directory copy is present in visible HTML.");
  }
  if (!html.includes('id="root"') && !html.includes("id='root'")) {
    findings.push("React root is missing from the public HTML response.");
  }
  if (!REACT_BOOTSTRAP.test(html)) {
    findings.push("React module bootstrap is missing from the public HTML response.");
  }

  const canonical = expectedCanonical(target, pathname);
  if (
    !html.includes(`rel="canonical" href="${canonical}"`) &&
    !html.includes(`rel='canonical' href='${canonical}'`) &&
    !html.includes(`href="${canonical}" rel="canonical"`)
  ) {
    findings.push(`Canonical URL is missing or incorrect; expected ${canonical}`);
  }

  if (pathname === "/") {
    for (const href of REQUIRED_HOME_HREFS) {
      if (!visibleHtml.includes(`href="${href}"`) && !visibleHtml.includes(`href='${href}'`)) {
        findings.push(`Expected homepage navigation href missing: ${href}`);
      }
    }
  }

  return {
    ok: findings.length === 0,
    report: {
      pathname,
      url: url.toString(),
      status: response.status,
      sanitizerHeader,
      safeEntryVersion,
      appShellFallback,
      bytes: html.length,
      visibleBytes: visibleHtml.length,
      findings,
    },
  };
}

let lastReports = [];
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  console.log(`Checking ${routePaths.length} public routes, attempt ${attempt}/${maxAttempts}.`);
  const results = [];

  for (const pathname of routePaths) {
    results.push(await checkRoute(pathname, attempt));
  }

  lastReports = results.map((result) => result.report);
  console.log(JSON.stringify(lastReports, null, 2));

  if (results.every((result) => result.ok)) {
    console.log("Live public route exposure and SPA-shell smoke passed.");
    process.exit(0);
  }

  if (attempt < maxAttempts) {
    console.log(`Public route defects remain; waiting ${delayMs}ms for deployment and edge propagation before retrying.`);
    await sleep(delayMs);
  }
}

console.error("Live public route exposure and SPA-shell smoke failed after retries.");
console.error(JSON.stringify(lastReports, null, 2));
process.exit(1);
