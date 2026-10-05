import {
  assertEquals,
  assertFalse,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const source = await Deno.readTextFile(
  new URL("./entry.ts", import.meta.url),
);

Deno.test("registry includes all three canonical numbers", () => {
  assertStringIncludes(source, "+18778123630");
  assertStringIncludes(source, "+16025843227");
  assertStringIncludes(source, "+16025874608");
});

Deno.test("personal number is never allowed for automated sending", () => {
  const personalBlock = source.match(/phone_number: "\+16025874608"[\s\S]*?notes:/)?.[0] || "";
  assertStringIncludes(personalBlock, "automated_sending_allowed: false");
  assertStringIncludes(personalBlock, "sms_enabled: false");
  assertFalse(personalBlock.includes("is_default_for_purpose: true"));
});

Deno.test("seed endpoint is admin-only and idempotent", () => {
  assertStringIncludes(source, 'user.role !== "admin"');
  assertStringIncludes(source, "TwilioPhoneNumber.filter");
  assertStringIncludes(source, "TwilioPhoneNumber.update");
  assertStringIncludes(source, "TwilioPhoneNumber.create");
});

Deno.test("registry uses production webhook routes", () => {
  assertEquals(
    (source.match(/receiveTwilioInboundSms/g) || []).length,
    2,
  );
  assertEquals(
    (source.match(/receiveTwilioSmsStatusCallback/g) || []).length,
    2,
  );
});
