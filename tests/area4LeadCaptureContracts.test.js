import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contactPage = readFileSync(new URL("../src/pages/Contact.jsx", import.meta.url), "utf8");
const publicFunctionClient = readFileSync(new URL("../src/lib/publicFunctionClient.js", import.meta.url), "utf8");
const submitContactInquiry = readFileSync(new URL("../base44/functions/submitContactInquiry/main.ts", import.meta.url), "utf8");
const submitLeadCapture = readFileSync(new URL("../base44/functions/submitLeadCapture/entry.ts", import.meta.url), "utf8");

test("Area 4 contact page uses the public function client, not the Base44 browser SDK", () => {
  assert.match(contactPage, /invokePublicBase44Function\("submitContactInquiry"/);
  assert.doesNotMatch(contactPage, /base44\.functions\.invoke\("submitContactInquiry"/);
  assert.doesNotMatch(contactPage, /import \{ base44 \}/);
  assert.match(publicFunctionClient, /\/api\/apps\/\$\{resolveAppId\(\)\}\/functions\/\$\{functionName\}/);
});

test("Area 4 contact page requires complete lead data and explicit consent", () => {
  for (const field of ["full_name", "business_name", "email", "phone", "business_type", "message", "consent_given"]) {
    assert.match(contactPage, new RegExp(field), `${field} should be present in contact page`);
  }

  assert.match(contactPage, /CONTACT_CONSENT_VERSION/);
  assert.match(contactPage, /consent_text_version/);
  assert.match(contactPage, /consent_source/);
  assert.match(contactPage, /business_website_url/);
});

test("Area 4 contact backend creates both WebsiteLead and canonical Leads records", () => {
  assert.match(submitContactInquiry, /entities\.WebsiteLead\.create/);
  assert.match(submitContactInquiry, /entities\.Leads\.create/);
  assert.match(submitContactInquiry, /website_lead_id/);
  assert.match(submitContactInquiry, /canonical_lead_id/);
});

test("Area 4 backend lead functions return request ids for support/debugging", () => {
  assert.match(submitContactInquiry, /request_id: requestId/);
  assert.match(submitContactInquiry, /contact_\$\{Date\.now\(\)\}_/);
  assert.match(submitLeadCapture, /request_id: requestId/);
  assert.match(submitLeadCapture, /lead_\$\{Date\.now\(\)\}_/);
});

test("Area 4 lead capture preserves source attribution beyond generic website_form", () => {
  for (const source of ["contact_page", "pricing_page", "home_page", "industry_page", "exit_intent", "chat_widget", "lead_capture_page"]) {
    assert.match(submitLeadCapture, new RegExp(source), `${source} should be recognized`);
  }
  assert.match(submitLeadCapture, /source_page/);
});
