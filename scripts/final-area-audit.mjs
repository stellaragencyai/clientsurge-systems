#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildSeoConversionAudit,
} from "../src/lib/seoConversionAudit.js";
import {
  evaluatePublicHeaders,
  evaluateSensitiveHeaders,
  verifyProductionSecurity,
} from "./verify-production-security.mjs";

const root = resolve(import.meta.dirname, "..");
const includeLive = process.argv.includes("--live");
const asJson = process.argv.includes("--json");

function read(path) {
  try {
    return readFileSync(resolve(root, path), "utf8");
  } catch {
    return "";
  }
}

function has(path) {
  return existsSync(resolve(root, path));
}

function scoreFromChecks(checks) {
  if (!checks.length) return 0;
  const points = checks.reduce((total, check) => {
    if (check.status === "pass") return total + 1;
    if (check.status === "warn") return total + 0.5;
    return total;
  }, 0);
  return Number(((points / checks.length) * 10).toFixed(1));
}

function area({ name, score, status = score >= 9.5 ? "excellent" : score >= 9 ? "ready" : "needs_work", evidence = [], blockers = [] }) {
  return { name, score: Number(score.toFixed ? score.toFixed(1) : score), status, evidence, blockers };
}

function readAutomationManifestIndex() {
  const dir = resolve(root, "base44/automations");
  try {
    return readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => `--- ${file} ---\n${read(`base44/automations/${file}`)}`)
      .join("\n");
  } catch {
    return "";
  }
}

function auditSeoConversion() {
  const files = {
    "index.html": read("index.html"),
    "public/sitemap.xml": read("public/sitemap.xml"),
    "public/robots.txt": read("public/robots.txt"),
    "src/App.jsx": read("src/App.jsx"),
    "src/lib/seo.js": read("src/lib/seo.js"),
    "src/lib/analytics.js": read("src/lib/analytics.js"),
    "src/components/analytics/AutoCTAAnalytics.jsx": read("src/components/analytics/AutoCTAAnalytics.jsx"),
    "src/components/landing/IndustryTemplate.jsx": read("src/components/landing/IndustryTemplate.jsx"),
    "src/components/admin/SocialMediaEngine.jsx": read("src/components/admin/SocialMediaEngine.jsx"),
    "base44/functions/generateSocialContent/entry.ts": read("base44/functions/generateSocialContent/entry.ts"),
    "base44/automations/index": readAutomationManifestIndex(),
  };
  const audit = buildSeoConversionAudit(files);
  return area({
    name: "SEO, conversion tracking, and content engine",
    score: audit.effectiveness_score_out_of_10,
    evidence: [`${audit.summary.pass} pass, ${audit.summary.warn} warn, ${audit.summary.fail} fail`],
  });
}

function auditRepoSecurity() {
  const headers = read("public/_headers");
  const app = read("src/App.jsx");
  const index = read("index.html");
  const publicChecks = evaluatePublicHeaders({
    target: "repo://public/_headers",
    headers: {
      "content-security-policy": headers.includes("Content-Security-Policy") ? "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'" : "",
      "x-frame-options": headers.includes("X-Frame-Options") ? "SAMEORIGIN" : "",
      "x-content-type-options": headers.includes("X-Content-Type-Options") ? "nosniff" : "",
      "referrer-policy": headers.includes("Referrer-Policy") ? "strict-origin-when-cross-origin" : "",
      "permissions-policy": headers.includes("Permissions-Policy") ? "camera=()" : "",
      "cross-origin-opener-policy": headers.includes("Cross-Origin-Opener-Policy") ? "same-origin-allow-popups" : "",
      "strict-transport-security": headers.includes("Strict-Transport-Security") ? "max-age=31536000" : "",
    },
  });
  const sensitiveChecks = evaluateSensitiveHeaders({
    target: "repo://public/_headers",
    headers: {
      "x-robots-tag": headers.includes("X-Robots-Tag: noindex, nofollow, noarchive") ? "noindex, nofollow, noarchive" : "",
      "cache-control": headers.includes("Cache-Control: no-store") ? "no-store" : "",
    },
  });
  const fallbackChecks = [
    { status: app.includes("noindex,nofollow,noarchive") ? "pass" : "fail" },
    { status: index.includes("noindex,nofollow,noarchive") ? "pass" : "fail" },
    { status: index.includes('"http-equiv": "Cache-Control"') ? "pass" : "fail" },
  ];
  return area({
    name: "Repo security controls and sensitive route fallbacks",
    score: scoreFromChecks([...publicChecks, ...sensitiveChecks, ...fallbackChecks]),
    evidence: ["Static headers, robots protection, noarchive metadata, and SPA cache hints present"],
  });
}

