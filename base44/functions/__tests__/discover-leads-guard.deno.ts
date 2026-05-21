import { assertEquals } from "jsr:@std/assert@1";

import { resolveGoogleMapsKey } from "../shared/discoverLeadsGuard.ts";

Deno.test("resolveGoogleMapsKey throws a launch-safe 503 when unset", () => {
  try {
    resolveGoogleMapsKey("");
    throw new Error("Expected resolveGoogleMapsKey to throw");
  } catch (err) {
    assertEquals(err.message, "Google Maps API key is not configured. Set GOOGLE_MAPS_API_KEY in environment variables.");
    assertEquals(err.status, 503);
  }
});

Deno.test("resolveGoogleMapsKey throws the same 503 for nullish keys", () => {
  try {
    resolveGoogleMapsKey(null);
    throw new Error("Expected resolveGoogleMapsKey to throw");
  } catch (err) {
    assertEquals(err.message, "Google Maps API key is not configured. Set GOOGLE_MAPS_API_KEY in environment variables.");
    assertEquals(err.status, 503);
  }
});

Deno.test("resolveGoogleMapsKey returns configured keys unchanged", () => {
  assertEquals(resolveGoogleMapsKey("maps_test_key"), "maps_test_key");
});
