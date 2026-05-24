#!/usr/bin/env node

const checks = [
  {
    id: "152 / PL-98",
    label: "healthCheck endpoint ready for external monitoring",
    env: ["CLIENTSURGE_HEALTHCHECK_URL"],
    hint: "Set CLIENTSURGE_HEALTHCHECK_URL to the deployed healthCheck function URL, then register that URL in UptimeRobot or Better Stack.",
  },
  {
    id: "201 / PL-8 / PL-21",
    label: "Stripe live API keys available",
    env: ["STRIPE_LIVE_SECRET_KEY", "STRIPE_LIVE_PUBLISHABLE_KEY"],
    validators: {
      STRIPE_LIVE_SECRET_KEY: (value) => value.startsWith("sk_live_"),
      STRIPE_LIVE_PUBLISHABLE_KEY: (value) => value.startsWith("pk_live_"),
    },
    hint: "Use live Stripe keys from the Stripe Dashboard. Do not paste secret values into source files.",
  },
  {
    id: "202 / PL-59",
    label: "Stripe production webhook ready",
    env: ["STRIPE_WEBHOOK_PROOF_URL", "STRIPE_WEBHOOK_SECRET"],
    validators: {
      STRIPE_WEBHOOK_PROOF_URL: (value) => /^https:\/\/.+/i.test(value),
      STRIPE_WEBHOOK_SECRET: (value) => value.startsWith("whsec_"),
    },
    hint: "Set the deployed Stripe webhook URL and live webhook signing secret before running scripts/stripe/stripe-webhook-proof.mjs.",
  },
  {
    id: "203 / 249",
    label: "live purchase E2E inputs available",
    env: ["CLIENTSURGE_LIVE_PURCHASE_URL", "CLIENTSURGE_LIVE_TEST_EMAIL"],
    validators: {
      CLIENTSURGE_LIVE_PURCHASE_URL: (value) => /^https:\/\/.+/i.test(value),
      CLIENTSURGE_LIVE_TEST_EMAIL: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    },
    hint: "Run only with explicit permission to create a real Stripe transaction on the production domain.",
  },
  {
    id: "206",
    label: "paid Stripe customer available for billing portal verification",
    env: ["CLIENTSURGE_PAID_CUSTOMER_EMAIL"],
    validators: {
      CLIENTSURGE_PAID_CUSTOMER_EMAIL: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    },
    hint: "Use a real paid customer's email/order context to verify getStripeCustomerPortalUrl.",
  },
  {
    id: "219",
    label: "staging lead endpoint available for load test",
    env: ["CLIENTSURGE_LEAD_TEST_URL"],
    validators: {
      CLIENTSURGE_LEAD_TEST_URL: (value) => /^https?:\/\/(localhost|127\.0\.0\.1|.*\.test|.*\.local|.*staging.*)/i.test(value),
    },
    hint: "Then run npm run load-test:leads. The harness intentionally refuses production-looking URLs.",
  },
  {
    id: "245 / AC-3 / AC-4 / AC-15",
    label: "Twilio live SMS/voice test inputs available",
    env: [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_PHONE_NUMBER",
      "CLIENTSURGE_TWILIO_TEST_RECIPIENT",
      "CLIENTSURGE_TWILIO_REGISTRATION_VERIFIED",
    ],
    validators: {
      TWILIO_ACCOUNT_SID: (value) => value.startsWith("AC"),
      TWILIO_PHONE_NUMBER: (value) => /^\+\d{8,15}$/.test(value),
      CLIENTSURGE_TWILIO_TEST_RECIPIENT: (value) => /^\+\d{8,15}$/.test(value),
      CLIENTSURGE_TWILIO_REGISTRATION_VERIFIED: (value) => value === "true",
    },
    hint: "Requires consent, permission to send real SMS/call traffic, and Twilio toll-free/A2P registration verification with no 30032/30034 blocks.",
  },
  {
    id: "AC-5",
    label: "Resend live delivery and webhook proof available",
    env: ["CLIENTSURGE_RESEND_WEBHOOK_DEPLOYED", "CLIENTSURGE_RESEND_LOG_ACCESS_CONFIRMED"],
    validators: {
      CLIENTSURGE_RESEND_WEBHOOK_DEPLOYED: (value) => value === "true",
      CLIENTSURGE_RESEND_LOG_ACCESS_CONFIRMED: (value) => value === "true",
    },
    hint: "Production Base44 can send via a verified ClientSurge sender; webhook proof still requires deployed receiveResendWebhook and Resend log/dashboard confirmation.",
  },
  {
    id: "PL-97",
    label: "production APP_URL known",
    env: ["APP_URL"],
    validators: {
      APP_URL: (value) => /^https:\/\/(www\.)?clientsurgesystems\.com\/?$/i.test(value),
    },
    hint: "Verify the same value exists in the deployed Base44 production environment.",
  },
  {
    id: "AC-29",
    label: "high-volume SMS simulation explicitly authorized",
    env: ["CLIENTSURGE_SMS_VOLUME_TEST_AUTHORIZED"],
    validators: {
      CLIENTSURGE_SMS_VOLUME_TEST_AUTHORIZED: (value) => value === "true",
    },
    hint: "Set only after Twilio/staging owners approve a 1000-reply/minute simulation.",
  },
];

async function verifyHealthUrl(url) {
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, status: error.name === "AbortError" ? "timeout" : "error" };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];

for (const check of checks) {
  const missing = [];
  const invalid = [];
  const present = [];

  for (const name of check.env) {
    const value = process.env[name] || "";
    if (!value) {
      missing.push(name);
      continue;
    }

    const validator = check.validators?.[name];
    if (validator && !validator(value)) {
      invalid.push(name);
      continue;
    }

    present.push({ name, present: true });
  }

  const result = {
    id: check.id,
    label: check.label,
    status: missing.length || invalid.length ? "blocked" : "ready",
    present,
    missing,
    invalid,
    next_step: check.hint,
  };

  if (check.id.includes("152") && process.env.CLIENTSURGE_HEALTHCHECK_URL) {
    result.health_probe = await verifyHealthUrl(process.env.CLIENTSURGE_HEALTHCHECK_URL);
    if (!result.health_probe.ok) result.status = "blocked";
  }

  results.push(result);
}

const blocked = results.filter((result) => result.status !== "ready");
const summary = {
  generated_at: new Date().toISOString(),
  ready_count: results.length - blocked.length,
  blocked_count: blocked.length,
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(blocked.length === 0 ? 0 : 1);
