import { assertEquals } from "jsr:@std/assert@1";

import { cachedJson, errJson, okJson, secureJson } from "../_shared/response.ts";

Deno.test("okJson returns success payload with secure JSON headers", async () => {
  const response = okJson({ value: 42 });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  assertEquals(response.headers.get("Cache-Control"), "no-store");
  assertEquals(response.headers.get("X-Frame-Options"), "DENY");
  assertEquals(await response.json(), { success: true, value: 42 });
});

Deno.test("errJson returns failure payload with status and extra metadata", async () => {
  const response = errJson("Missing input", 400, { field: "lead_id" });

  assertEquals(response.status, 400);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  assertEquals(response.headers.get("Cache-Control"), "no-store");
  assertEquals(response.headers.get("X-Frame-Options"), "DENY");
  assertEquals(await response.json(), {
    success: false,
    error: "Missing input",
    field: "lead_id",
  });
});

Deno.test("cachedJson keeps success payload and explicit max-age", () => {
  const response = cachedJson({ count: 3 }, 120);

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Cache-Control"), "public, max-age=120");
  assertEquals(response.headers.get("X-Frame-Options"), "DENY");
});

Deno.test("secureJson preserves explicit headers while forcing anti-framing", async () => {
  const response = secureJson({ ok: true }, {
    status: 202,
    headers: {
      "Cache-Control": "public, max-age=30",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });

  assertEquals(response.status, 202);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  assertEquals(response.headers.get("Cache-Control"), "public, max-age=30");
  assertEquals(response.headers.get("X-Frame-Options"), "DENY");
  assertEquals(await response.json(), { ok: true });
});
