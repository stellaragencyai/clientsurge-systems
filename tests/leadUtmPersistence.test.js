import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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

test("submitLeadCapture persists canonical UTM fields on WebsiteLead and CRM Leads", () => {
  for (const field of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    assert.match(websiteLeadEntity, new RegExp(`"${field}"`), `WebsiteLead includes ${field}`);
    assert.match(leadsEntity, new RegExp(`"${field}"`), `Leads includes ${field}`);
    assert.match(submitLeadCaptureSource, new RegExp(`${field}: cleanString\\(body\\.${field}\\)`));
    assert.match(submitLeadCaptureSource, new RegExp(`${field}: lead\\.${field} \\|\\| ""`));
  }

  assert.match(submitLeadCaptureSource, /const utmParams = normalizeUtmParams\(body\)/);
  assert.match(submitLeadCaptureSource, /\.\.\.utmParams/);
});
