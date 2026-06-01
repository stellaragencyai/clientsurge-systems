#!/usr/bin/env node

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { auditPage, DEFAULT_START_URL, importantRouteUrls, normalizeUrl, parseArgs } from "./audit-page.js";
import { crawlSite } from "./crawl-site.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const auditRoot = resolve(__dirname, "..");
const reportsDir = resolve(auditRoot, "reports");
const screenshotsDir = resolve(auditRoot, "screenshots");
const jsonOut = resolve(reportsDir, "site-audit.json");
const markdownOut = resolve(reportsDir, "site-audit.md");

async function auditAll(options = {}) {
  const startUrl = normalizeUrl(options.startUrl ?? DEFAULT_START_URL);
  const maxPages = Number(options.maxPages ?? 40);
  const browser = await chromium.launch({ headless: true });
  const crawl = await crawlSite({ startUrl, maxPages, browser });
  const urls = unique([...importantRouteUrls(startUrl), ...crawl.discoveredUrls])
    .filter((url) => url && new URL(url).protocol.startsWith("http"))
    .slice(0, maxPages);

  const pages = [];
  for (const url of urls) {
    process.stderr.write(`Auditing ${url}\n`);
    try {
      pages.push(await auditPage(url, { browser, baseUrl: startUrl, screenshotsDir }));
    } catch (error) {
      pages.push({ url, error: error.message });
    }
  }
  await browser.close();

  annotateDuplicateContent(pages);
  const marketplaceAudit = buildMarketplaceAudit(pages);
  const summary = buildSummary(pages, marketplaceAudit);
  return {
    target: startUrl,
    generatedAt: new Date().toISOString(),
    crawl,
    summary,
    marketplaceAudit,
    pages,
  };
}

function annotateDuplicateContent(pages) {
  const byHash = new Map();
  for (const page of pages) {
    if (!page.visibleTextHash || page.visibleTextLength < 400) continue;
    if (!byHash.has(page.visibleTextHash)) byHash.set(page.visibleTextHash, []);
    byHash.get(page.visibleTextHash).push(page.url);
  }
  for (const page of pages) {
    const matches = byHash.get(page.visibleTextHash) ?? [];
    page.duplicateSignals = matches.length > 1 ? matches.filter((url) => url !== page.url) : [];
  }
}

function buildMarketplaceAudit(pages) {
  const allText = pages.map((page) => `${page.pageTitle ?? ""} ${page.visibleTextSample ?? ""} ${(page.h1 ?? []).join(" ")} ${(page.h2h3 ?? []).join(" ")} ${(page.ctaTexts ?? []).join(" ")}`).join(" ").replace(/\s+/g, " ");
  const storePage = pages.find((page) => page.url?.includes("/store"));
  const packageNames = ["Starter", "Growth", "Pro"];
  const automationSystemTerms = [
    "instant lead response",
    "missed call",
    "booking",
    "follow-up",
    "review",
    "reactivation",
  ];
  const packageMentions = packageNames.filter((name) => new RegExp(`\\b${name}\\b`, "i").test(allText));
  const automationMentions = automationSystemTerms.filter((term) => new RegExp(term, "i").test(allText));
  const bookCallMentions = countMatches(allText, /\bbook (a|your) (call|demo)\b/gi);
  const packageCtaMentions = countMatches(allText, /\b(view ai service packages|choose your package|load this bundle|add to cart|self-serve checkout|package)\b/gi);

  const checks = [
    check("Self-serve package selection", /self-serve|checkout|add to cart|load this bundle|choose your package/i.test(allText)),
    check("3 clear packages", packageMentions.length >= 3),
    check("Package comparison", /comparison|compare|bundle pricing|package/i.test(allText)),
    check("Demo videos", /demo video|watch demo|video/i.test(allText)),
    check("Animation/diagram sections", /diagram|animation|workflow|flow|system map|automation flow/i.test(allText)),
    check("Self-enrollment flow", /checkout|cart|enroll|self-serve|start now|add to cart/i.test(allText)),
    check("Package-forward CTA language", /view ai service packages|choose your package|load this bundle|add to cart/i.test(allText)),
    check("Reduced dependency on book-a-call language", packageCtaMentions >= bookCallMentions),
    check("6 AI Automation Systems presented as feature systems", automationMentions.length >= 5),
    check("6 systems not confused as 6 packages", !/six packages|6 packages/i.test(allText)),
  ];

  return {
    status: checks.every((item) => item.passed) ? "pass" : "needs-review",
    checks,
    packageMentions,
    automationMentions,
    bookCallMentions,
    packageCtaMentions,
    storePageUrl: storePage?.finalUrl ?? storePage?.url ?? null,
  };
}

