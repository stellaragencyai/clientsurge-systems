#!/usr/bin/env node

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const target = getArg("--url", process.env.VERIFY_URL || "https://clientsurgesystems.com");
const maxAttempts = Number(getArg("--attempts", process.env.PUBLIC_EXPOSURE_ATTEMPTS || "18"));
const delayMs = Number(getArg("--delay-ms", process.env.PUBLIC_EXPOSURE_DELAY_MS || "5000"));

const EDGE_GUARD_SCRIPT_ID = "clientsurge-edge-route-exposure-guard";
const INTERNAL_TEXT = /Admin Dashboard|Business Setup|Client Portal|Client Dashboard|Setup Status|Website Preview|Function Audit|System Observability|Reconciliation|Mission Control|SaaS Admin|AI Status Dashboard|Onboarding Pipeline/i;
const GENERATED_PAGES = /(?:<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>|>\s*Pages\s*<)/i;
const GENERATED_DIRECTORY_COPY = /ClientSurge Systems manages \d+ data types|data types and \d+ pages|organize, track, and share your work in 1 place|including launch gates/i;
const INTERNAL_HREF = /href=["']\/(admin|dashboard|client|client-portal|client-dashboard|setup|internal|functions|function|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|["'?])/i;
const REQUIRED_PUBLIC_HREFS = ["/pricing", "/automations", "/contact", "/privacy", "/terms"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripInjectedEdgeGuard(html = "") {
  return String(html).replace(
    new RegExp(`<script id="${EDGE_GUARD_SCRIPT_ID}">[\\s\\S]*?<\\/script>`, "gi"),
    "",
  );
}

async function checkOnce(attempt) {
  const url = new URL(target);
  url.searchParams.set("v", `${Date.now()}-${attempt}`);

  console.log(`Checking public exposure attempt ${attempt}/${maxAttempts} on ${url.toString()}`);

  const response = await fetch(url, {
    headers: {
      accept: "text/html",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
  });

  if (!response.ok) {
    return {
      ok: false,
      report: {
        url: url.toString(),
        status: response.status,
        findings: [`Failed to fetch live page: HTTP ${response.status}`],
      },
    };
  }

  const html = await response.text();
  const publicHtml = stripInjectedEdgeGuard(html);
  const sanitizerHeader = response.headers.get("x-clientsurge-route-exposure-sanitized");
  const sanitizerVersion = response.headers.get("x-clientsurge-route-exposure-version");
  const homepageRepairHeader = response.headers.get("x-clientsurge-homepage-repair");
  const findings = [];

  if (GENERATED_PAGES.test(publicHtml) && INTERNAL_TEXT.test(publicHtml)) {
    findings.push("Generated Pages directory text is present in live raw HTML.");
  }
  if (INTERNAL_HREF.test(publicHtml)) {
    findings.push("Internal/admin route href is present in live raw HTML.");
  }
  if (INTERNAL_TEXT.test(publicHtml) && GENERATED_DIRECTORY_COPY.test(publicHtml)) {
    findings.push("Base44 app-builder directory copy is present in live raw HTML.");
  }
  for (const href of REQUIRED_PUBLIC_HREFS) {
    if (!publicHtml.includes(`href="${href}"`) && !publicHtml.includes(`href='${href}'`)) {
      findings.push(`Expected public navigation href missing: ${href}`);
    }
  }

  const report = {
    url: url.toString(),
    status: response.status,
    sanitizerHeader,
    sanitizerVersion,
    homepageRepairHeader,
    bytes: html.length,
    publicBytesAfterIgnoringGuard: publicHtml.length,
    findings,
  };

  console.log(JSON.stringify(report, null, 2));
  return { ok: findings.length === 0, report };
}

let lastReport = null;
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const result = await checkOnce(attempt);
  lastReport = result.report;
  if (result.ok) {
    console.log("Live public exposure smoke passed.");
    process.exit(0);
  }
  if (attempt < maxAttempts) {
    console.log(`Exposure still visible; waiting ${delayMs}ms for Cloudflare route/DNS propagation before retrying.`);
    await sleep(delayMs);
  }
}

console.error("Live public exposure smoke failed after retries.");
console.error(JSON.stringify(lastReport, null, 2));
process.exit(1);
