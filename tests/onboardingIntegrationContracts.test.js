import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";

const integrationStep = fs.readFileSync("src/components/onboarding/IntegrationStatusStep.jsx", "utf8");
const providerMain = fs.readFileSync("base44/functions/testProviderConnections/main.ts", "utf8");
const credentialsWizard = fs.readFileSync("src/components/onboarding/CredentialsWizard.jsx", "utf8");

test("integration checks parse flat and nested provider responses", () => {
  assert.match(integrationStep, /function getProviderResult/);
  assert.match(integrationStep, /data\?\.success === true/);
  assert.match(integrationStep, /data\?\.results\?\.\[providerKey\]/);
  assert.match(integrationStep, /data\?\.\[providerKey\]/);
});

test("connection checks send client phone and email values to backend", () => {
  assert.match(integrationStep, /provider:\s*"twilio"/);
  assert.match(integrationStep, /phone,/);
  assert.match(integrationStep, /provider:\s*"resend"/);
  assert.match(integrationStep, /email,/);
});

test("optional CRM is skipped instead of treated as a failure", () => {
  assert.match(integrationStep, /STATUS\.skipped/);
  assert.match(integrationStep, /CRM integration is optional/);
  assert.match(providerMain, /status:\s*"skipped"/);
});

test("backend returns provider-specific result objects", () => {
  assert.match(providerMain, /\[provider\]: result/);
  assert.match(providerMain, /results:\s*\{ \[provider\]: result \}/);
  assert.match(providerMain, /twilio,/);
  assert.match(providerMain, /resend,/);
  assert.match(providerMain, /crm,/);
});

test("wizard validates and normalizes setup fields before saving", () => {
  assert.match(credentialsWizard, /function normalizePhone/);
  assert.match(credentialsWizard, /function normalizeUrl/);
  assert.match(credentialsWizard, /function isValidEmail/);
  assert.match(credentialsWizard, /website_url: websiteUrl/);
  assert.match(credentialsWizard, /google_business_url: googleReviewLink/);
  assert.match(credentialsWizard, /tone_of_voice: trim\(data\.brand_voice\)/);
});
