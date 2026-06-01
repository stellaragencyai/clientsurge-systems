import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mobileCallBarSource = readFileSync(
  "src/components/landing/MobileCallBar.jsx",
  "utf8"
);

test("MobileCallBar uses a stable public call number without fetching admin settings", () => {
  assert.doesNotMatch(
    mobileCallBarSource,
    /fetchAdminSettings|adminSettingsApi|setPhoneNumber/
  );
  assert.match(mobileCallBarSource, /const FALLBACK_PHONE = "\+16025843227";/);
  assert.match(mobileCallBarSource, /const phoneNumber = FALLBACK_PHONE;/);
  assert.match(mobileCallBarSource, /href=\{`tel:\$\{phoneNumber\}`\}/);
  assert.match(mobileCallBarSource, /const phoneLabel = useMemo\(\(\) => formatPhoneLabel\(phoneNumber\), \[phoneNumber\]\);/);
});
