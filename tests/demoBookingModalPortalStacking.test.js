import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modalSource = readFileSync("src/components/forms/DemoBookingModal.jsx", "utf8");

test("DemoBookingModal portals above the app shell and supports dismissal", () => {
  const portalIndex = modalSource.indexOf("return createPortal(");
  const bodyIndex = modalSource.indexOf("document.body", portalIndex);

  assert.ok(portalIndex > -1, "modal should render through createPortal");
  assert.ok(bodyIndex > portalIndex, "modal portal should target document.body");
  assert.match(modalSource, /className="fixed inset-0 z-\[100\]/);
  assert.match(modalSource, /overflow-y-auto/);
  assert.match(modalSource, /role="dialog"/);
  assert.match(modalSource, /aria-modal="true"/);
  assert.match(modalSource, /event\.key === "Escape"/);
  assert.match(modalSource, /event\.target === event\.currentTarget/);
});

test("DemoBookingModal delegates to the canonical preferred-time request form", () => {
  assert.doesNotMatch(modalSource, /<iframe/);
  assert.doesNotMatch(modalSource, /DEMO_VIDEO_URL/);
  assert.doesNotMatch(modalSource, /base44\.functions\.invoke/);
  assert.match(modalSource, /import DemoBookingInline/);
  assert.match(modalSource, /<DemoBookingInline/);
  assert.match(modalSource, /serviceInterest=\{context\.interest\}/);
  assert.match(modalSource, /preferred time, not receiving an instant calendar confirmation/i);
  assert.match(modalSource, /within one business day/i);
});