function buildSummary(pages, marketplaceAudit) {
  const pageIssues = pages.flatMap((page) => {
    if (page.error) return [{ url: page.url, severity: "high", issue: page.error }];
    const issues = [];
    if (page.appearsBlankOrJsBroken) issues.push({ url: page.url, severity: "high", issue: "Appears blank or JavaScript-broken" });
    if ((page.consoleErrors ?? []).length) issues.push({ url: page.url, severity: "medium", issue: `${page.consoleErrors.length} console warnings/errors` });
    if ((page.failedNetworkRequests ?? []).length) issues.push({ url: page.url, severity: "medium", issue: `${page.failedNetworkRequests.length} failed network requests` });
    if ((page.httpErrorResponses ?? []).length) issues.push({ url: page.url, severity: "medium", issue: `${page.httpErrorResponses.length} HTTP error responses` });
    if ((page.brokenLinks ?? []).length) issues.push({ url: page.url, severity: "medium", issue: `${page.brokenLinks.length} broken links` });
    if ((page.accessibility?.axeViolations ?? []).length) issues.push({ url: page.url, severity: "medium", issue: `${page.accessibility.axeViolations.length} axe accessibility violations` });
    if ((page.visualChecks?.highPriorityFindings ?? []).length) issues.push({ url: page.url, severity: "medium", issue: page.visualChecks.highPriorityFindings.join("; ") });
    if ((page.duplicateSignals ?? []).length) issues.push({ url: page.url, severity: "low", issue: `Duplicate visible content with ${page.duplicateSignals.join(", ")}` });
    return issues;
  });

  return {
    pagesAudited: pages.length,
    pagesWithErrors: pages.filter((page) => page.error).length,
    pagesBlankOrJsBroken: pages.filter((page) => page.appearsBlankOrJsBroken).length,
    totalConsoleErrors: sum(pages, (page) => page.consoleErrors?.length),
    totalFailedNetworkRequests: sum(pages, (page) => page.failedNetworkRequests?.length),
    totalHttpErrorResponses: sum(pages, (page) => page.httpErrorResponses?.length),
    totalBrokenLinks: sum(pages, (page) => page.brokenLinks?.length),
    totalAxeViolations: sum(pages, (page) => page.accessibility?.axeViolations?.length),
    marketplaceStatus: marketplaceAudit.status,
    topIssues: pageIssues.slice(0, 50),
  };
}

