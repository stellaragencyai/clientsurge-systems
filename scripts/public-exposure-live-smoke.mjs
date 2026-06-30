#!/usr/bin/env node

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const target = getArg("--url", process.env.VERIFY_URL || "https://clientsurgesystems.com");
const url = new URL(target);
url.searchParams.set("v", String(Date.now()));

const INTERNAL_TEXT = /Admin Dashboard|Business Setup|Client Portal|Client Dashboard|Setup Status|Website Preview|Function Audit|System Observability|Reconciliation|Mission Control|SaaS Admin|AI Status Dashboard|Onboarding Pipeline/i;
const GENERATED_PAGES = /<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>|>\s*Pages\s*</i;
const INTERNAL_HREF = /href=["']\/(admin|dashboard|client-portal|client-dashboard|setup|internal|functions|mission-control|observability|reconciliation)(\/|["'?])/i;

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
const sanitizerHeader = response.headers.get("x-clientsurge-route-exposure-sanitized");
const findings = [];

if (GENERATED_PAGES.test(html) && INTERNAL_TEXT.test(html)) {
  findings.push("Generated Pages directory text is present in live raw HTML.");
}
if (INTERNAL_HREF.test(html)) {
  findings.push("Internal/admin route href is present in live raw HTML.");
}
if (INTERNAL_TEXT.test(html) && /ClientSurge Systems manages \d+ data types|organize, track, and share your work in 1 place|including launch gates/i.test(html)) {
  findings.push("Base44 app-builder directory copy is present in live raw HTML.");
}

console.log(JSON.stringify({
  url: url.toString(),
  status: response.status,
  sanitizerHeader,
  bytes: html.length,
  findings,
}, null, 2));

if (findings.length) {
  process.exit(1);
}

console.log("Live public exposure smoke passed.");
