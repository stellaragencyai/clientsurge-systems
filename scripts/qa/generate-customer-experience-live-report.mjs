import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");

const templatePath = path.join(root, "qa", "customer-experience-qa-template.md");
const livePath = path.join(root, "docs", "customer-experience-qa-live.md");
const trackerPath = path.join(root, "docs", "customer-experience-qa-tracker.md");
const codeAuditPath = path.join(root, "qa", "results", "customer-experience-code-audit.json");
const playwrightPath = path.join(root, "qa", "results", "customer-experience-playwright-status.json");
const changeAwarePath = path.join(root, "qa", "results", "customer-experience-change-aware.json");

const source = fs.readFileSync(templatePath, "utf8");

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return { generatedAt: null, checks: {} };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const codeAudit = safeReadJson(codeAuditPath);
const playwright = safeReadJson(playwrightPath);
const changeAware = safeReadJson(changeAwarePath);

const mergedStatuses = new Map();

for (const [id, result] of Object.entries(codeAudit.checks || {})) {
  mergedStatuses.set(id, result);
}

for (const [id, result] of Object.entries(playwright.checks || {})) {
  const existing = mergedStatuses.get(id);
  if (!existing || existing.status !== "failed") {
    mergedStatuses.set(id, result);
  }
}

const generatedDate = new Date().toISOString();
const generatedDateOnly = generatedDate.slice(0, 10);
const updatedLines = [];
let passed = 0;
let open = 0;
const failedItems = [];

for (const line of source.split(/\r?\n/)) {
  const match = line.match(/^-\s\[( |x)\]\s(FE-\d{3})\s(.+)$/);
  if (!match) {
    updatedLines.push(line);
    continue;
  }

  const [, originalStatus, id, label] = match;
  const override = mergedStatuses.get(id);
  const checked = override?.status === "passed" || originalStatus === "x";
  const marker = checked ? "x" : " ";
  if (checked) {
    passed += 1;
  } else {
    open += 1;
  }

  let suffix = "";
  if (override?.note) {
    suffix = ` <!-- ${override.source}: ${override.note} -->`;
  }
  if (override?.status === "failed") {
    failedItems.push({ id, label, source: override.source, note: override.note });
  }

  updatedLines.push(`- [${marker}] ${id} ${label}${suffix}`);
}

const total = passed + open;
const liveLines = [];

for (const line of updatedLines) {
  if (line.startsWith("Last updated:")) {
    liveLines.push(`Last updated: ${generatedDateOnly}`);
    continue;
  }

  if (line === "## How To Use") {
    liveLines.push("> This file auto-updates from the QA template plus the latest code-audit and Playwright results.");
    liveLines.push(`> Generated: ${generatedDate}`);
    liveLines.push(`> Latest code audit: ${codeAudit.generatedAt || "not run"}`);
    liveLines.push(`> Latest browser run: ${playwright.generatedAt || "not run"}`);
    liveLines.push("");
    liveLines.push(line);
    continue;
  }

  if (line.startsWith("- Total checks:")) {
    liveLines.push(`- Total checks: \`${total}\``);
    continue;
  }

  if (line.startsWith("- Passed:")) {
    liveLines.push(`- Passed: \`${passed}\``);
    continue;
  }

  if (line.startsWith("- Open:")) {
    liveLines.push(`- Open: \`${open}\``);
    continue;
  }

  liveLines.push(line);
}

const firstSectionIndex = liveLines.findIndex((line) => /^## A\./.test(line));
const failureSection = [
  "## Current Automated Failures",
  "",
];

if (failedItems.length === 0) {
  failureSection.push("- None currently recorded by the latest automated runs.");
} else {
  for (const item of failedItems) {
    failureSection.push(`- ${item.id} (${item.source}): ${item.label} -- ${item.note || "See test output."}`);
  }
}

failureSection.push("", "---", "");

const changeAwareSection = [
  "## Change-Aware QA Tasks",
  "",
  `- Changed customer-facing files detected: \`${changeAware.changedCustomerFiles?.length || 0}\``,
  `- Generated change-aware tasks: \`${changeAware.totalTasks || 0}\``,
  `- Detailed list: [customer-experience-change-aware-checks.md](C:\\Base44Projects\\clientsurge-systems\\docs\\customer-experience-change-aware-checks.md)`,
  "",
];

if ((changeAware.tasks || []).length === 0) {
  changeAwareSection.push("- None currently generated.");
} else {
  for (const task of changeAware.tasks.slice(0, 12)) {
    changeAwareSection.push(`- ${task.id}: ${task.title} (\`${task.file}\`)`);
  }
  if (changeAware.tasks.length > 12) {
    changeAwareSection.push(`- ...and ${changeAware.tasks.length - 12} more in the detailed change-aware file.`);
  }
}

changeAwareSection.push("", "---", "");

if (firstSectionIndex !== -1) {
  liveLines.splice(firstSectionIndex, 0, ...changeAwareSection, ...failureSection);
}

const output = `${liveLines.join("\n")}\n`;
fs.writeFileSync(livePath, output);
fs.writeFileSync(trackerPath, output);
console.log(`Wrote live markdown report to ${livePath}`);
console.log(`Updated primary tracker at ${trackerPath}`);
