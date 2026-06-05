import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const srcEnvReadme = readFileSync("src/README_ENV.md", "utf8");
const docsEnvReadme = readFileSync("docs/README_ENV.md", "utf8");
const combinedDocs = `${srcEnvReadme}\n${docsEnvReadme}`;

const requiredDocumentedVariables = [
  "ADMIN_EMAIL",
  "ADMIN_NOTIFICATION_EMAIL",
  "ADMIN_NOTIFICATION_PHONE",
  "APP_BASE_URL",
  "APP_URL",
  "AUTOMATION_SHARED_SECRET",
  "BASE44_APP_ID",
  "CLIENTSURGE_CHECKOUT_CAPACITY_LIMIT",
  "DEFAULT_BOOKING_LINK",
  "DEFAULT_BUSINESS_NAME",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_WEBHOOK_SECRET",
  "EXTERNAL_WEBHOOK_URL",
  "GITHUB_TOKEN",
  "GOOGLE_MAPS_API_KEY",
  "N8N_WEBHOOK_URL",
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_WEBHOOK_SECRET",
  "SITE_URL",
  "STRIPE_LIVE_SECRET_KEY",
  "STRIPE_MODE",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_TEST_SECRET_KEY",
  "STRIPE_TEST_WEBHOOK_SECRET",
  "STRIPE_WEBHOOK_SECRET",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_NOLAN_ID",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "TWILIO_SMS_STATUS_CALLBACK_URL",
  "TWILIO_WEBHOOK_KEY",
  "VITE_BASE44_APP_BASE_URL",
  "VITE_BASE44_APP_ID",
  "VITE_BASE44_FUNCTIONS_VERSION",
  "VITE_GA4_MEASUREMENT_ID",
  "VITE_GA_MEASUREMENT_ID",
  "VITE_GOOGLE_ANALYTICS_ID",
  "WEBHOOK_URL",
];

const localScriptVariables = [
  "CLIENTSURGE_ADMIN_LOAD_BUDGET_MS",
  "CLIENTSURGE_ADMIN_LOAD_LEADS",
  "CLIENTSURGE_AUTOMATION_NUMBER",
  "CLIENTSURGE_BASE44_HOST",
  "CLIENTSURGE_LEAD_TEST_URL",
  "CLIENTSURGE_LOAD_TEST_CONCURRENCY",
  "CLIENTSURGE_LOAD_TEST_SELF_TEST",
  "CLIENTSURGE_LOAD_TEST_TIMEOUT_MS",
  "CLIENTSURGE_TWILIO_WEBHOOK_FUNCTION",
];

test("environment documentation covers runtime and public app variables", () => {
  for (const variable of requiredDocumentedVariables) {
    assert.match(combinedDocs, new RegExp(`\\\`${variable}\\\``), `${variable} is documented`);
  }
});

test("environment documentation separates local verification variables", () => {
  assert.match(srcEnvReadme, /Local Verification Variables/);
  assert.match(docsEnvReadme, /Local Script Variables/);

  for (const variable of localScriptVariables) {
    assert.match(combinedDocs, new RegExp(`\\\`${variable}\\\``), `${variable} is documented`);
  }
});
