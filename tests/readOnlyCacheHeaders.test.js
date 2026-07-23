import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const getBookedDemoSlots = readFileSync("base44/functions/getBookedDemoSlots/entry.ts", "utf8");
const demoBookingGuard = readFileSync("base44/functions/demoBookingGuard/entry.ts", "utf8");
const getAdminSettings = readFileSync("base44/functions/getAdminSettings/main.ts", "utf8");

test("public read-only booking availability responses use short cache headers", () => {
  for (const source of [getBookedDemoSlots, demoBookingGuard]) {
    assert.match(source, /import \{[^}]*cachedJson[^}]*\} from "\.\.\/_shared\/response\.ts"|function cachedJson/);
    assert.match(source, /return cachedJson\(.*,\s*60\)/s);
  }
});

test("admin settings remains no-store and is not public cached", () => {
  assert.doesNotMatch(getAdminSettings, /cachedJson/);
  assert.match(getAdminSettings, /isAdmin\(user\)/);
});
