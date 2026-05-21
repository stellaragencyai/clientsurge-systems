import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

import {
  PRODUCTION_APP_URL,
  buildAppUrl,
  normalizeAppUrl,
} from "../base44/functions/_shared/appUrl.js";

const productionLinkSources = [
  "../base44/functions/_shared/stripeOrderWebhook.js",
  "../base44/functions/sendOrderConfirmationEmail/entry.ts",
  "../base44/functions/stripePaymentWebhook/entry.ts",
  "../base44/functions/onOnboardingStageChange/entry.ts",
  "../base44/functions/onChecklistStatusChange/entry.ts",
  "../base44/functions/saveClientCredentials/entry.ts",
  "../base44/functions/stalledCredentialsAlert/entry.ts",
];

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("APP_URL guard falls back to the production domain for local or invalid values", () => {
  assert.equal(normalizeAppUrl(""), PRODUCTION_APP_URL);
  assert.equal(normalizeAppUrl("http://localhost:5173"), PRODUCTION_APP_URL);
  assert.equal(normalizeAppUrl("http://127.0.0.1:4173"), PRODUCTION_APP_URL);
  assert.equal(normalizeAppUrl("http://0.0.0.0:4173"), PRODUCTION_APP_URL);
  assert.equal(normalizeAppUrl("http://clientsurgesystems.com"), PRODUCTION_APP_URL);
  assert.equal(normalizeAppUrl("not a url"), PRODUCTION_APP_URL);
});

test("APP_URL guard keeps valid https origins and strips paths", () => {
  assert.equal(normalizeAppUrl("https://clientsurgesystems.com/anything"), PRODUCTION_APP_URL);
  assert.equal(normalizeAppUrl("https://staging.clientsurgesystems.com/app"), "https://staging.clientsurgesystems.com");
  assert.equal(
    buildAppUrl("/client-portal", { get: () => "http://localhost:5173" }),
    "https://clientsurgesystems.com/client-portal"
  );
});

test("production-facing email links do not directly trust raw APP_URL fallbacks", () => {
  for (const relativePath of productionLinkSources) {
    const source = readSource(relativePath);
    assert.doesNotMatch(
      source,
      /Deno\.env\.get\(["']APP_URL["']\)\s*\|\|/,
      `${relativePath} should use the APP_URL guard instead of a raw fallback`
    );
  }
});

test("environment docs warn that production APP_URL must not be localhost", () => {
  const envReadme = readSource("../src/README_ENV.md");
  const docsReadme = readSource("../docs/README_ENV.md");

  assert.match(envReadme, /Production APP_URL must be `https:\/\/clientsurgesystems\.com`/);
  assert.match(envReadme, /`APP_URL=http:\/\/localhost:5173` is local development only/);
  assert.match(docsReadme, /Production `APP_URL` must be `https:\/\/clientsurgesystems\.com`/);
});