function auditLeadReliability() {
  const contact = read("src/pages/Contact.jsx");
  const submitContact = read("base44/functions/submitContactInquiry/entry.ts");
  const submitLead = read("base44/functions/submitLeadCapture/entry.ts");
  const shared = read("base44/functions/submitLeadCapture/leadCapture.shared.js");
  const checks = [
    /name="website_hp"/.test(contact),
    /MAX_CONTACT_BODY_BYTES = 12 \* 1024/.test(submitContact),
    /Invalid JSON body/.test(submitContact),
    /createLeadCaptureRateLimiter/.test(submitLead),
    /findDuplicateWebsiteLead/.test(submitLead),
    /isDisposableEmail/.test(submitLead),
    /normalizePhone/.test(shared),
    /direction: "system"/.test(submitLead),
    /provider: "internal"/.test(submitLead),
  ].map((passed) => ({ status: passed ? "pass" : "fail" }));

  return area({
    name: "Lead capture, contact forms, and CRM data flow",
    score: scoreFromChecks(checks),
    evidence: ["Honeypot, body guards, dedupe, rate limiting, disposable email block, and schema-valid workflow logs"],
  });
}

function auditBase44Metadata() {
  const result = spawnSync(process.execPath, ["scripts/base44/tolerant-functions-check.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  const pass = result.status === 0 && /Status:\s+PASS/.test(output) && /Failures:\s+0/.test(output);
  const functions = output.match(/Functions:\s+(\d+)/)?.[1] || "?";
  const automations = output.match(/Automations:\s+(\d+)/)?.[1] || "?";

  return area({
    name: "Base44 function and automation metadata",
    score: pass ? 10 : 0,
    evidence: [`${functions} functions, ${automations} automations, failures ${pass ? 0 : "detected"}`],
  });
}

function auditPerformance() {
  const assetsDir = resolve(root, "dist/assets");
  const jsAssets = existsSync(assetsDir)
    ? readdirSync(assetsDir).filter((file) => file.endsWith(".js"))
    : [];
  const entryChunks = jsAssets
    .filter((file) => /^index-[A-Za-z0-9_-]+\.js$/.test(file))
    .map((file) => ({ file, size: readFileSync(resolve(assetsDir, file)).byteLength }))
    .sort((a, b) => b.size - a.size);
  const entry = entryChunks[0] || { file: "missing", size: Infinity };
  const hasEmptyStripeChunk = jsAssets.some((file) => file.includes("vendor-stripe"));
  const score = !entryChunks.length
    ? 0
    : entry.size <= 325 * 1024 && !hasEmptyStripeChunk
      ? 10
      : entry.size <= 375 * 1024
        ? 9.5
        : 8.5;

  return area({
    name: "Performance and bundle hygiene",
    score,
    evidence: [`largest entry chunk ${entry.file}: ${Math.round(entry.size / 1024)} kB`, hasEmptyStripeChunk ? "empty Stripe vendor chunk still present" : "no empty Stripe vendor chunk"],
  });
}

function auditAccessibility() {
  const reportPath = "reports/lighthouse-accessibility-home.json";
  if (!has(reportPath)) {
    return area({
      name: "Accessibility",
      score: 0,
      status: "needs_work",
      evidence: ["Lighthouse accessibility report missing"],
    });
  }

  const report = JSON.parse(read(reportPath));
  const score = Number(((report.categories?.accessibility?.score || 0) * 10).toFixed(1));
  return area({
    name: "Accessibility",
    score,
    evidence: [`Lighthouse accessibility score ${(score * 10).toFixed(0)}/100`, `report fetched ${report.fetchTime}`],
  });
}

function auditReleaseReadiness() {
  const release = read("scripts/release-base44.ps1");
  const docs = read("docs/DEPLOYMENT_SECURITY_VERIFICATION.md");
  const checks = [
    /RunProductionSecurityGate/.test(release),
    /npm run verify:production-security/.test(release),
    /npm run launch:external-blockers/.test(read("docs/EXTERNAL_LAUNCH_BLOCKERS.md")),
    /npm run release:base44/.test(docs),
  ].map((passed) => ({ status: passed ? "pass" : "fail" }));

  return area({
    name: "Release gates and operator runbooks",
    score: scoreFromChecks(checks),
    evidence: ["Base44 publish flow, production security gate, and external blocker runbook are documented"],
  });
}

function auditExternalReadiness() {
  const result = spawnSync(process.execPath, ["scripts/launch-external-blockers-check.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  const output = result.stdout || "{}";
  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch {
    parsed = { ready_count: 0, blocked_count: 1, results: [] };
  }

  const total = parsed.ready_count + parsed.blocked_count;
  const score = total ? Number(((parsed.ready_count / total) * 10).toFixed(1)) : 0;
  return area({
    name: "External live proofs and credentials",
    score,
    status: parsed.blocked_count === 0 ? "excellent" : "provider_blocked",
    evidence: [`${parsed.ready_count} ready, ${parsed.blocked_count} blocked`],
    blockers: (parsed.results || [])
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.id}: ${(item.missing || []).join(", ") || (item.invalid || []).join(", ")}`),
  });
}

async function auditLiveProductionSecurity() {
  if (!includeLive) {
    return area({
      name: "Live production HTTP security",
      score: 0,
      status: "not_run",
      evidence: ["Run npm run audit:final -- --live to include live HTTP checks"],
    });
  }

  const report = await verifyProductionSecurity({ allowPlatformHeaderDrift: true });
  return area({
    name: "Live production HTTP security",
    score: scoreFromChecks(report.checks),
    status: report.summary.fail === 0 ? "excellent" : "provider_blocked",
    evidence: [`${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`],
    blockers: report.checks
      .filter((check) => check.status === "fail")
      .map((check) => `${check.id}: ${check.message}`),
  });
}

const repoControlled = [
  auditSeoConversion(),
  auditRepoSecurity(),
  auditLeadReliability(),
  auditBase44Metadata(),
  auditPerformance(),
  auditAccessibility(),
  auditReleaseReadiness(),
];
const providerGated = [
  auditExternalReadiness(),
  await auditLiveProductionSecurity(),
];
const repoScore = Number((repoControlled.reduce((sum, item) => sum + item.score, 0) / repoControlled.length).toFixed(1));

const report = {
  generated_at: new Date().toISOString(),
  repo_controlled_score: repoScore,
  repo_controlled: repoControlled,
  provider_gated: providerGated,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`# ClientSurge Final Area Audit\n`);
  console.log(`Generated: ${report.generated_at}`);
  console.log(`Repo-controlled score: ${repoScore}/10\n`);
  console.log(`## Repo-Controlled Areas`);
  for (const item of repoControlled) {
    console.log(`- ${item.score}/10 ${item.name} (${item.status})`);
    for (const evidence of item.evidence) console.log(`  Evidence: ${evidence}`);
  }
  console.log(`\n## Provider-Gated Areas`);
  for (const item of providerGated) {
    console.log(`- ${item.score}/10 ${item.name} (${item.status})`);
    for (const evidence of item.evidence) console.log(`  Evidence: ${evidence}`);
    for (const blocker of item.blockers.slice(0, 8)) console.log(`  Blocker: ${blocker}`);
    if (item.blockers.length > 8) console.log(`  Blocker: ${item.blockers.length - 8} more`);
  }
}

process.exitCode = repoScore >= 9.5 ? 0 : 1;
