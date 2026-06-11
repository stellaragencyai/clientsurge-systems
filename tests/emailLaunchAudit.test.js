import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";

const read = (filePath) => fs.readFileSync(filePath, "utf8");

test("website lead confirmations use business-domain support sender and sales reply-to", () => {
  const source = read("base44/functions/sendWebsiteLeadResponse/entry.ts");
  assert.match(source, /RESEND_FROM_LEADS/);
  assert.match(source, /support@clientsurgesystems\.com/);
  assert.match(source, /reply_to:\s*replyToEmail/);
  assert.match(source, /RESEND_REPLY_TO_LEADS/);
  assert.match(source, /nolan@clientsurgesystems\.com/);
});

test("website lead confirmations include roofing, HVAC, and dental variants", () => {
  const source = read("base44/functions/sendWebsiteLeadResponse/entry.ts");
  assert.match(source, /Your roofing automation audit request is in/);
  assert.match(source, /Your HVAC automation audit request is in/);
  assert.match(source, /Your dental automation audit request is in/);
});

test("safe test email harness refuses unsafe or incomplete launch env", () => {
  const source = read("scripts/email/safe-email-test-harness.mjs");
  for (const variable of [
    "TEST_EMAIL_RECIPIENT",
    "EMAIL_TEST_MODE",
    "RESEND_API_KEY",
    "RESEND_FROM_LEADS",
    "RESEND_REPLY_TO_LEADS",
    "ADMIN_NOTIFICATION_EMAIL",
    "SUPPORT_EMAIL",
    "SYSTEM_EMAIL",
    "BILLING_EMAIL",
    "ONBOARDING_EMAIL",
  ]) {
    assert.match(source, new RegExp(variable));
  }
  assert.match(source, /\[TEST\]/);
  assert.match(source, /example\.test/);
  assert.match(source, /artifacts\/email\/email-test-proof\.json/);
  assert.match(source, /audit_booking_prep_email/);
  assert.match(source, /Refusing to run/);
  assert.doesNotMatch(source, /entities\.Leads/);
  assert.doesNotMatch(source, /EmailCampaignRecipient/);
});

test("safe test harness refuses to run without TEST_EMAIL_RECIPIENT", () => {
  const result = spawnSync(process.execPath, ["scripts/email/safe-email-test-harness.mjs", "--dry-run"], {
    cwd: process.cwd(),
    env: { ...process.env, TEST_EMAIL_RECIPIENT: "", RESEND_API_KEY: "" },
    encoding: "utf8",
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /TEST_EMAIL_RECIPIENT is required/);
});

test("safe test harness requires explicit safe test mode", () => {
  const result = spawnSync(process.execPath, ["scripts/email/safe-email-test-harness.mjs", "--dry-run"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TEST_EMAIL_RECIPIENT: "qa@example.test",
      EMAIL_TEST_MODE: "false",
      RESEND_API_KEY: "test_key",
      RESEND_FROM_LEADS: "support@clientsurgesystems.com",
      RESEND_REPLY_TO_LEADS: "nolan@clientsurgesystems.com",
      ADMIN_NOTIFICATION_EMAIL: "system@clientsurgesystems.com",
      SUPPORT_EMAIL: "support@clientsurgesystems.com",
      SYSTEM_EMAIL: "system@clientsurgesystems.com",
      BILLING_EMAIL: "billing@clientsurgesystems.com",
      ONBOARDING_EMAIL: "onboarding@clientsurgesystems.com",
    },
    encoding: "utf8",
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /EMAIL_TEST_MODE must be true/);
});

test("direct email send uses ClientSurge sender and fails closed without proof", () => {
  const source = read("base44/functions/sendEmail/entry.ts");
  assert.doesNotMatch(source, /noreply@apexflow\.com/);
  assert.match(source, /EMAIL_DELIVERABILITY_PROOF_STATUS/);
  assert.match(source, /TEST_EMAIL_RECIPIENT/);
  assert.match(source, /Direct email sending is blocked until deliverability proof is complete/);
});

test("DNS email readiness scanner covers MX, SPF, DKIM, DMARC, and Resend verification", () => {
  const source = read("scripts/email/dns-email-readiness.mjs");
  assert.match(source, /resolveMx/);
  assert.match(source, /v=spf1/);
  assert.match(source, /_dmarc/);
  assert.match(source, /`\$\{selector\}\._domainkey\.\$\{(?:DOMAIN|domain)\}`/);
  assert.match(source, /resend\._domainkey/);
  assert.match(source, /_resend/);
  assert.match(source, /artifacts\/email\/dns-email-readiness\.json/);
  assert.match(source, /OWNER_CONFIRMATION_REQUIRED_RESEND_SELECTOR/);
});

test("active email code and scripts do not contain hardcoded Resend API keys", () => {
  const roots = ["base44/functions", "src", "scripts", "tests"];
  const secretPattern = /re_[A-Za-z0-9]{20,}/;

  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return fullPath;
    });
  }

  for (const file of roots.flatMap(walk)) {
    const ext = path.extname(file);
    if (![".js", ".jsx", ".ts", ".tsx", ".mjs"].includes(ext)) continue;
    assert.doesNotMatch(read(file), secretPattern, file);
  }
});

test("email success and failure logs avoid direct recipient PII", () => {
  const websiteLead = read("base44/functions/sendWebsiteLeadResponse/entry.ts");
  const orderEmail = read("base44/functions/sendOrderConfirmationEmail/entry.ts");
  const orderFailureLog = orderEmail.match(/console\.error\("\[sendOrderConfirmationEmail\][\s\S]*?\}\);/)?.[0] || "";

  assert.doesNotMatch(websiteLead, /SMS sent to \$\{lead\.id\}: \$\{lead\.phone_number\}/);
  assert.doesNotMatch(websiteLead, /Email sent to \$\{lead\.id\}: \$\{lead\.email\}/);
  assert.doesNotMatch(orderFailureLog, /to:\s*customerEmail/);
  assert.doesNotMatch(orderFailureLog, /body,\s*\n\s*from/);
});
