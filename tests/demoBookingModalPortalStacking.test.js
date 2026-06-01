import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modalSource = readFileSync("src/components/forms/DemoBookingModal.jsx", "utf8");

test("DemoBookingModal avoids Safari stacking-context issues by portaling above the app shell", () => {
  const portalIndex = modalSource.indexOf("return createPortal(");
  const bodyIndex = modalSource.indexOf("document.body", portalIndex);

  assert.ok(portalIndex > -1, "modal should render through createPortal");
  assert.ok(bodyIndex > portalIndex, "modal portal should target document.body");
  assert.match(modalSource, /className="fixed inset-0 z-\[9999\]/);
  assert.match(modalSource, /<div className="fixed inset-0 bg-black\/80 backdrop-blur-sm" onClick=\{onClose\} \/>/);
  assert.match(modalSource, /<div className="relative z-50 w-full max-w-xl">/);
  assert.match(modalSource, /<DemoBookingInline prefillIndustry=\{prefillIndustry\} \/>/);
  assert.match(modalSource, /tabIndex=\{0\}/);
  assert.match(modalSource, /if \(e\.key === "Escape"\) onClose\(\);/);
});
