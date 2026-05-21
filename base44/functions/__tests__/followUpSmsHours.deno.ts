import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("follow-up SMS hours allow Phoenix daytime sends", async () => {
  const { canSendFollowUpSms } = await import("../shared/followUpSmsHours.ts");
  const result = canSendFollowUpSms(new Date("2026-05-21T18:00:00.000Z"));

  assertEquals(result.allowed, true);
  assertEquals(result.current_hour, 11);
  assertEquals(result.timezone, "America/Phoenix");
});

Deno.test("follow-up SMS hours block Phoenix overnight sends", async () => {
  const { canSendFollowUpSms } = await import("../shared/followUpSmsHours.ts");
  const result = canSendFollowUpSms(new Date("2026-05-21T06:00:00.000Z"));

  assertEquals(result.allowed, false);
  assertEquals(result.current_hour, 23);
  assertEquals(result.allowed_window, "8:00-20:00");
});
