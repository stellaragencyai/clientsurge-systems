import {
  DEFAULT_CUSTOMER_SERVICE_NUMBER,
  DEFAULT_SALES_NUMBER,
  PERSONAL_VERIFICATION_NUMBER,
  assertAutomatedSenderAllowed,
  classifyInboundNumber,
  normalizePhoneE164,
  resolveTwilioSender,
} from "./entry.ts";

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || "assertEquals failed"}: expected ${expected}, got ${actual}`);
  }
}

Deno.test("normalizes US numbers to E.164", () => {
  assertEquals(normalizePhoneE164("(602) 584-3227"), "+16025843227");
  assertEquals(normalizePhoneE164("1-877-812-3630"), "+18778123630");
});

Deno.test("classifies inbound customer-service and sales numbers", () => {
  assertEquals(classifyInboundNumber(DEFAULT_CUSTOMER_SERVICE_NUMBER), "customer_service");
  assertEquals(classifyInboundNumber(DEFAULT_SALES_NUMBER), "sales");
  assertEquals(classifyInboundNumber("+15555555555"), "unmatched");
});

Deno.test("personal verification number is prohibited for automated sends", () => {
  let blocked = false;
  try {
    assertAutomatedSenderAllowed(PERSONAL_VERIFICATION_NUMBER);
  } catch (error) {
    blocked = String(error.message).includes("cannot be used for automated SMS");
  }
  assertEquals(blocked, true);
});

Deno.test("customer-service purpose resolves to toll-free default", async () => {
  const sender = await resolveTwilioSender(null, { purpose: "customer_service" });
  assertEquals(sender, DEFAULT_CUSTOMER_SERVICE_NUMBER);
});

Deno.test("sales purpose resolves to local sales default", async () => {
  const sender = await resolveTwilioSender(null, { purpose: "sales_outreach" });
  assertEquals(sender, DEFAULT_SALES_NUMBER);
});

Deno.test("conversation affinity overrides purpose", async () => {
  const sender = await resolveTwilioSender(null, {
    purpose: "customer_service",
    conversationFromNumber: DEFAULT_SALES_NUMBER,
  });
  assertEquals(sender, DEFAULT_SALES_NUMBER);
});
