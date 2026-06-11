import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const CLIENTSURGE_DOMAIN = "clientsurgesystems.com";
const PROOF_PATH = path.resolve("artifacts/email/email-test-proof.json");
const VALIDATION_REPORT_PATH = path.resolve("reports/email-flow-validation.json");
const REQUIRED_ENV = [
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
];

function getEnv(name) {
  return String(process.env[name] || "").trim();
}

function extractEmail(value) {
  const match = String(value || "").match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

function isSingleEmail(value) {
  return /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(value);
}

function isClientSurgeEmail(value) {
  return extractEmail(value).endsWith(`@${CLIENTSURGE_DOMAIN}`);
}

function fail(message, details = []) {
  console.error(`[email-safe-test] Refusing to run: ${message}`);
  for (const detail of details) console.error(`[email-safe-test] - ${detail}`);
  process.exitCode = 2;
}

function assertSafeEnvironment() {
  const testRecipient = getEnv("TEST_EMAIL_RECIPIENT");
  if (!testRecipient) {
    fail("TEST_EMAIL_RECIPIENT is required.");
    return null;
  }
  if (!isSingleEmail(testRecipient)) {
    fail("TEST_EMAIL_RECIPIENT must be exactly one email address.");
    return null;
  }
  if (getEnv("EMAIL_TEST_MODE").toLowerCase() !== "true") {
    fail("EMAIL_TEST_MODE must be true for safe email tests.");
    return null;
  }

  const missing = REQUIRED_ENV.filter((name) => !getEnv(name));
  if (missing.length > 0) {
    fail("required email environment variables are missing.", missing);
    return null;
  }

  const domainChecked = [
    "RESEND_FROM_LEADS",
    "RESEND_REPLY_TO_LEADS",
    "ADMIN_NOTIFICATION_EMAIL",
    "SUPPORT_EMAIL",
    "SYSTEM_EMAIL",
    "BILLING_EMAIL",
    "ONBOARDING_EMAIL",
  ];
  const wrongDomain = domainChecked.filter((name) => !isClientSurgeEmail(getEnv(name)));
  if (wrongDomain.length > 0) {
    fail("sender, reply-to, and routing addresses must use clientsurgesystems.com.", wrongDomain);
    return null;
  }

  return {
    testRecipient,
    resendKey: getEnv("RESEND_API_KEY"),
    fromLeads: getEnv("RESEND_FROM_LEADS"),
    replyToLeads: getEnv("RESEND_REPLY_TO_LEADS"),
    adminNotificationEmail: getEnv("ADMIN_NOTIFICATION_EMAIL"),
    supportEmail: getEnv("SUPPORT_EMAIL"),
    systemEmail: getEnv("SYSTEM_EMAIL"),
    billingEmail: getEnv("BILLING_EMAIL"),
    onboardingEmail: getEnv("ONBOARDING_EMAIL"),
  };
}

function formatFrom(email) {
  return `ClientSurge Systems <${email}>`;
}

function maskEmail(email) {
  const [localPart, domain] = String(email || "").split("@");
  if (!localPart || !domain) return "invalid";
  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, localPart.length - 2))}@${domain}`;
}

function buildMessages(env) {
  const fakeLead = {
    name: "Test Lead",
    business: "ClientSurge QA Roofing",
    email: "qa-lead@example.test",
    phone: "555-0100",
    website: "https://example.test",
    industry: "roofing",
    sourcePage: "/roofing?test=true",
  };

  return [
    {
      path: "contact_submission_customer_confirmation",
      validation: "contact submission",
      from: formatFrom(env.fromLeads),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] Contact submission confirmation - fake roofing audit",
      text: `Fake prospect confirmation for ${fakeLead.business}. No real lead data is used.`,
    },
    {
      path: "contact_submission_admin_notification",
      validation: "admin notification",
      from: formatFrom(env.systemEmail),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] Admin contact notification - fake website lead",
      text: [
        "Fake internal alert only.",
        `Name: ${fakeLead.name}`,
        `Email: ${fakeLead.email}`,
        `Phone: ${fakeLead.phone}`,
        `Website: ${fakeLead.website}`,
        `Industry: ${fakeLead.industry}`,
        `Source Page: ${fakeLead.sourcePage}`,
        `Production admin route would be: ${env.adminNotificationEmail}`,
      ].join("\n"),
    },
    {
      path: "audit_booking_confirmation",
      validation: "booking confirmation",
      from: formatFrom(env.fromLeads),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] Audit booking confirmation - fake appointment",
      text: "Fake audit booking confirmation. No calendar invite or real lead is used.",
    },
    {
      path: "audit_booking_prep_email",
      validation: "customer notification",
      from: formatFrom(env.systemEmail),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] Audit booking prep - fake appointment",
      text: "Fake audit prep email. Bring a booking link, monthly lead count, and the bottleneck to fix first.",
    },
    {
      path: "customer_status_notification",
      validation: "customer notification",
      from: formatFrom(env.supportEmail),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] Customer notification - fake status update",
      text: "Fake customer status notification proving support@clientsurgesystems.com routing behavior.",
    },
    {
      path: "system_backend_alert",
      validation: "admin notification",
      from: formatFrom(env.systemEmail),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] System alert - fake backend notification",
      text: "Fake backend alert proving system@clientsurgesystems.com sender behavior.",
    },
  ];
}

function summarizeValidation({ env, dryRun, messages, results, warnings }) {
  const resultByPath = new Map(results.map((item) => [item.path, item]));
  const validations = messages.map((message) => {
    const result = resultByPath.get(message.path);
    return {
      validation: message.validation,
      path: message.path,
      subject: message.subject,
      from_domain: extractEmail(message.from).split("@")[1] || "",
      reply_to_domain: extractEmail(message.reply_to).split("@")[1] || "",
      recipient: dryRun ? "masked_test_recipient" : maskEmail(message.to),
      protected_by_test_mode: true,
      provider_status: dryRun ? "not_sent_dry_run" : result?.status || "missing",
      provider_response_id_present: Boolean(result?.id),
      result: dryRun ? "planned" : result?.ok ? "pass" : "fail",
    };
  });

  const liveOk = !dryRun && results.length === messages.length && results.every((item) => item.ok);
  return {
    timestamp: new Date().toISOString(),
    safe_mode: getEnv("EMAIL_TEST_MODE").toLowerCase() === "true",
    dry_run: Boolean(dryRun),
    test_recipient_masked: maskEmail(env.testRecipient),
    validations,
    result: dryRun ? "planned" : liveOk ? "pass" : "fail",
    warnings,
    evidence_files: {
      safe_test_proof: PROOF_PATH,
      validation_report: VALIDATION_REPORT_PATH,
    },
    next_manual_steps: [
      "Run without --dry-run only after TEST_EMAIL_RECIPIENT, EMAIL_TEST_MODE=true, and Resend credentials are loaded locally.",
      "Confirm every provider response ID appears in the Resend dashboard.",
      "Confirm the test inbox received every [TEST] message.",
      "Keep EMAIL_CAMPAIGN_ENABLED=false until provider API verification, DKIM proof, unsubscribe proof, and suppression proof are complete.",
    ],
  };
}

async function writeProof({ env, dryRun, messages, results, warnings = [] }) {
  const ok = dryRun ? true : results.every((item) => item.ok);
  const proof = {
    timestamp: new Date().toISOString(),
    dry_run: Boolean(dryRun),
    test_recipient_masked: maskEmail(env.testRecipient),
    templates_tested: messages.map((message) => ({
      path: message.path,
      subject: message.subject,
      from_domain: extractEmail(message.from).split("@")[1] || "",
      reply_to_domain: extractEmail(message.reply_to).split("@")[1] || "",
    })),
    provider_response_ids: results
      .filter((item) => item.id)
      .map((item) => ({ path: item.path, id: item.id })),
    result: ok ? "pass" : "fail",
    warnings,
    next_manual_steps: [
      "Confirm every provider response ID appears in the Resend dashboard.",
      "Confirm the test inbox received every [TEST] message.",
      "Confirm Base44 production env vars match the documented sender map.",
      "Keep EMAIL_CAMPAIGN_ENABLED=false until DNS, provider, unsubscribe, and suppression proof are complete.",
    ],
  };

  await mkdir(path.dirname(PROOF_PATH), { recursive: true });
  await mkdir(path.dirname(VALIDATION_REPORT_PATH), { recursive: true });
  await writeFile(PROOF_PATH, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  await writeFile(
    VALIDATION_REPORT_PATH,
    `${JSON.stringify(summarizeValidation({ env, dryRun, messages, results, warnings }), null, 2)}\n`,
    "utf8"
  );
  return proof;
}

async function sendMessage(env, message) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: message.from,
      reply_to: message.reply_to,
      to: message.to,
      subject: message.subject,
      text: message.text,
      tags: [{ name: "client_surge_safe_test", value: message.path }],
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { path: message.path, ok: false, status: response.status, id: null };
  return { path: message.path, ok: true, status: response.status, id: body.id || null };
}

async function main() {
  const env = assertSafeEnvironment();
  if (!env) return;

  const messages = buildMessages(env);
  if (!messages.every((message) => message.subject.startsWith("[TEST]"))) {
    fail("all safe-test subjects must start with [TEST].");
    return;
  }

  if (process.argv.includes("--dry-run")) {
    const proof = await writeProof({
      env,
      dryRun: true,
      messages,
      results: [],
      warnings: ["Dry run only. No provider delivery proof exists until the harness sends live safe-test messages."],
    });
    console.log(JSON.stringify({
      ok: true,
      dry_run: true,
      planned_messages: messages.map((message) => ({ path: message.path, subject: message.subject })),
      proof_artifact: PROOF_PATH,
      validation_report: VALIDATION_REPORT_PATH,
      proof_result: proof.result,
    }, null, 2));
    return;
  }

  const results = [];
  for (const message of messages) results.push(await sendMessage(env, message));
  const proof = await writeProof({ env, dryRun: false, messages, results });
  console.log(JSON.stringify({
    ok: results.every((item) => item.ok),
    results,
    proof_artifact: PROOF_PATH,
    validation_report: VALIDATION_REPORT_PATH,
    proof_result: proof.result,
  }, null, 2));
  if (!results.every((item) => item.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[email-safe-test] Failed: ${error.message}`);
  process.exitCode = 1;
});
