/**
 * Deno-only canonical package classification checks for Stripe lifecycle work.
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const MOCK_SESSION = {
  id: "cs_test_mock_001",
  object: "checkout.session",
  payment_status: "paid",
  status: "complete",
  customer: "cus_test_001",
  subscription: "sub_test_001",
  amount_total: 69500,
  currency: "usd",
  metadata: {
    package_key: "starter_system",
    customer_name: "Test Business",
    customer_email: "test@example.com",
    customer_phone: "+16025551234",
    base44_app_id: "69d49a29c1974b32f46e8550",
  },
};

Deno.test("checkout.session.completed fixture carries canonical package metadata", () => {
  assertEquals(typeof MOCK_SESSION.metadata.package_key, "string");
  assertEquals(MOCK_SESSION.metadata.package_key, "starter_system");
  assertEquals(MOCK_SESSION.payment_status, "paid");
});

Deno.test("canonical package selection matches current service bundles", async () => {
  const { getBestPackageOfferForServiceKeys } = await import(
    "../../../src/lib/salesCatalog.js"
  );

  assertEquals(
    getBestPackageOfferForServiceKeys([
      "instant_lead_response",
      "ai_booking_agent",
    ])?.package_key,
    "starter_system"
  );
  assertEquals(
    getBestPackageOfferForServiceKeys([
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ])?.package_key,
    "growth_system"
  );
});
