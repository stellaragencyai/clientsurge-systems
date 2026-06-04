import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mobileCallBarSource = readFileSync(
  "src/components/landing/MobileCallBar.jsx",
  "utf8"
);

test("MobileCallBar uses the public fallback number without private settings calls", () => {
  assert.doesNotMatch(mobileCallBarSource, /fetchAdminSettings/);
  assert.doesNotMatch(mobileCallBarSource, /adminSettingsApi/);
  assert.match(mobileCallBarSource, /const FALLBACK_PHONE = "\+16025843227";/);
  assert.match(
    mobileCallBarSource,
    /const \[phoneNumber, setPhoneNumber\] = useState\(FALLBACK_PHONE\);/
  );
  assert.match(mobileCallBarSource, /href=\{`tel:\$\{phoneNumber\}`\}/);
  assert.match(mobileCallBarSource, /const phoneLabel = useMemo\(\(\) => formatPhoneLabel\(phoneNumber\), \[phoneNumber\]\);/);
});
