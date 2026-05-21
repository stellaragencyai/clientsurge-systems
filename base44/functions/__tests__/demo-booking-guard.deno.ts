import { assertEquals, assertRejects } from "jsr:@std/assert@1";

import {
  assertBookingDateAvailable,
  validateBookingDate,
  validateWeekdayBookingDate,
} from "../shared/demoBookingGuard.ts";

function fakeBase44(blockedDates: string[] = []) {
  return {
    asServiceRole: {
      entities: {
        AdminSettings: {
          list: async () => [{ blocked_dates: blockedDates }],
        },
      },
    },
  };
}

Deno.test("validateWeekdayBookingDate rejects weekends", () => {
  assertEquals(validateWeekdayBookingDate("2026-05-23"), {
    valid: false,
    reason: "Weekend bookings are not available. Please pick a weekday.",
  });
});

Deno.test("validateBookingDate rejects AdminSettings blocked dates", async () => {
  assertEquals(await validateBookingDate(fakeBase44(["2026-05-25"]), "2026-05-25"), {
    valid: false,
    reason: "2026-05-25 is blocked. Please choose another date.",
  });
});

Deno.test("assertBookingDateAvailable throws 400 for unavailable dates", async () => {
  const error = await assertRejects(
    () => assertBookingDateAvailable(fakeBase44(["2026-05-25"]), "2026-05-25"),
    Error,
    "2026-05-25 is blocked. Please choose another date.",
  );

  assertEquals((error as Error & { status?: number }).status, 400);
});

Deno.test("assertBookingDateAvailable allows valid weekdays", async () => {
  assertEquals(await assertBookingDateAvailable(fakeBase44(), "2026-05-26"), true);
});
