import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const legalPageSource = readFileSync(
  new URL("../src/internal-pages/LegalPage.jsx", import.meta.url),
  "utf8"
);
const cartSidebarSource = readFileSync(
  new URL("../src/components/store/CartSidebar.jsx", import.meta.url),
  "utf8"
);

test("privacy policy covers SMS, email, AI automation, and service-provider data sharing", () => {
  for (const phrase of [
    "SMS and Email Communications",
    "missed-call text-back messages",
    "AI and Automation Processing",
    "classify leads",
    "message history",
    "Twilio",
    "Resend",
    "Stripe",
    "OpenAI",
    "replying STOP",
  ]) {
    assert.match(legalPageSource, new RegExp(phrase), `privacy policy includes ${phrase}`);
  }
});

test("terms cover recurring subscriptions, cancellation, payment failures, and AI output responsibility", () => {
  for (const phrase of [
    "Subscription Billing and Auto-Renewal",
    "automatically renew",
    "recurring monthly fees",
    "Cancellation and Changes",
    "pause, resume, upgrade, or downgrade",
    "non-refundable",
    "past-due payments",
    "AI and Automation Outputs",
    "honoring customer opt-outs",
  ]) {
    assert.match(legalPageSource, new RegExp(phrase), `terms include ${phrase}`);
  }
});

test("checkout legal link uses canonical terms route", () => {
  assert.match(cartSidebarSource, /href="\/terms"/);
  assert.doesNotMatch(cartSidebarSource, /href="\/legal\/terms"/);
});
