/**
 * Deno-only install pipeline fixtures for canonical package service mapping.
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("Starter package exposes the canonical two-service bundle", async () => {
  const { getServicesForTier } = await import("../shared/tierServiceMap.ts");
  const services = getServicesForTier("starter_system");

  assertEquals(services.length, 2);
  assertEquals(services.includes("instant_lead_response"), true);
  assertEquals(services.includes("ai_booking_agent"), true);
});

Deno.test("Growth package exposes the canonical four-service bundle", async () => {
  const { getServicesForTier } = await import("../shared/tierServiceMap.ts");
  const services = getServicesForTier("growth_system");

  assertEquals(services.length, 4);
  assertEquals(services.includes("missed_call_text_back"), true);
  assertEquals(services.includes("nurture_sequence_14d"), true);
});

Deno.test("Elite package exposes the canonical six-service bundle", async () => {
  const { getServicesForTier } = await import("../shared/tierServiceMap.ts");
  const services = getServicesForTier("elite_system");

  assertEquals(services.length, 6);
  assertEquals(services.includes("lead_reactivation"), true);
  assertEquals(services.includes("review_request"), true);
});