function formatMarkdown(audit) {
  const lines = [];
  lines.push("# ClientSurge Browser Audit");
  lines.push("");
  lines.push(`Generated: ${audit.generatedAt}`);
  lines.push(`Target: ${audit.target}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Pages audited: ${audit.summary.pagesAudited}`);
  lines.push(`- Pages with errors: ${audit.summary.pagesWithErrors}`);
  lines.push(`- Blank or JS-broken pages: ${audit.summary.pagesBlankOrJsBroken}`);
  lines.push(`- Console warnings/errors: ${audit.summary.totalConsoleErrors}`);
  lines.push(`- Failed network requests: ${audit.summary.totalFailedNetworkRequests}`);
  lines.push(`- HTTP error responses: ${audit.summary.totalHttpErrorResponses}`);
  lines.push(`- Broken links: ${audit.summary.totalBrokenLinks}`);
  lines.push(`- axe accessibility violations: ${audit.summary.totalAxeViolations}`);
  lines.push(`- Marketplace audit status: ${audit.summary.marketplaceStatus}`);
  lines.push("");
  lines.push("## Marketplace Package Checks");
  lines.push("");
  for (const item of audit.marketplaceAudit.checks) {
    lines.push(`- ${item.passed ? "[pass]" : "[review]"} ${item.name}`);
  }
  lines.push("");
  lines.push(`Package mentions found: ${audit.marketplaceAudit.packageMentions.join(", ") || "none"}`);
  lines.push(`Automation system signals found: ${audit.marketplaceAudit.automationMentions.join(", ") || "none"}`);
  lines.push(`Book-a-call/demo mentions: ${audit.marketplaceAudit.bookCallMentions}`);
  lines.push(`Package/self-serve CTA mentions: ${audit.marketplaceAudit.packageCtaMentions}`);
  lines.push("");
  lines.push("## Top Issues");
  lines.push("");
  if (!audit.summary.topIssues.length) {
    lines.push("No high-signal automated issues found.");
  } else {
    for (const issue of audit.summary.topIssues) {
      lines.push(`- [${issue.severity}] ${issue.url}: ${issue.issue}`);
    }
  }
  lines.push("");
  lines.push("## Page Details");
  lines.push("");
  for (const page of audit.pages) {
    lines.push(`### ${page.url}`);
    if (page.error) {
      lines.push(`- Error: ${page.error}`);
      lines.push("");
      continue;
    }
    lines.push(`- Final URL: ${page.finalUrl}`);
    lines.push(`- Status: ${page.status}`);
    lines.push(`- Title: ${page.pageTitle || "(missing)"}`);
    lines.push(`- Meta description: ${page.metaDescription || "(missing)"}`);
    lines.push(`- H1: ${(page.h1 ?? []).join(" | ") || "(missing)"}`);
    lines.push(`- CTA/button text: ${(page.ctaTexts ?? []).slice(0, 20).join(" | ") || "(none)"}`);
    lines.push(`- Internal links: ${(page.internalLinks ?? []).length}`);
    lines.push(`- External links: ${(page.externalLinks ?? []).length}`);
    lines.push(`- Broken links: ${(page.brokenLinks ?? []).length}`);
    lines.push(`- Console warnings/errors: ${(page.consoleErrors ?? []).length}`);
    lines.push(`- Failed network requests: ${(page.failedNetworkRequests ?? []).length}`);
    lines.push(`- HTTP error responses: ${(page.httpErrorResponses ?? []).length}`);
    lines.push(`- axe violations: ${(page.accessibility?.axeViolations ?? []).length}`);
    lines.push(`- Desktop screenshot: ${page.screenshots?.desktop}`);
    lines.push(`- Mobile screenshot: ${page.screenshots?.mobile}`);
    const findings = page.visualChecks?.highPriorityFindings ?? [];
    lines.push(`- Visual QA findings: ${findings.length ? findings.join("; ") : "none"}`);
    if ((page.exposedInternalAdminLinks ?? []).length) {
      lines.push(`- Public admin/internal links: ${page.exposedInternalAdminLinks.map((link) => link.url).join(", ")}`);
    }
    if ((page.duplicateSignals ?? []).length) {
      lines.push(`- Duplicate content signals: ${page.duplicateSignals.join(", ")}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function check(name, passed) {
  return { name, passed: Boolean(passed) };
}

function countMatches(text, pattern) {
  return Array.from(text.matchAll(pattern)).length;
}

function sum(items, getter) {
  return items.reduce((total, item) => total + (getter(item) ?? 0), 0);
}

function unique(values) {
  return Array.from(new Set(values));
}

async function main() {
  const args = parseArgs();
  const audit = await auditAll({
    startUrl: args.start ?? DEFAULT_START_URL,
    maxPages: args["max-pages"] ?? 40,
  });
  await mkdir(reportsDir, { recursive: true });
  await writeFile(jsonOut, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(markdownOut, formatMarkdown(audit), "utf8");
  process.stdout.write(`${JSON.stringify(audit.summary, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
