import test from "node:test";
import assert from "node:assert/strict";

import { buildPaymentRecoveryEmail } from "../base44/functions/_shared/paymentRecoveryEmail.js";

test("payment recovery email includes hosted invoice payment update link", () => {
  const payload = buildPaymentRecoveryEmail({
    order: {
      customer_email: "owner@example.com",
      customer_name: "Jamie Owner",
      business_name: "Signal Med Spa",
    },
    invoice: {
      number: "INV-1001",
      amount_due: 49700,
    },
    paymentUpdateUrl: "https://pay.stripe.com/invoice/test",
    fromEmail: "billing@example.com",
    replyToEmail: "support@example.com",
  });

  assert.equal(payload.from, "ClientSurge Systems <billing@example.com>");
  assert.equal(payload.reply_to, "support@example.com");
  assert.equal(payload.to, "owner@example.com");
  assert.match(payload.subject, /Payment update needed/);
  assert.match(payload.text, /https:\/\/pay\.stripe\.com\/invoice\/test/);
  assert.match(payload.text, /\$497\.00/);
  assert.match(payload.html, /Update payment/);
  assert.match(payload.html, /INV-1001/);
});

test("payment recovery email falls back safely when no hosted invoice link exists", () => {
  const payload = buildPaymentRecoveryEmail({
    order: { customer_email: "owner@example.com" },
    invoice: {},
  });

  assert.match(payload.text, /billing portal/);
  assert.doesNotMatch(payload.html, /href=""/);
});
