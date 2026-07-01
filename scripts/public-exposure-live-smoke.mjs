#!/usr/bin/env node

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const target = getArg("--url", process.env.VERIFY_URL || "https://clientsurgesystems.com");
const url = new URL(target);
url.searchParams.set("v", String(Date.now()));

const EDGE_GUARD_SCRIPT_ID = "clientsurge-edge-route-exposure-guard";
const INTERNAL_TEXT = /Admin Dashboard|Business Setup|Client Portal|Client Dashboard|Setup Status|Website Preview|Function Audit|System Observability|Reconciliation|Mission Control|SaaS Admin|AI Status Dashboard|Onboarding Pipeline/i;
const GENERATED_PAGES = /(?:<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>|>\s*Pages\s*<)/i;
const GENERATED_DIRECTORY_COPY = /ClientSurge Systems manages \d+ data types|data types and \d+ pages|organize, track, and share your work in 1 place|including launch gates/i;
const INTERNAL_HREF = /href=["']\/(admin|dashboard|client|client-portal|client-dashboard|setup|internal|functions|function|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|["'?])/i;
const REQUIRED_PUBLIC_HREFS = ["/pricing", "/automations", "/contact", "/privacy", "/terms"];

function stripInjectedEdgeGuard(html = "") {
  return String(html).replace(
    new RegExp(`<script id="${EDGE_GUARD_SCRIPT_ID}">[\\s\\S]*?<\\/script>`, "gi"),
    "",
  );
}

console.log(`Checking public exposure on ${url.toString()}`);

const response = await fetch(url, {
  headers: {
    accept: "text/html",
    "cache-control": "no-cache",
    pragma: "no-cache",
  },
});

if (!response.ok) {
  console.error(`Failed to fetch live page: HTTP ${response.status}`);
  process.exit(1);
}

const html = await response.text();
const publicHtml = stripInjectedEdgeGuard(html);
const sanitizerHeader = response.headers.get("x-clientsurge-route-exposure-sanitized");
const sanitizerVersion = response.headers.get("x-clientsurge-route-exposure-version");
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

console.log(JSON.stringify({
  url: url.toString(),
  status: response.status,
  sanitizerHeader,
  sanitizerVersion,
  bytes: html.length,
  publicBytesAfterIgnoringGuard: publicHtml.length,
  findings,
}, null, 2));

if (findings.length) {
  process.exit(1);
}

console.log("Live public exposure smoke passed.");
