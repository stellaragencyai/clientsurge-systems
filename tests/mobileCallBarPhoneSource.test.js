import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mobileCallBarSource = readFileSync(
  "src/components/landing/MobileCallBar.jsx",
  "utf8"
);

test("MobileCallBar pulls its call number from AdminSettings with a local fallback", () => {
  assert.match(
    mobileCallBarSource,
    /import \{ fetchAdminSettings \} from "@\/lib\/adminSettingsApi";/
  );
  assert.match(mobileCallBarSource, /const FALLBACK_PHONE = "\+16025843227";/);
  assert.match(
    mobileCallBarSource,
    /const \[phoneNumber, setPhoneNumber\] = useState\(FALLBACK_PHONE\);/
  );
  assert.match(mobileCallBarSource, /fetchAdminSettings\(\)\s*\.then\(\(settings\) => \{/);
  assert.match(mobileCallBarSource, /if \(settings\?\.twilio_from_number\) \{/);
  assert.match(mobileCallBarSource, /setPhoneNumber\(settings\.twilio_from_number\);/);
  assert.match(mobileCallBarSource, /href=\{`tel:\$\{phoneNumber\}`\}/);
  assert.match(mobileCallBarSource, /const phoneLabel = useMemo\(\(\) => formatPhoneLabel\(phoneNumber\), \[phoneNumber\]\);/);
});
