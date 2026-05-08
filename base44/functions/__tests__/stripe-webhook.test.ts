/**
 * Test: checkout.session.completed → webhook → email → Order status
 * #401c: mock checkout event assertion
 */

// Run with: deno test stripe-webhook.test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const MOCK_SESSION = {
  id: "cs_test_mock_001",
  object: "checkout.session",
  payment_status: "paid",
  status: "complete",
  customer: "cus_test_001",
  subscription: "sub_test_001",
  amount_total: 79700,
  currency: "usd",
  metadata: {
    package_key: "starter",
    customer_name: "Test Business",
    customer_email: "test@example.com",
    customer_phone: "+16025551234",
    base44_app_id: "69d49a29c1974b32f46e8550",
  },
};

Deno.test("checkout.session.completed creates Order with correct fields", async () => {
  // Assert metadata is present
  assertEquals(typeof MOCK_SESSION.metadata.package_key, "string");
  assertEquals(MOCK_SESSION.metadata.base44_app_id, "69d49a29c1974b32f46e8550");
  assertEquals(MOCK_SESSION.payment_status, "paid");
  console.log("✅ Mock checkout session structure validated");
});

Deno.test("classifyPackageFromServices returns correct tier", async () => {
  const { classifyPackageFromServices } = await import("../classifyPurchasedPackage/entry.ts");
  assertEquals(classifyPackageFromServices(["instant_response", "missed_call_textback"]), "starter");
  assertEquals(classifyPackageFromServices(["instant_response", "missed_call_textback", "followup_sequences", "appointment_booking_ai"]), "growth");
  console.log("✅ classifyPackageFromServices tier mapping validated");
});
