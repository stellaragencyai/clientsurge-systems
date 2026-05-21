import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legalPage = readFileSync("src/internal-pages/LegalPage.jsx", "utf8");
const review = readFileSync("docs/LEGAL_TCPA_REVIEW_2026-05-21.md", "utf8");

test("legal pages include current SMS consent and opt-out disclosures", () => {
  assert.match(legalPage, /Message frequency varies/);
  assert.match(legalPage, /Message and data rates may apply/);
  assert.match(legalPage, /Consent is not a condition of purchase/);
  assert.match(legalPage, /Reply STOP to opt out/);
  assert.match(legalPage, /check the communication consent box/);
  assert.match(legalPage, /consent text version, timestamp, IP address, source page/);
});

test("legal pages disclose AI processing and service-provider sharing", () => {
  assert.match(legalPage, /AI-assisted systems/);
  assert.match(legalPage, /AI-assisted outputs may be reviewed, edited, or overridden/);
  assert.match(legalPage, /Base44, Twilio, Resend, Stripe, OpenAI, Google, Calendly/);
  assert.match(legalPage, /collecting and maintaining legally sufficient consent/);
});

test("TCPA review remains a draft pending final legal sign-off", () => {
  assert.match(review, /not legal advice and not final attorney sign-off/i);
  assert.match(review, /Final legal sign-off: pending Nolan\/legal counsel/);
  assert.match(review, /HELP-message support language should be added only after a working HELP response path exists/);
});
