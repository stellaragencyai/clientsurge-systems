import {
  createEmailUnsubscribeToken,
  verifyEmailUnsubscribeToken,
} from "../_shared/emailUnsubscribe.ts";

const SECRET = "test-email-unsubscribe-secret-with-more-than-32-characters";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("signed unsubscribe token round-trips its exact recipient identity", async () => {
  const token = await createEmailUnsubscribeToken({
    recipient_id: "recipient_123",
    campaign_id: "campaign_456",
    lead_id: "lead_789",
    email: "Owner@Example.com",
    exp: Math.floor(Date.now() / 1000) + 60,
  }, SECRET);

  const payload = await verifyEmailUnsubscribeToken(token, SECRET);
  assert(payload.recipient_id === "recipient_123", "recipient id should round-trip");
  assert(payload.campaign_id === "campaign_456", "campaign id should round-trip");
  assert(payload.lead_id === "lead_789", "lead id should round-trip");
  assert(payload.email === "owner@example.com", "email should be normalized");
});

Deno.test("tampered unsubscribe token is rejected", async () => {
  const token = await createEmailUnsubscribeToken({
    recipient_id: "recipient_123",
    campaign_id: "campaign_456",
    lead_id: "lead_789",
    email: "owner@example.com",
    exp: Math.floor(Date.now() / 1000) + 60,
  }, SECRET);

  const [payload, signature] = token.split(".");
  const tampered = `${payload.slice(0, -1)}${payload.endsWith("a") ? "b" : "a"}.${signature}`;
  let failed = false;
  try {
    await verifyEmailUnsubscribeToken(tampered, SECRET);
  } catch (error) {
    failed = /signature|payload/i.test(error instanceof Error ? error.message : String(error));
  }
  assert(failed, "tampered token should be rejected");
});

Deno.test("expired unsubscribe token is rejected", async () => {
  const token = await createEmailUnsubscribeToken({
    recipient_id: "recipient_123",
    campaign_id: "campaign_456",
    lead_id: "lead_789",
    email: "owner@example.com",
    exp: Math.floor(Date.now() / 1000) - 1,
  }, SECRET);

  let failed = false;
  try {
    await verifyEmailUnsubscribeToken(token, SECRET);
  } catch (error) {
    failed = /expired/i.test(error instanceof Error ? error.message : String(error));
  }
  assert(failed, "expired token should be rejected");
});
