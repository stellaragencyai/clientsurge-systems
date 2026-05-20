#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import process from "node:process";

const repoRoot = process.cwd();
const asJson = process.argv.includes("--json");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
    ...options,
  });

  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function trimForReport(text) {
  return String(text || "").trim().split(/\r?\n/).slice(-10).join("\n");
}

function parseLastJsonObject(output) {
  const trimmed = String(output || "").trim();
  const lines = trimmed.split(/\r?\n/).filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = lines.slice(index).join("\n");
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep looking for the JSON block because CLIs may print update notices.
    }
  }

  throw new Error("No JSON object found in command output.");
}

function buildSmokeScript() {
  return `
const suffix = Date.now();
const qaEmail = \`handoff-smoke-\${suffix}@clientsurge.test\`;
const qaOrder = await base44.entities.Order.create({
  customer_email: qaEmail,
  customer_name: "ClientSurge Smoke QA",
  customer_phone: "+16025550123",
  business_name: "ClientSurge Smoke QA",
  payment_status: "pending",
  order_status: "pending_payment",
  total_setup: 999,
  total_monthly: 299,
  notes: "OpenClaw non-customer smoke test order. Safe to archive.",
  items: [
    { product_id: "prod_UNi5RHiKNSTfQl", product_name: "Instant Lead Response", status: "pending" },
    { product_id: "prod_UNi5QL0bQl98If", product_name: "Missed Call Text-Back", status: "pending" },
    { product_id: "prod_UNi5N0l5MtaV0R", product_name: "14-Day Nurture Sequence", status: "pending" },
    { product_id: "prod_UNi5fLL2SyJJdP", product_name: "AI Booking Agent", status: "pending" },
    { product_id: "prod_UNi5PWv05ECzXI", product_name: "Old Lead Reactivation", status: "pending" },
    { product_id: "prod_UNi5dvOUm6Fi9i", product_name: "Review Request Automation", status: "pending" }
  ]
});
const response = await base44.functions.invoke("installPipeline", {
  action: "initialize",
  order_id: qaOrder.id
});
const data = response?.data || response || {};
const order = data.order || {};
const onboardingClient = data.onboarding_client || {};
const handoff = data.handoff || order.purchase_onboarding_handoff || {};
const checks = [
  ["function_success", data.success === true],
  ["detected_pro_package", order.activation_package_tier === "pro"],
  ["stored_package_key", order.activation_package_key === "pro_website_plus_six_automations"],
  ["linked_onboarding_client", Boolean(order.onboarding_client_id || onboardingClient.id)],
  ["handoff_has_all_services", Array.isArray(handoff.service_keys) && handoff.service_keys.length === 6],
  ["first_question_present", handoff.next_question === "What are the client's normal business hours?"],
  ["missing_fields_present", Array.isArray(handoff.missing_intake_fields) && handoff.missing_intake_fields.includes("business_hours")],
];
console.log(JSON.stringify({
  generated_at: new Date().toISOString(),
  suite: "purchase_to_onboarding_handoff_smoke",
  order_id: qaOrder.id,
  onboarding_client_id: order.onboarding_client_id || onboardingClient.id || null,
  package_tier: order.activation_package_tier || null,
  package_key: order.activation_package_key || null,
  next_question: handoff.next_question || null,
  missing_fields: handoff.missing_intake_fields || [],
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.every(([, passed]) => passed),
}, null, 2));
`;
}

const result = run("base44", ["exec"], {
  input: buildSmokeScript(),
});

let summary;
try {
  if (!result.ok) {
    summary = {
      generated_at: new Date().toISOString(),
      suite: "purchase_to_onboarding_handoff_smoke",
      passed: false,
      failure: "base44 exec failed",
      detail: trimForReport(result.stderr || result.stdout),
      checks: [],
    };
  } else {
    summary = parseLastJsonObject(result.stdout);
  }
} catch (error) {
  summary = {
    generated_at: new Date().toISOString(),
    suite: "purchase_to_onboarding_handoff_smoke",
    passed: false,
    failure: error.message,
    detail: trimForReport(result.stdout || result.stderr),
    checks: [],
  };
}

if (asJson) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  process.stdout.write("ClientSurge Purchase-To-Onboarding Smoke Test\n");
  process.stdout.write(`Generated: ${summary.generated_at}\n`);
  process.stdout.write(`Status: ${summary.passed ? "PASS" : "FAIL"}\n`);
  if (summary.order_id) process.stdout.write(`QA Order: ${summary.order_id}\n`);
  if (summary.onboarding_client_id) process.stdout.write(`QA Onboarding Client: ${summary.onboarding_client_id}\n`);
  if (summary.package_tier) process.stdout.write(`Detected Package: ${summary.package_tier}\n`);
  if (summary.next_question) process.stdout.write(`Next Question: ${summary.next_question}\n`);
  if (summary.failure) process.stdout.write(`Failure: ${summary.failure}\n${summary.detail || ""}\n`);
  process.stdout.write("\n");

  for (const check of summary.checks || []) {
    process.stdout.write(`- ${check.passed ? "PASS" : "FAIL"} ${check.name}\n`);
  }
}

process.exit(summary.passed ? 0 : 1);
