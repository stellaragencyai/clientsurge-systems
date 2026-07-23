import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sources = {
  submitLeadCapture: readFileSync(new URL("../base44/functions/submitLeadCapture/entry.ts", import.meta.url), "utf8"),
  submitContactInquiry: readFileSync(new URL("../base44/functions/submitContactInquiry/main.ts", import.meta.url), "utf8"),
  submitContactInquiryEntry: readFileSync(new URL("../base44/functions/submitContactInquiry/entry.ts", import.meta.url), "utf8"),
  contactPage: readFileSync(new URL("../src/pages/Contact.jsx", import.meta.url), "utf8"),
  exitIntent: readFileSync(new URL("../src/components/landing/ExitIntentPopup.jsx", import.meta.url), "utf8"),
  samChat: readFileSync(new URL("../src/components/sam/SamChatWidget.jsx", import.meta.url), "utf8"),
  leadCaptureModal: readFileSync(new URL("../src/components/forms/LeadCaptureModal.jsx", import.meta.url), "utf8"),
  leadCapturePageForm: readFileSync(new URL("../src/components/leads/LeadCaptureForm.jsx", import.meta.url), "utf8"),
  landingLeadCaptureForm: readFileSync(new URL("../src/components/landing/LeadCaptureForm.jsx", import.meta.url), "utf8"),
};

test("public backend form endpoints treat website_url as the honeypot field", () => {
  assert.match(sources.submitLeadCapture, /cleanString\(body\.website_url\)/);
  assert.match(sources.submitLeadCapture, /reason: 'bot_detected'|reason: "bot_detected"/);
  assert.match(sources.submitContactInquiry, /raw\.website_url\s*\|\|\s*raw\.website_hp/);
  assert.match(sources.submitContactInquiry, /if \(payload\.honeypot\)/);
});

test("submitContactInquiry entry delegates to the canonical main handler", () => {
  assert.match(sources.submitContactInquiryEntry, /import '\.\/main\.ts';/);
});

test("submitContactInquiry preserves real business website separately from honeypot website_url", () => {
  assert.match(sources.submitContactInquiry, /raw\.business_website_url\s*\|\|\s*raw\.business_website\s*\|\|\s*raw\.website\s*\|\|\s*raw\.url/);
  assert.doesNotMatch(sources.submitContactInquiry, /raw\.website_url\s*\|\|\s*raw\.website\)/);
  assert.match(sources.samChat, /business_website_url: leadForm\.business_website_url/);
});

test("public lead and contact forms submit a website_url honeypot field", () => {
  for (const [name, source] of Object.entries({
    contactPage: sources.contactPage,
    samChat: sources.samChat,
    leadCaptureModal: sources.leadCaptureModal,
    leadCapturePageForm: sources.leadCapturePageForm,
    landingLeadCaptureForm: sources.landingLeadCaptureForm,
  })) {
    assert.match(source, /website_url/, `${name} includes website_url`);
    assert.match(source, /tabIndex=\{-1\}/, `${name} hides website_url from tab order`);
    assert.match(source, /aria-hidden="true"/, `${name} marks website_url as hidden`);
  }

  assert.match(sources.exitIntent, /website_url: ""/);
});
