import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../base44/functions/receiveTwilioInboundSms/entry.ts", import.meta.url),
  "utf8",
);

test("receiveTwilioInboundSms invokes classifyLeadIntent for matched Leads replies", () => {
  assert.match(
    source,
    /functions\.invoke\("classifyLeadIntent",\s*\{/,
  );
});

test("receiveTwilioInboundSms can send booking link from classifier output", () => {
  assert.match(
    source,
    /intentResult\?\.should_send_booking_link/,
  );
});
