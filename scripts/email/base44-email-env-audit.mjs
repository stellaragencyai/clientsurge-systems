import { mkdir, readFile, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";

const REPORT_PATH = path.resolve("reports/base44-email-env-audit.md");
const ENV_EXAMPLE_PATH = path.resolve(".env.example");
const ENV_LOCAL_PATH = path.resolve(".env.local");

const VARIABLES = [
  { name: "RESEND_API_KEY", class: "REQUIRED_FOR_TRANSACTIONAL_EMAIL / REQUIRED_FOR_CAMPAIGNS", secret: true },
  { name: "RESEND_FROM_EMAIL", class: "REQUIRED_FOR_TRANSACTIONAL_EMAIL", secret: false },
  { name: "RESEND_FROM_LEADS", class: "REQUIRED_FOR_TRANSACTIONAL_EMAIL / REQUIRED_FOR_CAMPAIGNS", secret: false },
  { name: "RESEND_REPLY_TO_LEADS", class: "REQUIRED_FOR_TRANSACTIONAL_EMAIL / REQUIRED_FOR_CAMPAIGNS", secret: false },
  { name: "ADMIN_NOTIFICATION_EMAIL", class: "REQUIRED_FOR_TRANSACTIONAL_EMAIL", secret: false },
  { name: "ADMIN_EMAIL", class: "OWNER_CONFIRMATION_REQUIRED", secret: false },
  { name: "SUPPORT_EMAIL", class: "REQUIRED_FOR_TRANSACTIONAL_EMAIL", secret: false },
  { name: "SYSTEM_EMAIL", class: "REQUIRED_FOR_TRANSACTIONAL_EMAIL", secret: false },
  { name: "BILLING_EMAIL", class: "REQUIRED_FOR_TRANSACTIONAL_EMAIL", secret: false },
  { name: "ONBOARDING_EMAIL", class: "REQUIRED_FOR_TRANSACTIONAL_EMAIL", secret: false },
  { name: "TEST_EMAIL_RECIPIENT", class: "TEST_ONLY", secret: false },
  { name: "EMAIL_TEST_MODE", class: "TEST_ONLY", secret: false },
  { name: "EMAIL_CAMPAIGN_ENABLED", class: "REQUIRED_FOR_CAMPAIGNS", secret: false },
  { name: "EMAIL_DELIVERABILITY_PROOF_STATUS", class: "REQUIRED_FOR_CAMPAIGNS / OWNER_CONFIRMATION_REQUIRED", secret: false },
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function extractCodeUsage(root = "base44/functions") {
  const usage = new Map();
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (/\.(js|ts|mjs)$/.test(entry.name)) files.push(fullPath);
    }
  }
  walk(root);
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const variable of VARIABLES) {
      if (source.includes(variable.name)) {
        if (!usage.has(variable.name)) usage.set(variable.name, []);
        usage.get(variable.name).push(file.replace(/\\/g, "/"));
      }
    }
  }
  return usage;
}

function isEmail(value) {
  return /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(String(value || "").trim());
}

function assess(variable, values, usage) {
  const examplePresent = Object.prototype.hasOwnProperty.call(values.example, variable.name);
  const localPresent = Object.prototype.hasOwnProperty.call(values.local, variable.name) && Boolean(values.local[variable.name]);
  const processPresent = Boolean(process.env[variable.name]);
  const configuredSomewhere = localPresent || processPresent;
  const findings = [];

  if (!examplePresent) findings.push("Missing from .env.example");
  if (variable.class.includes("REQUIRED") && !configuredSomewhere) {
    findings.push("Not present in local/process env; Base44 production presence must be verified");
  }
  if (variable.name.startsWith("RESEND_FROM") || variable.name.endsWith("_EMAIL") || variable.name.includes("REPLY_TO")) {
    const sample = values.local[variable.name] || values.example[variable.name] || "";
    if (sample && !isEmail(sample)) findings.push("Configured value does not look like a single email address");
    if (sample && !sample.endsWith("@clientsurgesystems.com")) findings.push("Configured/default address is outside clientsurgesystems.com");
  }
  if (variable.name === "EMAIL_CAMPAIGN_ENABLED" && values.example[variable.name] !== "false") {
    findings.push("Example should default campaigns to false");
  }
  if (variable.name === "EMAIL_DELIVERABILITY_PROOF_STATUS" && values.example[variable.name] === "verified") {
    findings.push("Example must not default proof status to verified");
  }

  return {
    variable: variable.name,
    classification: variable.class,
    secret: variable.secret,
    example_present: examplePresent,
    local_present: localPresent,
    process_present: processPresent,
    configured_somewhere: configuredSomewhere,
    code_usage_count: (usage.get(variable.name) || []).length,
    sample_files: (usage.get(variable.name) || []).slice(0, 5),
    findings,
    status: findings.length ? "WARNING" : "PASS",
  };
}

async function main() {
  const values = {
    example: parseEnvFile(ENV_EXAMPLE_PATH),
    local: parseEnvFile(ENV_LOCAL_PATH),
  };
  const usage = extractCodeUsage();
  const rows = VARIABLES.map((variable) => assess(variable, values, usage));
  const missingProductionProof = rows
    .filter((row) => row.classification.includes("REQUIRED") && !row.configured_somewhere)
    .map((row) => row.variable);
  const warnings = rows.filter((row) => row.status !== "PASS");
  const now = new Date().toISOString();

  const lines = [
    "# Base44 Email Environment Audit",
    "",
    `Generated: ${now}`,
    "",
    "Secrets redacted: yes. This report only records presence/absence and safe defaults.",
    "",
    "## Summary",
    "",
    `- .env.example present: ${fs.existsSync(ENV_EXAMPLE_PATH) ? "yes" : "no"}`,
    `- .env.local present: ${fs.existsSync(ENV_LOCAL_PATH) ? "yes" : "no"}`,
    `- Required variables missing from local/process env: ${missingProductionProof.length ? missingProductionProof.join(", ") : "none"}`,
    `- Warnings: ${warnings.length}`,
    "",
    "## Variable Audit",
    "",
    "| Variable | Classification | Example | Local | Process | Code Usage | Status | Findings |",
    "|---|---|---:|---:|---:|---:|---|---|",
    ...rows.map((row) =>
      `| \`${row.variable}\` | ${row.classification} | ${row.example_present ? "yes" : "no"} | ${row.local_present ? "yes" : "no"} | ${row.process_present ? "yes" : "no"} | ${row.code_usage_count} | ${row.status} | ${row.findings.join("; ") || "none"} |`
    ),
    "",
    "## Code Usage Samples",
    "",
    ...rows.flatMap((row) => [
      `### ${row.variable}`,
      "",
      row.sample_files.length ? row.sample_files.map((file) => `- \`${file}\``).join("\n") : "- No direct source usage found.",
      "",
    ]),
    "## Production Readiness Notes",
    "",
    "- Base44 production env cannot be inspected from local repo-only access.",
    "- `RESEND_API_KEY` is absent locally, so provider API verification remains blocked.",
    "- Campaign sends must remain disabled until `EMAIL_DELIVERABILITY_PROOF_STATUS` is set to a verified value after proof.",
  ];

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
  console.log(`Base44 email env audit: ${REPORT_PATH}`);
  if (warnings.some((row) => row.findings.some((finding) => finding.startsWith("Missing from .env.example")))) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`[base44-email-env-audit] Failed: ${error.message}`);
  process.exitCode = 1;
});
