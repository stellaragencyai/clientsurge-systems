const RESEND_ENDPOINT = "https://api.resend.com/emails";
const CLIENTSURGE_DOMAIN = "clientsurgesystems.com";
const REQUIRED_ENV = [
  "TEST_EMAIL_RECIPIENT",
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
      path: "website_form_confirmation",
      from: formatFrom(env.fromLeads),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] Website form confirmation - fake roofing audit",
      text: `Fake prospect confirmation for ${fakeLead.business}. No real lead data is used.`,
    },
    {
      path: "admin_lead_alert",
      from: formatFrom(env.systemEmail),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] Internal lead alert - fake website lead",
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
      from: formatFrom(env.fromLeads),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] Audit booking confirmation - fake appointment",
      text: "Fake audit booking confirmation. No calendar invite or real lead is used.",
    },
    {
      path: "system_backend_alert",
      from: formatFrom(env.systemEmail),
      reply_to: env.replyToLeads,
      to: env.testRecipient,
      subject: "[TEST] System alert - fake backend notification",
      text: "Fake backend alert proving system@clientsurgesystems.com sender behavior.",
    },
  ];
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
    console.log(JSON.stringify({
      ok: true,
      dry_run: true,
      planned_messages: messages.map((message) => ({ path: message.path, subject: message.subject })),
    }, null, 2));
    return;
  }

  const results = [];
  for (const message of messages) results.push(await sendMessage(env, message));
  console.log(JSON.stringify({ ok: results.every((item) => item.ok), results }, null, 2));
  if (!results.every((item) => item.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[email-safe-test] Failed: ${error.message}`);
  process.exitCode = 1;
});
