#!/usr/bin/env node

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildSeoConversionAudit,
  formatSeoConversionAuditMarkdown,
} from "../src/lib/seoConversionAudit.js";

const root = resolve(import.meta.dirname, "..");
const asMarkdown = process.argv.includes("--markdown");
const failOnCritical = process.argv.includes("--fail-on-critical");

function read(path) {
  try {
    return readFileSync(resolve(root, path), "utf8");
  } catch {
    return "";
  }
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
process.stdout.write(asMarkdown ? formatSeoConversionAuditMarkdown(audit) : `${JSON.stringify(audit, null, 2)}\n`);

if (failOnCritical && audit.checks.some((check) => check.status === "fail" && check.severity === "high")) {
  process.exit(1);
}
