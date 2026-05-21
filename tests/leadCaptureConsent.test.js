import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const frontendForms = [
  ["landing lead form", "../src/components/landing/LeadCaptureForm.jsx"],
  ["lead capture modal", "../src/components/forms/LeadCaptureModal.jsx"],
  ["lead capture page form", "../src/components/leads/LeadCaptureForm.jsx"],
];

const submitLeadCaptureSource = readFileSync(
  new URL("../base44/functions/submitLeadCapture/entry.ts", import.meta.url),
  "utf8"
);
const websiteLeadEntity = readFileSync(
  new URL("../base44/entities/WebsiteLead.jsonc", import.meta.url),
  "utf8"
);
const leadsEntity = readFileSync(
  new URL("../base44/entities/Leads.jsonc", import.meta.url),
  "utf8"
);

test("public lead capture forms require explicit SMS and email consent", () => {
  for (const [name, path] of frontendForms) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");

    assert.match(source, /consent_given/, `${name} tracks consent state`);
    assert.match(source, /type="checkbox"/, `${name} renders a checkbox`);
    assert.match(source, /required/, `${name} requires consent before submit`);
    assert.match(source, /lead_capture_explicit_checkbox_v1/, `${name} sends consent text version`);
    assert.match(source, /\/privacy-policy/, `${name} links to privacy policy`);
    assert.match(source, /\/terms/, `${name} links to terms`);
    assert.doesNotMatch(source, /\/legal\/terms/, `${name} avoids stale terms route`);
  }
});

test("submitLeadCapture persists consent metadata for auditability", () => {
  for (const field of [
    "consent_given",
    "consent_given_at",
    "consent_ip",
    "consent_source",
    "consent_text_version",
    "requested_channels",
  ]) {
    assert.match(submitLeadCaptureSource, new RegExp(field), `submitLeadCapture stores ${field}`);
  }
});

test("lead entities expose consent audit fields", () => {
  for (const [entityName, source] of [
    ["WebsiteLead", websiteLeadEntity],
    ["Leads", leadsEntity],
  ]) {
    for (const field of [
      "consent_given",
      "consent_given_at",
      "consent_ip",
      "consent_source",
      "consent_text_version",
      "requested_channels",
    ]) {
      assert.match(source, new RegExp(`"${field}"`), `${entityName} includes ${field}`);
    }
  }
});
