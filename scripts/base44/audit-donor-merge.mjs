#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const DEFAULT_DONOR_PATH = "C:\\Users\\nolan\\Documents\\base44-eject-clientsurge";
const PRODUCTION_APP_ID = "69dc4a79656fdba136d413d3";
const DONOR_APP_ID = "69f959e2bc665e019e19840c";

const EXPECTED_DONOR_ONLY = new Set([
  "base44/functions/_shared/installPipeline/entry.ts",
  "base44/functions/_shared/installPipeline/function.jsonc",
  "src/MASTER_TASK_LIST_250.md",
  "src/pages/AdminAutomation.jsx",
  "src/pages/AdminDashboard.jsx",
  "src/pages/AdminInstallGuide.jsx",
  "src/pages/AdminLeadDetail.jsx",
  "src/pages/AdminLeads.jsx",
  "src/pages/AdminOnboarding.jsx",
  "src/pages/AdminSettings.jsx",
  "src/pages/AutomationsDemo.jsx",
  "src/pages/BusinessSetup.jsx",
  "src/pages/CaptureLeads.jsx",
  "src/pages/Chiropractic.jsx",
  "src/pages/ClientDashboard.jsx",
  "src/pages/ClientPortal.jsx",
  "src/pages/Contractors.jsx",
  "src/pages/CredentialsSetup.jsx",
  "src/pages/Dashboard.jsx",
  "src/pages/Dental.jsx",
  "src/pages/HVAC.jsx",
  "src/pages/LeadIntelligence.jsx",
  "src/pages/LegalPage.jsx",
  "src/pages/MedSpa.jsx",
  "src/pages/MedSpaDashboard.jsx",
  "src/pages/Onboarding.jsx",
  "src/pages/OrderSuccess.jsx",
  "src/pages/Roofing.jsx",
  "src/pages/Sam.jsx",
  "src/pages/Success.jsx",
  "src/pages/ThankYou.jsx",
]);

const LOCAL_IDENTITY_FILES = new Set([
  ".env.local",
  "base44/.app.jsonc",
]);

const DONOR_ID_ALLOWED_PREFIXES = [
  "docs/",
  "tests/",
  "scripts/",
  ".env.example",
];

const RUNTIME_APP_ID_SCAN_PREFIXES = [
  "base44/",
  "public/",
  "src/",
];

function parseArgs(argv) {
  const args = {
    donorPath: DEFAULT_DONOR_PATH,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--donor-path") args.donorPath = argv[++i] || args.donorPath;
    else if (arg === "--json") args.json = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/base44/audit-donor-merge.mjs [--json] [--donor-path <path>]

Verifies that the donor Base44 export has no unclassified donor-only files left
and that the donor app ID does not leak into runtime source.`);
      process.exit(0);
    }
  }

  return args;
}

function normalizeRel(path) {
  return path.split(sep).join("/");
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else files.push(path);
  }
  return files;
}

function shouldIgnoreRepoFile(rel) {
  return rel === ".git"
    || rel.startsWith(".git/")
    || rel === "node_modules"
    || rel.startsWith("node_modules/")
    || rel === "dist"
    || rel.startsWith("dist/")
    || rel === "logs"
    || rel.startsWith("logs/")
    || rel === "reports"
    || rel.startsWith("reports/")
    || rel === ".base44-publish-profile"
    || rel.startsWith(".base44-publish-profile/")
    || rel === "tools/browser-audit/reports"
    || rel.startsWith("tools/browser-audit/reports/");
}

function getFiles(root) {
  return walkFiles(root)
    .map((file) => normalizeRel(relative(root, file)))
    .filter((rel) => !shouldIgnoreRepoFile(rel))
    .sort();
}

function classifyDonorOnly({ repoRoot, donorPath }) {
  const donorFiles = getFiles(donorPath);
  const productionFiles = new Set(getFiles(repoRoot));
  const donorOnly = donorFiles.filter((rel) => !productionFiles.has(rel));
  const ignoredLocalIdentity = donorOnly.filter((rel) => LOCAL_IDENTITY_FILES.has(rel));
  const relevantDonorOnly = donorOnly.filter((rel) => !LOCAL_IDENTITY_FILES.has(rel));
  const unexpected = relevantDonorOnly.filter((rel) => !EXPECTED_DONOR_ONLY.has(rel));
  const missingExpected = [...EXPECTED_DONOR_ONLY].filter((rel) => !relevantDonorOnly.includes(rel));

  return {
    donor_file_count: donorFiles.length,
    production_file_count: productionFiles.size,
    donor_only_count: donorOnly.length,
    ignored_local_identity: ignoredLocalIdentity,
    expected_remaining: relevantDonorOnly.filter((rel) => EXPECTED_DONOR_ONLY.has(rel)),
    unexpected,
    missing_expected: missingExpected,
  };
}

function auditRuntimeAppIds(repoRoot) {
  const files = getFiles(repoRoot)
    .filter((rel) => RUNTIME_APP_ID_SCAN_PREFIXES.some((prefix) => rel.startsWith(prefix)));
  const donorLeaks = [];
  const productionMentions = [];

  for (const rel of files) {
    const text = readFileSync(join(repoRoot, ...rel.split("/")), "utf8");
    if (text.includes(DONOR_APP_ID) && !DONOR_ID_ALLOWED_PREFIXES.some((prefix) => rel === prefix || rel.startsWith(prefix))) {
      donorLeaks.push(rel);
    }
    if (text.includes(PRODUCTION_APP_ID)) {
      productionMentions.push(rel);
    }
  }

  return {
    donor_app_id_runtime_leaks: donorLeaks,
    production_app_id_mentions: productionMentions.length,
  };
}

function format(report) {
  const lines = [
    "Base44 Donor Merge Audit",
    `Donor path: ${report.donor_path}`,
    `Donor files: ${report.donor.donor_file_count}`,
    `Production files: ${report.donor.production_file_count}`,
    `Donor-only files: ${report.donor.donor_only_count}`,
    `Ignored local identity files: ${report.donor.ignored_local_identity.length}`,
    `Expected remaining donor-only files: ${report.donor.expected_remaining.length}`,
    `Unexpected donor-only files: ${report.donor.unexpected.length}`,
    `Missing expected remaining files: ${report.donor.missing_expected.length}`,
    `Donor app ID runtime leaks: ${report.app_ids.donor_app_id_runtime_leaks.length}`,
    `Overall: ${report.ok ? "OK" : "ATTENTION"}`,
  ];

  if (report.donor.unexpected.length) {
    lines.push("", "Unexpected donor-only files:");
    for (const rel of report.donor.unexpected) lines.push(`- ${rel}`);
  }

  if (report.app_ids.donor_app_id_runtime_leaks.length) {
    lines.push("", "Donor app ID runtime leaks:");
    for (const rel of report.app_ids.donor_app_id_runtime_leaks) lines.push(`- ${rel}`);
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(".");
  const donorPath = resolve(args.donorPath);

  if (!existsSync(donorPath)) {
    console.error(`Donor path does not exist: ${donorPath}`);
    process.exit(1);
  }

  const report = {
    checked_at: new Date().toISOString(),
    repo_root: repoRoot,
    donor_path: donorPath,
    donor: classifyDonorOnly({ repoRoot, donorPath }),
    app_ids: auditRuntimeAppIds(repoRoot),
  };
  report.ok = report.donor.unexpected.length === 0
    && report.donor.missing_expected.length === 0
    && report.app_ids.donor_app_id_runtime_leaks.length === 0;

  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(format(report));
  process.exitCode = report.ok ? 0 : 1;
}

main();
