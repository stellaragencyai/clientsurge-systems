import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("portal automation surfaces no longer rely on sample runtime data", () => {
  const overviewSource = readFileSync(
    new URL("../src/components/portal/AutomationsOverview.jsx", import.meta.url),
    "utf8"
  );
  const logSource = readFileSync(
    new URL("../src/components/portal/AutomatedResponsesLog.jsx", import.meta.url),
    "utf8"
  );
  const portalSource = readFileSync(
    new URL("../src/pages/ClientPortal.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(overviewSource, /SAMPLE_AUTOMATIONS|toggleAutomation|Triggers\/day|Success rate/);
  assert.doesNotMatch(logSource, /SAMPLE_RESPONSES|All system-sent SMS and emails on your behalf/);
  assert.match(portalSource, /<AutomationsOverview services=\{portalOrder\?\.services \|\| \[\]\} \/>/);
  assert.match(portalSource, /<AutomatedResponsesLog services=\{portalOrder\?\.services \|\| \[\]\} subscription=\{subscription\} \/>/);
});
